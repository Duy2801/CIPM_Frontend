"use client";

import { useMemo } from "react";
import { WarningFilled } from "@ant-design/icons";
import { Card, Tooltip } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import { getStepAlertLevel } from "../utils/procedure-rules";

interface ProcedureStageProgressChartProps {
  steps: ProcedureStep[];
}

type ProgressState = "COMPLETED" | "SKIPPED" | "IN_PROGRESS" | "OVERDUE" | "NOT_STARTED";

/** Thứ tự đoạn trên thanh: đã xong → bỏ qua → đang làm → quá hạn; phần còn lại (chưa bắt đầu) là rãnh xám */
const STATE_META: Record<ProgressState, { label: string; color: string }> = {
  COMPLETED: { label: "Hoàn thành", color: "#16a34a" },
  SKIPPED: { label: "Bỏ qua", color: "#94a3b8" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "#2563eb" },
  OVERDUE: { label: "Quá hạn", color: "#dc2626" },
  NOT_STARTED: { label: "Chưa bắt đầu", color: "#e2e8f0" },
};
const SEGMENT_ORDER: ProgressState[] = ["COMPLETED", "SKIPPED", "IN_PROGRESS", "OVERDUE"];

function getProgressState(step: ProcedureStep): ProgressState {
  if (step.status === "COMPLETED") return "COMPLETED";
  if (step.status === "SKIPPED") return "SKIPPED";
  if (getStepAlertLevel(step) === "DANGER_RED") return "OVERDUE";
  if (step.status === "IN_PROGRESS") return "IN_PROGRESS";
  return "NOT_STARTED";
}

/** "2026-10-22" → "22/10/2026" */
const formatShortDate = (iso?: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

/** Biểu đồ tiến độ theo giai đoạn (I, II...): mỗi giai đoạn một thanh, chia theo trạng thái các bước bên trong */
export default function ProcedureStageProgressChart({ steps }: ProcedureStageProgressChartProps) {
  const stages = useMemo(() => {
    const groupCodes = Array.from(new Set(steps.map((s) => s.groupCode || "CHUNG")));
    return groupCodes
      .map((code) => {
        const inGroup = steps.filter((s) => (s.groupCode || "CHUNG") === code && s.isEnabled);
        // Mục lớn chỉ là tiêu mục: có bước con thì chỉ đếm bước con; chưa có bước con thì đếm chính mục đó
        const hasChildren = inGroup.some((s) => s.code.includes("."));
        const work = hasChildren ? inGroup.filter((s) => s.code.includes(".")) : inGroup;

        const counts: Record<ProgressState, number> = {
          COMPLETED: 0,
          SKIPPED: 0,
          IN_PROGRESS: 0,
          OVERDUE: 0,
          NOT_STARTED: 0,
        };
        work.forEach((s) => {
          counts[getProgressState(s)] += 1;
        });

        const starts = work.map((s) => s.startDatePlanned).filter(Boolean).sort() as string[];
        const ends = work.map((s) => s.endDatePlanned).filter(Boolean).sort() as string[];
        const total = work.length;
        const done = counts.COMPLETED + counts.SKIPPED;

        return {
          code,
          title:
            steps.find((s) => (s.groupCode || "CHUNG") === code)?.groupTitle || `Giai đoạn ${code}`,
          total,
          done,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          counts,
          start: starts[0],
          end: ends[ends.length - 1],
        };
      })
      .filter((stage) => stage.total > 0);
  }, [steps]);

  const overall = stages.reduce(
    (acc, s) => ({ total: acc.total + s.total, done: acc.done + s.done, overdue: acc.overdue + s.counts.OVERDUE }),
    { total: 0, done: 0, overdue: 0 },
  );
  const overallPercent = overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0;

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200 bg-white shadow-2xs"
    >
      {/* Tổng quan + chú giải */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div>
          <h3 className="m-0 text-sm font-bold text-slate-900">Tiến độ theo giai đoạn</h3>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            Đã xử lý <strong className="text-slate-900">{overall.done}</strong>/{overall.total} bước ·{" "}
            <strong className="text-slate-900">{overallPercent}%</strong>
            {overall.overdue > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-1 font-semibold text-red-700">
                · <WarningFilled className="text-[11px]" /> {overall.overdue} bước quá hạn
              </span>
            )}
          </p>
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-3.5 gap-y-1 p-0 text-[11px] text-slate-600">
          {[...SEGMENT_ORDER, "NOT_STARTED" as const].map((state) => (
            <li key={state} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: STATE_META[state].color }}
                aria-hidden
              />
              {STATE_META[state].label}
            </li>
          ))}
        </ul>
      </div>

      {/* Mỗi giai đoạn một dòng */}
      <ol className="m-0 list-none divide-y divide-slate-100 p-0">
        {stages.map((stage) => (
          <li
            key={stage.code}
            className="grid grid-cols-1 items-center gap-2 px-4 py-3 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)_120px] md:gap-5"
          >
            {/* Giai đoạn */}
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded px-1 font-mono text-[11px] font-bold ${
                  stage.done === stage.total
                    ? "bg-green-600 text-white"
                    : "border border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                {stage.code}
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900" title={stage.title}>
                  {stage.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  {stage.start || stage.end
                    ? `${formatShortDate(stage.start) || "—"} → ${formatShortDate(stage.end) || "—"}`
                    : "Chưa có kế hoạch ngày"}
                </div>
              </div>
            </div>

            {/* Thanh tiến độ: đoạn màu theo trạng thái, cách nhau 2px; phần còn lại là chưa bắt đầu */}
            <div
              className="flex h-3 w-full gap-0.5 overflow-hidden rounded bg-slate-100"
              role="img"
              aria-label={`Giai đoạn ${stage.code}: ${SEGMENT_ORDER.map(
                (st) => `${STATE_META[st].label} ${stage.counts[st]}`,
              ).join(", ")}, Chưa bắt đầu ${stage.counts.NOT_STARTED}`}
            >
              {SEGMENT_ORDER.map((state) =>
                stage.counts[state] > 0 ? (
                  <Tooltip key={state} title={`${STATE_META[state].label}: ${stage.counts[state]} bước`}>
                    <div
                      className="h-full min-w-1.5"
                      style={{
                        width: `${(stage.counts[state] / stage.total) * 100}%`,
                        backgroundColor: STATE_META[state].color,
                      }}
                    />
                  </Tooltip>
                ) : null,
              )}
              {stage.counts.NOT_STARTED > 0 && (
                <Tooltip title={`Chưa bắt đầu: ${stage.counts.NOT_STARTED} bước`}>
                  <div className="h-full flex-1" />
                </Tooltip>
              )}
            </div>

            {/* Số liệu */}
            <div className="flex items-center justify-between gap-2 text-xs md:justify-end">
              {stage.counts.OVERDUE > 0 && (
                <Tooltip title={`${stage.counts.OVERDUE} bước quá hạn kế hoạch`}>
                  <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-px text-[11px] font-semibold text-red-700">
                    <WarningFilled className="text-[10px]" />
                    {stage.counts.OVERDUE}
                  </span>
                </Tooltip>
              )}
              <span className="tabular-nums text-slate-500">
                <strong className="text-slate-900">{stage.done}</strong>/{stage.total}
              </span>
              <span className="w-10 text-right font-bold tabular-nums text-slate-900">{stage.percent}%</span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
