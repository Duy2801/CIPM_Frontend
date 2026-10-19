"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CrownOutlined,
  InfoCircleOutlined,
  MailOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Col, Drawer, Form, Input, Row, Select, Text } from "@/components/ui";
import type { PersonnelDataset, StaffInput, TeamId } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";

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

export default function StaffModal({ data, errorText, onClose, onCreate }: StaffModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [appliedFieldIds, setAppliedFieldIds] = useState<Record<string, boolean>>({});

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
    { title: "Tổ viên", roleCode: "TECHNICAL_OFFICER", isLeader: false },
  ],
  BT: [
    { title: "Tổ trưởng", roleCode: "COMPENSATION_OFFICER", isLeader: true },
    { title: "Tổ phó", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Thành viên bồi thường", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Tổ viên", roleCode: "COMPENSATION_OFFICER", isLeader: false },
  ],
  HCTH: [
    { title: "Kế toán trưởng", roleCode: "CHIEF_ACCOUNTANT", isLeader: true },
    { title: "Kế toán Công trình - Thủ quỹ", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Kế toán viên", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Hành chính tổng hợp", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Văn thư, hỗ trợ Hành chính TH", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Tổ viên", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
  ],
};

  const currentTeam = data.teams.find((t) => t.id === selectedTeamId);
  const currentLeader = data.staff.find((s) => s.id === currentTeam?.leaderId);

  // Danh sách các vai trò / vị trí trong tổ CHỈ hiển thị vị trí thuộc tổ đó (và các vị trí đã thêm trước đó)
  const teamRoleOptions = useMemo(() => {
    if (!selectedTeamId) return [];

    const basePositions = BASE_TEAM_POSITIONS[selectedTeamId] || [
      { title: "Tổ trưởng / Phụ trách", roleCode: "TECHNICAL_OFFICER", isLeader: true },
      { title: "Tổ phó", roleCode: "TECHNICAL_OFFICER", isLeader: false },
      { title: "Tổ viên", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    ];

    const existingStaff = data.staff.filter((s) => s.teamId === selectedTeamId);
    const seenTitles = new Set<string>();
    const options: {
      value: string;
      roleCode: string;
      isLeader: boolean;
      title: string;
      label: React.ReactNode;
    }[] = [];

    // 1. Các vị trí được cấu hình trên phòng ban (team.roles)
    if (currentTeam?.roles && currentTeam.roles.length > 0) {
      const inactiveSet = new Set((currentTeam.inactiveRoles || []).map((r) => r.trim().toLowerCase()));
      currentTeam.roles.forEach((r, idx) => {
        const trimmed = r.trim();
        // Nếu role đang bị khóa (inactive) thì ẩn đi đối với thêm mới cán bộ
        if (!trimmed || seenTitles.has(trimmed.toLowerCase())) return;
        if (inactiveSet.has(trimmed.toLowerCase())) return;
        seenTitles.add(trimmed.toLowerCase());
        const isLeader =
          idx === 0 ||
          /trưởng|lead|chủ nhiệm|phụ trách|giám đốc/i.test(trimmed);
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

        options.push({
          value: `ROLE_${selectedTeamId}_${trimmed}`,
          roleCode,
          isLeader,
          title: trimmed,
          label: (
            <div className="flex items-center gap-1.5">
              {isLeader ? (
                <CrownOutlined className={selectedTeamId === "BGD" ? "text-red-500" : selectedTeamId === "PGD" ? "text-blue-500" : "text-amber-500"} />
              ) : (
                <UserOutlined className="text-slate-400" />
              )}
              <span className={isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>
                {trimmed}
              </span>
            </div>
          ),
        });
      });
    }

    // 2. Các vị trí cơ sở theo danh mục chuẩn của tổ (nếu chưa có)
    basePositions.forEach((pos) => {
      if (seenTitles.has(pos.title.toLowerCase().trim())) return;
      seenTitles.add(pos.title.toLowerCase().trim());
      options.push({
        value: `ROLE_${selectedTeamId}_${pos.title}`,
        roleCode: pos.roleCode,
        isLeader: Boolean(pos.isLeader),
        title: pos.title,
        label: (
          <div className="flex items-center gap-1.5">
            {pos.isLeader ? (
              <CrownOutlined className="text-amber-500" />
            ) : (
              <UserOutlined className="text-slate-400" />
            )}
            <span className={pos.isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>
              {pos.title}
            </span>
          </div>
        ),
      });
    });

    // 2. Tự động gom thêm các vị trí mà phòng ban này đã có nhân sự thêm trước đó (nếu chưa có trong chuẩn)
    existingStaff.forEach((s) => {
      const cleanTitle = s.title?.trim();
      if (cleanTitle && !seenTitles.has(cleanTitle.toLowerCase())) {
        seenTitles.add(cleanTitle.toLowerCase());
        const isLeader =
          s.id === currentTeam?.leaderId ||
          cleanTitle.toLowerCase().startsWith("tổ trưởng") ||
          cleanTitle.toLowerCase().startsWith("trưởng") ||
          cleanTitle.toLowerCase().includes("giám đốc");
        options.push({
          value: `ROLE_${selectedTeamId}_${cleanTitle}`,
          roleCode: s.roleCode || "TECHNICAL_OFFICER",
          isLeader,
          title: cleanTitle,
          label: (
            <div className="flex items-center gap-1.5">
              {isLeader ? (
                <CrownOutlined className="text-amber-500" />
              ) : (
                <UserOutlined className="text-slate-400" />
              )}
              <span className={isLeader ? "font-semibold text-slate-900" : "text-slate-700"}>
                {cleanTitle}
              </span>
            </div>
          ),
        });
      }
    });

    return options;
  }, [selectedTeamId, data.teams, data.staff, currentTeam?.leaderId]);

  // Luôn đồng bộ giá trị khi đổi phòng ban hoặc khi options thay đổi
  useEffect(() => {
    if (teamRoleOptions.length > 0) {
      const currentVal = form.getFieldValue("teamRole");
      const matched = teamRoleOptions.find((opt) => opt.value === currentVal);
      if (!matched) {
        const base = BASE_TEAM_POSITIONS[selectedTeamId] || [];
        const defaultPos = base.length === 1 ? base[0] : (base.find((p) => !p.isLeader) || base[0]);
        const matchedDefault = defaultPos
          ? teamRoleOptions.find((opt) => opt.title === defaultPos.title)
          : teamRoleOptions[0];
        const pick = matchedDefault || teamRoleOptions[0];
        form.setFieldValue("teamRole", pick.value);
        form.setFieldValue("roleCode", pick.roleCode);
      }
    }
  }, [teamRoleOptions, selectedTeamId, form]);

  const handleFinish = async (values: StaffFormValues) => {
    setSubmitting(true);
    try {
      const matchedOpt = teamRoleOptions.find((o) => o.value === values.teamRole);
      const isLeader = matchedOpt ? matchedOpt.isLeader : false;
      const title = matchedOpt?.title || "Tổ viên";
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

  const teamOptions = data.teams.map((t) => {
    const leader = data.staff.find((s) => s.id === t.leaderId);
    return {
      value: t.id,
      label: (
        <div className="flex items-center justify-between">
          <span>{t.name} ({t.id})</span>
          {leader && t.id !== "PGD" && (
            <span className="text-[11px] text-slate-400 font-normal">
              Lead: {leader.name}
            </span>
          )}
          {t.id === "PGD" && (
            <span className="text-[11px] text-slate-400 font-normal">
              Nhiều PGĐ
            </span>
          )}
        </div>
      ),
    };
  });

  const handleTeamChange = (newTeamId: TeamId) => {
    form.setFieldValue("teamId", newTeamId);
    const baseList = BASE_TEAM_POSITIONS[newTeamId] || [
      { title: "Tổ trưởng / Phụ trách", roleCode: "TECHNICAL_OFFICER", isLeader: true },
      { title: "Tổ phó", roleCode: "TECHNICAL_OFFICER", isLeader: false },
      { title: "Tổ viên", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    ];
    if (baseList.length > 0) {
      const defaultPos = baseList.length === 1 ? baseList[0] : (baseList.find((p) => !p.isLeader) || baseList[0]);
      form.setFieldValue("teamRole", `ROLE_${newTeamId}_${defaultPos.title}`);
      form.setFieldValue("roleCode", defaultPos.roleCode);
      form.setFieldValue("title", defaultPos.title);
    }
  };

  const handleTeamRoleChange = (roleValue: string) => {
    const matched = teamRoleOptions.find((opt) => opt.value === roleValue);
    if (matched) {
      form.setFieldValue("roleCode", matched.roleCode);
      if (matched.title) {
        form.setFieldValue("title", matched.title);
      } else {
        form.setFieldValue("title", "");
      }
    }
  };

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
            Khởi tạo thông tin hồ sơ và phân quyền vai trò trên hệ thống
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
                label="Bộ phận trực thuộc"
                rules={[{ required: true, message: "Vui lòng chọn tổ công tác." }]}
              >
                <Select
                  placeholder="Chọn tổ bộ phận"
                  options={teamOptions}
                  onChange={handleTeamChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="teamRole"
                label="Vị trí trong tổ"
                rules={[{ required: true, message: "Vui lòng chọn vị trí trong tổ." }]}
                tooltip="Chọn cán bộ là Thành viên hay Tổ trưởng / Phụ trách tổ (Lead)"
              >
                <Select
                  options={teamRoleOptions}
                  onChange={handleTeamRoleChange}
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
        {customFields.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Text className="text-xs font-bold text-[#102A43]">
                  Thông tin tùy biến (Đã cấu hình)
                </Text>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                {customFields.filter((f) => appliedFieldIds[f.id] !== false).length}/{customFields.length} trường áp dụng
              </span>
            </div>

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
          </div>
        )}
      </Form>
    </Drawer>
  );
}
