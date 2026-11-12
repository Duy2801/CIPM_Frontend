"use client";

import { useState } from "react";
import { ApartmentOutlined, LockOutlined, TableOutlined, TeamOutlined } from "@ant-design/icons";
import type React from "react";
import { Card, Segmented } from "@/components/ui";
import ProcedureRoadmap from "@/features/construction-procedures/components/ProcedureRoadmap";
import type { ProcedureStep } from "@/features/construction-procedures/types/procedure.types";
import { isHeadingStep } from "@/features/construction-procedures/utils/procedure-rules";
import { reachedStepIds } from "@/features/my-tasks/utils/my-tasks";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { STEP_FLOW_META, STEP_FLOW_TONE } from "../../constants/procedure-step-status";
import type { ProjectProcedureController } from "../../hooks/useProjectProcedure";
import { sameDepartmentKey } from "../../utils/project-procedure-data";
import { getStepFlow } from "../../utils/project-procedure-flow";
import ProcedureStepFlowDrawer from "./ProcedureStepFlowDrawer";

const WAITING_TONE = { card: "border-slate-200 bg-slate-50/70", dot: "bg-slate-300", text: "text-slate-400" };

const CARD_WIDTH = 360;
const CARD_HEIGHT = 128;

interface ProjectProcedureTabProps {
  department: string;
  controller: ProjectProcedureController;
  households?: React.ReactNode;
  prices?: React.ReactNode;
}

export default function ProjectProcedureTab({ department, controller, households, prices }: ProjectProcedureTabProps) {
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [view, setView] = useState<"procedure" | "households" | "prices">("procedure");
  const { data, departmentStatus } = controller;

  const steps = data.steps.filter((s) => s.department && sameDepartmentKey(s.department, department));
  const openStep = steps.find((s) => s.id === openStepId) ?? null;

  const reached = reachedStepIds(steps);
  const displayOf = (step: ProcedureStep) => {
    const flow = getStepFlow(step);
    if ((flow === "IN_PROGRESS" || flow === "UNASSIGNED") && !reached.has(step.id)) {
      return { label: "Chưa tới lượt", tone: WAITING_TONE, locked: true };
    }
    return { label: STEP_FLOW_META[flow].label, tone: STEP_FLOW_TONE[flow], locked: false };
  };

  const workSteps = steps.filter((s) => !isHeadingStep(s, steps) && getStepFlow(s) !== "DISABLED");
  const doneCount = workSteps.filter((s) => ["COMPLETED", "SKIPPED"].includes(getStepFlow(s))).length;
  const percent = workSteps.length > 0 ? Math.round((doneCount / workSteps.length) * 100) : 0;

  const current = workSteps
    .filter((s) => reached.has(s.id) && !["COMPLETED", "SKIPPED"].includes(getStepFlow(s)))
    .sort((a, b) => a.order - b.order);
  const head = current[0];
  const starts = workSteps.map((s) => s.startDatePlanned).filter(Boolean).sort() as string[];
  const ends = workSteps.map((s) => s.endDatePlanned).filter(Boolean).sort() as string[];
  const planRange = starts.length && ends.length ? `${formatDateVi(starts[0])} – ${formatDateVi(ends[ends.length - 1])}` : "—";

  const facts: { label: string; value: React.ReactNode; title?: string }[] = [
    {
      label: "Bước đang thực hiện",
      title: head ? `${head.code} ${head.name}` : undefined,
      value: head ? (
        <>
              <span className="mr-1.5 font-mono text-[11px] text-[#DC2626]">{head.code}</span>
              {head.name}
              {current.length > 1 && <span className="ml-1.5 font-normal text-slate-400">+{current.length - 1} bước</span>}
            </>
          ) : doneCount === workSteps.length && workSteps.length > 0 ? (
            <span className="text-emerald-600">Đã hoàn thành tất cả</span>
          ) : (
            "—"
          ),
        },
        { label: "Người thực hiện", value: head?.assignedTo || "—" },
        { label: "Hạn bước hiện tại", value: head?.endDatePlanned ? formatDateVi(head.endDatePlanned) : "—" },
        { label: "Kế hoạch quy trình", value: planRange },
      ];

      const headingBadge = (step: ProcedureStep) => {
        const children = steps.filter((s) => s.code.startsWith(`${step.code}.`) && !isHeadingStep(s, steps));
        const done = children.filter((s) => ["COMPLETED", "SKIPPED"].includes(getStepFlow(s))).length;
        return (
          <span className="text-slate-500">
            {done}/{children.length} bước xong
          </span>
        );
      };

      return (
        <div className="flex flex-col gap-3">
          {households && (
            <Segmented<"procedure" | "households" | "prices">
              value={view}
              onChange={setView}
              className="self-start"
              options={[
                { value: "procedure", label: "Quy trình", icon: <ApartmentOutlined /> },
                { value: "households", label: "Hộ dân được bồi thường", icon: <TeamOutlined /> },
                ...(prices ? [{ value: "prices" as const, label: "Bảng giá bồi thường", icon: <TableOutlined /> }] : []),
              ]}
            />
          )}

          {view === "procedure" && (
            <>
          <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-6 px-5 pt-4 pb-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold text-slate-900">
                  {departmentStatus(department)?.procedureName ?? "Quy trình"}
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#DC2626] transition-all" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    <strong className="text-slate-800">{doneCount}</strong>/{workSteps.length} bước hoàn thành
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-3xl font-bold leading-none text-[#DC2626]">{percent}%</div>
            </div>

            <dl className="m-0 grid grid-cols-2 border-t border-slate-100 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              {facts.map((f, i) => (
                <div
                  key={f.label}
                  className={cn("min-w-0 px-5 py-3", i > 0 && "border-l border-slate-100", i === 2 && "max-lg:border-l-0 max-lg:border-t", i === 3 && "max-lg:border-t")}
                >
                  <dt className="text-[11px] text-slate-400">{f.label}</dt>
                  <dd className="m-0 mt-0.5 truncate text-xs font-semibold text-slate-800" title={f.title ?? (typeof f.value === "string" ? f.value : undefined)}>
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

        </>
      )}

      {view === "households" && households ? (
        households
      ) : view === "prices" && prices ? (
        prices
      ) : steps.length === 0 ? (
        <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
          <div className="p-8 text-center text-sm text-slate-500">Quy trình chưa có bước nào.</div>
        </Card>
      ) : (
        <ProcedureRoadmap
          steps={steps}
          stepView={{
            cardWidth: CARD_WIDTH,
            cardHeight: CARD_HEIGHT,
            large: true,
            onClick: (step) => !isHeadingStep(step, steps) && setOpenStepId(step.id),
            tone: (step) => (isHeadingStep(step, steps) ? undefined : displayOf(step).tone.card),
            badge: (step) => {
              if (isHeadingStep(step, steps)) return headingBadge(step);
              const { label, tone, locked } = displayOf(step);
              return (
                <div className="flex flex-col gap-0.5">
                  <span className={cn("inline-flex items-center gap-1.5 font-medium", tone.text)}>
                    {locked ? (
                      <LockOutlined className="text-[11px]" />
                    ) : (
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
                    )}
                    {label}
                  </span>
                  <span className="truncate text-slate-600" title={step.assignedTo}>
                    <span className="text-slate-400">Người thực hiện: </span>
                    {step.assignedTo || "Chưa phân công"}
                  </span>
                </div>
              );
            },
          }}
        />
      )}

      <ProcedureStepFlowDrawer step={openStep} controller={controller} onClose={() => setOpenStepId(null)} />
    </div>
  );
}
