"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Form, Input, Modal, Radio, Text } from "@/components/ui";

const OTHER_REASON_KEY = "__OTHER__";

interface ReasonModalProps {
  open: boolean;
  title: string;
  /** Tóm tắt hồ sơ đang xử lý, giúp người dùng chắc chắn đúng đối tượng */
  summary?: ReactNode;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  /** Danh sách lý do mẫu cho người dùng chọn nhanh */
  presetReasons?: string[];
  /** Bật tùy chọn "Lý do khác" (mặc định: true) */
  allowCustomReason?: boolean;
  /** Tùy chọn lý do chọn mặc định (mặc định là lựa chọn đầu tiên trong preset) */
  defaultPresetReason?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
}

/** Hộp thoại bắt buộc nhập hoặc chọn lý do: trả lại hồ sơ, từ chối đề xuất, khóa tài khoản... */
export default function ReasonModal({
  open,
  title,
  summary,
  label = "Lý do",
  placeholder = "Nêu rõ lý do để người nhận biết cần bổ sung gì...",
  confirmText = "Xác nhận",
  presetReasons,
  allowCustomReason = true,
  defaultPresetReason,
  onClose,
  onConfirm,
}: ReasonModalProps) {
  const [form] = Form.useForm<{ reason?: string; customReason?: string }>();
  const [submitting, setSubmitting] = useState(false);

  const hasPresets = Boolean(presetReasons && presetReasons.length > 0);

  const [selectedPreset, setSelectedPreset] = useState<string>(
    defaultPresetReason || (hasPresets ? presetReasons![0] : OTHER_REASON_KEY)
  );

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedPreset(defaultPresetReason || (hasPresets ? presetReasons![0] : OTHER_REASON_KEY));
    }
  }, [open, defaultPresetReason, hasPresets, presetReasons, form]);

  const handleFinish = async (values: { reason?: string; customReason?: string }) => {
    setSubmitting(true);
    try {
      let finalReason = "";
      if (hasPresets) {
        if (selectedPreset === OTHER_REASON_KEY) {
          finalReason = (values.customReason || "").trim();
        } else {
          finalReason = selectedPreset.trim();
        }
      } else {
        finalReason = (values.reason || "").trim();
      }

      if (!finalReason) return;
      if (await onConfirm(finalReason)) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      centered
      title={
        <span className="flex items-center gap-2 text-base font-bold text-slate-900">
          <ExclamationCircleFilled className="text-rose-500" />
          {title}
        </span>
      }
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={540}
    >
      {summary && (
        <div className="mb-3.5 rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-[13px] text-slate-700">
          {summary}
        </div>
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {hasPresets ? (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2">
              {presetReasons!.map((reason) => {
                const isSelected = selectedPreset === reason;
                return (
                  <div
                    key={reason}
                    onClick={() => setSelectedPreset(reason)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "border-red-300 bg-white text-slate-900 font-semibold shadow-2xs"
                        : "border-transparent hover:bg-white/70 text-slate-700 font-medium"
                    }`}
                  >
                    <Radio checked={isSelected} className="!mr-0" />
                    <span className="text-[13px] leading-snug">{reason}</span>
                  </div>
                );
              })}

              {allowCustomReason && (
                <div
                  onClick={() => setSelectedPreset(OTHER_REASON_KEY)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all ${
                    selectedPreset === OTHER_REASON_KEY
                      ? "border-red-300 bg-white text-slate-900 font-semibold shadow-2xs"
                      : "border-transparent hover:bg-white/70 text-slate-700 font-medium"
                  }`}
                >
                  <Radio checked={selectedPreset === OTHER_REASON_KEY} className="!mr-0" />
                  <span className="text-[13px] leading-snug">Lý do khác...</span>
                </div>
              )}
            </div>

            {selectedPreset === OTHER_REASON_KEY && (
              <Form.Item
                name="customReason"
                label={
                  <Text strong className="text-[13px] text-slate-800">
                    Chi tiết lý do khác
                  </Text>
                }
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập lý do cụ thể." },
                  { min: 5, message: "Lý do cần tối thiểu 5 ký tự." },
                ]}
                className="mt-2 mb-0"
              >
                <Input.TextArea
                  rows={3}
                  placeholder={placeholder || "Nêu rõ lý do cụ thể..."}
                  className="text-sm"
                  autoFocus
                />
              </Form.Item>
            )}
          </div>
        ) : (
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
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
          <Button intent="danger" htmlType="submit" loading={submitting}>
            {confirmText}
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
