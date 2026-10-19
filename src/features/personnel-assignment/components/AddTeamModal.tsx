"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  LockOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Col, Drawer, Form, Input, Row, Select, Switch, Text } from "@/components/ui";
import { cn } from "@/utils/cn";
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
  const [roles, setRoles] = useState<string[]>([]);
  const [inactiveRoles, setInactiveRoles] = useState<string[]>([]);
  const [newRoleInput, setNewRoleInput] = useState("");

  const isEdit = Boolean(editingTeam);

  useEffect(() => {
    if (open) {
      if (editingTeam) {
        form.setFieldsValue({
          name: editingTeam.name,
          description: editingTeam.description,
          customFields: editingTeam.customFields || {},
        });
        setRoles(editingTeam.roles ? [...editingTeam.roles] : []);
        setInactiveRoles(editingTeam.inactiveRoles ? [...editingTeam.inactiveRoles] : []);
      } else {
        form.resetFields();
        setRoles([]);
        setInactiveRoles([]);
      }
      setNewRoleInput("");
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

  const handleAddRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    if (roles.includes(trimmed)) {
      // Nếu đã tồn tại nhưng đang bị khóa thì mở khóa lại
      if (inactiveRoles.includes(trimmed)) {
        setInactiveRoles((prev) => prev.filter((r) => r !== trimmed));
      }
      setNewRoleInput("");
      return;
    }
    setRoles((prev) => [...prev, trimmed]);
    setNewRoleInput("");
  };

  const handleToggleRoleStatus = (roleName: string, active: boolean) => {
    if (active) {
      // Mở khóa: loại khỏi inactiveRoles
      setInactiveRoles((prev) => prev.filter((r) => r !== roleName));
    } else {
      // Tạm khóa: đưa vào inactiveRoles
      setInactiveRoles((prev) => (prev.includes(roleName) ? prev : [...prev, roleName]));
    }
  };

  const handleFinish = async (values: {
    name: string;
    description?: string;
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
        description: values.description?.trim() || undefined,
        roles: roles.map((r) => r.trim()).filter(Boolean),
        inactiveRoles: inactiveRoles.map((r) => r.trim()).filter(Boolean),
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
            {isEdit ? "Cập nhật phòng ban / tổ chuyên môn" : "Thêm phòng ban / tổ chuyên môn"}
          </Text>
          <Text className="block text-xs font-normal text-slate-500">
            {isEdit
              ? `Chỉnh sửa thông tin và vị trí chức danh của "${editingTeam?.name}"`
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
        className="[&_.ant-form-item]:mb-3 [&_.ant-form-item-label]:!pb-0.5 [&_.ant-form-item-label>label]:text-xs [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-slate-700"
      >
        <div className="space-y-4">
          {/* Section 1: Thông tin phòng ban */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <span className="text-xs font-bold text-slate-800">
                Thông tin phòng ban / tổ chuyên môn
              </span>
            </div>

            {/* Tên phòng ban */}
            <Form.Item
              name="name"
              label="Tên phòng ban / Tổ chuyên môn"
              rules={[
                { required: true, message: "Vui lòng nhập tên phòng ban / tổ chuyên môn" },
                { min: 3, message: "Tên phòng ban phải có ít nhất 3 ký tự" },
              ]}
            >
              <Input
                placeholder="VD: Tổ Quản lý Chất lượng & Môi trường..."
                className="h-9 text-xs"
              />
            </Form.Item>

            {/* Mô tả */}
            <Form.Item
              name="description"
              label="Mô tả chức năng & nhiệm vụ"
              className="!mb-0"
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả chức năng chính, quyền hạn và nhiệm vụ chuyên môn của đơn vị..."
                className="text-xs resize-y"
              />
            </Form.Item>
          </div>

          {/* Section 2: Trường thông tin tùy biến (Cấu hình động - áp dụng linh hoạt khi thêm) */}
          {customFields.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <SettingOutlined className="text-[#0F4C81]" />
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

          {/* Section 3: Vị trí & Chức danh thuộc phòng ban (Người dùng có thể thêm nhiều vị trí) */}
          {/* Section 3: Vị trí & Chức danh thuộc phòng ban (Mỗi vị trí 1 hàng, trạng thái Khóa / Đang dùng) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200/80 text-slate-700">
                  <IdcardOutlined className="text-xs" />
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Chức danh thuộc phòng ban
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                  {roles.length} vị trí ({roles.length - inactiveRoles.length} đang dùng)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 m-0">
              Nhập các vị trí/chức danh công việc của phòng ban để phục vụ phân công cán bộ (có thể thêm nhiều vị trí tùy ý):
            </p>

            {/* Ô nhập vị trí + nút Thêm */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nhập tên vị trí (VD: Trưởng phòng, Kỹ sư giám sát, Kế toán viên...)"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
                className="h-9 text-xs flex-1 bg-white"
              />
              <Button
                htmlType="button"
                intent="primary"
                scale="compact"
                icon={<PlusOutlined />}
                onClick={handleAddRole}
                className="!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] text-white shrink-0 h-9 px-3.5 text-xs font-semibold shadow-xs"
              >
                Thêm
              </Button>
            </div>

            {/* Danh sách vị trí đã thêm: mỗi role 1 hàng căn đều 2 bên, có nút khóa/mở khóa, không có nút xóa */}
            <div className="space-y-2 pt-1">
              {roles.length === 0 ? (
                <div className="p-3.5 text-center rounded-lg bg-white border border-slate-200/80 text-xs text-slate-400 italic">
                  Chưa có vị trí nào được thêm. Nhập tên vị trí ở trên và bấm "Thêm" hoặc nhấn Enter.
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {roles.map((r, idx) => {
                    const isInactive = inactiveRoles.includes(r);
                    return (
                      <div
                        key={`${r}-${idx}`}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors",
                          isInactive ? "bg-slate-50/70" : "hover:bg-slate-50/70"
                        )}
                      >
                        {/* Cột trái: Thứ tự + Tên vị trí + Huy hiệu trạng thái */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {idx + 1}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold truncate",
                              isInactive ? "text-slate-400 line-through" : "text-slate-800"
                            )}
                            title={r}
                          >
                            {r}
                          </span>
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200 shrink-0">
                              <LockOutlined className="text-[10px]" /> Tạm khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-[#0F4C81] border border-sky-200 shrink-0">
                              <CheckCircleOutlined className="text-[10px]" /> Đang dùng
                            </span>
                          )}
                        </div>

                        {/* Cột phải: Switch bật / khóa (Không có nút xóa) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                            {isInactive ? "Mở khóa" : "Khóa"}
                          </span>
                          <Switch
                            size="small"
                            checked={!isInactive}
                            onChange={(checked) => handleToggleRoleStatus(r, checked)}
                            className={cn(!isInactive ? "!bg-[#0F4C81]" : "!bg-slate-300")}
                            title={isInactive ? "Bấm để kích hoạt lại vị trí này" : "Bấm để tạm khóa vị trí này (không xóa)"}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Form>
    </Drawer>
  );
}
