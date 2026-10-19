"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { SettingOutlined } from "@ant-design/icons";
import { Button, Checkbox, Col, Drawer, Form, Input, Row, Select, Text } from "@/components/ui";
import type { PersonnelDataset, Team } from "../types/personnel.types";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import { getCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";

interface AddTeamModalProps {
  open: boolean;
  data: PersonnelDataset;
  editingTeam?: Team | null;
  onClose: () => void;
  onSubmit: (input: {
    id?: string;
    name: string;
    description?: string;
    leaderId?: string;
    roles?: string[];
    inactiveRoles?: string[];
    customFields?: Record<string, any>;
  }) => Promise<boolean>;
}

export default function AddTeamModal({
  open,
  data,
  editingTeam,
  onClose,
  onSubmit,
}: AddTeamModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [appliedFieldIds, setAppliedFieldIds] = useState<Record<string, boolean>>({});

  const isEdit = Boolean(editingTeam);

  // Vai trò hiện có trong phòng ban: tự tổng hợp từ vai trò đã cấp cho cán bộ thuộc phòng ban
  // (phòng ban không tự định nghĩa vai trò — vai trò được cấp ở hồ sơ từng cán bộ)
  const teamRoleSummary = useMemo(() => {
    if (!editingTeam) return [];
    const byRole = new Map<string, string[]>();
    data.staff
      .filter((person) => person.teamId === editingTeam.id)
      .forEach((person) => {
        (person.title || "")
          .split(/\s*·\s*|\s*;\s*|\r?\n/)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((role) => byRole.set(role, [...(byRole.get(role) ?? []), person.name]));
      });
    return [...byRole.entries()]
      .map(([role, names]) => ({ role, names }))
      .sort((a, b) => b.names.length - a.names.length || a.role.localeCompare(b.role, "vi"));
  }, [data.staff, editingTeam]);

  useEffect(() => {
    if (open) {
      if (editingTeam) {
        form.setFieldsValue({
          name: editingTeam.name,
          customFields: editingTeam.customFields || {},
        });
      } else {
        form.resetFields();
      }
      setCustomFields(getCustomFields("team"));
    }
  }, [open, editingTeam, form]);

  useEffect(() => {
    return subscribeCustomFieldsChange((target, fields) => {
      if (target === "team") setCustomFields(fields);
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

  const handleFinish = async (values: {
    name: string;
    customFields?: Record<string, any>;
  }) => {
    setSubmitting(true);
    try {
      // Tự sinh mã định danh từ tên phòng ban nếu là thêm mới
      const acronym = values.name
        .trim()
        .split(/[\s–-]+/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("");

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

      const success = await onSubmit({
        id: isEdit ? editingTeam?.id : acronym || undefined,
        name: values.name.trim(),
        customFields: filteredCustomFields,
      });
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      destroyOnClose
      className="[&_.ant-drawer-header]:py-3 [&_.ant-drawer-body]:p-4 [&_.ant-drawer-footer]:py-2.5"
      title={
        <div>
          <Text className="text-base font-bold text-[#102A43]">
            {isEdit ? "Cập nhật phòng ban" : "Thêm phòng ban / tổ chuyên môn"}
          </Text>
          <Text className="block text-sm font-normal text-slate-500">
            {isEdit
              ? `Chỉnh sửa thông tin của "${editingTeam?.name}"`
              : "Khởi tạo đơn vị thuộc cơ cấu tổ chức Ban Quản lý"}
          </Text>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white"
          >
            {isEdit ? "Lưu cập nhật" : "Thêm phòng ban"}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="[&_.ant-form-item]:mb-3 [&_.ant-form-item-label]:!pb-0.5 [&_.ant-form-item-label>label]:text-sm [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-slate-700"
      >
        <div className="space-y-4">
          {/* Section 1: Thông tin phòng ban */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <span className="text-sm font-bold text-slate-800">
                Thông tin phòng ban / tổ chuyên môn
              </span>
            </div>

            {/* Tên phòng ban */}
            <Form.Item
              name="name"
              label="Tên phòng ban"
              className="!mb-0"
              rules={[
                { required: true, message: "Vui lòng nhập tên phòng ban / tổ chuyên môn" },
                { min: 3, message: "Tên phòng ban phải có ít nhất 3 ký tự" },
              ]}
            >
              <Input
                placeholder="VD: Tổ Quản lý Chất lượng & Môi trường..."
                className="h-10 text-sm"
              />
            </Form.Item>

          </div>

          {/* Vai trò hiện có trong phòng ban (chỉ xem, tự tổng hợp từ cán bộ) */}
          {isEdit && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                <span className="text-sm font-bold text-slate-800">Vai trò hiện có trong phòng ban</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {teamRoleSummary.length} vai trò
                </span>
              </div>
              <p className="m-0 mb-3 text-[13px] text-slate-500">
                Tự tổng hợp từ vai trò đã cấp cho cán bộ trong phòng ban. Cấp / đổi / thu hồi vai trò tại hồ sơ từng cán bộ.
              </p>
              {teamRoleSummary.length === 0 ? (
                <p className="m-0 text-sm italic text-slate-400">Phòng ban chưa có cán bộ nào được cấp vai trò.</p>
              ) : (
                <ul className="m-0 list-none divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white p-0">
                  {teamRoleSummary.map(({ role, names }) => (
                    <li key={role} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-[15px] font-semibold text-slate-800" title={role}>
                          {role}
                        </p>
                        <p className="m-0 mt-0.5 truncate text-[13px] text-slate-500" title={names.join(", ")}>
                          {names.join(", ")}
                        </p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-sm text-slate-600">
                        {names.length} người
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Section 2: Trường thông tin tùy biến (Cấu hình động - áp dụng linh hoạt khi thêm) */}
          {customFields.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <SettingOutlined className="text-[#0F4C81]" />
                  <Text className="text-sm font-bold text-[#102A43]">
                    Thông tin tùy biến (Đã cấu hình)
                  </Text>
                </div>
                <span className="text-xs text-slate-500 font-normal">
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
        </div>
      </Form>
    </Drawer>
  );
}
