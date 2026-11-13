"use client";

import { cn } from "@/utils/cn";
import type { CategorySummary } from "../../../utils/project-disbursement";
import { money } from "./disbursement-format";

const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const OTHER_COLOR = "#94a3b8";
const TRACK_COLOR = "#f1f5f9";

const SIZE = 240;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const HALF = Math.PI * RADIUS;
const GAP = 3;
const GAUGE_HEIGHT = SIZE / 2 + STROKE / 2;

const colorAt = (index: number) => SERIES_COLORS[index] ?? OTHER_COLOR;
const formatPct = (value: number) => `${value.toFixed(1)}%`;

interface DisbursementOverviewProps {
  title: string;
  totalInvestment: number;
  disbursed: number;
  count: number;
  categories: CategorySummary[];
  onSelect: (category: string) => void;
}

export default function DisbursementOverview({
  title,
  totalInvestment,
  disbursed,
  count,
  categories,
  onSelect,
}: DisbursementOverviewProps) {
  const items = categories.map((c, index) => ({
    key: c.category,
    value: Math.max(0, c.total),
    total: c.total,
    color: colorAt(index),
  }));
  const sum = items.reduce((acc, s) => acc + s.value, 0);
  const base = Math.max(totalInvestment, sum);
  const pctOf = (value: number) => (base > 0 ? (value / base) * 100 : 0);
  const rate = pctOf(sum);
  const remaining = totalInvestment > 0 ? Math.max(0, totalInvestment - disbursed) : undefined;

  const visible = items.filter((s) => s.value > 0);
  const gap = visible.length > 1 || sum < base ? GAP : 0;
  const arcLength = (value: number) => (base > 0 ? (value / base) * HALF : 0);
  const arcs = visible.map((s, i) => ({
    ...s,
    dash: Math.max(arcLength(s.value) - gap, 0),
    offset: visible.slice(0, i).reduce((acc, p) => acc + arcLength(p.value), 0),
  }));

  const stats = [
    { label: "Tổng mức đầu tư", value: totalInvestment > 0 ? money(totalInvestment) : "Chưa có", accent: false },
    { label: `Đã giải ngân · ${count} đợt`, value: money(disbursed), accent: true },
    { label: "Còn lại", value: remaining !== undefined ? money(remaining) : "—", accent: false },
  ];

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative" style={{ width: SIZE, height: GAUGE_HEIGHT }}>
            <svg
              width={SIZE}
              height={GAUGE_HEIGHT}
              viewBox={`0 0 ${SIZE} ${GAUGE_HEIGHT}`}
              role="img"
              aria-label={`Đã giải ngân ${formatPct(rate)}: ${items.map((s) => `${s.key} ${money(s.total)}`).join(", ")}`}
            >
              <g transform={`rotate(180 ${SIZE / 2} ${SIZE / 2})`}>
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={TRACK_COLOR}
                  strokeWidth={STROKE}
                  strokeDasharray={`${HALF} ${HALF * 2}`}
                />
                {arcs.map((a) => (
                  <circle
                    key={a.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${a.dash} ${HALF * 3}`}
                    strokeDashoffset={-a.offset}
                    className="cursor-pointer"
                    onClick={() => onSelect(a.key)}
                  >
                    <title>{`${a.key}: ${money(a.total)} (${formatPct(pctOf(a.value))})`}</title>
                  </circle>
                ))}
              </g>
            </svg>
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
              <span className="text-3xl font-bold leading-none text-slate-900">{formatPct(rate)}</span>
              <span className="mt-1 text-[11px] text-slate-500">đã giải ngân</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between px-1 text-[11px] text-slate-400" style={{ width: SIZE }}>
            <span>0</span>
            <span>{totalInvestment > 0 ? money(totalInvestment) : "—"}</span>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] text-slate-500">{stat.label}</div>
                <div className={cn("mt-0.5 text-sm font-bold", stat.accent ? "text-[#DC2626]" : "text-slate-900")}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2">
            {items.map((s) => (
              <span
                key={s.key}
                className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate" title={s.key}>
                  {s.key}
                </span>
                <b className="shrink-0 text-slate-900">{money(s.total)}</b>
                <span className="w-10 shrink-0 text-right text-slate-400">{formatPct(pctOf(s.value))}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
