"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Select, Spin } from "@/components/ui";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { MOCK_WEEKLY_PROGRESS, mockDailyProgress } from "../constants/dashboard-mock-data";
import { buildLastWeekReport, closedWeekRange } from "../utils/schedule-kpi";

const ALL = "__all__";
const WEEK_COUNT = 8;
const HEIGHT = 220;
const PAD = { top: 16, right: 20, bottom: 34, left: 32 };
const COMPLETED_COLOR = "#2a78d6";
const PLANNED_COLOR = "#94a3b8";

const short = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
const niceMax = (value: number) => Math.max(4, Math.ceil(value / 4) * 4);

export default function WeeklyProgressChart() {
  const { stepsByProject, loadingTasks } = useDashboardSchedule();
  const [projectId, setProjectId] = useState<string>(ALL);
  const [weeksAgo, setWeeksAgo] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number>();

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const report = useMemo(() => {
    const scope = projectId === ALL ? stepsByProject : stepsByProject.filter((p) => p.id === projectId);
    const real = buildLastWeekReport(scope.flatMap((p) => p.steps), weeksAgo);
    if (!MOCK_WEEKLY_PROGRESS) return real;
    const days = real.days.map((d, i) => {
      const mocked = scope.map((p) => mockDailyProgress(p.id, d.date, i));
      return {
        ...d,
        planned: mocked.reduce((sum, m) => sum + m.planned, 0),
        completed: mocked.reduce((sum, m) => sum + m.completed, 0),
      };
    });
    return {
      ...real,
      days,
      planned: days.reduce((sum, d) => sum + d.planned, 0),
      completed: days.reduce((sum, d) => sum + d.completed, 0),
    };
  }, [stepsByProject, projectId, weeksAgo]);

  const weekOptions = Array.from({ length: WEEK_COUNT }, (_, i) => {
    const range = closedWeekRange(i);
    const days = `${short(range.start)} – ${short(range.end)}`;
    return { value: i, label: i === 0 ? `Tuần vừa qua (${days})` : `Tuần ${days}` };
  }).reverse();

  const projectOptions = [
    { value: ALL, label: "Tất cả dự án" },
    ...stepsByProject.map((p) => ({ value: p.id, label: p.code ? `${p.code} — ${p.name}` : p.name })),
  ];

  const { days } = report;
  const max = niceMax(Math.max(...days.flatMap((d) => [d.completed, d.planned])));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const step = plotW / (days.length - 1);
  const x = (i: number) => PAD.left + i * step;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const line = (key: "completed" | "planned") => days.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const area = `${line("completed")} L${x(days.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const rate = report.planned > 0 ? Math.round((report.completed / report.planned) * 100) : undefined;
  const active = hover !== undefined ? days[hover] : undefined;

  return (
    <section className="w-full rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-sm font-bold text-slate-900">Kết quả thực hiện theo tuần</div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Select
          value={weeksAgo}
          onChange={(v) => setWeeksAgo(Number(v))}
          options={weekOptions}
          className="w-full text-xs sm:w-60"
        />
        <Select
          showSearch
          optionFilterProp="label"
          value={projectId}
          onChange={(v) => setProjectId(v as string)}
          options={projectOptions}
          className="w-full text-xs sm:w-72"
        />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="flex flex-row gap-3 lg:flex-col">
          <div className="flex-1 rounded-xl bg-sky-50/70 px-4 py-3">
            <div className="text-[11px] text-slate-500">Việc đã hoàn thành</div>
            <div className="mt-1 text-3xl font-bold leading-none text-slate-900">{report.completed}</div>
          </div>
          <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-[11px] text-slate-500">Đến hạn theo kế hoạch</div>
            <div className="mt-1 text-xl font-semibold leading-none text-slate-700">{report.planned}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {rate !== undefined ? `Đạt ${rate}% kế hoạch` : "Không có việc đến hạn"}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COMPLETED_COLOR }} />
              Hoàn thành
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed" style={{ borderColor: PLANNED_COLOR }} />
              Đến hạn theo kế hoạch
            </span>
          </div>

          <div ref={boxRef} className="relative mt-1" style={{ height: HEIGHT }}>
            {loadingTasks ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : (
              width > 0 && (
                <>
                  <svg width={width} height={HEIGHT} role="img" aria-label="Số việc hoàn thành và đến hạn theo từng ngày của tuần vừa qua">
                    <defs>
                      <linearGradient id="weekly-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={COMPLETED_COLOR} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={COMPLETED_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {ticks.map((t) => (
                      <g key={t}>
                        <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#f1f5f9" />
                        <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                          {t}
                        </text>
                      </g>
                    ))}
                    {days.map((d, i) => (
                      <text key={d.date} x={x(i)} y={HEIGHT - 12} textAnchor="middle" className="fill-slate-500 text-[10px]">
                        {d.weekday} {short(d.date)}
                      </text>
                    ))}
                    {hover !== undefined && (
                      <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="#cbd5e1" strokeDasharray="3 3" />
                    )}
                    <path d={area} fill="url(#weekly-fill)" />
                    <path d={line("planned")} fill="none" stroke={PLANNED_COLOR} strokeWidth={2} strokeDasharray="5 4" />
                    <path d={line("completed")} fill="none" stroke={COMPLETED_COLOR} strokeWidth={2} strokeLinejoin="round" />
                    {days.map((d, i) => (
                      <circle
                        key={d.date}
                        cx={x(i)}
                        cy={y(d.completed)}
                        r={hover === i ? 5 : 3.5}
                        fill="white"
                        stroke={COMPLETED_COLOR}
                        strokeWidth={2}
                      />
                    ))}
                    {days.map((d, i) => (
                      <rect
                        key={d.date}
                        x={x(i) - step / 2}
                        y={PAD.top}
                        width={step}
                        height={plotH}
                        fill="transparent"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(undefined)}
                      />
                    ))}
                  </svg>
                  {active && hover !== undefined && (
                    <div
                      className="pointer-events-none absolute z-10 w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-md"
                      style={{
                        left: Math.min(Math.max(x(hover) - 80, 0), width - 160),
                        top: Math.max(y(Math.max(active.completed, active.planned)) - 76, 0),
                      }}
                    >
                      <div className="font-semibold text-slate-900">
                        {active.weekday}, {short(active.date)}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-slate-600">Hoàn thành</span>
                        <b className="text-slate-900">{active.completed}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Đến hạn</span>
                        <b className="text-slate-900">{active.planned}</b>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
