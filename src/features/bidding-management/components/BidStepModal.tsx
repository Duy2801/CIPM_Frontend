"use client";

import { useState } from "react";
import {
  ExclamationCircleFilled,
  FileTextOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, MoneyInput, StandardFileUpload, Text } from "@/components/ui";
import type { UploadedAttachment } from "@/components/ui";
import { todayIso } from "@/utils/date";
import type { BidPackage, BidStepInput } from "../types/bidding.types";
import { getBidStepDefinition, getCurrentBidStep } from "../utils/bidding-rules";
import { parseMoney } from "@/utils/format-money";

interface BidStepModalProps {
  pkg: BidPackage;
  errorText?: string;
  onClose: () => void;
  onComplete: (id: string, input: BidStepInput) => Promise<boolean>;
  onSubmit: (id: string, input: BidStepInput) => Promise<boolean>;
}

interface FormValues {
  documentNo: string;
  completedAt: string;
  bidDeadline?: string;
  winner?: string;
  winningPrice?: string;
  fileName?: string;
  fileSize?: string;
}

export default function BidStepModal({ pkg, errorText, onClose, onComplete, onSubmit }: BidStepModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const current = getCurrentBidStep(pkg) ?? 0;
  const definition = getBidStepDefinition(current);
  const needsApproval = Boolean(definition?.requiresApproval);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const firstFile = attachments[0];
      const input: BidStepInput = {
        documentNo: values.documentNo.trim(),
        completedAt: values.completedAt,
        bidDeadline: values.bidDeadline,
        winner: values.winner?.trim(),
        winningPrice: values.winningPrice ? parseMoney(values.winningPrice) : undefined,
        fileName: firstFile?.name || values.fileName,
        fileSize: firstFile?.size || values.fileSize,
      };
      const success = needsApproval ? await onSubmit(pkg.id, input) : await onComplete(pkg.id, input);
      if (success) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white font-semibold"
          >
            {needsApproval ? "Gửi tờ trình" : `Hoàn thành bước ${current}`}
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
      title={
        <div>
          <span className="text-base font-bold text-[#102A43]">
            {needsApproval ? "Trình phê duyệt" : "Cập nhật"} bước {current}
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            Gói thầu: {pkg.code} – {pkg.name}
          </span>
        </div>
      }
    >
      <section className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <Text className="block text-sm font-bold text-[#102A43]">Bước {current}: {definition?.title}</Text>
        <Text className="mt-1 block text-[13px] text-slate-600">Kết quả cần có: {definition?.output}</Text>
        <Text className="block text-[13px] text-slate-600">Thời gian thông thường: {definition?.duration}</Text>
      </section>

      {pkg.rejection && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span><strong>Lần trước bị trả lại:</strong> {pkg.rejection.reason}</span>
        </div>
      )}

      {needsApproval && (
        <Text className="mb-4 flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-[13px] text-violet-800">
          <InfoCircleOutlined className="mt-0.5" />
          Tờ trình sẽ được gửi Giám đốc / Phó Giám đốc. Bước chỉ hoàn thành khi được phê duyệt.
        </Text>
      )}

      {errorText && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span><strong>Chưa thể lưu:</strong> {errorText}</span>
        </div>
      )}

      <Form<FormValues> form={form} layout="vertical" initialValues={{ completedAt: todayIso() }} onFinish={handleFinish}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="documentNo"
            label={needsApproval ? "Số tờ trình" : "Số văn bản / biên bản"}
            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập số văn bản." }]}
          >
            <Input placeholder="Ví dụ: 215/TTr-BQL" />
          </Form.Item>
          <Form.Item name="completedAt" label="Ngày thực hiện" rules={[{ required: true, message: "Vui lòng chọn ngày." }]}>
            <Input type="date" max={todayIso()} />
          </Form.Item>
        </div>

        {/* Đính kèm tài liệu / minh chứng cho bước */}
        <div className="mb-3">
          <StandardFileUpload
            title="Tài liệu / Văn bản đính kèm"
            value={attachments}
            onChange={(files) => {
              setAttachments(files);
              if (files[0]) {
                form.setFieldsValue({ fileName: files[0].name, fileSize: files[0].size });
              } else {
                form.setFieldsValue({ fileName: undefined, fileSize: undefined });
              }
            }}
          />
        </div>

        {definition?.output && (
          <div className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 flex items-center gap-1.5 mb-3">
            <span className="font-semibold text-slate-600 not-italic">Văn bản đầu ra:</span>
            <span>{definition.output}</span>
          </div>
        )}

        {current === 4 && (
          <Form.Item
            name="bidDeadline"
            label="Hạn nộp hồ sơ dự thầu"
            extra="Hệ thống sẽ nhắc khi còn 7 ngày và 3 ngày"
            rules={[{ required: true, message: "Vui lòng chọn hạn nộp hồ sơ dự thầu." }]}
          >
            <Input type="date" />
          </Form.Item>
        )}

        {current === 8 && (
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="winner"
              label="Nhà thầu trúng thầu"
              rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nhà thầu trúng thầu." }]}
            >
              <Input placeholder="Tên đầy đủ của nhà thầu" />
            </Form.Item>
            <Form.Item
              name="winningPrice"
              label="Giá trúng thầu"
              extra={`Không vượt giá gói thầu ${new Intl.NumberFormat("vi-VN").format(pkg.estimatedPrice)}`}
              rules={[
                { required: true, message: "Vui lòng nhập giá trúng thầu." },
                () => ({
                  validator: (_, val) => {
                    const num = parseMoney(val);
                    if (!num || num <= 0) return Promise.reject(new Error("Số dương hợp lệ."));
                    if (num > pkg.estimatedPrice) return Promise.reject(new Error("Không được vượt giá gói thầu."));
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <MoneyInput placeholder="Ví dụ: 100.000.000" />
            </Form.Item>
          </div>
        )}
      </Form>
    </Drawer>
  );
}
