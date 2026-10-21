"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BranchesOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  LARGE_MODAL_BODY_STYLE,
  LARGE_MODAL_CONTAINER_STYLE,
  LARGE_MODAL_PROPS,
  Modal,
  Select,
  Switch,
  Tag,
  Tooltip,
  toast,
} from "@/components/ui";
import { App } from "antd";
import type { ProcedureStep, StepStatus, StepType } from "../types/procedure.types";

interface StepConfigModalProps {
  open: boolean;
  steps: ProcedureStep[];
  currentProcedureId?: string;
  departmentTitle?: string;
  projectName?: string;
  onClose: () => void;
  onSaveConfig: (updatedSteps: ProcedureStep[], profileId?: string) => void;
}

import {
  loadCustomProfiles,
  saveCustomProfiles,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import {
  getDepartmentStaff,
  DEPARTMENT_PROCEDURE_TEMPLATES,
  isSameDepartment,
} from "../constants/procedure-department-templates";

// Danh mục đơn vị phụ trách chuẩn hóa để người dùng chọn
const RESPONSIBLE_UNIT_OPTIONS = [
  { value: "Chủ đầu tư", label: "Chủ đầu tư" },
  { value: "Chủ đầu tư + TV", label: "Chủ đầu tư + TV" },
  { value: "Chủ đầu tư + HĐ TĐ Phường", label: "Chủ đầu tư + HĐ TĐ Phường" },
  { value: "Chủ đầu tư + TV đấu thầu", label: "Chủ đầu tư + TV đấu thầu" },
  { value: "Tư vấn lập", label: "Tư vấn lập" },
  { value: "Tư vấn thẩm tra", label: "Tư vấn thẩm tra" },
  { value: "Tư vấn đấu thầu", label: "Tư vấn đấu thầu" },
  { value: "Cơ quan chuyên ngành", label: "Cơ quan chuyên ngành" },
  { value: "Cơ quan chuyên môn", label: "Cơ quan chuyên môn" },
  { value: "Cơ quan thẩm định giá", label: "Cơ quan thẩm định giá" },
  { value: "HĐ TĐ Phường", label: "HĐ TĐ Phường" },
  { value: "Ban Quản lý dự án", label: "Ban Quản lý dự án" },
  { value: "Nhà thầu thi công", label: "Nhà thầu thi công" },
];

// Helper số La Mã cho bước chính (I, II, III...)
const toRoman = (num: number): string => {
  const romanMap: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let res = "";
  let n = num;
  for (const [val, sym] of romanMap) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res || "I";
};

const fromRoman = (str: string): number => {
  const romanMap: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
  };
  let sum = 0;
  let prev = 0;
  const upper = str.toUpperCase().trim();
  for (let i = upper.length - 1; i >= 0; i--) {
    const val = romanMap[upper[i]] || 0;
    if (val < prev) sum -= val;
    else sum += val;
    prev = val;
  }
  return sum;
};

// Cấp của bước theo mã: "III" = 0 (bước chính), "III.1" = 1, "III.1.1" = 2... (không giới hạn số cấp)
const getStepDepth = (code: string): number => code.split(".").length - 1;

// Bước gốc (cấp 1) chứa bước này: "III.1.1" → "III"
const getRootCode = (code: string): string => code.split(".")[0];

// Bước con / cháu... của một bước (mọi cấp bên dưới)
const isDescendantOf = (code: string, ancestorCode: string): boolean => code.startsWith(`${ancestorCode}.`);

// Gợi ý mã bước cha tiếp theo (I, II, III...)
const getNextParentCode = (steps: ProcedureStep[]): string => {
  const parents = steps.filter((s) => !s.code.includes("."));
  if (parents.length === 0) return "I";
  let maxRoman = 0;
  for (const p of parents) {
    const num = fromRoman(p.code);
    if (num > maxRoman) maxRoman = num;
  }
  return toRoman(maxRoman > 0 ? maxRoman + 1 : parents.length + 1);
};

// Gợi ý mã bước con tiếp theo, ở bất kỳ cấp nào (II → II.1, II.2...; III.1 → III.1.1, III.1.2...)
const getNextSubCode = (parentCode: string, steps: ProcedureStep[]): string => {
  const childDepth = getStepDepth(parentCode) + 1;
  // Chỉ xét bước con trực tiếp (đúng 1 cấp bên dưới), bỏ qua các cấp sâu hơn
  const children = steps.filter((s) => isDescendantOf(s.code, parentCode) && getStepDepth(s.code) === childDepth);
  let maxChildNum = 0;
  for (const c of children) {
    const childNum = parseInt(c.code.split(".")[childDepth], 10);
    if (!isNaN(childNum) && childNum > maxChildNum) {
      maxChildNum = childNum;
    }
  }
  return `${parentCode}.${maxChildNum + 1}`;
};

// Chèn bước con đúng vào sau nhóm bước của cha nó
const insertStepHierarchically = (
  steps: ProcedureStep[],
  newStep: ProcedureStep,
  parentCode?: string
): ProcedureStep[] => {
  if (!parentCode) {
    return [...steps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
  }
  let lastIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].code === parentCode || steps[i].code.startsWith(`${parentCode}.`)) {
      lastIndex = i;
    }
  }
  if (lastIndex === -1) {
    return [...steps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
  }
  const result = [...steps];
  result.splice(lastIndex + 1, 0, newStep);
  return result.map((s, idx) => ({ ...s, order: idx + 1 }));
};

/** Mỗi cấp bước thụt vào thêm (px) */
const STEP_INDENT_PX = 14;

/** Số ngày từ ngày bắt đầu đến ngày kết thúc (tính cả hai đầu); thiếu ngày thì null */
const countPlannedDays = (start?: string, end?: string): number | null => {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
  return diff > 0 ? diff : null;
};

/** Thông tin thời gian của bước suy ra từ ngày bắt đầu / kết thúc */
const buildDateFields = (
  start?: string,
  end?: string
): Pick<
  ProcedureStep,
  "startDatePlanned" | "endDatePlanned" | "plannedDays" | "durationMargin" | "durationDaysMin" | "durationDaysMax"
> => {
  const days = countPlannedDays(start, end);
  return {
    startDatePlanned: start || undefined,
    endDatePlanned: end || undefined,
    plannedDays: days ?? undefined,
    durationMargin: days ? `${days} ngày` : "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
  };
};

