"use client";

import { useState } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Form, Input, Select, Text } from "@/components/ui";
import type { Employment, Staff, TeamId } from "../types/personnel.types";
import { useCustomFieldDefs } from "../hooks/useCustomFieldDefs";
import { useStaffAccess } from "../hooks/usePersonnelAccess";
import { useUpdateStaff } from "../hooks/usePersonnelMutations";
import { useStaff, useTeams } from "../hooks/usePersonnelQueries";
import { dobGetValueProps, dobInputProps, dobNormalize } from "../utils/dob-date";
import StaffChangeSummary, { type StaffFieldChange } from "./StaffChangeSummary";
import StaffInfoFieldBox, { INLINE_FORM_ITEM_CLASS, INLINE_INPUT_CLASS, INLINE_SELECT_CLASS } from "./StaffInfoFieldBox";

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

const isEmptyValue = (val: unknown) => val === undefined || val === null || val === "";
const sameValue = (a: unknown, b: unknown) => (isEmptyValue(a) && isEmptyValue(b)) || String(a ?? "").trim() === String(b ?? "").trim();

/** Thẻ "Thông tin cá nhân & công tác" trong hồ sơ cán bộ: tự tải hồ sơ theo mã cán bộ, có quyền thì sửa trực tiếp */
export default function StaffInfoCard({ staffId }: { staffId: string }) {
  const { data: staff } = useStaff(staffId);
  if (!staff) return null;
  // Mở cán bộ khác thì dựng lại form với giá trị của cán bộ đó
  return <StaffInfoForm key={staff.id} staff={staff} />;
}

function StaffInfoForm({ staff }: { staff: Staff }) {
  const { modal } = App.useApp();
  const [form] = Form.useForm<StaffInfoFormValues>();
  const [saving, setSaving] = useState(false);
  const [customFieldDefs] = useCustomFieldDefs("staff");
  const { data: teams = [] } = useTeams();
  const team = teams.find((t) => t.id === staff.teamId);
  const updateStaff = useUpdateStaff();
  // Sửa thông tin cá nhân: người quản lý tài khoản. Đổi chức danh (chỉ là tên gọi): người quản lý chức danh.
  const { canManageAccounts: editable, canManageRole: titleEditable } = useStaffAccess();
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
  const changes: StaffFieldChange[] = watched
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
      await updateStaff.run({
        staffId: staff.id,
        input: {
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
        successText: `Đã lưu ${changes.length} thay đổi trong hồ sơ của cán bộ ${staff.name}.`,
      });
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
    modal.confirm({
      centered: true,
      width: 460,
      title: "Xác nhận thay đổi thông tin",
      content: <StaffChangeSummary staffName={staff.name} changes={changes} />,
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => saveChanges(values),
    });
  };

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <Text className="mb-1 block text-xs font-bold text-slate-800 uppercase tracking-wide">
        Thông tin cá nhân & công tác
      </Text>
      {anyEditable && <p className="m-0 mb-3 text-[11px] text-slate-500">Bấm vào ô thông tin để sửa trực tiếp.</p>}

      <Form form={form} layout="vertical" requiredMark={false} initialValues={initialValues}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Chức danh: chỉ là tên gọi hiển thị, đổi không ảnh hưởng vai trò / ma trận phân quyền */}
          <StaffInfoFieldBox label="Chức danh" editable={titleEditable}>
            {titleEditable ? (
              <Form.Item
                name="title"
                className={INLINE_FORM_ITEM_CLASS}
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập chức danh." }]}
              >
                <Input size="small" variant="borderless" className={INLINE_INPUT_CLASS} placeholder="VD: Giám đốc" />
              </Form.Item>
            ) : (
              staff.title || EMPTY_TEXT
            )}
          </StaffInfoFieldBox>

          <StaffInfoFieldBox label="Phòng ban / Tổ chuyên môn" editable={editable}>
            {editable ? (
              <Form.Item name="teamId" className={INLINE_FORM_ITEM_CLASS} rules={[{ required: true, message: "Vui lòng chọn phòng ban." }]}>
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
          </StaffInfoFieldBox>

          <StaffInfoFieldBox label="Email công vụ" editable={editable}>
            {editable ? (
              <Form.Item
                name="email"
                className={INLINE_FORM_ITEM_CLASS}
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
          </StaffInfoFieldBox>


          <StaffInfoFieldBox label="Hình thức tuyển dụng" editable={editable}>
            {editable ? (
              <Form.Item name="employment" className={INLINE_FORM_ITEM_CLASS} rules={[{ required: true }]}>
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
          </StaffInfoFieldBox>

          <StaffInfoFieldBox label="Giới tính" editable={editable}>
            {editable ? (
              <Form.Item name="gender" className={INLINE_FORM_ITEM_CLASS}>
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
          </StaffInfoFieldBox>

          <StaffInfoFieldBox label="Ngày sinh" editable={editable}>
            {editable ? (
              <Form.Item name="dob" className={INLINE_FORM_ITEM_CLASS} getValueProps={dobGetValueProps} normalize={dobNormalize}>
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
          </StaffInfoFieldBox>

          {visibleCustomFields.map((field) => (
            <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
              <StaffInfoFieldBox label={field.label} editable={editable}>
                {editable ? (
                  <Form.Item
                    name={["customFields", field.name]}
                    className={INLINE_FORM_ITEM_CLASS}
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
              </StaffInfoFieldBox>
            </div>
          ))}
        </div>
      </Form>

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
