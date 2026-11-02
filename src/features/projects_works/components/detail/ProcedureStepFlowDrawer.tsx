"use client";

import React from "react";
import { FileTextOutlined } from "@ant-design/icons";
import { Button, Drawer, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import { getDepartmentStaff } from "@/features/construction-procedures/constants/procedure-department-templates";
import type { ProcedureStep } from "@/features/construction-procedures/types/procedure.types";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { STEP_FLOW_META } from "../../constants/procedure-step-status";
import type { ProjectProcedureController } from "../../hooks/useProjectProcedure";
import { getStepFlow } from "../../utils/project-procedure-flow";

interface ProcedureStepFlowDrawerProps {
  step: ProcedureStep | null;
  controller: ProjectProcedureController;
  onClose: () => void;
}

/** Chi tiết một bước (chỉ xem): thông tin bước, người thực hiện, đã hoàn thành chưa, ghi chú và hồ sơ đã nộp */
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
      {step && <StepDetail key={step.id} step={step} controller={controller} onClose={onClose} />}
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

const date = (value?: string) => (value ? formatDateVi(value) : "—");

function StepDetail({
  step,
  controller,
  onClose,
}: {
  step: ProcedureStep;
  controller: ProjectProcedureController;
  onClose: () => void;
}) {
  const flow = getStepFlow(step);
  const lead = step.department ? controller.departmentLead(step.department) : undefined;
  const assignee = getDepartmentStaff().find(
    (s) => (step.assignedToId && s.id === step.assignedToId) || s.name === step.assignedTo,
  );
  const days = step.plannedDays ?? step.durationDaysMax ?? step.durationDaysMin;
  const done = flow === "COMPLETED" || flow === "SKIPPED";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <Section title="Thông tin bước">
          <Fact label="Giai đoạn" value={`${step.groupCode}. ${step.groupTitle}`} wide />
          <Fact label="Loại bước" value={step.type === "MANDATORY" ? "Bắt buộc" : "Nếu có"} />
          <Fact label="Thời gian thực hiện" value={days ? `${days} ngày` : step.durationMargin || "—"} />
        </Section>

        <Section title="Người thực hiện">
          <Fact label="Họ tên" value={step.assignedTo || "Chưa phân công"} />
          <Fact label="Chức danh" value={assignee?.title || "—"} />
          <Fact label="Email" value={assignee?.email || "—"} />
          <Fact label="Người duyệt (Tổ trưởng)" value={lead || "—"} />
        </Section>

        <Section title="Tình trạng">
          <Fact
            label="Hoàn thành"
            value={
              <span className={done ? "text-emerald-700" : "text-slate-600"}>
                {done ? "Đã hoàn thành" : "Chưa hoàn thành"}
              </span>
            }
          />
          <Fact label="Trạng thái" value={<FlowBadge step={step} />} />
          <Fact label="Bắt đầu thực tế" value={date(step.actualStartDate)} />
          <Fact
            label="Kết thúc thực tế"
            value={date(step.actualEndDate || (step.status === "COMPLETED" ? step.approvedAt : undefined))}
          />
          {step.submittedBy && <Fact label="Nộp kết quả" value={`${step.submittedBy} · ${date(step.submittedAt)}`} />}
          {step.approvedBy && <Fact label="Duyệt bởi" value={`${step.approvedBy} · ${date(step.approvedAt)}`} />}
        </Section>

        {flow === "RETURNED" && step.rejectionReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <strong className="mb-0.5 block">Bị từ chối, yêu cầu làm lại:</strong>
            {step.rejectionReason}
          </div>
        )}

        <section>
          <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">Ghi chú</h3>
          {step.notes || step.submissionNote ? (
            <div className="space-y-2 rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700">
              {step.notes && <p className="m-0 whitespace-pre-line">{step.notes}</p>}
              {step.submissionNote && (
                <p className="m-0">
                  <span className="font-semibold text-slate-500">Khi nộp ({step.submittedBy}): </span>
                  {step.submissionNote}
                </p>
              )}
            </div>
          ) : (
            <Empty>Chưa có ghi chú</Empty>
          )}
        </section>

        <section>
          <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Hồ sơ đính kèm{step.attachments.length > 0 && ` (${step.attachments.length})`}
          </h3>
          {step.attachments.length > 0 ? (
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
          ) : (
            <Empty>Chưa có hồ sơ đính kèm</Empty>
          )}
        </section>
      </div>

      <footer className="flex justify-end border-t border-slate-200 bg-white px-5 py-3">
        <Button scale="sm" onClick={onClose}>
          Đóng
        </Button>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
        {children}
      </dl>
    </section>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">{children}</div>
  );
}
