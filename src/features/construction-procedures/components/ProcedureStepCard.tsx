"use client";

import { useState } from "react";
import {
  AlertFilled,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ClockCircleOutlined,
  DownOutlined,
  FilePdfOutlined,
  LockOutlined,
  PaperClipOutlined,
  StopOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Tag, Text, Tooltip } from "@/components/ui";
import {
  calculateDaysRemaining,
  getStepAlertLevel,
  getStepSequenceValidation,
} from "../utils/procedure-rules";
import type { ProcedureStep } from "../types/procedure.types";

interface ProcedureStepCardProps {
  step: ProcedureStep;
  allSteps: ProcedureStep[];
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  onOpenDocsModal: (step: ProcedureStep) => void;
  onOpenDetail?: (step: ProcedureStep) => void;
  highlight?: boolean;
  canUpdateProcedure?: boolean;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa thiết lập";
}

export default function ProcedureStepCard({
  step,
  allSteps,
  onStartStep,
  onOpenCompleteModal,
  onOpenSkipModal,
  onOpenDocsModal,
  onOpenDetail,
  highlight = false,
  canUpdateProcedure = true,
}: ProcedureStepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const alertLevel = getStepAlertLevel(step);
  const daysRemaining = calculateDaysRemaining(step.endDatePlanned);
  const sequence = getStepSequenceValidation(step.id, allSteps);
  const detailsVisible = expanded || highlight;

  const isCompleted = step.status === "COMPLETED";
  const isSkipped = step.status === "SKIPPED";
  const isInProgress = step.status === "IN_PROGRESS";
  const isNotStarted = step.status === "NOT_STARTED";
  const isDisabled = !step.isEnabled;
  const documentsCount = step.attachments.length;

  const appearance = isDisabled
    ? "border-slate-200 bg-slate-50/60 opacity-60"
    : alertLevel === "DANGER_RED"
    ? "border-rose-200 border-l-4 border-l-rose-500 bg-white"
    : alertLevel === "WARNING_YELLOW"
    ? "border-amber-200 border-l-4 border-l-amber-500 bg-white"
    : isInProgress
    ? "border-slate-200 border-l-4 border-l-[#007A78] bg-white"
    : "border-slate-200 bg-white hover:border-slate-300";

  // Hiển thị trạng thái tinh gọn (tránh hiển thị 2 tag trùng lặp)
  const renderStatusBadge = () => {
    if (isDisabled) return <Tag intent="muted">Đã tắt</Tag>;
    if (isCompleted) return <Tag intent="success" icon={<CheckCircleFilled />}>Hoàn thành</Tag>;
    if (isSkipped) return <Tag intent="warning" icon={<StopOutlined />}>Đã bỏ qua</Tag>;
    if (isInProgress) return <Tag intent="info" icon={<ClockCircleFilled />}>Đang thực hiện</Tag>;
    if (!sequence.canOperate) {
      return (
        <Tooltip title={sequence.reasonMessage}>
          <Tag intent="default" icon={<LockOutlined />}>Bị khóa</Tag>
        </Tooltip>
      );
    }
    return <Tag intent="subtle">Chưa bắt đầu</Tag>;
  };

  return (
    <div
      className={`rounded-xl border p-3.5 transition-all shadow-2xs ${appearance} ${
        highlight ? "ring-2 ring-[#007A78] ring-offset-1" : ""
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* Hàng 1 (Top Bar): Mã bước + Loại bước bên trái | Trạng thái + Cảnh báo + Thao tác bên phải */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Cụm nhận diện bước riêng 1 hàng: Mã bước + Loại bước */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold font-mono border shrink-0 ${
                isCompleted
                  ? "bg-slate-100 border-slate-200 text-slate-700"
                  : isInProgress
                  ? "bg-teal-50 border-teal-200 text-[#007A78]"
                  : isSkipped
                  ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              {isCompleted && <CheckCircleFilled className="text-emerald-600 text-xs" />}
              {isSkipped && <StopOutlined className="text-slate-400 text-xs" />}
              Bước {step.code}
            </span>

            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium border shrink-0 ${
                step.type === "MANDATORY"
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : "bg-amber-50/70 border-amber-200 text-amber-700"
              }`}
            >
              {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
            </span>

            {alertLevel === "DANGER_RED" && (
              <Tag intent="danger" icon={<AlertFilled />}>
                Quá hạn {Math.abs(daysRemaining ?? 0)} ngày
              </Tag>
            )}
            {alertLevel === "WARNING_YELLOW" && (
              <Tag intent="warning" icon={<ClockCircleFilled />}>
                Còn {daysRemaining} ngày
              </Tag>
            )}
          </div>

          {/* Cụm trạng thái và nút thao tác */}
          <div className="flex items-center gap-2 shrink-0">
            {renderStatusBadge()}

            {canUpdateProcedure && (isNotStarted || isInProgress) && !isDisabled && sequence.canOperate && (
              <Button
                intent="outline"
                scale="compact"
                icon={<StopOutlined className="text-amber-600" />}
                className="!bg-white !border-slate-200 !text-slate-600 hover:!bg-slate-50 hover:!border-slate-300 hover:!text-slate-800 font-medium shadow-2xs transition-colors"
                onClick={() => onOpenSkipModal(step)}
              >
                Bỏ qua
              </Button>
            )}
          </div>
        </div>

        {/* Hàng 2: Tên bước riêng biệt toàn chiều rộng, thoáng đãng và nổi bật */}
        <div className="py-0.5">
          <button
            type="button"
            onClick={() => onOpenDetail?.(step)}
            className="text-left text-sm sm:text-base font-bold text-slate-900 leading-snug hover:text-[#007A78] hover:underline cursor-pointer block w-full"
          >
            {step.name}
          </button>
        </div>

        {/* Hàng 2: Thông tin chi tiết & Nút quản lý hồ sơ tích hợp cảnh báo */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-slate-600">
              <UserOutlined className="text-slate-400 text-[11px]" />
              <span>Đơn vị: <strong className="font-semibold text-slate-800">{step.responsibleUnit}</strong></span>
            </span>

            <span className="flex items-center gap-1.5 text-slate-600">
              <CalendarOutlined className="text-slate-400 text-[11px]" />
              <span>Biên độ: <strong className="font-semibold text-slate-700">{step.durationMargin}</strong></span>
            </span>

            {!isDisabled && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <ClockCircleOutlined className="text-slate-400 text-[11px]" />
                <span>
                  {isCompleted && step.actualEndDate ? (
                    <>Hoàn thành: <strong className="font-semibold text-slate-700">{formatDate(step.actualEndDate)}</strong></>
                  ) : (
                    <>Hạn kế hoạch: <strong className={`font-semibold ${alertLevel === "DANGER_RED" ? "text-rose-600" : alertLevel === "WARNING_YELLOW" ? "text-amber-600" : "text-slate-700"}`}>{formatDate(step.endDatePlanned)}</strong></>
                  )}
                </span>
              </span>
            )}
          </div>

          {/* Nút Hồ sơ đính kèm tích hợp chỉ báo cần văn bản gọn gàng */}
          <button
            type="button"
            onClick={() => onOpenDocsModal(step)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              documentsCount === 0 && !isDisabled && !isCompleted && !isSkipped
                ? "border-amber-200/90 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <PaperClipOutlined className="text-slate-400" />
            <span>Hồ sơ ({documentsCount})</span>
            {documentsCount === 0 && !isDisabled && !isCompleted && !isSkipped && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded">
                Cần ≥ 1 VB
              </span>
            )}
          </button>
        </div>

        {/* Căn cứ bỏ qua nếu bước bị bỏ qua */}
        {isSkipped && (
          <aside className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-950">
            <div className="flex items-center gap-1 font-bold text-amber-900 text-xs">
              <FilePdfOutlined /> Căn cứ bỏ qua: {step.skipDocumentCode || "Chưa có số văn bản"}
            </div>
            <div className="mt-1 text-[11px] italic text-amber-900/90 pl-3 border-l-2 border-amber-400">
              {step.skipReason}
            </div>
          </aside>
        )}

        {/* Khung mở rộng chi tiết khi bấm 'Chi tiết' */}
        {detailsVisible && !isDisabled && (
          <section className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5 text-xs md:grid-cols-4 mt-1">
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Bắt đầu KH</span>
              <span className="font-semibold text-slate-800">{formatDate(step.startDatePlanned)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Hạn kế hoạch</span>
              <span className="font-semibold text-slate-800">{formatDate(step.endDatePlanned)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Bắt đầu thực tế</span>
              <span className="font-semibold text-slate-800">{formatDate(step.actualStartDate)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400 font-semibold">Hoàn thành thực tế</span>
              <span className="font-semibold text-slate-800">
                {step.actualEndDate ? formatDate(step.actualEndDate) : isInProgress ? "Đang tiến hành" : "—"}
              </span>
            </div>
            {step.notes && (
              <div className="col-span-2 md:col-span-4 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 mt-1">
                <strong>Ghi chú:</strong> {step.notes}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
