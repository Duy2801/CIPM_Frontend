"use client";

import { useState } from "react";
import { CalendarOutlined, CheckOutlined, CloseOutlined, LoadingOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, Form, Input, Select, Text, Tooltip } from "@/components/ui";
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

interface NewField {
  id: string;
  label: string;
  value: string;
}

/** Tên các ô có sẵn (thông tin bổ sung không được trùng) */
const FIXED_LABELS = ["chức danh", "phòng ban", "phòng ban / tổ chuyên môn", "email công vụ", "hình thức tuyển dụng", "giới tính", "ngày sinh"];

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

  // Trường bổ sung riêng của cán bộ (chỉ những trường người này có). Khóa là tên trường;
  // dữ liệu cũ dạng "field_..." thì lấy nhãn trong danh mục cũ.
  const ownCustomFields = Object.entries(staff.customFields || {})
    .filter(([, value]) => !isEmptyValue(value))
    .map(([key, value]) => ({
      key,
      value,
      label: customFieldDefs.find((def) => def.name === key)?.label ?? key,
      editable: editable && (typeof value === "string" || typeof value === "number"),
    }));

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
        ...ownCustomFields
          .filter((f) => f.editable && watched.customFields && !sameValue(watched.customFields[f.key], f.value))
          .map((f) => ({ label: f.label, from: f.value, to: watched.customFields?.[f.key] })),
      ]
    : [];
  // Thông tin bổ sung mới đang nhập (chưa lưu): mỗi dòng một tên thông tin + nội dung
  const [newFields, setNewFields] = useState<NewField[]>([]);
  const [newFieldError, setNewFieldError] = useState<string>();
  const [savingFieldId, setSavingFieldId] = useState<string>();
  // Thông tin bổ sung mới lưu ngay từng dòng, không tính vào thanh "Lưu thay đổi"
  const allChanges = changes;
  const isDirty = allChanges.length > 0;

  const addNewField = () => {
    setNewFields((prev) => [...prev, { id: `nf-${Date.now()}`, label: "", value: "" }]);
    setNewFieldError(undefined);
  };
  const updateNewField = (id: string, patch: Partial<NewField>) => {
    setNewFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setNewFieldError(undefined);
  };
  const removeNewField = (id: string) => setNewFields((prev) => prev.filter((f) => f.id !== id));

  /** Kiểm tra một dòng mới: đủ tên + nội dung, tên không trùng thông tin đã có */
  const validateNewField = (f: NewField): string | undefined => {
    const label = f.label.trim();
    if (!label) return "Vui lòng nhập tên thông tin.";
    if (!f.value.trim()) return `Vui lòng nhập nội dung cho "${label}".`;
    const taken = new Set([
      ...FIXED_LABELS,
      ...ownCustomFields.map((c) => c.label.toLowerCase()),
      ...ownCustomFields.map((c) => c.key.toLowerCase()),
    ]);
    if (taken.has(label.toLowerCase())) return `Thông tin "${label}" đã có, vui lòng đặt tên khác.`;
  };

  /** Lưu ngay một thông tin bổ sung vào hồ sơ (chỉ ghi phần thông tin bổ sung) */
  const saveNewField = async (f: NewField) => {
    const problem = validateNewField(f);
    if (problem) {
      setNewFieldError(problem);
      return;
    }
    setSavingFieldId(f.id);
    try {
      await updateStaff.run({
        staffId: staff.id,
        input: { customFields: { ...(staff.customFields || {}), [f.label.trim()]: f.value.trim() } },
        successText: `Đã bổ sung "${f.label.trim()}" vào hồ sơ của cán bộ ${staff.name}.`,
      });
      // Form dựng từ hồ sơ lúc mở: ghi luôn giá trị mới vào form để ô vừa thêm hiện đúng nội dung,
      // không bị tính là "thay đổi chưa lưu"
      form.setFieldValue(["customFields", f.label.trim()], f.value.trim());
      removeNewField(f.id);
    } finally {
      setSavingFieldId(undefined);
    }
  };

  const resetChanges = () => form.setFieldsValue(initialValues);

  const saveChanges = async (values: StaffInfoFormValues) => {
    // Sửa giá trị các trường bổ sung của cán bộ; xóa trắng ô = bỏ trường đó
    const nextCustomFields: Record<string, unknown> = { ...(staff.customFields || {}) };
    for (const field of ownCustomFields.filter((f) => f.editable)) {
      const val = values.customFields?.[field.key];
      if (isEmptyValue(val) || String(val).trim() === "") delete nextCustomFields[field.key];
      else nextCustomFields[field.key] = typeof val === "string" ? val.trim() : val;
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
        successText: `Đã lưu ${allChanges.length} thay đổi trong hồ sơ của cán bộ ${staff.name}.`,
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
      content: <StaffChangeSummary staffName={staff.name} changes={allChanges} />,
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => saveChanges(values),
    });
  };

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Text className="block text-xs font-bold text-[#DC2626] uppercase tracking-wide">Thông tin cá nhân & công tác</Text>
        {editable && (
          <Button
            intent="outline"
            scale="compact"
            onClick={addNewField}
            className="!border-slate-200 text-xs font-semibold !text-slate-700 hover:!border-[#DC2626] hover:!text-[#DC2626]"
          >
            Bổ sung thông tin
          </Button>
        )}
      </div>
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
                  // Giữ chữ backend đang lưu (VD "Biên chế chính thức") làm một lựa chọn
                  options={[...new Set([staff.employment, "Viên chức", "Hợp đồng"].filter(Boolean))].map((value) => ({
                    value,
                    label: value,
                  }))}
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

          {ownCustomFields.map((field) => (
            <StaffInfoFieldBox key={field.key} label={field.label} editable={field.editable}>
              {field.editable ? (
                <Form.Item name={["customFields", field.key]} className={INLINE_FORM_ITEM_CLASS}>
                  <Input size="small" variant="borderless" className={INLINE_INPUT_CLASS} placeholder="Chưa cập nhật" />
                </Form.Item>
              ) : typeof field.value === "object" ? (
                JSON.stringify(field.value)
              ) : (
                String(field.value)
              )}
            </StaffInfoFieldBox>
          ))}

          {/* Thông tin bổ sung mới: nhập tên + nội dung, lưu cùng thanh "Lưu thay đổi" */}
          {newFields.map((f, i) => (
            <div
              key={f.id}
              className="flex items-start gap-2 rounded-lg border border-dashed border-[#DC2626]/40 bg-red-50/30 px-3 py-2 sm:col-span-2"
            >
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <Input
                  size="small"
                  autoFocus={i === newFields.length - 1}
                  value={f.label}
                  maxLength={60}
                  placeholder="Tên thông tin (VD: Số CCCD)"
                  onChange={(e) => updateNewField(f.id, { label: e.target.value })}
                />
                <Input
                  size="small"
                  value={f.value}
                  maxLength={500}
                  placeholder="Nội dung"
                  onChange={(e) => updateNewField(f.id, { value: e.target.value })}
                  onPressEnter={() => saveNewField(f)}
                />
              </div>
              <Tooltip title="Lưu thông tin">
                <button
                  type="button"
                  aria-label="Lưu thông tin bổ sung"
                  disabled={savingFieldId === f.id}
                  onClick={() => saveNewField(f)}
                  className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:cursor-wait disabled:opacity-60"
                >
                  {savingFieldId === f.id ? <LoadingOutlined className="text-xs" /> : <CheckOutlined className="text-xs" />}
                </button>
              </Tooltip>
              <Tooltip title="Bỏ dòng này">
                <button
                  type="button"
                  aria-label="Bỏ thông tin bổ sung"
                  onClick={() => removeNewField(f.id)}
                  className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <CloseOutlined className="text-xs" />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
        {newFieldError && <p className="m-0 mt-2 text-xs text-rose-600">{newFieldError}</p>}
      </Form>

      {/* Thanh lưu chỉ hiện khi có thay đổi chưa lưu */}
      {anyEditable && isDirty && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
          <span className="text-xs text-amber-900">
            Có <strong>{allChanges.length}</strong> thay đổi chưa lưu
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
