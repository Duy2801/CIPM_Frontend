"use client";

import React, { useState } from "react";
import { App } from "antd";
import { CheckOutlined, CloseOutlined, FileTextOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Input,
  STANDARD_DRAWER_WIDTH,
  StandardFileUpload,
  type UploadedAttachment,
} from "@/components/ui";
import { ReasonModal } from "@/components/workspace";
import type { ProcedureDocument, ProcedureStep } from "@/features/construction-procedures/types/procedure.types";
import { getStepAlertLevel } from "@/features/construction-procedures/utils/procedure-rules";
import { cn } from "@/utils/cn";
import { STEP_FLOW_META } from "../../constants/procedure-step-status";
import type { ProjectProcedureController } from "../../hooks/useProjectProcedure";
import { getStepFlow } from "../../utils/project-procedure-flow";

interface ProcedureStepFlowDrawerProps {
  step: ProcedureStep | null;
  controller: ProjectProcedureController;
  onClose: () => void;
}

/** Chi tiết một bước: thông tin, hồ sơ đính kèm và thao tác theo vai trò (bắt đầu, nộp, duyệt / từ chối) */
export default function ProcedureStepFlowDrawer({ step, controller, onClose }: ProcedureStepFlowDrawerProps) {
  return (
    <Drawer
      open={Boolean(step)}
      width={STANDARD_DRAWER_WIDTH}
      closable={false}
      onClose={onClose}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0"
      title={
        step && (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{step.code}</span>
              <FlowBadge step={step} />
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{step.name}</div>
          </div>
        )
      }
    >
      {step && <StepFlowBody key={step.id} step={step} controller={controller} onClose={onClose} />}
    </Drawer>
  );
}

