"use client";

import React from "react";
import {
  AlertFilled,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  ClockCircleOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LockOutlined,
  PaperClipOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Tag, Text, Tooltip } from "@/components/ui";
import {
  calculateDaysRemaining,
  getStepAlertLevel,
  getStepSequenceValidation,
} from "../utils/procedure-rules";
import type { ProcedureStep } from "../types/procedure.types";

interface ProcedureStepDetailDrawerProps {
  step: ProcedureStep | null;
  allSteps: ProcedureStep[];
  projectName: string;
  open: boolean;
  onClose: () => void;
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  onOpenDocsModal: (step: ProcedureStep) => void;
  canUpdateProcedure?: boolean;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "—";
}

export default function ProcedureStepDetailDrawer({
  step,
  allSteps,
  projectName,
  open,
  onClose,
  onStartStep,
  onOpenCompleteModal,
  onOpenSkipModal,
  onOpenDocsModal,
  canUpdateProcedure = true,
}: ProcedureStepDetailDrawerProps) {
  if (!step) return null;

  const alertLevel = getStepAlertLevel(step);
  const daysRemaining = calculateDaysRemaining(step.endDatePlanned);
  const sequence = getStepSequenceValidation(step.id, allSteps);

  const isCompleted = step.status === "COMPLETED";
  const isSkipped = step.status === "SKIPPED";
  const isInProgress = step.status === "IN_PROGRESS";
  const isNotStarted = step.status === "NOT_STARTED";
  const isDisabled = !step.isEnabled;

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

  const facts = [
    { label: "Dự án áp dụng", value: projectName, wide: true },
    { label: "Nhóm giai đoạn", value: `${step.groupCode}. ${step.groupTitle}`, wide: true },
    { label: "Mã bước", value: `Bước ${step.code}` },
    { label: "Phân loại", value: step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện" },
    { label: "Đơn vị phụ trách", value: step.responsibleUnit },
    { label: "Biên độ thời gian", value: step.durationMargin },
    { label: "Thời gian kế hoạch", value: step.plannedDays ? `${step.plannedDays} ngày` : step.durationMargin },
    { label: "Bắt đầu kế hoạch", value: formatDate(step.startDatePlanned) },
    { label: "Hạn kế hoạch", value: formatDate(step.endDatePlanned) },
    { label: "Bắt đầu thực tế", value: formatDate(step.actualStartDate) },
    ...(step.actualEndDate ? [{ label: "Hoàn thành thực tế", value: formatDate(step.actualEndDate) }] : []),
    {
      label: "Hồ sơ pháp lý đính kèm",
      value: `${step.attachments.length} văn bản`,
    },
  ];

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-2.5 flex-wrap px-1 py-1">
          {canUpdateProcedure && (isNotStarted || isInProgress) && !isDisabled && sequence.canOperate && (
            <Button
              intent="outline"
              scale="sm"
              icon={<StopOutlined className="text-amber-600" />}
              className="!border-amber-300 !text-amber-800 hover:!bg-amber-50 hover:!border-amber-400 hover:!text-amber-900"
              onClick={() => {
                onClose();
                onOpenSkipModal(step);
              }}
            >
              Bỏ qua bước
            </Button>
          )}

          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#102A43]">Bước {step.code}</span>
            <Tag intent={step.type === "MANDATORY" ? "info" : "warning"} scale="md">
              {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
            </Tag>
            {renderStatusBadge()}
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            {step.name}
          </span>
        </span>
      }
    >
      {/* Banner cảnh báo tiến độ */}
      {alertLevel === "DANGER_RED" && (
        <aside className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-800">
          <AlertFilled className="shrink-0 text-rose-600" />
          <span>
            Bước này đã quá hạn {Math.abs(daysRemaining ?? 0)} ngày so với kế hoạch ban đầu (Hạn chót:{" "}
            {formatDate(step.endDatePlanned)}).
          </span>
        </aside>
      )}
      {alertLevel === "WARNING_YELLOW" && (
        <aside className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium text-amber-800">
          <ClockCircleFilled className="shrink-0 text-amber-600" />
          <span>
            Sắp đến hạn hoàn thành: Còn {daysRemaining} ngày (Hạn chót: {formatDate(step.endDatePlanned)}).
          </span>
        </aside>
      )}

      {/* Thông tin chính của bước thủ tục */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
            <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {/* Ràng buộc tuần tự & Khóa bước */}
      {!sequence.canOperate && sequence.blockingStep && (
        <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <Flex align="center" gap={6} className="mb-2">
            <LockOutlined className="text-rose-600" />
            <Text className="text-xs font-bold uppercase tracking-wide text-rose-800">
              Ràng buộc tuần tự – Chưa thể thực hiện
            </Text>
          </Flex>
          <p className="m-0 text-xs text-rose-800 leading-relaxed">
            {sequence.reasonMessage}
          </p>
          <div className="mt-2 pt-2 border-t border-rose-200/60 text-xs text-rose-900 font-medium">
            Bước đang chặn: <strong>[{sequence.blockingStep.code}] {sequence.blockingStep.name}</strong> (Trạng thái: {sequence.blockingStep.status === "NOT_STARTED" ? "Chưa bắt đầu" : "Đang thực hiện"})
          </div>
        </section>
      )}

      {/* Danh mục hồ sơ văn bản pháp lý */}
      <section className="mt-4 rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" className="mb-2.5">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Hồ sơ & Tài liệu pháp lý ({step.attachments.length})
          </Text>
          <Button
            intent="outline"
            scale="xs"
            icon={<PaperClipOutlined />}
            onClick={() => onOpenDocsModal(step)}
          >
            Xem & Tải hồ sơ
          </Button>
        </Flex>

        {step.attachments.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Chưa có văn bản pháp lý nào được đính kèm vào bước này (Yêu cầu ít nhất 1 văn bản để hoàn thành)
          </div>
        ) : (
          <div className="space-y-2">
            {step.attachments.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <FilePdfOutlined className="text-rose-500" />
                    <strong className="text-slate-900 font-mono text-xs">{doc.documentCode}</strong>
                    <span className="text-slate-700 font-medium truncate">{doc.title}</span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Cơ quan ban hành: <strong>{doc.issuer}</strong> · Ngày ban hành: {formatDate(doc.issueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Drawer>
  );
}
