"use client";

import { useEffect, useState } from "react";
import { ApartmentOutlined, CloseOutlined } from "@ant-design/icons";
import { Form, Modal } from "antd";
import { Button, Input } from "@/components/ui";
import type { PersonnelDataset } from "../types/personnel.types";

interface AddTeamModalProps {
  open: boolean;
  data: PersonnelDataset;
  onClose: () => void;
  onSubmit: (input: { id?: string; name: string; description?: string; leaderId?: string }) => Promise<boolean>;
}

export default function AddTeamModal({
  open,
  data,
  onClose,
  onSubmit,
}: AddTeamModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: { name: string; description?: string }) => {
    setSubmitting(true);
    try {
      // Tự sinh mã định danh từ tên phòng ban
      const acronym = values.name
        .trim()
        .split(/[\s–-]+/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("");

      const success = await onSubmit({
        id: acronym || undefined,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closeIcon={<CloseOutlined className="text-slate-400 hover:text-slate-600" />}
      title={
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-base text-[#DC2626] shadow-2xs">
            <ApartmentOutlined />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Thêm phòng ban / tổ chuyên môn
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Khởi tạo đơn vị thuộc cơ cấu tổ chức Ban Quản lý
            </p>
          </div>
        </div>
      }
    >
      {/* Form chỉ gồm Tên phòng ban và Mô tả */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="space-y-4 pt-3"
        requiredMark={false}
      >
        {/* Tên phòng ban */}
        <Form.Item
          name="name"
          label={
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Tên phòng ban / Tổ chuyên môn <span className="text-rose-500">*</span>
            </div>
          }
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
          label={
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Mô tả
            </div>
          }
        >
          <Input.TextArea
            rows={4}
            placeholder="Mô tả chức năng chính, quyền hạn và nhiệm vụ chuyên môn của đơn vị..."
            className="text-xs resize-y"
          />
        </Form.Item>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
          <Button
            htmlType="button"
            intent="outline"
            scale="compact"
            onClick={onClose}
            disabled={submitting}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Hủy bỏ
          </Button>
          <Button
            htmlType="submit"
            intent="primary"
            scale="compact"
            disabled={submitting}
            className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white text-xs font-semibold shadow-xs"
          >
            {submitting ? "Đang khởi tạo..." : "+ Thêm phòng ban"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