/** Ô chọn ngày của trình duyệt: chỉ chọn trên lịch (không gõ tay), bấm vào là mở lịch */
function StepDateInput({
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  value?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      value={value || ""}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => {
        e.stopPropagation();
        e.currentTarget.showPicker?.();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") e.preventDefault();
      }}
      className="h-7 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626] disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export default function StepConfigModal({
  open,
  steps,
  currentProcedureId,
  departmentTitle,
  projectName,
  onClose,
  onSaveConfig,
}: StepConfigModalProps) {
  const { modal } = App.useApp();
  const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(steps);
  const [filterType, setFilterType] = useState<"ALL" | "MANDATORY" | "CONDITIONAL" | "DISABLED">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Quản lý quy trình (kịch bản)
  const [customProfiles, setCustomProfiles] = useState<CustomProcedureProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    currentProcedureId || ""
  );

  // Modal 1: Tạo quy trình mới
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileSource, setNewProfileSource] = useState<"CURRENT" | "DEPT_TEMPLATE" | "EMPTY">("CURRENT");
  const [createProfileError, setCreateProfileError] = useState("");

  // Tìm quy trình mẫu chuẩn tương ứng với phòng ban (nếu có)
  const deptTemplate = useMemo(() => {
    if (!departmentTitle) return null;
    return (
      DEPARTMENT_PROCEDURE_TEMPLATES[departmentTitle] ||
      Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((tpl) =>
        isSameDepartment(tpl.department, departmentTitle)
      ) ||
      null
    );
  }, [departmentTitle]);

  // Danh sách cán bộ thuộc phòng ban của Lead (nếu mở cho phòng ban)
  const staffList = useMemo(() => {
    return departmentTitle ? getDepartmentStaff(departmentTitle) : [];
  }, [departmentTitle]);

  // Cập nhật thông tin của bất kỳ bước nào trong danh sách
  const handleUpdateStep = (stepId: string, updates: Partial<ProcedureStep>) => {
    setLocalSteps((prev) => {
      const updated = prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
      syncToCurrentProfile(updated);
      return updated;
    });
  };

  // Inline thêm bước chính (Cha) trực tiếp trong danh sách
  const [isAddingParentInline, setIsAddingParentInline] = useState(false);
  const [inlineParentCode, setInlineParentCode] = useState<string>("");
  const [inlineParentName, setInlineParentName] = useState<string>("");
  const [inlineParentUnit, setInlineParentUnit] = useState<string>("Chủ đầu tư");
  const [inlineParentAssignee, setInlineParentAssignee] = useState<string>("");
  const [inlineParentStart, setInlineParentStart] = useState<string>("");
  const [inlineParentEnd, setInlineParentEnd] = useState<string>("");
  const [inlineParentType, setInlineParentType] = useState<"MANDATORY" | "CONDITIONAL">("MANDATORY");
  const [inlineParentError, setInlineParentError] = useState<string>("");

  // Trạng thái thêm bước con trực tiếp bên dưới bước cha khi click vào cha
  const [activeParentForSub, setActiveParentForSub] = useState<string | null>(null);
  const [inlineChildCode, setInlineChildCode] = useState<string>("");
  const [inlineChildName, setInlineChildName] = useState<string>("");
  const [inlineChildUnit, setInlineChildUnit] = useState<string>("Chủ đầu tư");
  const [inlineChildAssignee, setInlineChildAssignee] = useState<string>("");
  const [inlineChildStart, setInlineChildStart] = useState<string>("");
  const [inlineChildEnd, setInlineChildEnd] = useState<string>("");
  const [inlineChildType, setInlineChildType] = useState<"MANDATORY" | "CONDITIONAL">("MANDATORY");
  const [inlineChildError, setInlineChildError] = useState<string>("");

  // Theo dõi các bước mới thêm trong session này (chưa lưu cấu hình)
  const [newlyAddedStepIds, setNewlyAddedStepIds] = useState<Set<string>>(new Set());

  // Danh mục đơn vị phụ trách có thể bao gồm phòng ban hiện tại
  const unitOptions = useMemo(() => {
    if (departmentTitle && !RESPONSIBLE_UNIT_OPTIONS.some((o) => o.value === departmentTitle)) {
      return [{ value: departmentTitle, label: departmentTitle }, ...RESPONSIBLE_UNIT_OPTIONS];
    }
    return RESPONSIBLE_UNIT_OPTIONS;
  }, [departmentTitle]);

  // Tải custom profiles khi mở modal
  useEffect(() => {
    if (open) {
      const loaded = loadCustomProfiles();
      setCustomProfiles(loaded);
      setLocalSteps(steps);
      setSelectedProfileId(currentProcedureId || "");
      setNewlyAddedStepIds(new Set()); // Reset danh sách bước mới khi mở modal
      if (departmentTitle) {
        setInlineParentUnit(departmentTitle);
        setInlineChildUnit(departmentTitle);
      }
    }
  }, [open, steps, currentProcedureId, departmentTitle]);


  // Danh sách các bước cha hiện có (không chứa dấu chấm)
  const parentSteps = useMemo(() => {
    return localSteps.filter((s) => !s.code.includes("."));
  }, [localSteps]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const totalCount = localSteps.length;
    const mandatoryCount = localSteps.filter((s) => s.type === "MANDATORY").length;
    const conditionalCount = localSteps.filter((s) => s.type === "CONDITIONAL").length;
    const enabledConditionalCount = localSteps.filter((s) => s.type === "CONDITIONAL" && s.isEnabled).length;
    const disabledCount = conditionalCount - enabledConditionalCount;
    const totalActiveSteps = mandatoryCount + enabledConditionalCount;

    return {
      totalCount,
      mandatoryCount,
      conditionalCount,
      enabledConditionalCount,
      disabledCount,
      totalActiveSteps,
    };
  }, [localSteps]);

  // Bật/Tắt bước điều kiện
  const handleToggle = (stepId: string, enabled: boolean) => {
    setLocalSteps((prev) => {
      const target = prev.find((s) => s.id === stepId);
      if (!target || target.type !== "CONDITIONAL") return prev;
      // Bật / tắt một bước thì các bước con (mọi cấp) bên dưới đi theo
      const updated: ProcedureStep[] = prev.map((s) => {
        if (s.id === stepId || isDescendantOf(s.code, target.code)) {
          const newStatus: StepStatus = enabled
            ? s.status === "DISABLED"
              ? "NOT_STARTED"
              : s.status
            : "DISABLED";
          return {
            ...s,
            isEnabled: enabled,
            status: newStatus,
          };
        }
        return s;
      });
      syncToCurrentProfile(updated);
      return updated;
    });
  };

  // Điều chỉnh số ngày kế hoạch
  const handleDaysChange = (stepId: string, delta: number) => {
    setLocalSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id === stepId) {
          // Giới hạn số ngày theo biên độ của chính bước đó (không có thì 1–180 ngày)
          const current = s.plannedDays || s.durationDaysMin || 10;
          const min = s.durationDaysMin || 1;
          const max = s.durationDaysMax || 180;
          const updatedDays = Math.min(max, Math.max(min, current + delta));
          return {
            ...s,
            plannedDays: updatedDays,
          };
        }
        return s;
      });
      syncToCurrentProfile(updated);
      return updated;
    });
  };

  // Đồng bộ bước vào custom profile nếu đang chọn profile tự tạo
  const syncToCurrentProfile = (newSteps: ProcedureStep[]) => {
    if (selectedProfileId.startsWith("custom_")) {
      const updated = customProfiles.map((p) =>
        p.id === selectedProfileId ? { ...p, steps: newSteps } : p
      );
      setCustomProfiles(updated);
      saveCustomProfiles(updated);
    }
  };

  // Chọn quy trình để xem / chỉnh trong hộp cấu hình (chỉ áp dụng khi bấm "Lưu cấu hình" nên không thông báo)
  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);

    // 1. Kiểm tra template theo phòng ban
    const deptTpl = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === profileId);
    if (deptTpl) {
      const loadedSteps = deptTpl.createSteps();
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
      return;
    }

    // 2. Kiểm tra custom profile
    const target = customProfiles.find((p) => p.id === profileId);
    if (target) {
      const loadedSteps = target.steps || [];
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
    }
  };

  // Xóa cấu hình quy trình tự tạo
  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = customProfiles.find((p) => p.id === profileId);
    const updated = customProfiles.filter((p) => p.id !== profileId);
    setCustomProfiles(updated);
    saveCustomProfiles(updated);
    toast.info("Đã xóa quy trình tùy chỉnh", `Đã xóa quy trình "${target?.name || ""}".`);
    if (selectedProfileId === profileId) {
      const fallbackId = currentProcedureId || (deptTemplate ? deptTemplate.id : "");
      setSelectedProfileId(fallbackId);
      const deptT = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === fallbackId);
      if (deptT) {
        setLocalSteps(deptT.createSteps());
      } else {
        setLocalSteps(steps);
      }
    }
  };

  // Mở modal tạo quy trình mới
  const handleOpenCreateProfile = () => {
    setNewProfileName("");
    setCreateProfileError("");
    setNewProfileSource(localSteps.length > 0 ? "CURRENT" : deptTemplate ? "DEPT_TEMPLATE" : "EMPTY");
    setIsCreateProfileOpen(true);
  };

  // Xác nhận tạo quy trình mới
  const handleConfirmCreateProfile = () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) {
      setCreateProfileError("Vui lòng nhập tên quy trình mới");
      return;
    }

    let initialSteps: ProcedureStep[] = [];
    if (newProfileSource === "CURRENT") {
      initialSteps = localSteps.map((s) => ({ ...s }));
    } else if (newProfileSource === "DEPT_TEMPLATE" && deptTemplate) {
      initialSteps = deptTemplate.createSteps();
    } else {
      initialSteps = [];
    }

    const newProfile: CustomProcedureProfile = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString().slice(0, 10),
      steps: initialSteps,
    };

    const updated = [newProfile, ...customProfiles];
    setCustomProfiles(updated);
    saveCustomProfiles(updated);
    setSelectedProfileId(newProfile.id);
    setLocalSteps(initialSteps);
    setNewlyAddedStepIds(new Set());
    setIsCreateProfileOpen(false);

    toast.success(
      "Đã tạo quy trình mới",
      `Đã lưu quy trình "${trimmed}" (${initialSteps.length} bước). Về sau bạn và các dự án khác có thể chọn dùng lại ngay lập tức!`
    );
  };

  // Mở dòng nhập inline thêm bước chính (Cha)
  const handleOpenAddParentStep = () => {
    if (isAddingParentInline) {
      setIsAddingParentInline(false);
      return;
    }
    setIsAddingParentInline(true);
    setInlineParentCode(getNextParentCode(localSteps));
    setInlineParentName("");
    setInlineParentUnit(departmentTitle || "Chủ đầu tư");
    setInlineParentAssignee("");
    setInlineParentStart("");
    setInlineParentEnd("");
    setInlineParentType("MANDATORY");
    setInlineParentError("");
    // Đóng inline bước con nếu đang mở
    setActiveParentForSub(null);
  };

  // Lưu bước chính được nhập inline
  const handleSaveInlineParent = (keepOpen = false) => {
    if (!inlineParentName.trim()) {
      setInlineParentError("Vui lòng nhập tên bước chính");
      return;
    }
    const finalCode = inlineParentCode.trim() || getNextParentCode(localSteps);
    const assigneeStaff = staffList.find((s) => s.name === inlineParentAssignee);
    const newStep: ProcedureStep = {
      id: `dept-step-${Date.now()}-${finalCode}`,
      order: localSteps.length + 1,
      code: finalCode,
      groupCode: finalCode,
      groupTitle: inlineParentName.trim(),
      name: inlineParentName.trim(),
      type: inlineParentType,
      responsibleUnit: inlineParentUnit || departmentTitle || "Chủ đầu tư",
      department: departmentTitle || undefined,
      assignedTo: inlineParentAssignee || undefined,
      assignedToId: assigneeStaff?.id,
      assignedBy: inlineParentAssignee && departmentTitle ? `Lead ${departmentTitle}` : undefined,
      assignedAt: inlineParentAssignee ? new Date().toISOString().slice(0, 10) : undefined,
      ...buildDateFields(inlineParentStart, inlineParentEnd),
      isEnabled: true,
      status: "NOT_STARTED",
      attachments: [],
      notes: "",
    };
    const updated = [...localSteps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => new Set([...prev, newStep.id]));
    if (keepOpen) {
      setInlineParentName("");
      setInlineParentError("");
      setInlineParentAssignee("");
      setInlineParentCode(getNextParentCode(updated));
    } else {
      setIsAddingParentInline(false);
      setInlineParentName("");
      setInlineParentError("");
      setInlineParentAssignee("");
    }
  };

  // Click trực tiếp vào bước cha để mở dòng thêm bước con ngay bên dưới
  const handleParentRowClick = (parentCode: string) => {
    if (activeParentForSub === parentCode) {
      setActiveParentForSub(null);
      return;
    }
    const parentObj = localSteps.find((s) => s.code === parentCode);
    setActiveParentForSub(parentCode);
    setInlineChildCode(getNextSubCode(parentCode, localSteps));
    setInlineChildName("");
    setInlineChildUnit(parentObj?.responsibleUnit || departmentTitle || "Chủ đầu tư");
    setInlineChildAssignee("");
    setInlineChildStart("");
    setInlineChildEnd("");
    setInlineChildType("MANDATORY");
    setInlineChildError("");
  };

  // Lưu bước con được nhập trực tiếp bên dưới bước cha
  const handleSaveInlineChild = (keepOpen = false) => {
    if (!activeParentForSub) return;
    if (!inlineChildName.trim()) {
      setInlineChildError("Vui lòng nhập tên bước con");
      return;
    }

    const finalCode = inlineChildCode.trim() || getNextSubCode(activeParentForSub, localSteps);

    const rootCode = getRootCode(activeParentForSub);
    const rootObj = localSteps.find((p) => p.code === rootCode);
    const assigneeStaff = staffList.find((s) => s.name === inlineChildAssignee);

    const newStep: ProcedureStep = {
      id: `dept-step-${Date.now()}-${finalCode}`,
      order: localSteps.length + 1,
      code: finalCode,
      groupCode: rootCode,
      groupTitle: rootObj?.name || "Quy trình thực hiện",
      name: inlineChildName.trim(),
      type: inlineChildType,
      responsibleUnit: inlineChildUnit || departmentTitle || "Chủ đầu tư",
      department: departmentTitle || undefined,
      assignedTo: inlineChildAssignee || undefined,
      assignedToId: assigneeStaff?.id,
      assignedBy: inlineChildAssignee && departmentTitle ? `Lead ${departmentTitle}` : undefined,
      assignedAt: inlineChildAssignee ? new Date().toISOString().slice(0, 10) : undefined,
      ...buildDateFields(inlineChildStart, inlineChildEnd),
      isEnabled: true,
      status: "NOT_STARTED",
      attachments: [],
      notes: "",
    };

    const updated = insertStepHierarchically(localSteps, newStep, activeParentForSub);
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => new Set([...prev, newStep.id]));

    if (keepOpen) {
      setInlineChildName("");
      setInlineChildError("");
      setInlineChildAssignee("");
      setInlineChildCode(getNextSubCode(activeParentForSub, updated));
    } else {
      setActiveParentForSub(null);
      setInlineChildName("");
      setInlineChildError("");
      setInlineChildAssignee("");
    }
  };

  // Mở modal thêm bước con
  const handleOpenAddSubStep = (defaultParentCode?: string) => {
    if (parentSteps.length === 0) {
      handleOpenAddParentStep();
      return;
    }
    const targetParent = defaultParentCode || parentSteps[parentSteps.length - 1]?.code || parentSteps[0]?.code;
    handleParentRowClick(targetParent);
  };

  // Xóa bước khỏi quy trình
  const handleRemoveStep = (stepId: string) => {
    const target = localSteps.find((s) => s.id === stepId);
    if (!target) return;
    // Xóa bước kèm toàn bộ bước con bên dưới để không còn bước con mồ côi
    const removedIds = new Set(
      localSteps.filter((s) => s.id === stepId || isDescendantOf(s.code, target.code)).map((s) => s.id)
    );
    const updated = localSteps.filter((s) => !removedIds.has(s.id)).map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => {
      const next = new Set(prev);
      removedIds.forEach((id) => next.delete(id));
      return next;
    });
    if (activeParentForSub && (activeParentForSub === target.code || isDescendantOf(activeParentForSub, target.code))) {
      setActiveParentForSub(null);
    }
  };

  // Sửa bước ngay trên dòng (bút chì): tên, đơn vị thực hiện, loại
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; responsibleUnit: string; type: StepType }>({
    name: "",
    responsibleUnit: "",
    type: "MANDATORY",
  });
  const [editError, setEditError] = useState("");

  const startEditStep = (step: ProcedureStep) => {
    setActiveParentForSub(null);
    setEditingStepId(step.id);
    setEditDraft({ name: step.name, responsibleUnit: step.responsibleUnit, type: step.type });
    setEditError("");
  };
  const cancelEditStep = () => {
    setEditingStepId(null);
    setEditError("");
  };
  const saveEditStep = () => {
    if (!editingStepId) return;
    const name = editDraft.name.trim();
    if (!name) {
      setEditError("Vui lòng nhập tên bước");
      return;
    }
    const isMandatory = editDraft.type === "MANDATORY";
    const current = localSteps.find((s) => s.id === editingStepId);
    handleUpdateStep(editingStepId, {
      name,
      // Bước chính: tên nhóm hiển thị ở màn hình chính đi theo tên bước
      ...(current && !current.code.includes(".") ? { groupTitle: name } : {}),
      responsibleUnit: editDraft.responsibleUnit.trim() || current?.responsibleUnit || "",
      type: editDraft.type,
      // Đổi sang bắt buộc thì bước luôn được áp dụng
      ...(isMandatory && current && !current.isEnabled
        ? { isEnabled: true, status: current.status === "DISABLED" ? "NOT_STARTED" : current.status }
        : {}),
    });
    setEditingStepId(null);
    setEditError("");
  };

  // Bấm thùng rác: luôn hỏi trước khi xóa (bước có bước con thì xóa luôn các bước con); chỉ áp dụng khi bấm "Lưu cấu hình"
  const confirmRemoveStep = (step: ProcedureStep) => {
    const childCount = localSteps.filter((s) => isDescendantOf(s.code, step.code)).length;
    modal.confirm({
      centered: true,
      width: 440,
      icon: null,
      zIndex: 1400,
      title: `Xóa bước [${step.code}] ${step.name}?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          {childCount > 0 && (
            <>
              Bước này có <strong>{childCount}</strong> bước con bên dưới, tất cả sẽ bị xóa cùng.{" "}
            </>
          )}
          Thay đổi chỉ áp dụng cho dự án khi bạn bấm &quot;Lưu cấu hình&quot;.
        </p>
      ),
      okText: "Xóa bước",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => handleRemoveStep(step.id),
    });
  };

  // Lưu cấu hình
  const handleSave = () => {
    onSaveConfig(localSteps, selectedProfileId);
    onClose();
  };

  // Danh sách hiển thị theo bộ lọc & tìm kiếm
  const filteredSteps = useMemo(() => {
    return localSteps.filter((step) => {
      let matchFilter = true;
      if (filterType === "MANDATORY") {
        matchFilter = step.type === "MANDATORY";
      } else if (filterType === "CONDITIONAL") {
        matchFilter = step.type === "CONDITIONAL";
      } else if (filterType === "DISABLED") {
        matchFilter = !step.isEnabled;
      }

      const matchSearch =
        searchTerm.trim() === "" ||
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.responsibleUnit.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [localSteps, filterType, searchTerm]);

  // Xác định bước cuối cùng của bước cha đang active để hiển thị dòng nhập bên dưới
  const lastCodeForActiveParent = useMemo(() => {
    if (!activeParentForSub) return null;
    let lastCode = activeParentForSub;
    for (const s of filteredSteps) {
      if (s.code === activeParentForSub || s.code.startsWith(`${activeParentForSub}.`)) {
        lastCode = s.code;
      }
    }
    return lastCode;
  }, [activeParentForSub, filteredSteps]);

  // Render dòng nhập bước con trực tiếp bên dưới bước cha
  const renderInlineChildRow = () => {
    if (!activeParentForSub) return null;
    const childDepth = getStepDepth(activeParentForSub) + 1;

    return (
      <div className="flex flex-col gap-1 px-3.5 py-2 bg-red-50/70 border-y border-red-200 border-l-[3px] border-l-[#DC2626] shadow-2xs transition-all">
        <div className="flex items-center gap-3 w-full">
          {/* Mã bước (thụt lề theo cấp) */}
          <div className="w-28 shrink-0 flex items-center gap-0.5" style={{ paddingLeft: STEP_INDENT_PX * childDepth }}>
            <span className="text-[#DC2626] font-mono text-xs select-none">└</span>
            <Input
              value={inlineChildCode}
              onChange={(e) => setInlineChildCode(e.target.value)}
              className="h-7 w-16 text-center font-mono font-bold text-[11px] bg-white border-red-200 p-0.5"
              placeholder="Mã"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineChild(false);
                if (e.key === "Escape") setActiveParentForSub(null);
              }}
            />
          </div>

          {/* Tên bước con */}
          <div className="min-w-0 flex-1 pr-2">
            <Input
              value={inlineChildName}
              onChange={(e) => {
                setInlineChildName(e.target.value);
                if (inlineChildError) setInlineChildError("");
              }}
              placeholder={`Nhập tên bước con thuộc [${activeParentForSub}] (nhấn Enter để lưu)...`}
              autoFocus
              className={`h-7 text-xs bg-white w-full ${
                inlineChildError ? "border-rose-500 ring-1 ring-rose-200" : "border-red-300 focus:border-[#DC2626]"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineChild(false);
                if (e.key === "Escape") setActiveParentForSub(null);
              }}
            />
          </div>

          {/* Người thực hiện nếu cấu hình theo phòng ban của Lead */}
          {departmentTitle && (
            <div className="w-48 shrink-0">
              <Select
                value={inlineChildAssignee || undefined}
                onChange={setInlineChildAssignee}
                size="small"
                className="w-full text-xs"
                placeholder="— Phân công —"
                allowClear
                options={staffList.map((st) => ({
                  value: st.name,
                  label: `${st.name} (${st.title})`,
                }))}
              />
            </div>
          )}

          {/* Đơn vị thực hiện - chỉ hiện khi không phải modal phòng ban */}
          {!departmentTitle && (
            <div className="w-44 xl:w-56 2xl:w-72 shrink-0 hidden md:block">
              <Select
                value={inlineChildUnit}
                onChange={setInlineChildUnit}
                size="small"
                className="w-full text-xs"
                options={unitOptions}
              />
            </div>
          )}

          {/* Ngày bắt đầu / Ngày kết thúc */}
          <div className="w-32 xl:w-36 shrink-0 hidden sm:block">
            <StepDateInput value={inlineChildStart} max={inlineChildEnd || undefined} onChange={setInlineChildStart} />
          </div>
          <div className="w-32 xl:w-36 shrink-0 hidden sm:block">
            <StepDateInput value={inlineChildEnd} min={inlineChildStart || undefined} onChange={setInlineChildEnd} />
          </div>

          {/* Phân loại */}
          <div className="w-28 shrink-0 flex items-center justify-center">
            <Select
              value={inlineChildType}
              onChange={setInlineChildType}
              size="small"
              className="w-24 text-xs"
              options={[
                { value: "MANDATORY", label: "Bắt buộc" },
                { value: "CONDITIONAL", label: "Điều kiện" },
              ]}
            />
          </div>

          {/* Áp dụng */}
          <div className="w-20 shrink-0 flex items-center justify-center text-xs text-slate-300 select-none font-medium">
            —
          </div>

          {/* Thao tác */}
          <div className="w-24 shrink-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSaveInlineChild(false)}
                className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-md bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors shadow-2xs cursor-pointer text-xs font-semibold"
                title="Lưu bước con (Enter)"
              >
                <CheckOutlined className="text-[11px]" />
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveParentForSub(null)}
                className="flex h-7 px-2 items-center justify-center rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer text-xs font-medium"
                title="Đóng (Esc)"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo lỗi nằm riêng ở dòng dưới, thẳng hàng với ô nhập tên, không làm lệch hàng controls */}
        {inlineChildError && (
          <div className="flex items-center gap-3 w-full">
            <div className="w-16 shrink-0" />
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[11px] text-rose-500 font-medium m-0 pt-0.5 leading-normal">
                {inlineChildError}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render dòng nhập bước chính (Cha) trực tiếp ở cuối danh sách
  const renderInlineParentRow = () => {
    if (!isAddingParentInline) return null;
    return (
      <div className="flex flex-col gap-1 px-3.5 py-2 bg-indigo-50/60 border-y border-indigo-300 border-l-[3px] border-l-indigo-500 shadow-2xs">
        <div className="flex items-center gap-3 w-full">
          {/* Mã bước */}
          <div className="w-28 shrink-0 text-left">
            <Input
              value={inlineParentCode}
              onChange={(e) => setInlineParentCode(e.target.value)}
              className="h-7 w-14 text-center font-mono font-bold text-[11px] bg-white border-indigo-300 p-0.5"
              placeholder="Mã"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineParent(false);
                if (e.key === "Escape") setIsAddingParentInline(false);
              }}
            />
          </div>

          {/* Tên bước chính */}
          <div className="min-w-0 flex-1 pr-2">
            <Input
              value={inlineParentName}
              onChange={(e) => {
                setInlineParentName(e.target.value);
                if (inlineParentError) setInlineParentError("");
              }}
              placeholder="Nhập tên bước chính (nhấn Enter để lưu)..."
              autoFocus
              className={`h-7 text-xs bg-white w-full font-semibold ${
                inlineParentError ? "border-rose-500 ring-1 ring-rose-200" : "border-indigo-400 focus:border-indigo-600"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineParent(false);
                if (e.key === "Escape") setIsAddingParentInline(false);
              }}
            />
          </div>

          {/* Người thực hiện nếu cấu hình theo phòng ban của Lead */}
          {departmentTitle && (
            <div className="w-48 shrink-0">
              <Select
                value={inlineParentAssignee || undefined}
                onChange={setInlineParentAssignee}
                size="small"
                className="w-full text-xs"
                placeholder="— Phân công —"
                allowClear
                options={staffList.map((st) => ({
                  value: st.name,
                  label: `${st.name} (${st.title})`,
                }))}
              />
            </div>
          )}

          {/* Đơn vị thực hiện - chỉ hiện khi không phải modal phòng ban */}
          {!departmentTitle && (
            <div className="w-44 xl:w-56 2xl:w-72 shrink-0 hidden md:block">
              <Select
                value={inlineParentUnit}
                onChange={setInlineParentUnit}
                size="small"
                className="w-full text-xs"
                options={unitOptions}
              />
            </div>
          )}

          {/* Ngày bắt đầu / Ngày kết thúc */}
          <div className="w-32 xl:w-36 shrink-0 hidden sm:block">
            <StepDateInput value={inlineParentStart} max={inlineParentEnd || undefined} onChange={setInlineParentStart} />
          </div>
          <div className="w-32 xl:w-36 shrink-0 hidden sm:block">
            <StepDateInput value={inlineParentEnd} min={inlineParentStart || undefined} onChange={setInlineParentEnd} />
          </div>

          {/* Phân loại */}
          <div className="w-28 shrink-0 flex items-center justify-center">
            <Select
              value={inlineParentType}
              onChange={setInlineParentType}
              size="small"
              className="w-24 text-xs"
              options={[
                { value: "MANDATORY", label: "Bắt buộc" },
                { value: "CONDITIONAL", label: "Điều kiện" },
              ]}
            />
          </div>

          {/* Áp dụng */}
          <div className="w-20 shrink-0 flex items-center justify-center text-xs text-slate-300 select-none font-medium">
            —
          </div>

          {/* Thao tác */}
          <div className="w-24 shrink-0 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSaveInlineParent(false)}
                className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-md bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors shadow-2xs cursor-pointer text-xs font-semibold"
                title="Lưu bước chính (Enter)"
              >
                <CheckOutlined className="text-[11px]" />
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingParentInline(false)}
                className="flex h-7 px-2 items-center justify-center rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer text-xs font-medium"
                title="Đóng (Esc)"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo lỗi nằm riêng ở dòng dưới, thẳng hàng với ô nhập tên, không làm lệch hàng controls */}
        {inlineParentError && (
          <div className="flex items-center gap-3 w-full">
            <div className="w-16 shrink-0" />
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[11px] text-rose-500 font-medium m-0 pt-0.5 leading-normal">
                {inlineParentError}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeProfile =
    customProfiles.find((p) => p.id === selectedProfileId) ||
    Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === selectedProfileId) ||
    null;

  const profileSelectOptions = useMemo(() => {
    const groups: Array<{
      label: string;
      options: Array<{
        value: string;
        label: string;
        name: string;
        stepCount: number;
        isCustom: boolean;
        badge?: string;
      }>;
    }> = [];

    // 1. Nhóm Quy trình thủ tục ĐTXD theo dự thảo (chuẩn bị đầu tư, đấu thầu, giám sát, quy hoạch)
    const deptTemplatesList = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES);
    if (deptTemplatesList.length > 0) {
      const sortedDeptTemplates = deptTemplate
        ? [deptTemplate, ...deptTemplatesList.filter((d) => d.id !== deptTemplate.id)]
        : deptTemplatesList;

      groups.push({
        label: departmentTitle
          ? `Quy trình chuyên môn: ${departmentTitle}`
          : "Quy trình thủ tục ĐTXD (theo dự thảo)",
        options: sortedDeptTemplates.map((d) => ({
          value: d.id,
          label: isSameDepartment(d.department, departmentTitle)
            ? `★ ${d.shortName} (Mẫu của ${d.department})`
            : `${d.shortName} (${d.department})`,
          name: d.name,
          stepCount: d.createSteps().length,
          isCustom: false,
          badge: d.badge,
        })),
      });
    }

    // 2. Nhóm Quy trình tùy chỉnh đã tạo (customProfiles)
    if (customProfiles.length > 0) {
      groups.push({
        label: `Quy trình tùy chỉnh đã lưu (${customProfiles.length})`,
        options: customProfiles.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.steps?.length || 0} bước)`,
          name: p.name,
          stepCount: p.steps?.length || 0,
          isCustom: true,
          badge: "Tùy chỉnh",
        })),
      });
    }

    return groups;
  }, [customProfiles, departmentTitle, deptTemplate]);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        destroyOnHidden
        // Cùng kích thước với popup Quản lý chức danh
        {...LARGE_MODAL_PROPS}
        styles={{ container: LARGE_MODAL_CONTAINER_STYLE, body: LARGE_MODAL_BODY_STYLE }}
        title={
          <div className="flex items-center justify-between pr-6 w-full">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-[#DC2626]">
                <SettingOutlined className="text-base" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {departmentTitle ? (
                    <>
                      Thêm Quy trình Thủ tục — <span className="text-[#DC2626]">{departmentTitle}</span>
                    </>
                  ) : (
                    "Cấu hình Quy trình Thủ tục Dự án"
                  )}
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  {projectName
                    ? `Dự án: ${projectName} — Tùy chỉnh quy trình, thêm bước chính và bước con phù hợp`
                    : "Tùy chỉnh hoặc thêm mới quy trình, thêm bước cha và bước con phù hợp với dự án"}
                </p>
              </div>
            </div>
          </div>
        }
        footer={[
          <div key="footer-row" className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-600 font-normal">
              Áp dụng: <strong className="text-slate-900 font-semibold">{stats.totalActiveSteps}/{stats.totalCount} bước</strong>{" "}
              <span className="text-slate-400">({stats.mandatoryCount} bắt buộc + {stats.enabledConditionalCount} điều kiện)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                key="save"
                intent="primary"
                scale="compact"
                icon={<SaveOutlined />}
                className="bg-[#DC2626] border-[#DC2626] text-white"
                onClick={handleSave}
              >
                Lưu cấu hình
              </Button>
              <Button key="cancel" scale="compact" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>,
        ]}
      >
        <div className="flex-1 min-h-0 flex flex-col gap-3 pr-1 pb-2 text-xs">
          {/* Thanh công cụ 2 dòng chuyên nghiệp, thông thoáng */}
          <div className="flex flex-col gap-2.5 bg-slate-50/90 p-3 rounded-lg border border-slate-200/80 shrink-0">
            {/* Dòng 1: Quản lý Quy trình & Thao tác chính */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Trái: Badge phòng ban (nếu có) + Chọn quy trình cũ/mẫu + Nút Thêm quy trình mới */}
              <div className="flex flex-wrap items-center gap-2">
                {departmentTitle && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] font-bold text-xs shadow-2xs shrink-0">
                    <BranchesOutlined className="text-sm" />
                    <span>{departmentTitle}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
                  <BranchesOutlined className="text-[#DC2626] text-sm" />
                  <span>Quy trình:</span>
                </div>

                <Select
                  // Quy trình đang áp dụng không còn trong danh sách (VD: mẫu chuẩn hệ thống đã bỏ) → hiện gợi ý thay vì mã
                  value={
                    profileSelectOptions.some((g) => g.options.some((o) => o.value === selectedProfileId))
                      ? selectedProfileId
                      : undefined
                  }
                  placeholder="-- Chọn quy trình để dùng ngay --"
                  onChange={handleSelectProfile}
                  className="w-72 sm:w-80 text-xs"
                  size="small"
                  popupMatchSelectWidth={420}
                  options={profileSelectOptions}
                  optionRender={(option) => {
                    const data = option.data as {
                      value: string;
                      label: string;
                      name?: string;
                      stepCount?: number;
                      isCustom?: boolean;
                      badge?: string;
                    };
                    return (
                      <div className="flex items-center justify-between w-full py-0.5">
                        <span
                          className="truncate pr-2 font-medium text-slate-800 text-xs"
                          title={data?.name || data?.label}
                        >
                          {data?.label}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {data?.isCustom ? (
                            <>
                              <Tag intent="warning" scale="sm">
                                Tùy chỉnh
                              </Tag>
                              <Tooltip title="Xóa quy trình này">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProfile(data.value, e)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                                >
                                  <DeleteOutlined className="text-[11px]" />
                                </button>
                              </Tooltip>
                            </>
                          ) : (
                            data?.badge && (
                              <Tag intent="subtle" scale="sm">
                                {data.badge}
                              </Tag>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }}
                />

                <Button
                  intent="outline"
                  scale="compact"
                  icon={<FolderAddOutlined className="text-[#DC2626]" />}
                  onClick={handleOpenCreateProfile}
                  className="h-8 text-xs font-semibold text-[#DC2626] border-red-200 hover:bg-red-50 shrink-0 shadow-2xs"
                >
                  Thêm quy trình mới
                </Button>
              </div>

              {/* Phải: Thêm bước chính */}
              <Button
                intent="primary"
                scale="compact"
                icon={<PlusOutlined />}
                onClick={handleOpenAddParentStep}
                className="h-8 text-xs font-semibold bg-[#DC2626] border-[#DC2626] text-white hover:bg-[#B91C1C] shadow-2xs shrink-0"
              >
                Thêm bước chính
              </Button>
            </div>

            {/* Dòng 2: Tìm kiếm & Bộ lọc */}
            <div className="flex items-center justify-between gap-3">
              {/* Trái: Ô tìm kiếm rộng rãi */}
              <Input
                placeholder="Tìm mã bước (I, II...), tên bước hoặc đơn vị phụ trách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="h-8 text-xs flex-1 max-w-md"
              />

              {/* Phải: Bộ lọc Tabs + Nút Reset */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-200/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType("ALL")}
                    className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Tất cả ({stats.totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("MANDATORY")}
                    className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "MANDATORY"
                      ? "bg-white text-blue-700 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Bắt buộc ({stats.mandatoryCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("CONDITIONAL")}
                    className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "CONDITIONAL"
                      ? "bg-white text-amber-700 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Điều kiện ({stats.conditionalCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng danh sách các bước: Cố định kích thước */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white min-h-0">
            {/* Header bảng */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 shrink-0">
              <div className="w-28 shrink-0 text-left pl-1">Mã bước</div>
              <div className="min-w-0 flex-1">Tên bước / Bước con</div>
              {departmentTitle && (
                <div className="w-48 shrink-0 text-center text-slate-700">Người thực hiện</div>
              )}
              {!departmentTitle && (
                <div className="w-44 xl:w-56 2xl:w-72 shrink-0 hidden md:block">Đơn vị thực hiện</div>
              )}
              <div className="w-32 xl:w-36 shrink-0 hidden sm:block text-center">Ngày bắt đầu</div>
              <div className="w-32 xl:w-36 shrink-0 hidden sm:block text-center">Ngày kết thúc</div>
              <div className="w-28 shrink-0 text-center">Loại</div>
              <div className="w-20 shrink-0 text-center">Áp dụng</div>
              <div className="w-28 shrink-0 text-center">Thao tác</div>
            </div>

            {/* Danh sách các hàng */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin] min-h-0">
              {filteredSteps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626] mb-3 border border-red-100 shadow-2xs">
                    <FolderAddOutlined className="text-2xl" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {departmentTitle
                      ? `Quy trình chuyên môn của ${departmentTitle} chưa có bước nào`
                      : localSteps.length === 0
                      ? activeProfile
                        ? `Quy trình "${activeProfile.name}" hiện chưa có bước nào`
                        : "Dự án hiện chưa có bước thủ tục nào"
                      : "Không tìm thấy bước thủ tục phù hợp với từ khóa"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                    {departmentTitle
                      ? `Là Lead (Tổ trưởng) ${departmentTitle}, bạn hãy thêm các bước quy trình chuyên môn (bước chính I, II... và bước con I.1, I.2...) và phân công cho thành viên trong tổ.`
                      : localSteps.length === 0
                      ? "Bạn có thể áp dụng ngay quy trình mẫu chuẩn có sẵn hoặc thêm bước chính thủ công bên dưới:"
                      : "Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc chuyển sang tab bộ lọc khác."}
                  </p>
                  {localSteps.length === 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {deptTemplate && (
                        <Button
                          intent="primary"
                          scale="compact"
                          icon={<BranchesOutlined />}
                          onClick={() => handleSelectProfile(deptTemplate.id)}
                          className="bg-[#DC2626] border-[#DC2626] text-white font-semibold h-8.5 px-4 shadow-2xs hover:bg-[#B91C1C]"
                        >
                          Áp dụng {deptTemplate.shortName}
                        </Button>
                      )}
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<FolderAddOutlined className="text-[#DC2626]" />}
                        onClick={handleOpenCreateProfile}
                        className="font-semibold h-8.5 px-4 text-[#DC2626] border-red-200 hover:bg-red-50 shadow-2xs"
                      >
                        Thêm quy trình mới
                      </Button>
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAddParentStep}
                        className="font-semibold h-8.5 px-4 text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]"
                      >
                        Thêm bước chính thủ công
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                filteredSteps.map((step) => {
                  const isMandatory = step.type === "MANDATORY";
                  const isEnabled = step.isEnabled;
                  const depth = getStepDepth(step.code);
                  const isSubStep = depth > 0;
                  // Bước nào cũng có thể thêm bước con (không giới hạn số cấp)
                  const isCurrentParentActive = activeParentForSub === step.code;
                  const isEditing = editingStepId === step.id;

                  return (
                    <div key={step.id}>
                      <div
                        onClick={() => {
                          if (!isSubStep && !isEditing) {
                            handleParentRowClick(step.code);
                          }
                        }}
                        className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${isEditing
                          ? // Đang sửa: luôn sáng rõ và nổi bật, kể cả bước đang tắt
                            "bg-red-50/70 border-l-[3px] border-l-[#DC2626] ring-1 ring-inset ring-red-200"
                          : !isEnabled
                          ? "bg-slate-50/70 opacity-60"
                          : isSubStep
                            ? "bg-slate-50/30 hover:bg-red-50/20 border-l-[3px] border-l-red-300/80"
                            : isCurrentParentActive
                              ? "bg-red-50/60 hover:bg-red-50/80 cursor-pointer border-l-[3px] border-l-[#DC2626]"
                              : "hover:bg-red-50/30 cursor-pointer"
                          }`}
                        title={!isSubStep ? "Nhấn vào bước chính này để thêm bước con bên dưới" : undefined}
                      >
                        {/* Mã bước (thụt lề theo cấp) */}
                        <div className="w-28 shrink-0" style={{ paddingLeft: STEP_INDENT_PX * depth }}>
                          {isSubStep ? (
                            <div className="flex items-center gap-0.5">
                              <span className="text-[#DC2626] font-mono text-xs select-none">└</span>
                              <span className="inline-block min-w-8 rounded border border-red-200 bg-red-50 px-1 py-0.5 text-center text-[11px] font-bold font-mono text-red-800 shadow-2xs">
                                {step.code}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block min-w-9 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-center text-xs font-extrabold font-mono text-slate-800 shadow-2xs">
                              {step.code}
                            </span>
                          )}
                        </div>

                        {/* Tên bước */}
                        <div className="min-w-0 flex-1 pr-2" style={{ paddingLeft: STEP_INDENT_PX * depth }}>
                          {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Input
                                autoFocus
                                value={editDraft.name}
                                onChange={(e) => {
                                  setEditDraft((d) => ({ ...d, name: e.target.value }));
                                  if (editError) setEditError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditStep();
                                  if (e.key === "Escape") cancelEditStep();
                                }}
                                placeholder="Tên bước (nhấn Enter để lưu)..."
                                className={`h-7 text-xs bg-white w-full ${
                                  editError ? "border-rose-500 ring-1 ring-rose-200" : "border-red-300 focus:border-[#DC2626]"
                                }`}
                              />
                              {editError && <div className="mt-0.5 text-[11px] text-rose-600">{editError}</div>}
                            </div>
                          ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`leading-snug truncate ${isSubStep ? "text-xs font-medium text-slate-700" : "text-xs font-bold text-slate-900"
                                } ${!isEnabled ? "text-slate-400 line-through" : ""}`}
                              title={step.name}
                            >
                              {step.name}
                            </span>
                            {step.notes && (
                              <Tooltip title={<span className="whitespace-pre-line">{step.notes}</span>} placement="topLeft">
                                <InfoCircleOutlined className="text-slate-400 hover:text-slate-600 text-xs cursor-help shrink-0" />
                              </Tooltip>
                            )}
                            {isCurrentParentActive && (
                              <span className="text-[10px] font-semibold text-[#DC2626] bg-red-100/80 px-1.5 py-0.2 rounded shrink-0">
                                Đang thêm bước con
                              </span>
                            )}
                          </div>
                          )}

                          {/* Hiện phụ đơn vị & thời gian trên màn hình nhỏ */}
                          <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 md:hidden mt-0.5">
                            {!departmentTitle && (
                              <>
                                <span>{step.responsibleUnit}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="text-[#DC2626] font-medium">{step.durationMargin}</span>
                          </div>
                        </div>

                        {/* Người thực hiện nếu cấu hình theo phòng ban của Lead */}
                        {departmentTitle && (
                          <div className="w-48 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={step.assignedTo || undefined}
                              placeholder="— Chọn cán bộ —"
                              size="small"
                              className="w-full text-xs"
                              allowClear
                              onChange={(val) => {
                                const staffObj = staffList.find((s) => s.name === val);
                                handleUpdateStep(step.id, {
                                  assignedTo: (val as string) || undefined,
                                  assignedToId: staffObj?.id,
                                  assignedBy: `Lead ${departmentTitle}`,
                                  assignedAt: val ? new Date().toISOString().slice(0, 10) : undefined,
                                });
                              }}
                              options={staffList.map((st) => ({
                                value: st.name,
                                label: `${st.name} (${st.title})`,
                              }))}
                            />
                          </div>
                        )}

                        {/* Đơn vị thực hiện - chỉ hiện khi không phải modal phòng ban */}
                        {!departmentTitle && (
                          <div className="w-44 xl:w-56 2xl:w-72 shrink-0 hidden md:block text-xs text-slate-700 truncate" title={step.responsibleUnit}>
                            {isEditing ? (
                              <Input
                                value={editDraft.responsibleUnit}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setEditDraft((d) => ({ ...d, responsibleUnit: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditStep();
                                  if (e.key === "Escape") cancelEditStep();
                                }}
                                placeholder="Đơn vị thực hiện"
                                className="h-7 text-xs bg-white w-full border-red-300 focus:border-[#DC2626]"
                              />
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium max-w-full truncate">
                                {step.responsibleUnit}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Ngày bắt đầu / Ngày kết thúc (số ngày kế hoạch tự tính theo 2 ngày này) */}
                        <div className="w-32 xl:w-36 shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
                          <StepDateInput
                            value={step.startDatePlanned}
                            max={step.endDatePlanned}
                            disabled={!isEnabled}
                            onChange={(val) => handleUpdateStep(step.id, buildDateFields(val, step.endDatePlanned))}
                          />
                        </div>
                        <div className="w-32 xl:w-36 shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
                          <StepDateInput
                            value={step.endDatePlanned}
                            min={step.startDatePlanned}
                            disabled={!isEnabled}
                            onChange={(val) => handleUpdateStep(step.id, buildDateFields(step.startDatePlanned, val))}
                          />
                        </div>

                        {/* Phân loại */}
                        <div className="w-28 shrink-0 flex items-center justify-center" onClick={(e) => isEditing && e.stopPropagation()}>
                          {isEditing ? (
                            <Select
                              value={editDraft.type}
                              onChange={(val) => setEditDraft((d) => ({ ...d, type: val as StepType }))}
                              size="small"
                              className="w-24 text-xs"
                              options={[
                                { value: "MANDATORY", label: "Bắt buộc" },
                                { value: "CONDITIONAL", label: "Điều kiện" },
                              ]}
                            />
                          ) : isMandatory ? (
                            <Tag intent="brand" scale="sm">
                              Bắt buộc
                            </Tag>
                          ) : (
                            <Tag intent="warning" scale="sm">
                              Điều kiện
                            </Tag>
                          )}
                        </div>

                        {/* Áp dụng: Bật/Tắt (cho bước điều kiện) */}
                        <div
                          className="w-20 shrink-0 flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isMandatory ? (
                            <div className="flex h-7 items-center justify-center gap-2">
                              <Switch
                                checked={isEnabled}
                                onChange={(checked) => handleToggle(step.id, checked)}
                                size="small"
                                className={isEnabled ? "bg-[#DC2626]" : "bg-slate-300"}
                              />
                              <span
                                className={`w-7 text-left text-xs font-medium select-none ${
                                  isEnabled ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {isEnabled ? "Bật" : "Tắt"}
                              </span>
                            </div>
                          ) : (
                            <Tooltip title="Bước bắt buộc (mặc định luôn áp dụng)">
                              <span className="text-xs text-slate-300 select-none font-medium">—</span>
                            </Tooltip>
                          )}
                        </div>

                        {/* Thao tác: Thêm bước con, Sửa, Xóa (đang sửa: Lưu / Hủy) */}
                        <div
                          className="w-28 shrink-0 flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditing && (
                            <>
                              <Tooltip title="Lưu thay đổi (Enter)">
                                <button
                                  type="button"
                                  onClick={saveEditStep}
                                  aria-label="Lưu thay đổi"
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-[#DC2626] bg-[#DC2626] text-white shadow-2xs transition-colors cursor-pointer hover:bg-[#B91C1C]"
                                >
                                  <CheckOutlined className="text-xs" />
                                </button>
                              </Tooltip>
                              <Tooltip title="Hủy sửa (Esc)">
                                <button
                                  type="button"
                                  onClick={cancelEditStep}
                                  aria-label="Hủy sửa"
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-2xs transition-colors cursor-pointer hover:bg-slate-100"
                                >
                                  <CloseOutlined className="text-xs" />
                                </button>
                              </Tooltip>
                            </>
                          )}

                          {/* 1. Nút thêm bước con (mọi cấp) */}
                          {!isEditing && (
                            <Tooltip
                              title={
                                isCurrentParentActive
                                  ? "Đang mở thêm bước con (nhấn để đóng)"
                                  : `Thêm bước con cho [${step.code}]`
                              }
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleParentRowClick(step.code);
                                }}
                                className={`flex h-7 w-7 items-center justify-center rounded-md border transition-all cursor-pointer shadow-2xs ${
                                  isCurrentParentActive
                                    ? "border-[#DC2626] bg-[#DC2626] text-white ring-2 ring-red-200"
                                    : "border-red-200 bg-red-50 text-[#DC2626] hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                                }`}
                                aria-label="Thêm quy trình con"
                              >
                                <PlusOutlined className="text-xs font-bold" />
                              </button>
                            </Tooltip>
                          )}

                          {/* 2. Nút sửa bước ngay trên dòng */}
                          {!isEditing && (
                            <Tooltip title={`Sửa bước [${step.code}]`}>
                              <button
                                type="button"
                                onClick={() => startEditStep(step)}
                                aria-label={`Sửa bước ${step.code}`}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-2xs transition-colors cursor-pointer hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                              >
                                <EditOutlined className="text-xs" />
                              </button>
                            </Tooltip>
                          )}

                          {/* 3. Nút xóa bước (mọi bước, luôn hỏi trước khi xóa) */}
                          {!isEditing && (
                          <Tooltip title={`Xóa bước [${step.code}]`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRemoveStep(step);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-2xs transition-colors cursor-pointer hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Xóa bước ${step.code}`}
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Tooltip>
                          )}

                        </div>
                      </div>

                      {/* Hiển thị dòng nhập bước con trực tiếp bên dưới bước cha / các bước con hiện có */}
                      {step.code === lastCodeForActiveParent && renderInlineChildRow()}
                    </div>
                  );
                })
              )}
            </div>
            {/* Dòng nhập inline bước chính (Cha) hiện ngay cuối danh sách */}
            {renderInlineParentRow()}
          </div>
        </div>
      </Modal>

      {/* MODAL: THÊM / TẠO QUY TRÌNH MỚI */}
      <Modal
        open={isCreateProfileOpen}
        onCancel={() => setIsCreateProfileOpen(false)}
        centered
        width={560}
        zIndex={1350}
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <span>Thêm Quy trình Thủ tục Mới</span>
          </div>
        }
        footer={[
          <Button
            key="confirm-create"
            intent="primary"
            scale="compact"
            icon={<CheckOutlined />}
            className="bg-[#DC2626] border-[#DC2626] text-white font-semibold"
            onClick={handleConfirmCreateProfile}
          >
            Tạo & Lưu quy trình
          </Button>,
          <Button key="cancel-create" scale="compact" onClick={() => setIsCreateProfileOpen(false)}>
            Hủy
          </Button>,
        ]}
      >
        <div className="space-y-4 py-2 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Tên quy trình mới <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Quy trình Giám sát công trình đặc thù, Quy trình nghiệm thu nhanh..."
              value={newProfileName}
              onChange={(e) => {
                setNewProfileName(e.target.value);
                if (createProfileError) setCreateProfileError("");
              }}
              onPressEnter={handleConfirmCreateProfile}
              className="w-full text-xs h-9"
              autoFocus
            />
            {createProfileError && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{createProfileError}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Nguồn khởi tạo các bước quy trình:
            </label>
            <div className="space-y-2">
              {localSteps.length > 0 && (
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    newProfileSource === "CURRENT"
                      ? "border-[#DC2626] bg-red-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                  onClick={() => setNewProfileSource("CURRENT")}
                >
                  <input
                    type="radio"
                    name="newProfileSource"
                    checked={newProfileSource === "CURRENT"}
                    onChange={() => setNewProfileSource("CURRENT")}
                    className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <div>
                    <div className="font-semibold text-slate-800">
                      Lưu và sao chép từ {localSteps.length} bước hiện tại đang thiết lập
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Giữ nguyên toàn bộ bước chính, bước con, thời gian và phân công đang cấu hình để tái sử dụng về sau.
                    </div>
                  </div>
                </label>
              )}

              {deptTemplate && (
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    newProfileSource === "DEPT_TEMPLATE"
                      ? "border-[#DC2626] bg-red-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                  onClick={() => setNewProfileSource("DEPT_TEMPLATE")}
                >
                  <input
                    type="radio"
                    name="newProfileSource"
                    checked={newProfileSource === "DEPT_TEMPLATE"}
                    onChange={() => setNewProfileSource("DEPT_TEMPLATE")}
                    className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <div>
                    <div className="font-semibold text-slate-800">
                      Khởi tạo từ {deptTemplate.shortName} (Mẫu của {deptTemplate.department})
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {deptTemplate.description}
                    </div>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  newProfileSource === "EMPTY"
                    ? "border-[#DC2626] bg-red-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
                onClick={() => setNewProfileSource("EMPTY")}
              >
                <input
                  type="radio"
                  name="newProfileSource"
                  checked={newProfileSource === "EMPTY"}
                  onChange={() => setNewProfileSource("EMPTY")}
                  className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                />
                <div>
                  <div className="font-semibold text-slate-800">
                    Quy trình trống (tự thêm bước từ đầu)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bắt đầu với danh sách rỗng và tự thêm các bước chính, bước con theo nhu cầu.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            💡 <strong>Tiện ích tái sử dụng:</strong> Sau khi tạo, quy trình này sẽ được lưu vĩnh viễn vào hệ thống. Bạn và các dự án khác có thể chọn dùng lại bất kỳ lúc nào tại ô chọn quy trình mà không mất công setup lại từng bước.
          </div>
        </div>
      </Modal>

    </>
  );
}
