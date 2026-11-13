"use client";

import { Spin } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import type { ScheduleFilter } from "./ScheduleStatsPage";

const TONES = {
  total: { text: "text-[#DC2626]", tint: "bg-red-50/70" },
  ahead: { text: "text-emerald-600", tint: "bg-emerald-50/70" },
  late: { text: "text-rose-600", tint: "bg-rose-50/70" },
  onTrack: { text: "text-sky-600", tint: "bg-sky-50/70" },
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

export default function DashboardScheduleKpis({ onOpen }: { onOpen: (filter: ScheduleFilter) => void }) {
  const { projects, tasks, loadingTasks } = useDashboardSchedule();
  const cards = [
    { tone: "total" as const, title: "Tổng dự án", projects: projects.total, tasks: tasks.total },
    { tone: "ahead" as const, title: "Vượt tiến độ", projects: projects.ahead.count, tasks: tasks.ahead },
    { tone: "late" as const, title: "Trễ tiến độ", projects: projects.late.count, tasks: tasks.late },
    { tone: "onTrack" as const, title: "Đúng tiến độ", projects: projects.onTrack.count, tasks: tasks.onTrack },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {cards.map((c) => (
        <button
          key={c.tone}
          type="button"
          onClick={() => onOpen(c.tone)}
          className={cn(
            "cursor-pointer rounded-2xl border-0 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-md",
            TONES[c.tone].tint,
          )}
        >
          <span className={cn("text-sm font-semibold", TONES[c.tone].text)}>{c.title}</span>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold leading-none text-slate-900">{pad(c.projects)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Dự án</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold leading-none text-slate-700">
                {loadingTasks ? <Spin size="small" /> : pad(c.tasks)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Công việc</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
