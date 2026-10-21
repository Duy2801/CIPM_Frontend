"use client";

import { useState } from "react";
import { CalendarOutlined, FormOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Form, Input, Select, Text } from "@/components/ui";
import type { Employment, PersonnelProject, Staff, StaffInput, Team } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields } from "../utils/custom-fields-storage";

interface StaffInfoCardProps {
  staff: Staff;
  team?: Team;
  relatedProjects: { project: PersonnelProject; roleText: string }[];
  /** Chức danh của cán bộ đang tắt → hiện "Chưa có chức danh" */
  titleLocked?: boolean;
  /** Có truyền thì các ô thông tin bấm vào sửa trực tiếp được, lưu sau khi xác nhận */
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

/** Ô nhập "trong suốt": trông như giá trị đang hiển thị, bấm vào là sửa được ngay */
const INLINE_INPUT_CLASS = "!px-0 !font-semibold !text-slate-800 placeholder:!font-normal placeholder:!italic";
const INLINE_SELECT_CLASS =
  "w-full [&_.ant-select-selector]:!px-0 [&_.ant-select-content]:!font-semibold [&_.ant-select-content]:!text-slate-800";

function FieldBox({ label, editable, children }: { label: string; editable?: boolean; children: React.ReactNode }) {
  return (
    // Dùng <label> để bấm vào bất kỳ đâu trong ô (kể cả biểu tượng bút) là con trỏ vào ô nhập luôn
    <label
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
        editable
          ? "cursor-text border-slate-200/70 bg-slate-50/50 hover:border-[#DC2626]/40 hover:bg-white focus-within:border-[#DC2626]/60 focus-within:bg-white focus-within:shadow-xs"
          : "border-slate-200/70 bg-slate-50/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] text-slate-400">{label}</span>
        <div className="font-semibold text-slate-800 break-words">{children}</div>
      </div>
      {/* Biểu tượng sửa luôn hiện để người dùng biết ô này sửa được */}
      {editable && <FormOutlined className="shrink-0 text-lg text-slate-700" aria-hidden />}
    </label>
  );
}

const isEmptyValue = (val: unknown) => val === undefined || val === null || val === "";
const sameValue = (a: unknown, b: unknown) => (isEmptyValue(a) && isEmptyValue(b)) || String(a ?? "").trim() === String(b ?? "").trim();

export default function StaffInfoCard({ staff, team, relatedProjects, titleLocked, onSave }: StaffInfoCardProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<StaffInfoFormValues>();
  const [saving, setSaving] = useState(false);
  const [customFieldDefs] = useState<CustomFieldDefinition[]>(() => getCustomFields("staff"));
  const editable = Boolean(onSave);

  const initialValues: StaffInfoFormValues = {
    email: staff.email,
    phone: staff.phone,
    employment: staff.employment,
    gender: staff.gender,
    dob: staff.dob,
    customFields: staff.customFields || {},
  };

  // So sánh giá trị đang nhập với hồ sơ để biết có thay đổi nào chưa lưu
  const watched = Form.useWatch([], form) as StaffInfoFormValues | undefined;
  const fieldLabels: { key: keyof Omit<StaffInfoFormValues, "customFields">; label: string }[] = [
    { key: "email", label: "Email công vụ" },
    { key: "phone", label: "Số điện thoại" },
    { key: "employment", label: "Hình thức tuyển dụng" },
    { key: "gender", label: "Giới tính" },
    { key: "dob", label: "Ngày sinh" },
  ];
  const changes: { label: string; from: unknown; to: unknown }[] = watched
    ? [
        ...fieldLabels
          .filter(({ key }) => key in watched && !sameValue(watched[key], staff[key]))
          .map(({ key, label }) => ({ label, from: staff[key], to: watched[key] })),
        ...customFieldDefs
          .filter((def) => watched.customFields && !sameValue(watched.customFields[def.name], staff.customFields?.[def.name]))
          .map((def) => ({ label: def.label, from: staff.customFields?.[def.name], to: watched.customFields?.[def.name] })),
      ]
    : [];
  const isDirty = changes.length > 0;

  // Chỉ xem: ẩn trường tùy biến chưa có giá trị. Sửa được: hiện đủ để nhập bổ sung.
  const visibleCustomFields = customFieldDefs.filter(
    (def) => editable || !isEmptyValue(staff.customFields?.[def.name])
  );

  const resetChanges = () => form.setFieldsValue(initialValues);

  const saveChanges = async (values: StaffInfoFormValues) => {
    if (!onSave) return;
    // Giữ lại các trường tùy biến chưa cấu hình để không làm mất dữ liệu cũ
    const nextCustomFields: Record<string, unknown> = { ...(staff.customFields || {}) };
    for (const field of customFieldDefs) {
      const val = values.customFields?.[field.name];
      if (isEmptyValue(val)) delete nextCustomFields[field.name];
      else nextCustomFields[field.name] = val;
    }

    setSaving(true);
    try {
      await onSave(
        staff.id,
        {
          email: values.email.trim(),
          phone: values.phone?.trim() || "",
          employment: values.employment,
          gender: values.gender,
          dob: values.dob?.trim() || "",
          customFields: nextCustomFields,
        },
        `Đã lưu ${changes.length} thay đổi trong hồ sơ của cán bộ ${staff.name}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // Bấm "Lưu thay đổi": kiểm tra dữ liệu → hỏi xác nhận, liệt kê đúng những gì sẽ đổi
  const confirmSave = async () => {
    let values: StaffInfoFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    const renderValue = (val: unknown) =>
      isEmptyValue(val) ? <span className="italic text-slate-400">Trống</span> : String(val);

    modal.confirm({
      centered: true,
      width: 460,
      title: "Xác nhận thay đổi thông tin",
      content: (
        <div className="space-y-2.5 text-xs">
          <p className="m-0 text-slate-600">
            Bạn có đồng ý cập nhật {changes.length} thông tin sau cho cán bộ{" "}
            <strong className="text-slate-900">{staff.name}</strong>?
          </p>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            {changes.map((c) => (
              <div key={c.label} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">{c.label}:</span>
                <span className="text-slate-500 line-through">{renderValue(c.from)}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{renderValue(c.to)}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => saveChanges(values),
    });
  };

  const formItemClass = "!mb-0 [&_.ant-form-item-explain]:text-[11px]";

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-1 block text-xs font-bold text-slate-800 uppercase tracking-wide">
        Thông tin cá nhân & công tác
      </Text>
      {editable && <p className="m-0 mb-3 text-[11px] text-slate-500">Bấm vào ô thông tin để sửa trực tiếp.</p>}

      <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Phòng ban, chức danh đổi qua tab "Chức danh" nên luôn chỉ đọc */}
          <FieldBox label="Phòng ban / Tổ chuyên môn">{team?.name || EMPTY_TEXT}</FieldBox>
          <FieldBox label="Chức danh">
            {titleLocked ? (
              <span className="font-normal italic text-slate-400">Chưa có chức danh ({staff.title} đang tắt)</span>
            ) : (
              staff.title || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Email công vụ" editable={editable}>
            {editable ? (
              <Form.Item
                name="email"
                className={formItemClass}
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input size="small" variant="borderless" className={INLINE_INPUT_CLASS} placeholder="canbo@hatien.gov.vn" />
              </Form.Item>
            ) : (
              staff.email || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Số điện thoại" editable={editable}>
            {editable ? (
              <Form.Item
                name="phone"
                className={formItemClass}
                rules={[{ pattern: /^[0-9+\s.-]{8,15}$/, message: "Số điện thoại không hợp lệ." }]}
              >
                <Input size="small" variant="borderless" className={INLINE_INPUT_CLASS} placeholder="Chưa cập nhật" />
              </Form.Item>
            ) : (
              staff.phone || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Hình thức tuyển dụng" editable={editable}>
            {editable ? (
              <Form.Item name="employment" className={formItemClass} rules={[{ required: true }]}>
                <Select
                  size="small"
                  variant="borderless"
                  suffixIcon={null}
                  className={INLINE_SELECT_CLASS}
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

          <FieldBox label="Giới tính" editable={editable}>
            {editable ? (
              <Form.Item name="gender" className={formItemClass}>
                <Select
                  size="small"
                  variant="borderless"
                  suffixIcon={null}
                  className={INLINE_SELECT_CLASS}
                  placeholder="Chưa cập nhật"
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

          <FieldBox label="Ngày sinh" editable={editable}>
            {editable ? (
              <Form.Item
                name="dob"
                className={formItemClass}
                rules={[{ pattern: /^\d{2}\/\d{2}\/\d{4}$/, message: "Nhập theo dạng dd/mm/yyyy." }]}
              >
                <Input
                  size="small"
                  variant="borderless"
                  className={INLINE_INPUT_CLASS}
                  prefix={<CalendarOutlined className="text-slate-400" />}
                  placeholder="dd/mm/yyyy"
                />
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
              <FieldBox label={field.label} editable={editable}>
                {editable ? (
                  <Form.Item
                    name={["customFields", field.name]}
                    className={formItemClass}
                    rules={field.required ? [{ required: true, message: `Vui lòng nhập ${field.label.toLowerCase()}.` }] : []}
                  >
                    {field.type === "textarea" ? (
                      <Input.TextArea
                        rows={2}
                        variant="borderless"
                        className={INLINE_INPUT_CLASS}
                        placeholder={field.placeholder || "Chưa cập nhật"}
                      />
                    ) : field.type === "select" ? (
                      <Select
                        size="small"
                        variant="borderless"
                        allowClear
                        suffixIcon={null}
                        className={INLINE_SELECT_CLASS}
                        placeholder={field.placeholder || "Chưa cập nhật"}
                        options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                      />
                    ) : (
                      <Input
                        size="small"
                        variant="borderless"
                        className={INLINE_INPUT_CLASS}
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        placeholder={field.placeholder || "Chưa cập nhật"}
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

      {/* Thanh lưu chỉ hiện khi có thay đổi chưa lưu */}
      {editable && isDirty && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
          <span className="text-xs text-amber-900">
            Có <strong>{changes.length}</strong> thay đổi chưa lưu
          </span>
          <div className="flex items-center gap-2">
            <Button intent="outline" scale="compact" disabled={saving} onClick={resetChanges}>
              Hủy thay đổi
            </Button>
            <Button
              intent="primary"
              scale="compact"
              loading={saving}
              onClick={confirmSave}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] text-xs font-semibold"
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
