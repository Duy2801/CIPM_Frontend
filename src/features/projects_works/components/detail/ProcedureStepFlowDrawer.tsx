"use client";

import React from "react";
import { FileTextOutlined } from "@ant-design/icons";
import { Drawer, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import { StepHeading } from "@/components/workspace";
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

export default function ProcedureStepFlowDrawer({ step, controller, onClose }: ProcedureStepFlowDrawerProps) {
  return (
    <Drawer
      showBack
      open={Boolean(step)}
      width={STANDARD_DRAWER_WIDTH}
      closable={false}
      onClose={onClose}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0"
      title={
        step && (
          <StepHeading code={step.code} name={step.name} />
        )
      }
    >
      {step && <StepDetail key={step.id} step={step} controller={controller} />}
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

const dateWithPlan = (actual?: string, planned?: string) =>
  actual ? (
    date(actual)
  ) : planned ? (
    <span>
      {date(planned)} <span className="font-normal text-slate-400">(dự kiến)</span>
    </span>
  ) : (
    "—"
  );

function StepDetail({
  step,
  controller,
}: {
  step: ProcedureStep;
  controller: ProjectProcedureController;
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
          <Fact label="Ngày bắt đầu" value={dateWithPlan(step.actualStartDate, step.startDatePlanned)} />
          <Fact
            label="Ngày kết thúc"
            value={dateWithPlan(
              step.actualEndDate || (step.status === "COMPLETED" ? step.approvedAt : undefined),
              step.endDatePlanned,
            )}
          />
          {step.submittedBy && <Fact label="Nộp kết quả" value={`${step.submittedBy} · ${date(step.submittedAt)}`} />}
          {step.approvedBy && step.status === "COMPLETED" && <Fact label="Duyệt bởi" value={`${step.approvedBy} · ${date(step.approvedAt)}`} />}
        </Section>

        {flow === "RETURNED" && step.rejectionReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <strong className="mb-0.5 block">Bị từ chối, yêu cầu làm lại:</strong>
            {step.rejectionReason}
          </div>
        )}

        <section>
          <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">Ghi chú</h3>
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
          <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
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

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">{title}</h3>
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