export function FlowBadge({ step }: { step: ProcedureStep }) {
  const meta = STEP_FLOW_META[getStepFlow(step)];
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function StepFlowBody({
  step,
  controller,
  onClose,
}: {
  step: ProcedureStep;
  controller: ProjectProcedureController;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const { departmentLead, canWorkOnStep, canApproveSteps, submitStep, approveStep, returnStep, actorName } =
    controller;
  const flow = getStepFlow(step);
  const lead = step.department ? departmentLead(step.department) : undefined;
  const alert = getStepAlertLevel(step);

  const [files, setFiles] = useState<UploadedAttachment[]>([]);
  const [note, setNote] = useState("");
  const [returning, setReturning] = useState(false);

  const canWork = canWorkOnStep(step);
  const canApprove = canApproveSteps(step.department);
  // Người thực hiện đang xử lý (hoặc bị từ chối) thì đính kèm hồ sơ và nộp ngay trong khung này
  const canSubmit = canWork && (flow === "IN_PROGRESS" || flow === "RETURNED");

  const handleSubmit = () => {
    // Quy tắc 10: bước bắt buộc phải có ít nhất 1 văn bản đính kèm khi nộp
    if (step.type === "MANDATORY" && step.attachments.length === 0 && files.length === 0) {
      message.warning("Bước bắt buộc phải đính kèm ít nhất 1 tệp hồ sơ trước khi nộp (Quy tắc 10).");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const documents = files.map<ProcedureDocument>((f) => ({
      id: f.id,
      documentCode: "",
      title: f.name,
      issuer: step.department ?? "",
      issueDate: today,
      fileName: f.name,
      fileSize: f.size,
      uploadedAt: today,
      uploadedBy: actorName,
    }));
    submitStep(step, { note: note.trim() || undefined, documents });
    message.success("Đã nộp kết quả, chờ Tổ trưởng duyệt.");
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Thông tin bước */}
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <Fact label="Giai đoạn" value={`${step.groupCode}. ${step.groupTitle}`} wide />
          <Fact label="Phòng ban" value={step.department || "—"} />
          <Fact label="Loại bước" value={step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"} />
          <Fact label="Người thực hiện" value={step.assignedTo || "Chưa giao"} />
          <Fact label="Người duyệt (Tổ trưởng)" value={lead || "—"} />
          <Fact label="Bắt đầu kế hoạch" value={<span className="font-mono">{step.startDatePlanned || "Chưa đặt"}</span>} />
          <Fact
            label="Hạn kế hoạch"
            value={
              <span
                className={cn(
                  "font-mono",
                  alert === "DANGER_RED" && "text-rose-600",
                  alert === "WARNING_YELLOW" && "text-amber-700",
                )}
              >
                {step.endDatePlanned || "Chưa đặt"}
                {alert === "DANGER_RED" && " (quá hạn)"}
              </span>
            }
          />
          <Fact label="Bắt đầu thực tế" value={<span className="font-mono">{step.actualStartDate || "—"}</span>} />
          <Fact
            label="Kết thúc thực tế"
            value={
              <span className="font-mono">
                {step.actualEndDate || (step.status === "COMPLETED" ? step.approvedAt : undefined) || "—"}
              </span>
            }
          />
        </dl>

        {flow === "RETURNED" && step.rejectionReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <strong className="mb-0.5 block">Tổ trưởng từ chối, yêu cầu làm lại:</strong>
            {step.rejectionReason}
          </div>
        )}

        {step.submissionNote && (flow === "AWAITING_APPROVAL" || flow === "COMPLETED") && (
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
            <strong className="mb-0.5 block text-slate-500">
              Ghi chú khi nộp ({step.submittedBy} · {step.submittedAt})
            </strong>
            {step.submissionNote}
          </div>
        )}

        {/* Tệp đã đính kèm */}
        {step.attachments.length > 0 && (
          <section>
            <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Hồ sơ đã nộp ({step.attachments.length})
            </h3>
            <div className="space-y-1.5">
              {step.attachments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-red-200 bg-red-50 text-[#DC2626]">
                    <FileTextOutlined />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-800" title={doc.fileName || doc.title}>
                      {doc.documentCode ? `${doc.documentCode} · ` : ""}
                      {doc.fileName || doc.title}
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      {[doc.fileSize !== "—" && doc.fileSize, doc.uploadedBy, doc.uploadedAt].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Đính kèm hồ sơ + ghi chú khi nộp kết quả */}
        {canSubmit && (
          <section className="space-y-3">
            <StandardFileUpload
              title={flow === "RETURNED" ? "Đính kèm hồ sơ nộp lại" : "Đính kèm hồ sơ kết quả"}
              subTitle={
                step.type === "MANDATORY" && step.attachments.length === 0
                  ? "Văn bản, biên bản, quyết định (PDF, DOCX, ảnh) · Bắt buộc ≥ 1 tệp"
                  : "Văn bản, biên bản, quyết định (PDF, DOCX, ảnh)"
              }
              required={step.type === "MANDATORY" && step.attachments.length === 0}
              value={files}
              onChange={setFiles}
            />
            <Input.TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú kết quả gửi Tổ trưởng (không bắt buộc)..."
              autoSize={{ minRows: 2, maxRows: 4 }}
              className="text-xs"
            />
          </section>
        )}

        {!canSubmit && step.attachments.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
            Chưa có hồ sơ đính kèm
          </div>
        )}
      </div>

      {/* Thao tác theo vai trò */}
      <footer className="flex flex-wrap items-center gap-2.5 border-t border-slate-200 bg-white px-5 py-3">
        {canSubmit && (
          <Button
            intent="primary"
            scale="sm"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]"
          >
            {flow === "RETURNED" ? "Nộp lại" : "Nộp kết quả"}
          </Button>
        )}
        {flow === "AWAITING_APPROVAL" && canApprove && (
          <>
            <Button
              intent="primary"
              scale="sm"
              icon={<CheckOutlined />}
              onClick={() => {
                approveStep(step);
                message.success("Đã duyệt hoàn thành bước.");
                onClose();
              }}
              className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
            >
              Duyệt
            </Button>
            <Button scale="sm" danger icon={<CloseOutlined />} onClick={() => setReturning(true)}>
              Từ chối
            </Button>
          </>
        )}
        {flow === "AWAITING_APPROVAL" && !canApprove && (
          <span className="text-xs text-slate-500">Đang chờ {lead || "Tổ trưởng"} duyệt.</span>
        )}
        <Button scale="sm" onClick={onClose} className="ml-auto">
          Đóng
        </Button>
      </footer>

      <RejectStepModal
        step={returning ? step : null}
        onClose={() => setReturning(false)}
        onConfirm={(reason) => {
          returnStep(step, reason);
          message.warning("Đã từ chối, chuyển lại cho người thực hiện.");
          setReturning(false);
          onClose();
        }}
      />
    </div>
  );
}

/** Hộp nhập lý do từ chối kết quả bước (dùng trong khung chi tiết và ngay trên bảng) */
export function RejectStepModal({
  step,
  onClose,
  onConfirm,
}: {
  step: ProcedureStep | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  return (
    <ReasonModal
      open={Boolean(step)}
      title="Từ chối kết quả bước"
      summary={
        step && (
          <span>
            Bước <strong>{step.code}</strong> · {step.assignedTo || "người thực hiện"} sẽ phải làm lại và nộp lại.
          </span>
        )
      }
      label="Lý do từ chối"
      presetReasons={["Thiếu hồ sơ, văn bản kèm theo", "Nội dung chưa đạt yêu cầu", "Sai số liệu, cần điều chỉnh"]}
      confirmText="Từ chối"
      onClose={onClose}
      onConfirm={async (reason) => {
        onConfirm(reason);
        return true;
      }}
    />
  );
}

function Fact({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="m-0 mt-0.5 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
