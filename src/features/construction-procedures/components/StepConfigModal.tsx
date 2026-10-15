"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BranchesOutlined,
  CheckOutlined,
  DeleteOutlined,
  FolderAddOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Switch, Tag, Tooltip, toast } from "@/components/ui";
import { MASTER_PROCEDURE_STEPS } from "../constants/procedure-steps-master";
import type { ProcedureStep, StepStatus } from "../types/procedure.types";

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
  BUILTIN_PROCEDURE_TEMPLATES,
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

// Gợi ý mã bước con tiếp theo (ví dụ bước cha II -> II.1, II.2...)
const getNextSubCode = (parentCode: string, steps: ProcedureStep[]): string => {
  const children = steps.filter((s) => s.code.startsWith(`${parentCode}.`));
  let maxChildNum = 0;
  for (const c of children) {
    const parts = c.code.split(".");
    const childNum = parseInt(parts[1], 10);
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

export default function StepConfigModal({
  open,
  steps,
  currentProcedureId,
  departmentTitle,
  projectName,
  onClose,
  onSaveConfig,
}: StepConfigModalProps) {
  const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(steps);
  const [filterType, setFilterType] = useState<"ALL" | "MANDATORY" | "CONDITIONAL" | "DISABLED">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Quản lý quy trình (kịch bản)
  const [customProfiles, setCustomProfiles] = useState<CustomProcedureProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    currentProcedureId || (steps.length > 0 ? "standard-16" : "")
  );

  // Modal 1: Tạo quy trình mới
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileSource, setNewProfileSource] = useState<"CURRENT" | "DEPT_TEMPLATE" | "STANDARD_16" | "EMPTY">("CURRENT");
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
  const [inlineParentMinDays, setInlineParentMinDays] = useState<number>(5);
  const [inlineParentMaxDays, setInlineParentMaxDays] = useState<number>(10);
  const [inlineParentType, setInlineParentType] = useState<"MANDATORY" | "CONDITIONAL">("MANDATORY");
  const [inlineParentError, setInlineParentError] = useState<string>("");

  // Trạng thái thêm bước con trực tiếp bên dưới bước cha khi click vào cha
  const [activeParentForSub, setActiveParentForSub] = useState<string | null>(null);
  const [inlineChildCode, setInlineChildCode] = useState<string>("");
  const [inlineChildName, setInlineChildName] = useState<string>("");
  const [inlineChildUnit, setInlineChildUnit] = useState<string>("Chủ đầu tư");
  const [inlineChildAssignee, setInlineChildAssignee] = useState<string>("");
  const [inlineChildMinDays, setInlineChildMinDays] = useState<number>(3);
  const [inlineChildMaxDays, setInlineChildMaxDays] = useState<number>(7);
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
      setSelectedProfileId(currentProcedureId || (steps.length > 0 ? "standard-16" : ""));
      setNewlyAddedStepIds(new Set()); // Reset danh sách bước mới khi mở modal
      if (departmentTitle) {
        setInlineParentUnit(departmentTitle);
        setInlineChildUnit(departmentTitle);
      }
    }
  }, [open, steps, currentProcedureId, departmentTitle]);

  const masterStepsMap = useMemo(() => {
    const map = new Map<string, (typeof MASTER_PROCEDURE_STEPS)[number]>();
    MASTER_PROCEDURE_STEPS.forEach((m) => map.set(m.id, m));
    return map;
  }, []);

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
      const updated: ProcedureStep[] = prev.map((s) => {
        if (s.id === stepId && s.type === "CONDITIONAL") {
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
          const master = masterStepsMap.get(s.id);
          const current = s.plannedDays || master?.defaultDays || 10;
          const min = master?.durationDaysMin || 1;
          const max = master?.durationDaysMax || 180;
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

  // Chuyển đổi quy trình đang áp dụng
  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);

    // 1. Kiểm tra template theo phòng ban
    const deptTpl = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === profileId);
    if (deptTpl) {
      const loadedSteps = deptTpl.createSteps();
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
      toast.success("Áp dụng quy trình", `Đã tải ${deptTpl.name} (${loadedSteps.length} bước)!`);
      return;
    }

    // 2. Kiểm tra template chuẩn hệ thống
    const builtin = BUILTIN_PROCEDURE_TEMPLATES.find((b) => b.id === profileId);
    if (builtin) {
      if (profileId === currentProcedureId && steps.length > 0) {
        setLocalSteps(steps);
      } else {
        const loadedSteps = builtin.createSteps();
        setLocalSteps(loadedSteps);
        toast.success("Áp dụng quy trình", `Đã tải ${builtin.name} (${loadedSteps.length} bước)!`);
      }
      setNewlyAddedStepIds(new Set());
      return;
    }

    // 3. Kiểm tra custom profile
    const target = customProfiles.find((p) => p.id === profileId);
    if (target) {
      const loadedSteps = target.steps || [];
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
      toast.success("Áp dụng quy trình", `Đã tải quy trình "${target.name}" (${loadedSteps.length} bước)!`);
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
      const fallbackId = currentProcedureId || (deptTemplate ? deptTemplate.id : "standard-16");
      setSelectedProfileId(fallbackId);
      const builtin = BUILTIN_PROCEDURE_TEMPLATES.find((b) => b.id === fallbackId);
      const deptT = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === fallbackId);
      if (deptT) {
        setLocalSteps(deptT.createSteps());
      } else if (builtin) {
        setLocalSteps(builtin.createSteps());
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
    } else if (newProfileSource === "STANDARD_16") {
      const std = BUILTIN_PROCEDURE_TEMPLATES.find((b) => b.id === "standard-16");
      initialSteps = std ? std.createSteps() : [];
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

  // Sao chép 16 bước chuẩn hóa vào quy trình hiện tại
  const handleLoadMasterSteps = () => {
    const masterSteps: ProcedureStep[] = MASTER_PROCEDURE_STEPS.map((m) => ({
      id: `dept-step-${Date.now()}-${m.code}`,
      order: m.order,
      code: m.code,
      groupCode: m.groupCode,
      groupTitle: m.groupTitle,
      name: m.name,
      type: m.type,
      responsibleUnit: m.responsibleUnit,
      durationMargin: m.durationMargin,
      durationDaysMin: m.durationDaysMin,
      durationDaysMax: m.durationDaysMax,
      isContractBased: m.isContractBased,
      isSpecialRequest: m.isSpecialRequest,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: m.defaultDays,
      attachments: [],
      notes: "",
    }));
    setLocalSteps(masterSteps);
    syncToCurrentProfile(masterSteps);
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
    setInlineParentMinDays(5);
    setInlineParentMaxDays(10);
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
    const minD = Math.max(1, inlineParentMinDays || 1);
    const maxD = Math.max(minD, inlineParentMaxDays || minD);
    const durText = minD === maxD ? `${minD} ngày` : `${minD}–${maxD} ngày`;
    const defaultPlanned = Math.round((minD + maxD) / 2);
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
      durationMargin: durText,
      durationDaysMin: minD,
      durationDaysMax: maxD,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: defaultPlanned,
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
    setInlineChildMinDays(3);
    setInlineChildMaxDays(7);
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

    const minD = Math.max(1, inlineChildMinDays || 1);
    const maxD = Math.max(minD, inlineChildMaxDays || minD);
    const durText = minD === maxD ? `${minD} ngày` : `${minD}–${maxD} ngày`;
    const defaultPlanned = Math.round((minD + maxD) / 2);
    const finalCode = inlineChildCode.trim() || getNextSubCode(activeParentForSub, localSteps);

    const parentObj = localSteps.find((p) => p.code === activeParentForSub);
    const assigneeStaff = staffList.find((s) => s.name === inlineChildAssignee);

    const newStep: ProcedureStep = {
      id: `dept-step-${Date.now()}-${finalCode}`,
      order: localSteps.length + 1,
      code: finalCode,
      groupCode: activeParentForSub,
      groupTitle: parentObj?.name || "Quy trình thực hiện",
      name: inlineChildName.trim(),
      type: inlineChildType,
      responsibleUnit: inlineChildUnit || departmentTitle || "Chủ đầu tư",
      department: departmentTitle || undefined,
      assignedTo: inlineChildAssignee || undefined,
      assignedToId: assigneeStaff?.id,
      assignedBy: inlineChildAssignee && departmentTitle ? `Lead ${departmentTitle}` : undefined,
      assignedAt: inlineChildAssignee ? new Date().toISOString().slice(0, 10) : undefined,
      durationMargin: durText,
      durationDaysMin: minD,
      durationDaysMax: maxD,
      isEnabled: true,
      status: "NOT_STARTED",
      plannedDays: defaultPlanned,
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
    const updated = localSteps.filter((s) => s.id !== stepId);
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => {
      const next = new Set(prev);
      next.delete(stepId);
      return next;
    });
  };

  // Đặt lại mặc định
  const handleReset = () => {
    setLocalSteps(steps);
    setSelectedProfileId(currentProcedureId || (steps.length > 0 ? "standard-16" : ""));
    setActiveParentForSub(null);
    setIsAddingParentInline(false);
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

    return (
      <div className="flex flex-col gap-1 px-3.5 py-2 bg-red-50/70 border-y border-red-200 border-l-[3px] border-l-[#DC2626] shadow-2xs transition-all">
        <div className="flex items-center gap-3 w-full">
          {/* Mã bước */}
          <div className="w-16 shrink-0 text-center flex items-center justify-center gap-0.5">
            <span className="text-[#DC2626] font-mono text-xs select-none">└</span>
            <Input
              value={inlineChildCode}
              onChange={(e) => setInlineChildCode(e.target.value)}
              className="h-7 w-12 text-center font-mono font-bold text-[11px] bg-white border-red-200 p-0.5"
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
            <div className="w-44 shrink-0 hidden md:block">
              <Select
                value={inlineChildUnit}
                onChange={setInlineChildUnit}
                size="small"
                className="w-full text-xs"
                options={unitOptions}
              />
            </div>
          )}

          {/* Thời gian */}
          <div className="w-40 shrink-0 hidden sm:block text-center">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              <input
                type="number"
                min={1}
                max={365}
                value={inlineChildMinDays}
                onChange={(e) => setInlineChildMinDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 h-7 text-center font-bold text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded px-0.5 focus:bg-white focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
              <span className="text-slate-400 font-bold shrink-0">–</span>
              <input
                type="number"
                min={1}
                max={365}
                value={inlineChildMaxDays}
                onChange={(e) => setInlineChildMaxDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 h-7 text-center font-bold text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded px-0.5 focus:bg-white focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
              <span className="text-xs text-slate-600 font-medium shrink-0">ngày</span>
            </div>
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
          <div className="w-16 shrink-0 text-center">
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
            <div className="w-44 shrink-0 hidden md:block">
              <Select
                value={inlineParentUnit}
                onChange={setInlineParentUnit}
                size="small"
                className="w-full text-xs"
                options={unitOptions}
              />
            </div>
          )}

          {/* Thời gian */}
          <div className="w-40 shrink-0 hidden sm:block text-center">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              <input
                type="number"
                min={1}
                max={365}
                value={inlineParentMinDays}
                onChange={(e) => setInlineParentMinDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 h-7 text-center font-bold text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded px-0.5 focus:bg-white focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
              <span className="text-slate-400 font-bold shrink-0">–</span>
              <input
                type="number"
                min={1}
                max={365}
                value={inlineParentMaxDays}
                onChange={(e) => setInlineParentMaxDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-10 h-7 text-center font-bold text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded px-0.5 focus:bg-white focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
              <span className="text-xs text-slate-600 font-medium shrink-0">ngày</span>
            </div>
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
    BUILTIN_PROCEDURE_TEMPLATES.find((b) => b.id === selectedProfileId) ||
    (deptTemplate?.id === selectedProfileId ? deptTemplate : null);

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

    // 1. Nhóm Quy trình theo Phòng ban
    const deptTemplatesList = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES);
    if (deptTemplatesList.length > 0) {
      const sortedDeptTemplates = deptTemplate
        ? [deptTemplate, ...deptTemplatesList.filter((d) => d.id !== deptTemplate.id)]
        : deptTemplatesList;

      groups.push({
        label: departmentTitle
          ? `Quy trình chuyên môn: ${departmentTitle}`
          : "Quy trình theo Tổ / Phòng ban",
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

    // 3. Nhóm Quy trình mẫu chuẩn chung
    groups.push({
      label: "Quy trình mẫu chuẩn hệ thống",
      options: BUILTIN_PROCEDURE_TEMPLATES.map((b) => ({
        value: b.id,
        label: b.shortName,
        name: b.name,
        stepCount: b.stepCount,
        isCustom: false,
        badge: b.badge,
      })),
    });

    return groups;
  }, [customProfiles, departmentTitle, deptTemplate]);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        destroyOnHidden
        width={1200}
        centered
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
                Lưu cấu hình ({stats.totalActiveSteps} bước)
              </Button>
              <Button key="cancel" scale="compact" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>,
        ]}
      >
        <div className="h-[520px] flex flex-col gap-3 pr-1 pb-2 text-xs">
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
                  value={selectedProfileId || undefined}
                  placeholder="-- Chọn quy trình cũ để dùng ngay --"
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

                <Tooltip title="Đặt lại cấu hình ban đầu">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                  >
                    <UndoOutlined />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Bảng danh sách các bước: Cố định kích thước */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white min-h-0">
            {/* Header bảng */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 shrink-0">
              <div className="w-16 shrink-0 text-center">Mã bước</div>
              <div className="min-w-0 flex-1">Tên bước / Bước con</div>
              {departmentTitle && (
                <div className="w-48 shrink-0 text-center text-slate-700">Người thực hiện</div>
              )}
              {!departmentTitle && (
                <div className="w-44 shrink-0 hidden md:block">Đơn vị thực hiện</div>
              )}
              <div className="w-40 shrink-0 hidden sm:block text-center">Thời gian</div>
              <div className="w-28 shrink-0 text-center">Loại</div>
              <div className="w-20 shrink-0 text-center">Áp dụng</div>
              <div className="w-24 shrink-0 text-center">Thao tác</div>
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
                        icon={<BranchesOutlined />}
                        onClick={() => handleSelectProfile("standard-16")}
                        className="font-semibold h-8.5 px-4 text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]"
                      >
                        Quy trình chuẩn (16 bước)
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
                  const isSubStep = step.code.includes(".");
                  const master = masterStepsMap.get(step.id);
                  const isCurrentParentActive = !isSubStep && activeParentForSub === step.code;

                  return (
                    <div key={step.id}>
                      <div
                        onClick={() => {
                          if (!isSubStep) {
                            handleParentRowClick(step.code);
                          }
                        }}
                        className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${!isEnabled
                          ? "bg-slate-50/70 opacity-60"
                          : isSubStep
                            ? "bg-slate-50/30 hover:bg-red-50/20 border-l-[3px] border-l-red-300/80"
                            : isCurrentParentActive
                              ? "bg-red-50/60 hover:bg-red-50/80 cursor-pointer border-l-[3px] border-l-[#DC2626]"
                              : "hover:bg-red-50/30 cursor-pointer"
                          }`}
                        title={!isSubStep ? "Nhấn vào bước chính này để thêm bước con bên dưới" : undefined}
                      >
                        {/* Mã bước */}
                        <div className="w-16 shrink-0 text-center">
                          {isSubStep ? (
                            <div className="flex items-center justify-center gap-0.5">
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
                        <div className={`min-w-0 flex-1 pr-2 ${isSubStep ? "pl-3" : ""}`}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`leading-snug truncate ${isSubStep ? "text-xs font-medium text-slate-700" : "text-xs font-bold text-slate-900"
                                } ${!isEnabled ? "text-slate-400 line-through" : ""}`}
                              title={step.name}
                            >
                              {step.name}
                            </span>
                            {master?.description && (
                              <Tooltip title={master.description} placement="topLeft">
                                <InfoCircleOutlined className="text-slate-400 hover:text-slate-600 text-xs cursor-help shrink-0" />
                              </Tooltip>
                            )}
                            {isCurrentParentActive && (
                              <span className="text-[10px] font-semibold text-[#DC2626] bg-red-100/80 px-1.5 py-0.2 rounded shrink-0">
                                Đang thêm bước con
                              </span>
                            )}
                          </div>

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
                          <div className="w-44 shrink-0 hidden md:block text-xs text-slate-700 truncate" title={step.responsibleUnit}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium max-w-full truncate">
                              {step.responsibleUnit}
                            </span>
                          </div>
                        )}

                        {/* Thời gian */}
                        <div className="w-40 shrink-0 hidden sm:block text-xs font-semibold text-slate-700 text-center">
                          {step.durationMargin}
                        </div>

                        {/* Phân loại */}
                        <div className="w-28 shrink-0 flex items-center justify-center">
                          {isMandatory ? (
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

                        {/* Thao tác: Thêm bước con (chỉ cha), Xóa bước */}
                        <div
                          className="w-24 shrink-0 flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Nút thêm quy trình con (Chỉ bước cha mới có) */}
                          {!isSubStep && (
                            <Tooltip
                              title={
                                isCurrentParentActive
                                  ? "Đang mở thêm quy trình con (nhấn để đóng)"
                                  : "Thêm quy trình con"
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

                          {/* 2. Nút xóa bước — hiện khi trong profile tự tạo HOẶC bước vừa thêm chưa lưu */}
                          {(selectedProfileId.startsWith("custom_") || newlyAddedStepIds.has(step.id)) && (
                            <Tooltip title={newlyAddedStepIds.has(step.id) ? "Xóa bước vừa thêm (chưa lưu)" : "Xóa bước này khỏi quy trình"}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveStep(step.id);
                                }}
                                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                                  newlyAddedStepIds.has(step.id)
                                    ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
                                    : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                                }`}
                              >
                                <DeleteOutlined className="text-xs" />
                              </button>
                            </Tooltip>
                          )}

                          {/* Nếu là bước con và không có nút xóa, hiển thị dấu gạch ngang mờ */}
                          {isSubStep && !(selectedProfileId.startsWith("custom_") || newlyAddedStepIds.has(step.id)) && (
                            <span className="text-xs text-slate-300 select-none font-medium">—</span>
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
            <FolderAddOutlined className="text-[#DC2626] text-base" />
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
                  newProfileSource === "STANDARD_16"
                    ? "border-[#DC2626] bg-red-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
                onClick={() => setNewProfileSource("STANDARD_16")}
              >
                <input
                  type="radio"
                  name="newProfileSource"
                  checked={newProfileSource === "STANDARD_16"}
                  onChange={() => setNewProfileSource("STANDARD_16")}
                  className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                />
                <div>
                  <div className="font-semibold text-slate-800">
                    Khởi tạo từ Quy trình chuẩn ĐTXD (16 bước)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Quy trình chuẩn hóa theo Nghị định 15/2021/NĐ-CP.
                  </div>
                </div>
              </label>

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
