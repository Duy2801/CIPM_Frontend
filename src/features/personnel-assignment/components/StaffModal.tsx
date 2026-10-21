"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  InfoCircleOutlined,
  MailOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Col, Divider, Drawer, Form, Input, Row, Select, Text, toast } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { PersonnelDataset, StaffInput, Team, TeamId } from "../types/personnel.types";
import type { CustomFieldDefinition, CustomFieldType } from "../types/custom-fields.types";
import { getCustomFields, saveCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";
import { mockPersonnelRepository } from "../services/mock-personnel.repository";
import { useLockedTitles } from "../hooks/useLockedTitles";

interface StaffFormValues extends Omit<StaffInput, "isLeader" | "title"> {
  title?: string;
  teamRole: string;
  customFields?: Record<string, any>;
}

interface StaffModalProps {
  data: PersonnelDataset;
  errorText?: string;
  onClose: () => void;
  onCreate: (input: StaffInput) => Promise<boolean>;
}

interface RoleOptionItem {
  value: string;
  roleCode: string;
  isLeader: boolean;
  title: string;
  teamId?: string;
  teamName?: string;
  searchText: string;
  label: React.ReactNode;
}

const BASE_TEAM_POSITIONS: Record<
  string,
  { title: string; roleCode: string; isLeader?: boolean }[]
> = {
  BGD: [
    { title: "Giám đốc", roleCode: "ADMIN", isLeader: true },
  ],
  PGD: [
    { title: "Phó Giám đốc", roleCode: "DEPUTY_DIRECTOR", isLeader: true },
  ],
  GSKT: [
    { title: "Tổ trưởng", roleCode: "TECHNICAL_OFFICER", isLeader: true },
    { title: "Tổ phó (KT)", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    { title: "Tổ phó (GS)", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "TECHNICAL_OFFICER", isLeader: false },
  ],
  BT: [
    { title: "Tổ trưởng", roleCode: "COMPENSATION_OFFICER", isLeader: true },
    { title: "Tổ phó", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Thành viên bồi thường", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "COMPENSATION_OFFICER", isLeader: false },
  ],
  HCTH: [
    { title: "Kế toán trưởng", roleCode: "CHIEF_ACCOUNTANT", isLeader: true },
    { title: "Kế toán Công trình - Thủ quỹ", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Kế toán viên", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Hành chính tổng hợp", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Văn thư, hỗ trợ Hành chính TH", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
  ],
};

/** Danh sách xổ xuống hiện khoảng 5 mục, còn lại cuộn chuột */
const DROPDOWN_LIST_HEIGHT = 5 * 36;

function getLocalStorageCustomRoles(): { title: string; roleCode: string; isLeader?: boolean }[] {
  if (typeof window === "undefined") return [];
  const results: { title: string; roleCode: string; isLeader?: boolean }[] = [];
  const seen = new Set<string>();

  const storageKeys = [
    "cipm_custom_roles_matrix_v3",
    "cipm_custom_roles_matrix_v2",
    "cipm_custom_roles_matrix",
    "cipm_custom_roles",
    "cipm_roles",
  ];

  for (const k of storageKeys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const name = item.name || item.title || item.label || item.shortName;
            if (name && typeof name === "string") {
              const trimmed = name.trim();
              if (trimmed && !seen.has(trimmed.toLowerCase())) {
                seen.add(trimmed.toLowerCase());
                results.push({
                  title: trimmed,
                  roleCode: item.code || "TECHNICAL_OFFICER",
                  isLeader: item.group === "lead" || Boolean(item.isLeader),
                });
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

export default function StaffModal({ data, errorText, onClose, onCreate }: StaffModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const lockedTitles = useLockedTitles();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [appliedFieldIds, setAppliedFieldIds] = useState<Record<string, boolean>>({});

  // Danh sách phòng ban nội bộ có thể bổ sung ngay trên form
  const [teams, setTeams] = useState<Team[]>(() => data.teams);

  useEffect(() => {
    setTeams(data.teams);
  }, [data.teams]);

  // State thêm phòng ban mới trong dropdown
  const [newDeptName, setNewDeptName] = useState("");
  const [isAddingDeptLoading, setIsAddingDeptLoading] = useState(false);

  // State thêm vị trí mới trong dropdown
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [isAddingRoleLoading, setIsAddingRoleLoading] = useState(false);

  // State thêm trường dữ liệu tùy biến (field) trực tiếp trên form
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [isAddingField, setIsAddingField] = useState(false);

  useEffect(() => {
    setCustomFields(getCustomFields("staff"));
    return subscribeCustomFieldsChange((target, fields) => {
      if (target === "staff") setCustomFields(fields);
    });
  }, []);

  useEffect(() => {
    setAppliedFieldIds((prev) => {
      const next = { ...prev };
      for (const f of customFields) {
        if (next[f.id] === undefined) {
          next[f.id] = true;
        }
      }
      return next;
    });
  }, [customFields]);

  const selectedTeamId = Form.useWatch("teamId", form);
  const selectedTeamRole = Form.useWatch("teamRole", form);

  const currentTeam = teams.find((t) => t.id === selectedTeamId) || data.teams.find((t) => t.id === selectedTeamId);
  const currentLeader = data.staff.find((s) => s.id === currentTeam?.leaderId);

  // Toàn bộ vị trí trong hệ thống, một danh sách phẳng (không chia nhóm theo phòng ban).
  // Vị trí trùng tên ở nhiều phòng ban (VD: "Thành viên") được ghi kèm mã phòng ban để phân biệt,
  // vì cùng tên nhưng mỗi phòng ban có quyền khác nhau: "Thành viên (GSKT)", "Thành viên (HCTH)".
  const { roleSelectOptions, allRoleOptions } = useMemo(() => {
    const allLeafOptions: RoleOptionItem[] = [];

    // Chỉ hiện tên vị trí (không biểu tượng); vị trí lãnh đạo in đậm
    const renderLabel = (displayTitle: string, isLeader: boolean) => (
      <span className={isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>{displayTitle}</span>
    );

    teams.forEach((team) => {
      const seenInTeam = new Set<string>();

      const addRole = (title: string, defaultRoleCode?: string, defaultIsLeader?: boolean) => {
        const cleanTitle = title.trim();
        if (!cleanTitle || seenInTeam.has(cleanTitle.toLowerCase())) return;
        seenInTeam.add(cleanTitle.toLowerCase());

        const isLeader =
          defaultIsLeader !== undefined
            ? defaultIsLeader
            : team.id === "BGD"
            ? /giám đốc/i.test(cleanTitle) && !/phó|thư ký/i.test(cleanTitle)
            : team.id === "PGD"
            ? true
            : /trưởng|lead|chủ nhiệm|phụ trách|giám đốc/i.test(cleanTitle);

        let roleCode = defaultRoleCode || "TECHNICAL_OFFICER";
        if (!defaultRoleCode) {
          if (team.id === "BGD") {
            roleCode = /giám đốc/i.test(cleanTitle) && !/phó|thư ký/i.test(cleanTitle) ? "ADMIN" : "ADMINISTRATIVE_OFFICER";
          } else if (team.id === "PGD") {
            roleCode = "DEPUTY_DIRECTOR";
          } else if (isLeader) {
            roleCode =
              team.id === "HCTH"
                ? "CHIEF_ACCOUNTANT"
                : team.id === "BT"
                ? "COMPENSATION_OFFICER"
                : "TECHNICAL_OFFICER";
          } else if (/kế toán|tài chính/i.test(cleanTitle)) {
            roleCode = /trưởng/i.test(cleanTitle) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
          } else if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(cleanTitle)) {
            roleCode = "COMPENSATION_OFFICER";
          } else if (/hành chính|văn thư|tổng hợp/i.test(cleanTitle)) {
            roleCode = "ADMINISTRATIVE_OFFICER";
          }
        }

        allLeafOptions.push({
          value: `ROLE_${team.id}_${cleanTitle}`,
          title: cleanTitle,
          roleCode,
          isLeader,
          teamId: team.id,
          teamName: team.name,
          searchText: `${cleanTitle} ${team.name} ${team.id}`,
          label: null, // gán ở bước dưới, sau khi biết tên có trùng giữa các phòng ban không
        });
      };

      // 1. Roles cấu hình trên team
      const inactiveSet = new Set((team.inactiveRoles || []).map((r) => r.trim().toLowerCase()));
      (team.roles || []).forEach((r) => {
        if (!inactiveSet.has(r.trim().toLowerCase())) {
          addRole(r);
        }
      });

      // 2. Base positions
      (BASE_TEAM_POSITIONS[team.id] || []).forEach((bp) => addRole(bp.title, bp.roleCode, bp.isLeader));

      // 3. Existing staff in team
      data.staff
        .filter((s) => s.teamId === team.id)
        .forEach((s) => {
          if (s.title) addRole(s.title, s.roleCode);
        });
    });

    // 4. Custom/independent roles from localStorage
    getLocalStorageCustomRoles().forEach((cr) => {
      if (allLeafOptions.some((o) => o.title.toLowerCase() === cr.title.toLowerCase())) return;
      allLeafOptions.push({
        value: `ROLE_CUSTOM_${cr.title}`,
        title: cr.title,
        roleCode: cr.roleCode,
        isLeader: Boolean(cr.isLeader),
        searchText: `${cr.title} Chức danh tùy chỉnh`,
        label: null,
      });
    });

    // Đếm tên vị trí xuất hiện ở bao nhiêu phòng ban → trùng thì ghi kèm mã phòng ban
    const teamCountByTitle = new Map<string, Set<string>>();
    allLeafOptions.forEach((o) => {
      if (!o.teamId) return;
      const key = o.title.toLowerCase();
      teamCountByTitle.set(key, (teamCountByTitle.get(key) ?? new Set()).add(o.teamId));
    });

    allLeafOptions.forEach((o) => {
      const isShared = o.teamId && (teamCountByTitle.get(o.title.toLowerCase())?.size ?? 0) > 1;
      const displayTitle = isShared ? `${o.title} (${o.teamId})` : o.title;
      o.label = renderLabel(displayTitle, o.isLeader);
      o.searchText = `${displayTitle} ${o.searchText}`;
    });

    // Chức danh đã khóa trong ma trận phân quyền không cho chọn khi thêm nhân sự
    const assignable = allLeafOptions.filter((o) => !lockedTitles.has(o.title.toLowerCase()));
    return { roleSelectOptions: assignable, allRoleOptions: assignable };
  }, [teams, data.staff, lockedTitles]);

  // Xử lý thêm phòng ban mới trực tiếp từ dropdown
  const handleAddDepartment = async () => {
    const trimmed = newDeptName.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên phòng ban", "Vui lòng nhập tên phòng ban / tổ chuyên môn.");
      return;
    }

    if (teams.some((t) => normalizeSearchText(t.name) === normalizeSearchText(trimmed))) {
      toast.warning("Trùng tên phòng ban", "Phòng ban này đã tồn tại trong danh sách.");
      return;
    }

    setIsAddingDeptLoading(true);
    try {
      const createdTeam = await mockPersonnelRepository.createTeam({
        name: trimmed,
        roles: ["Tổ trưởng", "Tổ phó", "Thành viên"],
      });
      setTeams((prev) => [...prev, createdTeam]);
      setNewDeptName("");
      handleTeamChange(createdTeam.id as TeamId);
      toast.success("Thành công", `Đã thêm phòng ban "${trimmed}".`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cipm_personnel_dataset_updated"));
      }
    } catch (err: any) {
      toast.error("Lỗi", err?.message || "Không thể thêm phòng ban mới.");
    } finally {
      setIsAddingDeptLoading(false);
    }
  };

  // Xử lý thêm vị trí / vai trò mới trực tiếp từ dropdown
  const handleAddRole = async () => {
    const trimmed = newRoleTitle.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên chức danh", "Vui lòng nhập tên chức danh mới.");
      return;
    }

    if (!selectedTeamId) {
      toast.warning("Chưa chọn phòng ban", "Vui lòng chọn bộ phận trực thuộc trước.");
      return;
    }

    const currentRoles = currentTeam?.roles || [];
    if (
      currentRoles.some((r) => normalizeSearchText(r) === normalizeSearchText(trimmed)) ||
      allRoleOptions.some((opt) => normalizeSearchText(opt.title) === normalizeSearchText(trimmed))
    ) {
      toast.warning("Trùng tên chức danh", "Chức danh này đã tồn tại trong danh mục.");
      return;
    }

    setIsAddingRoleLoading(true);
    try {
      const updatedRoles = [...currentRoles, trimmed];
      const updatedTeam = await mockPersonnelRepository.updateTeam(selectedTeamId, {
        roles: updatedRoles,
      });
      setTeams((prev) =>
        prev.map((t) => (t.id === selectedTeamId ? updatedTeam : t))
      );
      setNewRoleTitle("");

      // Xác định cờ isLeader và roleCode
      const isLeader = /trưởng|lead|chủ nhiệm|phụ trách|giám đốc/i.test(trimmed);
      let roleCode = "TECHNICAL_OFFICER";
      if (selectedTeamId === "BGD") {
        roleCode = /giám đốc/i.test(trimmed) && !/phó|thư ký/i.test(trimmed) ? "ADMIN" : "ADMINISTRATIVE_OFFICER";
      } else if (selectedTeamId === "PGD") {
        roleCode = "DEPUTY_DIRECTOR";
      } else if (isLeader) {
        roleCode =
          selectedTeamId === "HCTH"
            ? "CHIEF_ACCOUNTANT"
            : selectedTeamId === "BT"
            ? "COMPENSATION_OFFICER"
            : "TECHNICAL_OFFICER";
      } else if (/kế toán|tài chính/i.test(trimmed)) {
        roleCode = /trưởng/i.test(trimmed) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
      } else if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(trimmed)) {
        roleCode = "COMPENSATION_OFFICER";
      } else if (/hành chính|văn thư|tổng hợp/i.test(trimmed)) {
        roleCode = "ADMINISTRATIVE_OFFICER";
      }

      const newRoleValue = `ROLE_${selectedTeamId}_${trimmed}`;
      form.setFieldValue("teamRole", newRoleValue);
      form.setFieldValue("title", trimmed);
      form.setFieldValue("roleCode", roleCode);

      toast.success("Thành công", `Đã thêm chức danh "${trimmed}" cho ${currentTeam?.name || "phòng ban"}.`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cipm_personnel_dataset_updated"));
      }
    } catch (err: any) {
      toast.error("Lỗi", err?.message || "Không thể thêm chức danh mới.");
    } finally {
      setIsAddingRoleLoading(false);
    }
  };

  // Xử lý thêm trường thông tin tùy biến (custom field) trực tiếp trên form
  const handleAddCustomField = () => {
    const trimmed = newFieldLabel.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên trường", "Vui lòng nhập tên trường dữ liệu mới.");
      return;
    }

    if (customFields.some((f) => f.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("Trùng tên trường", "Trường thông tin này đã có trong danh mục.");
      return;
    }

    const fieldId = `cf_${Date.now()}`;
    const fieldName = `field_${Date.now()}`;

    const newField: CustomFieldDefinition = {
      id: fieldId,
      name: fieldName,
      label: trimmed,
      type: newFieldType,
      required: false,
      active: true,
      placeholder: `Nhập ${trimmed.toLowerCase()}...`,
    };

    const updated = [...customFields, newField];
    saveCustomFields("staff", updated);
    setCustomFields(updated);
    setAppliedFieldIds((prev) => ({ ...prev, [fieldId]: true }));
    setNewFieldLabel("");
    setNewFieldType("text");
    setIsAddingField(false);
    toast.success("Thành công", `Đã thêm trường "${trimmed}".`);
  };

  // Luôn đồng bộ giá trị khởi tạo khi danh sách vai trò sẵn sàng
  useEffect(() => {
    if (allRoleOptions.length > 0) {
      const currentVal = form.getFieldValue("teamRole");
      const matched = allRoleOptions.find((opt) => opt.value === currentVal);
      if (!matched) {
        const defaultRole =
          allRoleOptions.find((r) => r.teamId === selectedTeamId) ||
          allRoleOptions[0];
        if (defaultRole) {
          form.setFieldValue("teamRole", defaultRole.value);
          form.setFieldValue("roleCode", defaultRole.roleCode);
          form.setFieldValue("title", defaultRole.title);
        }
      }
    }
  }, [allRoleOptions, form]);

  const handleFinish = async (values: StaffFormValues) => {
    setSubmitting(true);
    try {
      const matchedOpt = allRoleOptions.find((o) => o.value === values.teamRole);
      const isLeader = matchedOpt ? matchedOpt.isLeader : false;
      const title = matchedOpt?.title || values.title || "Thành viên";
      const roleCode = values.roleCode || matchedOpt?.roleCode || "TECHNICAL_OFFICER";

      let filteredCustomFields: Record<string, any> | undefined = undefined;
      if (values.customFields) {
        const result: Record<string, any> = {};
        for (const field of customFields) {
          const isApplied = appliedFieldIds[field.id] !== false;
          if (isApplied && values.customFields[field.name] !== undefined && values.customFields[field.name] !== "") {
            result[field.name] = values.customFields[field.name];
          }
        }
        if (Object.keys(result).length > 0) {
          filteredCustomFields = result;
        }
      }

      const payload: StaffInput = {
        name: values.name.trim(),
        citizenId: values.citizenId?.trim() || undefined,
        dob: values.dob?.trim() || undefined,
        gender: values.gender,
        teamId: values.teamId,
        title,
        employment: values.employment,
        phone: values.phone?.trim() || "",
        email: values.email?.trim(),
        roleCode,
        isLeader,
        username: values.email?.trim(),
        password: "1111",
        accountActive: true,
        customFields: filteredCustomFields,
      };
      const success = await onCreate(payload);
      if (success) {
        form.resetFields();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const teamOptions = teams.map((t) => ({
    value: t.id,
    searchText: `${t.name} ${t.id}`,
    label: `${t.name} (${t.id})`,
  }));

  const handleTeamChange = (newTeamId: TeamId) => {
    form.setFieldValue("teamId", newTeamId);
    // Nếu người dùng chưa chọn vai trò nào thì mới tự động gán vai trò của phòng ban mới
    const currentVal = form.getFieldValue("teamRole");
    if (!currentVal) {
      const defaultRole = allRoleOptions.find((r) => r.teamId === newTeamId) || allRoleOptions[0];
      if (defaultRole) {
        form.setFieldValue("teamRole", defaultRole.value);
        form.setFieldValue("roleCode", defaultRole.roleCode);
        form.setFieldValue("title", defaultRole.title);
      }
    }
  };

  const handleTeamRoleChange = (roleValue: string) => {
    const matched = allRoleOptions.find((opt) => opt.value === roleValue);
    if (matched) {
      // Mỗi vị trí gắn với một phòng ban (quyền khác nhau) → đồng bộ bộ phận trực thuộc
      if (matched.teamId && matched.teamId !== form.getFieldValue("teamId")) {
        form.setFieldValue("teamId", matched.teamId as TeamId);
      }
      form.setFieldValue("roleCode", matched.roleCode);
      if (matched.title) {
        form.setFieldValue("title", matched.title);
      } else {
        form.setFieldValue("title", "");
      }
    }
  };

  // Tìm trong dropdown: không phân biệt hoa/thường và dấu ("giam doc" khớp "Giám đốc")
  const filterBySearchText = (input: string, option?: any) => {
    if (!input) return true;
    const searchTarget = option?.searchText || option?.label || option?.value || "";
    return normalizeSearchText(String(searchTarget)).includes(normalizeSearchText(input));
  };

  const deptQuery = newDeptName.trim();
  const canAddDept =
    Boolean(deptQuery) && !teams.some((t) => normalizeSearchText(t.name) === normalizeSearchText(deptQuery));
  const roleQuery = newRoleTitle.trim();
  const canAddRole =
    Boolean(roleQuery) &&
    !allRoleOptions.some((opt) => normalizeSearchText(opt.title) === normalizeSearchText(roleQuery));

  const initialTeam = data.teams[0];
  const initialBasePos = BASE_TEAM_POSITIONS[initialTeam?.id || "BGD"]?.[0];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      destroyOnClose
      className="[&_.ant-drawer-header]:py-3 [&_.ant-drawer-body]:p-4 [&_.ant-drawer-footer]:py-2.5"
      title={
        <div>
          <Text className="text-base font-bold text-[#102A43]">
            Thêm nhân sự mới
          </Text>
          <Text className="block text-xs font-normal text-slate-500">
            Khởi tạo hồ sơ và chức danh của cán bộ trên hệ thống
          </Text>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
          >
            Thêm nhân sự
          </Button>
          <Button
            intent="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Đóng
          </Button>
        </div>
      }
    >
      {errorText && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <InfoCircleOutlined className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể tạo nhân sự:</strong> {errorText}</span>
        </div>
      )}

      <Form<StaffFormValues>
        form={form}
        layout="vertical"
        className="[&_.ant-form-item]:mb-2.5 [&_.ant-form-item-label]:!pb-0.5 [&_.ant-form-item-label>label]:text-xs [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-slate-700"
        initialValues={{
          gender: "Nam",
          employment: "Viên chức",
          teamId: (initialTeam?.id ?? "BGD") as TeamId,
          teamRole: initialBasePos ? `ROLE_${initialTeam?.id ?? "BGD"}_${initialBasePos.title}` : "",
          roleCode: initialBasePos?.roleCode || "ADMIN",
          title: initialBasePos?.title || "Giám đốc",
        }}
        onFinish={handleFinish}
      >
        {/* Section 1: Thông tin hồ sơ nhân sự */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-200/70 pb-1.5">
            <Text className="text-xs font-bold text-[#102A43]">Thông tin hồ sơ nhân sự</Text>
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Họ và tên cán bộ"
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ và tên." }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn An" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email công vụ"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="canbo@hatien.gov.vn" />
              </Form.Item>
            </Col>

            {/* Ngày sinh & Giới tính */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="dob"
                label="Ngày sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày sinh." }]}
              >
                <Input type="date" className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: "Vui lòng chọn giới tính." }]}
              >
                <Select
                  options={[
                    { value: "Nam", label: "Nam" },
                    { value: "Nữ", label: "Nữ" },
                  ]}
                  placeholder="Chọn giới tính"
                />
              </Form.Item>
            </Col>

            {/* Tổ / Bộ phận và Vị trí trong tổ */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="teamId"
                label="Tất cả phòng ban"
                rules={[{ required: true, message: "Vui lòng chọn tổ công tác." }]}
              >
                <Select
                  showSearch
                  placeholder="Gõ để tìm phòng ban..."
                  options={teamOptions}
                  listHeight={DROPDOWN_LIST_HEIGHT}
                  filterOption={filterBySearchText}
                  onChange={(val) => handleTeamChange(val)}
                  notFoundContent={
                    <div className="py-1 text-xs text-slate-400">Chưa có phòng ban này trong hệ thống.</div>
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "6px 0" }} />
                      {/* Ô nhập tên mới ngay trong danh sách: gõ rồi bấm "Thêm" (hoặc Enter) */}
                      <div className="flex items-center gap-2 px-2 pb-1.5">
                        <Input
                          size="small"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          onKeyDown={(e) => {
                            // Không để phím gõ trong ô này điều khiển danh sách chọn
                            e.stopPropagation();
                            if (e.key === "Enter" && canAddDept) {
                              e.preventDefault();
                              handleAddDepartment();
                            }
                          }}
                          placeholder="Nhập tên phòng ban mới..."
                          className="flex-1 text-xs"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={!canAddDept}
                          loading={isAddingDeptLoading}
                          onClick={handleAddDepartment}
                          className="text-xs"
                        >
                          Thêm
                        </Button>
                      </div>
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="teamRole"
                label="Chức danh"
                rules={[{ required: true, message: "Vui lòng chọn chức danh." }]}
                tooltip="Mỗi cán bộ giữ một chức danh; quyền hạn đi theo chức danh"
              >
                <Select
                  showSearch
                  placeholder="Gõ để tìm chức danh..."
                  options={roleSelectOptions}
                  listHeight={DROPDOWN_LIST_HEIGHT}
                  filterOption={filterBySearchText}
                  onChange={(val) => handleTeamRoleChange(val)}
                  notFoundContent={
                    <div className="py-1 text-xs text-slate-400">Chưa có chức danh này trong hệ thống.</div>
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "6px 0" }} />
                      {/* Ô nhập tên mới ngay trong danh sách: gõ rồi bấm "Thêm" (hoặc Enter) */}
                      <div className="flex items-center gap-2 px-2 pb-1.5">
                        <Input
                          size="small"
                          value={newRoleTitle}
                          onChange={(e) => setNewRoleTitle(e.target.value)}
                          onKeyDown={(e) => {
                            // Không để phím gõ trong ô này điều khiển danh sách chọn
                            e.stopPropagation();
                            if (e.key === "Enter" && canAddRole) {
                              e.preventDefault();
                              handleAddRole();
                            }
                          }}
                          placeholder="Nhập tên chức danh mới..."
                          className="flex-1 text-xs"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={!canAddRole}
                          loading={isAddingRoleLoading}
                          onClick={handleAddRole}
                          className="text-xs"
                        >
                          Thêm
                        </Button>
                      </div>
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="employment"
                label="Loại hình biên chế"
                rules={[{ required: true, message: "Vui lòng chọn loại biên chế." }]}
              >
                <Select
                  options={[
                    { value: "Viên chức", label: "Viên chức" },
                    { value: "Hợp đồng", label: "Hợp đồng lao động" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Section 2: Trường thông tin tùy biến (Cấu hình động - áp dụng linh hoạt khi thêm) */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
          <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-2">
            <div className="flex items-center gap-1.5">
              <Text className="text-xs font-bold text-[#102A43]">
                Thông tin bổ xung {customFields.length > 0 && `(${customFields.filter((f) => appliedFieldIds[f.id] !== false).length}/${customFields.length} trường áp dụng)`}
              </Text>
            </div>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIsAddingField(!isAddingField)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {isAddingField ? "Đóng thêm field" : "Thêm trường dữ liệu"}
            </Button>
          </div>

          {/* Form thêm field trực tiếp */}
          {isAddingField && (
            <div className="mb-3.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
              <div className="mb-2 text-xs font-semibold text-blue-900">
                Thêm trường dữ liệu tùy biến mới
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Nhập tên trường (ví dụ: Số CCCD phụ, Size áo...)"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  onPressEnter={handleAddCustomField}
                  className="flex-1 min-w-[240px]"
                />
                <Select
                  value={newFieldType}
                  onChange={(val) => setNewFieldType(val as CustomFieldType)}
                  className="w-full sm:w-[210px]"
                  options={[
                    { value: "text", label: "Văn bản (Text)" },
                    { value: "number", label: "Số (Number)" },
                    { value: "date", label: "Ngày tháng (Date)" },
                    { value: "select", label: "Danh sách chọn (Select)" },
                    { value: "textarea", label: "Đoạn văn (Textarea)" },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddCustomField}
                >
                  Thêm
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingField(false);
                    setNewFieldLabel("");
                  }}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {customFields.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              Chưa có trường tùy biến nào. Bấm &quot;Thêm trường dữ liệu&quot; ở trên để thêm nhanh.
            </div>
          ) : (
            <Row gutter={[16, 0]}>
              {customFields.map((field) => {
                const isApplied = appliedFieldIds[field.id] !== false;
                return (
                  <Fragment key={field.id}>
                    {/* Cột 1: Ô nhập liệu cùng độ rộng (sm=12) dài bằng các ô phía trên */}
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={["customFields", field.name]}
                        label={
                          <span className={isApplied ? "font-semibold text-slate-700" : "font-medium text-slate-400"}>
                            {field.label}
                            {field.required && isApplied && <span className="text-rose-500 ml-0.5">*</span>}
                          </span>
                        }
                        rules={isApplied && field.required ? [{ required: true, message: `Vui lòng nhập ${field.label.toLowerCase()}` }] : []}
                      >
                        {field.type === "textarea" ? (
                          <Input.TextArea
                            rows={2}
                            disabled={!isApplied}
                            placeholder={isApplied ? (field.placeholder || `Nhập ${field.label}...`) : "Không áp dụng"}
                          />
                        ) : field.type === "number" ? (
                          <Input
                            type="number"
                            disabled={!isApplied}
                            placeholder={isApplied ? (field.placeholder || `Nhập ${field.label}...`) : "Không áp dụng"}
                          />
                        ) : field.type === "date" ? (
                          <Input
                            type="date"
                            disabled={!isApplied}
                            placeholder={isApplied ? (field.placeholder || `Chọn ${field.label}...`) : "Không áp dụng"}
                          />
                        ) : field.type === "select" ? (
                          <Select
                            disabled={!isApplied}
                            placeholder={isApplied ? (field.placeholder || `Chọn ${field.label.toLowerCase()}`) : "Không áp dụng"}
                            options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                            allowClear
                          />
                        ) : (
                          <Input
                            disabled={!isApplied}
                            placeholder={isApplied ? (field.placeholder || `Nhập ${field.label}...`) : "Không áp dụng"}
                          />
                        )}
                      </Form.Item>
                    </Col>

                    {/* Cột 2: Nút tích Áp dụng nằm ở vị trí thứ 2 bên cạnh */}
                    <Col xs={24} sm={12}>
                      <Form.Item label={<span className="invisible select-none">Áp dụng</span>}>
                        <div className="flex items-center h-8">
                          <Checkbox
                            checked={isApplied}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAppliedFieldIds((prev) => ({ ...prev, [field.id]: checked }));
                              if (!checked) {
                                form.setFieldValue(["customFields", field.name], undefined);
                              }
                            }}
                          >
                            <span className={`text-xs font-semibold select-none ${isApplied ? "text-slate-800" : "text-slate-400"}`}>
                              Áp dụng
                            </span>
                          </Checkbox>
                          {!isApplied && (
                            <span className="text-[11px] text-slate-400 italic ml-2">
                              (Không áp dụng)
                            </span>
                          )}
                        </div>
                      </Form.Item>
                    </Col>
                  </Fragment>
                );
              })}
            </Row>
          )}
        </div>
      </Form>
    </Drawer>
  );
}
