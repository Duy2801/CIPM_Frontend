"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Form, Input, Modal, Text } from "@/components/ui";
import { todayIso } from "@/utils/date";
import type { FixInput, Incident } from "../types/warranty.types";

interface FixAcceptanceModalProps {
  incident: Incident;
  errorText?: string;
  onClose: () => void;
  onSubmit: (id: string, input: FixInput) => Promise<boolean>;
}

export default function FixAcceptanceModal({ incident, errorText, onClose, onSubmit }: FixAcceptanceModalProps) {
  const [form] = Form.useForm<FixInput>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: FixInput) => {
    setSubmitting(true);
    try {
      if (await onSubmit(incident.id, { ...values, attachment: values.attachment || undefined })) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open title={`Nghiệm thu khắc phục ${incident.code}`} footer={null} width={560} onCancel={onClose} destroyOnHidden>
      <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
        <Text className="block font-semibold">{incident.description}</Text>
        <Text className="block text-xs text-slate-500">Vị trí: {incident.location}</Text>
      </div>
      {errorText && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể lưu:</strong> {errorText}</span>
        </div>
      )}
      <Form<FixInput> form={form} layout="vertical" initialValues={{ fixedDate: todayIso() }} onFinish={handleFinish}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item name="fixedDate" label="Ngày hoàn thành sửa chữa" rules={[{ required: true, message: "Chọn ngày." }]}>
            <Input type="date" min={incident.foundDate} max={todayIso()} />
          </Form.Item>
          <Form.Item
            name="acceptanceDocument"
            label="Số biên bản nghiệm thu"
            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập số biên bản." }]}
          >
            <Input placeholder="Ví dụ: BB-NT-KP-015" />
          </Form.Item>
        </div>
        <Form.Item
          name="attachment"
          label="Biên bản nghiệm thu lại / ảnh sau sửa chữa"
          getValueFromEvent={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0]?.name ?? ""}
          getValueProps={() => ({})}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-[13px] file:font-medium file:text-teal-700 hover:border-teal-400"
          />
        </Form.Item>
        <footer className="flex items-center justify-start gap-2.5 border-t border-slate-100 pt-4">
          <Button intent="primary" htmlType="submit" loading={submitting}>Xác nhận đã khắc phục</Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>Đóng</Button>
        </footer>
      </Form>
    </Modal>
  );
}
