"use client";

import { useState } from "react";
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  FileTextOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Text } from "@/components/ui";
import { formatDateVi, todayIso } from "@/utils/date";
import { GPMB_STEPS, LAND_TYPE_LABELS } from "../constants/gpmb-steps";
import type { Household, StepCompletionInput } from "../types/gpmb.types";
import { getCurrentStep, getStepDefinition } from "../utils/gpmb-rules";
import { SpecialStatusTag } from "./HouseholdBadges";

interface StepUpdateModalProps {
  household: Household;
  errorText?: string;
  onClose: () => void;
  onComplete: (id: string, input: StepCompletionInput) => Promise<boolean>;
  onPropose: (id: string, input: StepCompletionInput) => Promise<boolean>;
}

interface FormValues {
  documentNo: string;
  completedAt: string;
  fileName?: string;
  note?: string;
}

/** Form cập nhật bước dạng Drawer trượt từ bên phải giống hệt "Xem chi tiết" */
export default function StepUpdateModal({
  household,
  errorText,
  onClose,
  onComplete,
  onPropose,
}: StepUpdateModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const current = getCurrentStep(household) ?? 0;
  const definition = getStepDefinition(current);
  const needsApproval = Boolean(definition?.requiresApproval);

  const handleFinish = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const input: StepCompletionInput = {
        documentNo: values.documentNo.trim(),
        completedAt: values.completedAt,
        fileName: values.fileName || undefined,
        note: values.note?.trim() || undefined,
      };
      const success = needsApproval
        ? await onPropose(household.id, input)
        : await onComplete(household.id, input);
      if (success) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const facts = [
    { label: "Mã hộ", value: household.code },
    { label: "CCCD", value: household.idNumber },
    { label: "Địa chỉ", value: household.address },
    { label: "Diện tích thu hồi", value: `${new Intl.NumberFormat("vi-VN").format(household.areaM2)} m²` },
    { label: "Loại đất", value: LAND_TYPE_LABELS[household.landType] },
    {
      label: "Tiền bồi thường",
      value: `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(household.compensation)} tỷ đồng`,
    },
  ];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#102A43]">{household.ownerName}</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {household.code}
            </span>
            <SpecialStatusTag status={household.specialStatus} />
          </div>
          <span className="block text-xs font-normal text-slate-500 mt-1">
            {household.address} · CCCD {household.idNumber}
          </span>
        </div>
      }
    >
      {/* 1. Lưới thông tin cơ bản của hộ dân (giống hệt xem chi tiết) */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-slate-500">{fact.label}</dt>
            <dd className="m-0 text-sm font-semibold text-slate-800">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {/* 2. Khối biểu mẫu cập nhật bước hiện tại */}
      {current > 0 && (
        <section className="mt-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-md bg-[#007A78] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {current}
            </span>
            <span className="text-sm font-bold text-[#102A43]">
              {needsApproval ? "Đề xuất duyệt" : "Cập nhật"} bước {current}: {definition?.title}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-white/90 p-3 rounded-lg border border-teal-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Sản phẩm cần có</span>
              <span className="font-medium text-slate-700">{definition?.output}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Thời hạn pháp lý</span>
              <span className="font-medium text-slate-700">
                {definition?.legalDays ? `${definition.legalDays} ngày ${definition.mandatory ? "(bắt buộc)" : ""}` : "Không quy định"}
              </span>
            </div>
            {definition?.forms && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Biểu mẫu bắt buộc</span>
                <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                  {definition.forms}
                </span>
              </div>
            )}
          </div>

          {household.rejection && (
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
              <ExclamationCircleFilled className="mt-0.5 text-rose-500 text-sm shrink-0" />
              <div>
                <strong className="block font-semibold">Lần trước bị trả lại:</strong>
                <span className="mt-0.5 block">{household.rejection.reason}</span>
              </div>
            </div>
          )}

          {needsApproval && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800 border border-violet-100">
              <InfoCircleOutlined className="mt-0.5 shrink-0" />
              <span>Bước quan trọng: Đề xuất sẽ được gửi Giám đốc / Phó Giám đốc phê duyệt.</span>
            </div>
          )}

          {errorText && (
            <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              <ExclamationCircleFilled className="mt-0.5 text-rose-500 shrink-0" />
              <span><strong>Chưa thể lưu:</strong> {errorText}</span>
            </div>
          )}

          <Form<FormValues>
            form={form}
            layout="vertical"
            initialValues={{ completedAt: todayIso() }}
            onFinish={handleFinish}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5">
              <Form.Item
                name="documentNo"
                label={<span className="text-xs font-semibold text-slate-700">Số văn bản / biên bản <span className="text-rose-500">*</span></span>}
                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập số văn bản." }]}
                className="mb-3"
              >
                <Input placeholder="Ví dụ: 125/BB-BT" className="h-9 text-xs" />
              </Form.Item>
              <Form.Item
                name="completedAt"
                label={<span className="text-xs font-semibold text-slate-700">Ngày thực hiện <span className="text-rose-500">*</span></span>}
                rules={[{ required: true, message: "Vui lòng chọn ngày." }]}
                className="mb-3"
              >
                <Input type="date" max={todayIso()} className="h-9 text-xs" />
              </Form.Item>
            </div>

            <Form.Item
              name="fileName"
              label={
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <PaperClipOutlined className="text-slate-400" />
                  File biểu mẫu {definition?.forms ? `(${definition.forms})` : "(tùy chọn)"}
                  {definition?.forms && <span className="text-rose-500">*</span>}
                </span>
              }
              rules={definition?.forms ? [{ required: true, message: "Bước này bắt buộc đính kèm biểu mẫu." }] : []}
              className="mb-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-[#007A78] text-xs font-medium text-slate-700 transition-colors shadow-2xs">
                  <UploadOutlined className="text-teal-700 text-sm" />
                  <span>Chọn tệp đính kèm</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const name = file?.name ?? "";
                      form.setFieldsValue({ fileName: name });
                      setSelectedFileName(name);
                    }}
                  />
                </label>

                {selectedFileName ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium">
                    <FileTextOutlined className="text-teal-600" />
                    <span className="truncate max-w-[240px]">{selectedFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        form.setFieldsValue({ fileName: "" });
                        setSelectedFileName("");
                      }}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer font-bold"
                      title="Xóa tệp"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[11.5px] text-slate-400">
                    Chấp nhận PDF, DOC, DOCX, PNG, JPG
                  </span>
                )}
              </div>
            </Form.Item>

            <Form.Item
              name="note"
              label={<span className="text-xs font-semibold text-slate-700">Ghi chú (nếu có)</span>}
              className="mb-3.5"
            >
              <Input.TextArea
                rows={2}
                placeholder="Ví dụ: Hộ dân đồng ý ký biên bản, có mặt đại diện khu phố..."
                className="resize-none text-xs"
              />
            </Form.Item>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                scale="sm"
                htmlType="submit"
                loading={submitting}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs font-semibold h-8 px-5 rounded-lg shadow-xs"
              >
                {needsApproval ? "Gửi đề xuất duyệt" : `Hoàn thành bước ${current}`}
              </Button>
              <Button
                scale="sm"
                intent="secondary"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-4 text-xs font-medium rounded-lg"
              >
                Đóng
              </Button>
            </div>
          </Form>
        </section>
      )}

      {/* 3. Lịch sử các bước đã thực hiện (giống hệt xem chi tiết) */}
      <div className="mt-5 border-t border-slate-200 pt-4">
        <Text className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Lịch sử các bước đã hoàn thành ({household.records.length}/16)
        </Text>
        {household.records.length === 0 ? (
          <Text className="text-xs text-slate-400 italic">Chưa hoàn thành bước nào.</Text>
        ) : (
          <ol className="m-0 list-none space-y-2.5 p-0">
            {household.records.map((record) => {
              const stepDef = GPMB_STEPS[record.step - 1];
              return (
                <li key={record.step} className="flex items-start gap-2.5 text-xs">
                  <CheckCircleFilled className="mt-0.5 text-emerald-600 text-sm shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Bước {record.step}: {stepDef?.title}
                    </span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {formatDateVi(record.completedAt)} · Số văn bản: {record.documentNo}
                      {record.by && ` · Thực hiện: ${record.by}`}
                      {record.approvedBy && ` · Duyệt: ${record.approvedBy}`}
                      {record.fileName && (
                        <span className="ml-1 text-teal-700 font-medium">
                          <PaperClipOutlined /> {record.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Drawer>
  );
}
