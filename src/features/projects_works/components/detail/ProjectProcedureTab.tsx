"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import ProcedureRoadmap from "@/features/construction-procedures/components/ProcedureRoadmap";
import type { ProcedureStep } from "@/features/construction-procedures/types/procedure.types";
import { isHeadingStep } from "@/features/construction-procedures/utils/procedure-rules";
import { cn } from "@/utils/cn";
import { STEP_FLOW_META, STEP_FLOW_TONE } from "../../constants/procedure-step-status";
import { sameDepartmentKey, type ProjectProcedureController } from "../../hooks/useProjectProcedure";
import { getStepFlow, type StepFlowKey } from "../../utils/project-procedure-flow";
import ProcedureStepFlowDrawer from "./ProcedureStepFlowDrawer";

const LEGEND: StepFlowKey[] = ["UNASSIGNED", "IN_PROGRESS", "AWAITING_APPROVAL", "RETURNED", "COMPLETED"];

/** Thẻ bước rộng hơn sơ đồ bên Quy trình để hiện đủ tên, trạng thái và người thực hiện */
const CARD_WIDTH = 360;
const CARD_HEIGHT = 128;

interface ProjectProcedureTabProps {
  department: string;
  controller: ProjectProcedureController;
}

/** Tab của một quy trình trong dự án: sơ đồ các bước, bấm thẻ để xem chi tiết bước */
export default function ProjectProcedureTab({ department, controller }: ProjectProcedureTabProps) {
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const { data, departmentStatus } = controller;

  const steps = data.steps.filter((s) => s.department && sameDepartmentKey(s.department, department));
  const openStep = steps.find((s) => s.id === openStepId) ?? null;

  /** Bước có bước con (mục lớn): số bước con đã xong */
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
      <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              {departmentStatus(department)?.procedureName ?? "Quy trình"}
            </div>
            <div className="text-xs text-slate-500">{department}</div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            {LEGEND.map((flow) => (
              <span key={flow} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", STEP_FLOW_TONE[flow].dot)} />
                {STEP_FLOW_META[flow].label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {steps.length === 0 ? (
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
            tone: (step) => (isHeadingStep(step, steps) ? undefined : STEP_FLOW_TONE[getStepFlow(step)].card),
            badge: (step) => {
              if (isHeadingStep(step, steps)) return headingBadge(step);
              const flow = getStepFlow(step);
              return (
                <div className="flex flex-col gap-0.5">
                  <span className={cn("inline-flex items-center gap-1.5 font-medium", STEP_FLOW_TONE[flow].text)}>
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STEP_FLOW_TONE[flow].dot)} />
                    {STEP_FLOW_META[flow].label}
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
