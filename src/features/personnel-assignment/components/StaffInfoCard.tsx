"use client";

import { useState } from "react";
import { CalendarOutlined, FormOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Form, Input, Select, Text } from "@/components/ui";
import type { Employment, PersonnelProject, Staff, StaffInput, Team, TeamId } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields } from "../utils/custom-fields-storage";
import { dobGetValueProps, dobInputProps, dobNormalize } from "../utils/dob-date";

interface StaffInfoCardProps {
  staff: Staff;
  team?: Team;
  /** Danh sách phòng ban để đổi phòng ban của cán bộ */
  teams: Team[];
  relatedProjects: { project: PersonnelProject; roleText: string }[];
  /** Có truyền thì các ô thông tin bấm vào sửa trực tiếp được, lưu sau khi xác nhận */
  onSave?: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => Promise<boolean>;
  /** Được sửa các thông tin cá nhân (phòng ban, email, ngày sinh...) */
  canEditInfo?: boolean;
  /** Được đổi chức danh — chỉ là tên gọi hiển thị, không ảnh hưởng vai trò / ma trận phân quyền */
  canChangeTitle?: boolean;
}

interface StaffInfoFormValues {
  /** Chức danh: tên gọi hiển thị (độc lập với vai trò phân quyền) */
  title?: string;
  teamId: TeamId;
  email: string;
  employment: Employment;
  gender?: "Nam" | "Nữ";
  dob?: string;
  customFields?: Record<string, unknown>;
}

const EMPTY_TEXT = <span className="font-normal italic text-slate-400">Chưa cập nhật</span>;

/** Ô nhập "trong suốt": trông như giá trị đang hiển thị, bấm vào là sửa được ngay.
 *  Ô nhập và ô chọn cùng đệm 8px; phần điều khiển nới ra 8px mỗi bên (-mx-2) để chữ thẳng với nhãn
 *  mà viền khi đang nhập vẫn có khoảng thở, không dính sát chữ. */
const INLINE_INPUT_CLASS =
  "!px-2 !rounded-md !font-semibold !text-slate-800 placeholder:!font-normal placeholder:!italic";
const INLINE_SELECT_CLASS =
  "w-full !px-2 !rounded-md [&_.ant-select-selector]:!px-0 [&_.ant-select-content]:!font-semibold [&_.ant-select-content]:!text-slate-800";

function FieldBox({ label, editable, children }: { label: string; editable?: boolean; children: React.ReactNode }) {
  return (
    // Dùng <label> để bấm vào bất kỳ đâu trong ô (kể cả biểu tượng bút) là con trỏ vào ô nhập luôn
    <label
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
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

export default function StaffInfoCard({
  staff,
  team,
  teams,
  relatedProjects,
  onSave,
  canEditInfo = true,
  canChangeTitle = false,
}: StaffInfoCardProps) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<StaffInfoFormValues>();
  const [saving, setSaving] = useState(false);
  const [customFieldDefs] = useState<CustomFieldDefinition[]>(() => getCustomFields("staff"));
  const editable = Boolean(onSave) && canEditInfo;
  const titleEditable = Boolean(onSave) && canChangeTitle;
  const anyEditable = editable || titleEditable;
  const teamName = (id?: string) => teams.find((t) => t.id === id)?.name ?? id;

  const initialValues: StaffInfoFormValues = {
    title: staff.title,
    teamId: staff.teamId,
    email: staff.email,
    employment: staff.employment,
    gender: staff.gender,
    dob: staff.dob,
    customFields: staff.customFields || {},
  };

  // So sánh giá trị đang nhập với hồ sơ để biết có thay đổi nào chưa lưu
  const watched = Form.useWatch([], form) as StaffInfoFormValues | undefined;
  const fieldLabels: { key: keyof Omit<StaffInfoFormValues, "customFields">; label: string }[] = [
    { key: "teamId", label: "Phòng ban" },
    { key: "email", label: "Email công vụ" },
    { key: "employment", label: "Hình thức tuyển dụng" },
    { key: "gender", label: "Giới tính" },
    { key: "dob", label: "Ngày sinh" },
  ];
  const titleChanged = Boolean(watched) && "title" in watched! && !sameValue(watched!.title, staff.title);
  const changes: { label: string; from: unknown; to: unknown }[] = watched
    ? [
        ...(titleChanged ? [{ label: "Chức danh", from: staff.title, to: watched.title }] : []),
        ...fieldLabels
          .filter(({ key }) => key in watched && !sameValue(watched[key], staff[key]))
          .map(({ key, label }) => ({
            label,
            // Phòng ban: hiện tên thay vì mã
            from: key === "teamId" ? teamName(staff.teamId) : staff[key],
            to: key === "teamId" ? teamName(watched.teamId) : watched[key],
          })),
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

    // Đổi chức danh chỉ đổi tên gọi — không đổi vai trò, phòng ban hay quyền hạn
    const titleInput =
      titleEditable && !sameValue(values.title, staff.title) ? { title: (values.title || "").trim() } : null;

    setSaving(true);
    try {
      await onSave(
        staff.id,
        {
          ...(editable
            ? {
                teamId: values.teamId,
                email: values.email.trim(),
                employment: values.employment,
                gender: values.gender,
                dob: values.dob?.trim() || "",
                customFields: nextCustomFields,
              }
            : {}),
          ...(titleInput ?? {}),
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

  const formItemClass = "!mb-0 mt-0.5 -mx-2 [&_.ant-form-item-explain]:px-2 [&_.ant-form-item-explain]:text-[11px]";

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-1 block text-xs font-bold text-slate-800 uppercase tracking-wide">
        Thông tin cá nhân & công tác
      </Text>
      {anyEditable && <p className="m-0 mb-3 text-[11px] text-slate-500">Bấm vào ô thông tin để sửa trực tiếp.</p>}

      <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Chức danh: chỉ là tên gọi hiển thị, đổi không ảnh hưởng vai trò / ma trận phân quyền */}
          <FieldBox label="Chức danh" editable={titleEditable}>
            {titleEditable ? (
              <Form.Item
                name="title"
                className={formItemClass}
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập chức danh." }]}
              >
                <Input size="small" variant="borderless" className={INLINE_INPUT_CLASS} placeholder="VD: Giám đốc" />
              </Form.Item>
            ) : (
              staff.title || EMPTY_TEXT
            )}
          </FieldBox>

          <FieldBox label="Phòng ban / Tổ chuyên môn" editable={editable}>
            {editable ? (
              <Form.Item name="teamId" className={formItemClass} rules={[{ required: true, message: "Vui lòng chọn phòng ban." }]}>
                <Select
                  size="small"
                  variant="borderless"
                  showSearch
                  suffixIcon={null}
                  className={INLINE_SELECT_CLASS}
                  optionFilterProp="label"
                  popupMatchSelectWidth={false}
                  options={teams.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Form.Item>
            ) : (
              team?.name || EMPTY_TEXT
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
              <Form.Item name="dob" className={formItemClass} getValueProps={dobGetValueProps} normalize={dobNormalize}>
                {/* Ô ngày của trình duyệt: chọn trên lịch, không cho gõ tay */}
                <Input size="small" variant="borderless" {...dobInputProps()} className={`cursor-pointer ${INLINE_INPUT_CLASS}`} />
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
      {anyEditable && isDirty && (
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
