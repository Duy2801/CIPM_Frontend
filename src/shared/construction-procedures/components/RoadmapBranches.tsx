"use client";

import { useEffect, useRef, useState } from "react";
import { BRANCH_COLOR, SPINE_X } from "../constants/roadmap-layout";
import type { ProcedureStep } from "../types/procedure.types";
import { getSiblingSteps } from "../utils/step-dependencies";
import RoadmapStepFlow, { type ChangeStagesHandler, type RoadmapStepView } from "./RoadmapStepFlow";

function BranchBlock({
  steps,
  branch,
  onChangeStages,
  collapsed,
  onToggleBranch,
  stepView,
}: {
  steps: ProcedureStep[];
  branch: ProcedureStep;
  onChangeStages?: ChangeStagesHandler;
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
  stepView?: RoadmapStepView;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ cx: number; rise: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const measure = () => {
      const card = host.parentElement?.querySelector(`[data-roadmap-card="${branch.id}"]`);
      if (!card) return;
      const c = card.getBoundingClientRect();
      const next = {
        cx: Math.round(c.left + c.width / 2 - host.getBoundingClientRect().left),
        rise: Math.round(el.getBoundingClientRect().top - c.bottom),
      };
      setAnchor((prev) => (prev && prev.cx === next.cx && prev.rise === next.rise ? prev : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    if (host.parentElement) observer.observe(host.parentElement);
    return () => observer.disconnect();
  }, [branch.id]);

  const left = anchor ? anchor.cx + SPINE_X * -1 - 1 : 0;
  return (
    <div ref={ref} className="relative mt-3" style={{ marginLeft: left, visibility: anchor ? "visible" : "hidden" }}>
      {anchor && (
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
          <path
            d={`M ${SPINE_X + 1} ${-anchor.rise} L ${SPINE_X + 1} 1`}
            stroke={BRANCH_COLOR}
            strokeWidth={1.75}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="w-max rounded-xl border border-sky-100 bg-sky-50/30">
        <RoadmapStepFlow
          steps={steps}
          parent={branch}
          onChangeStages={onChangeStages}
          entryColor={BRANCH_COLOR}
          collapsed={collapsed}
          onToggleBranch={onToggleBranch}
          stepView={stepView}
        />
      </div>
      <RoadmapBranches
        steps={steps}
        parent={branch}
        onChangeStages={onChangeStages}
        collapsed={collapsed}
        onToggleBranch={onToggleBranch}
        stepView={stepView}
      />
    </div>
  );
}

export default function RoadmapBranches({
  steps,
  parent,
  onChangeStages,
  collapsed,
  onToggleBranch,
  stepView,
}: {
  steps: ProcedureStep[];
  parent: ProcedureStep;
  onChangeStages?: ChangeStagesHandler;
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
  stepView?: RoadmapStepView;
}) {
  const branches = getSiblingSteps(steps, parent.code).filter(
    (c) => !collapsed.has(c.code) && getSiblingSteps(steps, c.code).length > 0,
  );
  if (branches.length === 0) return null;
  return (
    <div>
      {branches.map((b) => (
        <BranchBlock
          key={b.id}
          steps={steps}
          branch={b}
          onChangeStages={onChangeStages}
          collapsed={collapsed}
          onToggleBranch={onToggleBranch}
          stepView={stepView}
        />
      ))}
    </div>
  );
}
