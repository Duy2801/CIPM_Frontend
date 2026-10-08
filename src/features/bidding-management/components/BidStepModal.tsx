"use client";

import { useState } from "react";
import {
  ExclamationCircleFilled,
  FileTextOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Text } from "@/components/ui";
import { todayIso } from "@/utils/date";
import type { BidPackage, BidStepInput } from "../types/bidding.types";
import { getBidStepDefinition, getCurrentBidStep } from "../utils/bidding-rules";

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
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const current = getCurrentBidStep(pkg) ?? 0;
  const definition = getBidStepDefinition(current);
  const needsApproval = Boolean(definition?.requiresApproval);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const input: BidStepInput = {
        documentNo: values.documentNo.trim(),
        completedAt: values.completedAt,
        bidDeadline: values.bidDeadline,
        winner: values.winner?.trim(),
        winningPrice: values.winningPrice ? Number(values.winningPrice) : undefined,
        fileName: selectedFile?.name || values.fileName,
        fileSize: selectedFile?.size || values.fileSize,
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
            className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white font-semibold"
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
        <Form.Item
          name="fileName"
          label={
            <span className="flex items-center gap-1.5 font-semibold text-xs text-slate-700">
              <PaperClipOutlined className="text-slate-500" />
              Tài liệu / Văn bản đính kèm
            </span>
          }
          className="mb-3"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#007A78] text-xs font-medium text-slate-700 transition-colors shadow-2xs">
                <UploadOutlined className="text-teal-700 text-sm" />
                <span>Chọn tệp đính kèm</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const name = file.name;
                      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
                      const sizeStr = `${sizeInMb} MB`;
                      setSelectedFile({ name, size: sizeStr });
                      form.setFieldsValue({ fileName: name, fileSize: sizeStr });
                    }
                  }}
                />
              </label>

              {selectedFile ? (
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium">
                  <FileTextOutlined className="text-teal-600 text-sm" />
                  <span className="truncate max-w-[260px] font-mono">{selectedFile.name}</span>
                  <span className="text-[11px] text-teal-600">({selectedFile.size})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      form.setFieldsValue({ fileName: undefined, fileSize: undefined });
                    }}
                    className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer font-bold leading-none"
                    title="Xóa tệp đính kèm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-[11.5px] text-slate-400">
                  Hỗ trợ định dạng PDF, Word (.doc, .docx), Excel (.xls, .xlsx), ảnh (.png, .jpg)
                </span>
              )}
            </div>

            {definition?.output && (
              <div className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 not-italic">Văn bản đầu ra:</span>
                <span>{definition.output}</span>
              </div>
            )}
          </div>
        </Form.Item>

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
              label="Giá trúng thầu (tỷ đồng)"
              extra={`Không vượt giá gói thầu ${new Intl.NumberFormat("vi-VN").format(pkg.estimatedPrice)} tỷ`}
              rules={[
                { required: true, message: "Vui lòng nhập giá trúng thầu." },
                { pattern: /^\d+(\.\d{1,3})?$/, message: "Số dương, tối đa 3 chữ số thập phân." },
              ]}
            >
              <Input inputMode="decimal" suffix="tỷ" placeholder="Ví dụ: 35.080" />
            </Form.Item>
          </div>
        )}
      </Form>
    </Drawer>
  );
}
