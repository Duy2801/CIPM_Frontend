"use client";

import { useState } from "react";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Text, toast } from "@/components/ui";

/** Trường thông tin bổ sung riêng của cán bộ đang thêm (nhãn = khóa lưu trong customFields) */
export interface StaffCustomField {
  id: string;
  label: string;
}

interface StaffFormCustomFieldsProps {
  fields: StaffCustomField[];
  onAdd: (field: StaffCustomField) => void;
  onRemove: (field: StaffCustomField) => void;
}

/**
 * Khu "Thông tin bổ sung" của form thêm nhân sự: mỗi cán bộ tự thêm trường riêng (chỉ kiểu văn bản),
 * không dùng chung danh mục trường với cán bộ khác.
 */
export default function StaffFormCustomFields({ fields, onAdd, onRemove }: StaffFormCustomFieldsProps) {
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const closeAdding = () => {
    setIsAddingField(false);
    setNewFieldLabel("");
  };

  const submitNewField = () => {
    const trimmed = newFieldLabel.trim();
    if (!trimmed) {
      toast.warning("Chưa nhập tên trường", "Vui lòng nhập tên trường dữ liệu mới.");
      return;
    }
    if (fields.some((f) => f.label.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("Trùng tên trường", "Cán bộ này đã có trường thông tin này.");
      return;
    }
    onAdd({ id: `cf_${Date.now()}`, label: trimmed });
    closeAdding();
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
      <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-2">
        <Text className="text-xs font-bold text-[#102A43]">
          Thông tin bổ sung {fields.length > 0 && `(${fields.length} trường)`}
        </Text>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => (isAddingField ? closeAdding() : setIsAddingField(true))}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {isAddingField ? "Đóng thêm trường" : "Thêm trường dữ liệu"}
        </Button>
      </div>

      {/* Thêm trường: chỉ cần nhập tên, trường luôn là ô văn bản */}
      {isAddingField && (
        <div className="mb-3.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
          <div className="mb-2 text-xs font-semibold text-blue-900">Thêm trường thông tin cho cán bộ này</div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              autoFocus
              placeholder="Nhập tên trường (ví dụ: Số CCCD phụ, Size áo...)"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onPressEnter={(e) => {
                // Không để Enter gửi luôn form thêm nhân sự
                e.preventDefault();
                submitNewField();
              }}
              className="min-w-[240px] flex-1"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={submitNewField}>
              Thêm
            </Button>
            <Button onClick={closeAdding}>Hủy</Button>
          </div>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="py-4 text-center text-xs italic text-slate-400">
          Chưa có trường bổ sung. Bấm &quot;Thêm trường dữ liệu&quot; nếu cán bộ cần thêm thông tin.
        </div>
      ) : (
        <Row gutter={[16, 0]}>
          {fields.map((field) => (
            <Col key={field.id} xs={24} sm={12}>
              <Form.Item
                name={["customFields", field.id]}
                label={
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700">{field.label}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(field)}
                      aria-label={`Xóa trường ${field.label}`}
                      title="Xóa trường này"
                      className="cursor-pointer rounded border-0 bg-transparent p-0.5 text-[10px] text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                }
                className="[&_.ant-form-item-label>label]:w-full"
              >
                <Input placeholder={`Nhập ${field.label.toLowerCase()}...`} />
              </Form.Item>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
