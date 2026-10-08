"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Form, Input, Modal, Text } from "@/components/ui";

interface ReasonModalProps {
  open: boolean;
  title: string;
  /** Tóm tắt hồ sơ đang xử lý, giúp người dùng chắc chắn đúng đối tượng */
  summary?: ReactNode;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
}

/** Hộp thoại bắt buộc nhập lý do: trả lại hồ sơ, từ chối đề xuất, khóa tài khoản... */
export default function ReasonModal({
  open,
  title,
  summary,
  label = "Lý do",
  placeholder = "Nêu rõ lý do để người nhận biết cần bổ sung gì...",
  confirmText = "Xác nhận",
  onClose,
  onConfirm,
}: ReasonModalProps) {
  const [form] = Form.useForm<{ reason: string }>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async ({ reason }: { reason: string }) => {
    setSubmitting(true);
    try {
      if (await onConfirm(reason.trim())) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      centered
      title={
        <span className="flex items-center gap-2 text-base">
          <ExclamationCircleFilled className="text-rose-500" />
          {title}
        </span>
      }
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={520}
    >
      {summary && (
        <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">{summary}</div>
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="reason"
          label={<Text strong className="text-[13px]">{label}</Text>}
          rules={[
            { required: true, whitespace: true, message: "Vui lòng nhập lý do." },
            { min: 10, message: "Lý do cần rõ ràng, tối thiểu 10 ký tự." },
          ]}
        >
          <Input.TextArea rows={4} placeholder={placeholder} className="text-sm" />
        </Form.Item>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button intent="danger" htmlType="submit" loading={submitting}>{confirmText}</Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>Đóng</Button>
        </div>
      </Form>
    </Modal>
  );
}
