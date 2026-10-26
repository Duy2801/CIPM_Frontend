"use client";

import { Fragment, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Col, Form, Input, Row, Select, Text, toast } from "@/components/ui";
import { useConfirmAction } from "../hooks/useConfirmAction";
import { useCustomFieldDefs } from "../hooks/useCustomFieldDefs";
import type { CustomFieldDefinition, CustomFieldType } from "../types/custom-fields.types";

interface StaffFormCustomFieldsProps {
  /** Trường bị bỏ tích "Áp dụng" (chưa có trong danh sách = đang áp dụng) */
  appliedFieldIds: Record<string, boolean>;
  onToggleApplied: (field: CustomFieldDefinition, applied: boolean) => void;
}

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Văn bản (Text)" },
  { value: "number", label: "Số (Number)" },
  { value: "date", label: "Ngày tháng (Date)" },
  { value: "select", label: "Danh sách chọn (Select)" },
  { value: "textarea", label: "Đoạn văn (Textarea)" },
];

/** Ô nhập theo loại dữ liệu của trường; không áp dụng thì khóa ô */
function CustomFieldInput({ field, applied }: { field: CustomFieldDefinition; applied: boolean }) {
  const placeholder = (verb: string) =>
    applied ? field.placeholder || `${verb} ${field.label}...` : "Không áp dụng";

  if (field.type === "textarea") return <Input.TextArea rows={2} disabled={!applied} placeholder={placeholder("Nhập")} />;
  if (field.type === "number") return <Input type="number" disabled={!applied} placeholder={placeholder("Nhập")} />;
  if (field.type === "date") return <Input type="date" disabled={!applied} placeholder={placeholder("Chọn")} />;
  if (field.type === "select") {
    return (
      <Select
        disabled={!applied}
        placeholder={applied ? field.placeholder || `Chọn ${field.label.toLowerCase()}` : "Không áp dụng"}
        options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
        allowClear
      />
    );
  }
  return <Input disabled={!applied} placeholder={placeholder("Nhập")} />;
}

/** Khu "Thông tin bổ sung" của form thêm nhân sự: trường tùy biến, bật / tắt áp dụng, thêm trường mới */
export default function StaffFormCustomFields({ appliedFieldIds, onToggleApplied }: StaffFormCustomFieldsProps) {
  const [fields, saveFields] = useCustomFieldDefs("staff");
  const confirmAction = useConfirmAction();
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");

  const appliedCount = fields.filter((f) => appliedFieldIds[f.id] !== false).length;

  // Thêm trường mới dùng cho hồ sơ tất cả cán bộ
  const submitNewField = async () => {
    const trimmed = newFieldLabel.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên trường", "Vui lòng nhập tên trường dữ liệu mới.");
      return;
    }
    if (fields.some((f) => f.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("Trùng tên trường", "Trường thông tin này đã có trong danh mục.");
      return;
    }
    if (
      !(await confirmAction({
        title: `Thêm trường thông tin "${trimmed}"?`,
        description: "Trường mới sẽ dùng cho hồ sơ tất cả cán bộ.",
        okText: "Thêm trường",
      }))
    )
      return;

    saveFields([
      ...fields,
      {
        id: `cf_${Date.now()}`,
        name: `field_${Date.now()}`,
        label: trimmed,
        type: newFieldType,
        required: false,
        active: true,
        placeholder: `Nhập ${trimmed.toLowerCase()}...`,
      },
    ]);
    toast.success("Thành công", `Đã thêm trường "${trimmed}".`);
    setNewFieldLabel("");
    setNewFieldType("text");
    setIsAddingField(false);
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
      <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-2">
        <div className="flex items-center gap-1.5">
          <Text className="text-xs font-bold text-[#102A43]">
            Thông tin bổ xung {fields.length > 0 && `(${appliedCount}/${fields.length} trường áp dụng)`}
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
              onPressEnter={submitNewField}
              className="flex-1 min-w-[240px]"
            />
            <Select
              value={newFieldType}
              onChange={(val) => setNewFieldType(val as CustomFieldType)}
              className="w-full sm:w-[210px]"
              options={FIELD_TYPE_OPTIONS}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={submitNewField}>
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

      {fields.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400 italic">
          Chưa có trường tùy biến nào. Bấm &quot;Thêm trường dữ liệu&quot; ở trên để thêm nhanh.
        </div>
      ) : (
        <Row gutter={[16, 0]}>
          {fields.map((field) => {
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
                    <CustomFieldInput field={field} applied={isApplied} />
                  </Form.Item>
                </Col>

                {/* Cột 2: Nút tích Áp dụng nằm ở vị trí thứ 2 bên cạnh */}
                <Col xs={24} sm={12}>
                  <Form.Item label={<span className="invisible select-none">Áp dụng</span>}>
                    <div className="flex items-center h-8">
                      <Checkbox checked={isApplied} onChange={(e) => onToggleApplied(field, e.target.checked)}>
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
  );
}
