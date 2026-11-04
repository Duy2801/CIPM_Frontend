"use client";

import { useMemo, useState } from "react";
import { FlagFilled, TrophyFilled } from "@ant-design/icons";
import { Select } from "@/components/ui";
import { EDGE_SCROLL_ZONE } from "../constants/roadmap-layout";
import { useStickyScrollbar } from "../hooks/useStickyScrollbar";
import type { ProcedureStep } from "../types/procedure.types";
import { getSiblingSteps, getStageColumns, moveStepToStage } from "../utils/step-dependencies";
import { getSpanDays } from "../utils/procedure-progress";
import RoadmapBranches from "./RoadmapBranches";
import RoadmapStepFlow, { type ChangeStagesHandler, type RoadmapStepView } from "./RoadmapStepFlow";

interface ProcedureRoadmapProps {
  steps: ProcedureStep[];
  stickyBottom?: number;
  onChangeStages?: ChangeStagesHandler;
  stepView?: RoadmapStepView;
}

const SEQUENTIAL = "__sequential__";

const GROUP_TONES = [
  { node: "border-violet-500 text-violet-600", pill: "bg-violet-50 ring-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  { node: "border-sky-500 text-sky-600", pill: "bg-sky-50 ring-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  { node: "border-emerald-500 text-emerald-600", pill: "bg-emerald-50 ring-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { node: "border-amber-500 text-amber-600", pill: "bg-amber-50 ring-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { node: "border-fuchsia-500 text-fuchsia-600", pill: "bg-fuchsia-50 ring-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
];

export default function ProcedureRoadmap({ steps, stickyBottom = 0, onChangeStages, stepView }: ProcedureRoadmapProps) {
  const mainStages = useMemo(() => getStageColumns(getSiblingSteps(steps, null)), [steps]);

  const { bodyRef, barRef, scrollWidth, syncFromBody, syncFromBar } = useStickyScrollbar(mainStages.length);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggleBranch = (code: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  if (mainStages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs italic text-slate-400">
        Quy trình chưa có bước nào để vẽ sơ đồ.
      </div>
    );
  }

  const mains = mainStages.flat();
  const ordered = getSiblingSteps(steps, null);
  const stageOf = (id: string) => mainStages.findIndex((col) => col.some((m) => m.id === id));
  const parallelStages = mainStages.map((col, si) => (col.length > 1 ? si : -1)).filter((si) => si >= 0);
  const toneOf = (si: number) => {
    const g = parallelStages.indexOf(si);
    return g >= 0 ? GROUP_TONES[g % GROUP_TONES.length] : null;
  };

  const setOrder = (step: ProcedureStep, si: number, value: string) => {
    if (value === SEQUENTIAL) {
      if (mainStages[si].length > 1) {
        // Giữ đúng thứ tự giai đoạn: bước đứng đầu nhóm song song tách ra phía trước, còn lại tách ra phía sau
        const insertAt = mainStages[si][0].id === step.id ? si : si + 1;
        onChangeStages?.(
          moveStepToStage(mains, step.id, { insertAt }),
          `Giai đoạn ${step.code} làm lần lượt, không song song với giai đoạn khác.`,
          { stepId: step.id, drop: { insertAt } },
        );
      }
      return;
    }
    const target = stageOf(value);
    if (target >= 0 && target !== si)
      onChangeStages?.(
        moveStepToStage(mains, step.id, { target }),
        `Giai đoạn ${step.code} làm song song với giai đoạn ${mainStages[target].map((m) => m.code).join(", ")}.`,
        { stepId: step.id, drop: { parallelWith: mainStages[target][0].id } },
      );
  };

  const phase = (s: ProcedureStep) => {
    const si = stageOf(s.id);
    const partners = mainStages[si].filter((m) => m.id !== s.id);
    const tone = toneOf(si);
    return (
      <div key={s.id} className="relative flex gap-4 pb-7">
        <span className="absolute bottom-0 left-[17px] top-5 w-0.5 bg-slate-200" />
        <div className="relative z-10 flex w-9 shrink-0 justify-center pt-0.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white font-mono text-[12px] font-bold ring-4 ring-white ${
              tone ? tone.node : "border-[#DC2626] text-[#DC2626]"
            }`}
          >
            {s.code}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
            <span className="text-[14.5px] font-semibold text-slate-900">{s.name}</span>
            <span
              className="rounded-full bg-red-50 px-2 py-0.5 text-[11.5px] font-semibold text-[#DC2626] ring-1 ring-red-100"
              title="Tổng số ngày hoàn thành giai đoạn: các bước làm lần lượt cộng lại, bước song song lấy bước lâu nhất"
            >
              {getSpanDays(steps, s)} ngày
            </span>
            {mains.length > 1 &&
              (onChangeStages ? (
                <span className={`inline-flex items-center rounded-full pl-2.5 ring-1 ${tone ? tone.pill : "bg-slate-50 ring-slate-200"}`}>
                  {tone && <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />}
                  <Select
                    size="small"
                    variant="borderless"
                    value={partners[0]?.id ?? SEQUENTIAL}
                    onChange={(v) => setOrder(s, si, v as string)}
                    options={[
                      { value: SEQUENTIAL, label: "Làm lần lượt" },
                      ...ordered
                        .filter((m) => m.id !== s.id)
                        .map((m) => ({ value: m.id, label: `Song song với ${m.code}`, title: m.name })),
                    ]}
                    labelRender={() => (
                      <span className={`text-[11.5px] font-medium ${tone ? tone.text : "text-slate-600"}`}>
                        {partners.length ? `Song song với ${partners.map((m) => m.code).join(", ")}` : "Làm lần lượt"}
                      </span>
                    )}
                    popupMatchSelectWidth={false}
                  />
                </span>
              ) : (
                tone && (
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1 ${tone.pill} ${tone.text}`}>
                    Song song với {partners.map((m) => m.code).join(", ")}
                  </span>
                )
              ))}
          </div>
          <div className="mt-2 w-max min-w-full rounded-xl border border-slate-100 bg-slate-50/60">
            <RoadmapStepFlow
              steps={steps}
              parent={s}
              onChangeStages={onChangeStages}
              collapsed={collapsed}
              onToggleBranch={toggleBranch}
              stepView={stepView}
            />
          </div>
          <RoadmapBranches
            steps={steps}
            parent={s}
            onChangeStages={onChangeStages}
            collapsed={collapsed}
            onToggleBranch={toggleBranch}
            stepView={stepView}
          />
        </div>
      </div>
    );
  };

  const capNode = (icon: React.ReactNode, label: string, last = false) => (
    <div className={`relative flex gap-4 ${last ? "pb-3" : "pb-6"}`}>
      {!last && <span className="absolute bottom-0 left-[17px] top-4 w-0.5 bg-slate-200" />}
      <div className="relative z-10 flex w-9 shrink-0 justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white ring-4 ring-white">
          {icon}
        </span>
      </div>
      <span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white">
      <div
        ref={bodyRef}
        onScroll={syncFromBody}
        onDragOver={(e) => {
          const body = bodyRef.current;
          if (!body) return;
          const rect = body.getBoundingClientRect();
          const fromLeft = e.clientX - rect.left;
          const fromRight = rect.right - e.clientX;
          if (fromLeft < EDGE_SCROLL_ZONE) body.scrollLeft -= Math.ceil(((EDGE_SCROLL_ZONE - fromLeft) / EDGE_SCROLL_ZONE) * 28);
          else if (fromRight < EDGE_SCROLL_ZONE) body.scrollLeft += Math.ceil(((EDGE_SCROLL_ZONE - fromRight) / EDGE_SCROLL_ZONE) * 28);
        }}
        className="overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="relative w-max min-w-full px-5 pb-2 pt-5">
          {capNode(<FlagFilled />, "Bắt đầu")}
          {ordered.map(phase)}
          {capNode(<TrophyFilled />, "Hoàn thành", true)}
        </div>
      </div>
      <div
        ref={barRef}
        onScroll={syncFromBar}
        className="sticky z-10 overflow-x-scroll overflow-y-hidden rounded-b-lg border-t border-slate-200 bg-white"
        style={{ bottom: stickyBottom }}
      >
        <div style={{ width: scrollWidth, height: 1 }} />
      </div>
    </div>
  );
}
