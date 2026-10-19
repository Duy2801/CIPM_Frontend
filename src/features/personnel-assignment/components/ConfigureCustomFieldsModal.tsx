"use client";

import React, { useEffect, useState } from "react";
import {
  CloseOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Text,
  toast,
} from "@/components/ui";
import type {
  CustomFieldDefinition,
  CustomFieldTarget,
  CustomFieldType,
} from "../types/custom-fields.types";
import {
  getCustomFields,
  saveCustomFields,
} from "../utils/custom-fields-storage";

interface ConfigureCustomFieldsModalProps {
  open: boolean;
  target: CustomFieldTarget;
  onClose: () => void;
  onFieldsUpdated?: (fields: CustomFieldDefinition[]) => void;
}

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string; color: string }[] = [
  { value: "text", label: "Văn bản (Text)", color: "blue" },
  { value: "number", label: "Số (Number)", color: "purple" },
  { value: "date", label: "Ngày tháng (Date)", color: "green" },
  { value: "select", label: "Lựa chọn (Select)", color: "orange" },
  { value: "textarea", label: "Đoạn văn (Textarea)", color: "cyan" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function ConfigureCustomFieldsModal({
  open,
  target,
  onClose,
  onFieldsUpdated,
}: ConfigureCustomFieldsModalProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch("type", form);

  useEffect(() => {
    if (open) {
      const currentFields = getCustomFields(target);
      setFields(currentFields);
      form.resetFields();
      form.setFieldsValue({ type: "text" });
    }
  }, [open, target, form]);

  const handleAddField = async (values: any) => {
    const label = values.label?.trim();
    if (!label) {
      toast.error("Vui lòng nhập tên trường thông tin.");
      return;
    }

    const baseName = slugify(label).replace(/[^a-z0-9_]/gi, "_") || "truong_moi";
    let name = baseName;
    let counter = 1;
    while (fields.some((f) => f.name === name)) {
      name = `${baseName}_${counter++}`;
    }

    let options: string[] | undefined;
    if (values.type === "select") {
      options = (values.optionsRaw || "")
        .split(/[,;\n]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (!options || options.length === 0) {
        toast.error("Vui lòng nhập ít nhất một lựa chọn (cách nhau bởi dấu phẩy).");
        return;
      }
    }

    const newField: CustomFieldDefinition = {
      id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      label,
      type: values.type || "text",
      required: false,
      placeholder: `Nhập ${label.toLowerCase()}...`,
      options,
      active: true,
    };

    const updated = [...fields, newField];
    setFields(updated);
    saveCustomFields(target, updated);
    onFieldsUpdated?.(updated);
    form.resetFields();
    form.setFieldsValue({ type: "text" });
    toast.success(`Đã thêm trường "${label}" vào cấu hình.`);
    onClose();
  };

  const targetTitle = target === "staff" ? "Nhân sự / Tài khoản" : "Phòng ban / Tổ chuyên môn";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
      centered
      closeIcon={<CloseOutlined className="text-slate-400 hover:text-slate-600" />}
      title={
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            Thêm trường thông tin {targetTitle}
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Trường dữ liệu tùy biến sẽ xuất hiện trên form {target === "staff" ? "Thêm nhân sự" : "Thêm phòng ban"}
          </p>
        </div>
      }
    >
      <div className="pt-3">
        <Form form={form} layout="vertical" onFinish={handleAddField} requiredMark={false}>
          <Row gutter={12}>
            <Col xs={24} sm={15}>
              <Form.Item
                name="label"
                label={<Text strong className="text-xs text-slate-700">Tên trường (Nhãn hiển thị) <span className="text-rose-500">*</span></Text>}
                rules={[{ required: true, message: "Vui lòng nhập tên trường" }]}
              >
                <Input
                  placeholder={target === "staff" ? "Ví dụ: Chứng chỉ hành nghề, Bằng cấp chuyên môn..." : "Ví dụ: Địa điểm làm việc, Số máy nhánh..."}
                  className="text-sm"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={9}>
              <Form.Item
                name="type"
                label={<Text strong className="text-xs text-slate-700">Loại dữ liệu</Text>}
                rules={[{ required: true, message: "Chọn loại dữ liệu" }]}
              >
                <Select
                  options={FIELD_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                  className="w-full text-sm"
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedType === "select" && (
            <Form.Item
              name="optionsRaw"
              label={<Text strong className="text-xs text-slate-700">Danh sách lựa chọn (ngăn cách bằng dấu phẩy) <span className="text-rose-500">*</span></Text>}
              rules={[{ required: true, message: "Vui lòng nhập danh sách lựa chọn" }]}
            >
              <Input placeholder="Lựa chọn 1, Lựa chọn 2, Lựa chọn 3" className="text-sm" />
            </Form.Item>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
            <Button intent="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              intent="primary"
              htmlType="submit"
              className="font-semibold !bg-[#DC2626] hover:!bg-[#B91C1C] text-white shadow-2xs"
            >
              Thêm trường
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
