"use client";

import { useState } from "react";
import { CalendarOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Text } from "@/components/ui";
import type { Employment, PersonnelProject, Staff, StaffInput, Team } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields } from "../utils/custom-fields-storage";

interface StaffInfoCardProps {
  staff: Staff;
  team?: Team;
  relatedProjects: { project: PersonnelProject; roleText: string }[];
  /** Có truyền thì hiện nút "Cập nhật thông tin" để sửa trực tiếp trên thẻ */
  onSave?: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
}

interface StaffInfoFormValues {
  email: string;
  phone?: string;
  employment: Employment;
  gender?: "Nam" | "Nữ";
  dob?: string;
  customFields?: Record<string, unknown>;
}

const EMPTY_TEXT = <span className="font-normal italic text-slate-400">Chưa cập nhật</span>;

function FieldBox({ label, editing, children }: { label: string; editing?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${
        editing ? "border-[#DC2626]/30 bg-white" : "border-slate-200/70 bg-slate-50/50"
      }`}
    >
      <span className="block text-[11px] text-slate-400">{label}</span>
      <div className="font-semibold text-slate-800 break-words">{children}</div>
    </div>
  );
}

export default function StaffInfoCard({ staff, team, relatedProjects, onSave }: StaffInfoCardProps) {
  const [form] = Form.useForm<StaffInfoFormValues>();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customFieldDefs] = useState<CustomFieldDefinition[]>(() => getCustomFields("staff"));

  // Khi xem: chỉ hiện trường tùy biến có giá trị. Khi sửa: hiện đủ để nhập bổ sung.
  const visibleCustomFields = customFieldDefs.filter((def) => {
    if (editing) return true;
    const val = staff.customFields?.[def.name];
    return val !== undefined && val !== null && val !== "";
  });

  const startEditing = () => {
    form.setFieldsValue({
      email: staff.email,
      phone: staff.phone,
      employment: staff.employment,
      gender: staff.gender,
      dob: staff.dob,
      customFields: staff.customFields || {},
    });
    setEditing(true);
  };

  const handleSave = async (values: StaffInfoFormValues) => {
    if (!onSave) return;
    // Giữ lại các trường tùy biến chưa cấu hình để không làm mất dữ liệu cũ
    const nextCustomFields: Record<string, unknown> = { ...(staff.customFields || {}) };
    for (const field of customFieldDefs) {
      const val = values.customFields?.[field.name];
      if (val === undefined || val === null || val === "") delete nextCustomFields[field.name];
      else nextCustomFields[field.name] = val;
    }

    setSaving(true);
    try {
      const ok = await onSave(
        staff.id,
        {
          email: values.email,
          phone: values.phone?.trim() || "",
          employment: values.employment,
          gender: values.gender,
          dob: values.dob?.trim() || "",
          customFields: nextCustomFields,
        },
        `Đã cập nhật thông tin cán bộ ${staff.name}.`,
      );
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Form.Item chỉ dùng khi đang sửa; khi xem thì hiện giá trị thuần
  const formItemClass = "!mb-0 mt-1 [&_.ant-form-item-explain]:text-[11px]";

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-3 block text-xs font-bold text-slate-800 uppercase tracking-wide">
        Thông tin cá nhân & vị trí công tác
      </Text>

      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSave}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Phòng ban, chức vụ đổi qua mục "Đổi vai trò" nên luôn chỉ đọc */}
          <FieldBox label="Phòng ban / Tổ chuyên môn">{team?.name || EMPTY_TEXT}</FieldBox>
          <FieldBox label="Vị trí / Chức vụ">{staff.title || EMPTY_TEXT}</FieldBox>

          <FieldBox label="Email công vụ" editing={editing}>
            {editing ? (
              <Form.Item
                name="email"
                className={formItemClass}
                rules={[
                  { required: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input size="small" placeholder="canbo@hatien.gov.vn" />
              </Form.Item>
            ) : (
              staff.email || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Số điện thoại" editing={editing}>
            {editing ? (
              <Form.Item
                name="phone"
                className={formItemClass}
                rules={[{ pattern: /^[0-9+\s.-]{8,15}$/, message: "Số điện thoại không hợp lệ." }]}
              >
                <Input size="small" placeholder="09xx xxx xxx" />
              </Form.Item>
            ) : (
              staff.phone || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Hình thức tuyển dụng" editing={editing}>
            {editing ? (
              <Form.Item name="employment" className={formItemClass} rules={[{ required: true }]}>
                <Select
                  size="small"
                  options={[
                    { value: "Viên chức", label: "Viên chức" },
                    { value: "Hợp đồng", label: "Hợp đồng" },
                  ]}
                />
              </Form.Item>
            ) : (
              staff.employment || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Giới tính" editing={editing}>
            {editing ? (
              <Form.Item name="gender" className={formItemClass}>
                <Select
                  size="small"
                  placeholder="Chọn giới tính"
                  options={[
                    { value: "Nam", label: "Nam" },
                    { value: "Nữ", label: "Nữ" },
                  ]}
                />
              </Form.Item>
            ) : (
              staff.gender || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Ngày sinh" editing={editing}>
            {editing ? (
              <Form.Item name="dob" className={formItemClass}>
                <Input size="small" type="date" />
              </Form.Item>
            ) : staff.dob ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarOutlined className="text-slate-400" />
                {staff.dob}
              </span>
            ) : (
              EMPTY_TEXT
            )}
          </FieldBox>

          {visibleCustomFields.map((field) => (
            <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
              <FieldBox label={field.label} editing={editing}>
                {editing ? (
                  <Form.Item
                    name={["customFields", field.name]}
                    className={formItemClass}
                    rules={field.required ? [{ required: true, message: `Vui lòng nhập ${field.label.toLowerCase()}.` }] : []}
                  >
                    {field.type === "textarea" ? (
                      <Input.TextArea rows={2} placeholder={field.placeholder || `Nhập ${field.label}...`} />
                    ) : field.type === "select" ? (
                      <Select
                        size="small"
                        allowClear
                        placeholder={field.placeholder || `Chọn ${field.label.toLowerCase()}`}
                        options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                      />
                    ) : (
                      <Input
                        size="small"
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        placeholder={field.placeholder || `Nhập ${field.label}...`}
                      />
                    )}
                  </Form.Item>
                ) : (
                  String(staff.customFields?.[field.name])
                )}
              </FieldBox>
            </div>
          ))}
        </div>
      </Form>

      {relatedProjects.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <span className="block text-[11px] font-semibold text-slate-500">
            Dự án phụ trách ({relatedProjects.length})
          </span>
          {relatedProjects.map(({ project, roleText }) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 px-2.5 py-2 text-xs"
            >
              <span className="min-w-0 truncate font-semibold text-slate-800">
                [{project.code}] {project.name}
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-[#0F4C81]">{roleText}</span>
            </div>
          ))}
        </div>
      )}

      {onSave && (
        <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          {editing ? (
            <>
              <Button intent="outline" scale="compact" disabled={saving} onClick={() => setEditing(false)}>
                Hủy
              </Button>
              <Button
                intent="primary"
                scale="compact"
                loading={saving}
                onClick={() => form.submit()}
                className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] text-xs font-semibold"
              >
                Lưu thông tin
              </Button>
            </>
          ) : (
            <Button
              intent="outline"
              scale="compact"
              icon={<EditOutlined />}
              onClick={startEditing}
              className="!border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60 text-xs font-semibold"
            >
              Cập nhật thông tin
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
