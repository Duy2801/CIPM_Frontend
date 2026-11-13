"use client";

import { useMemo, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Spin } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import {
  buildSchedulePeople,
  buildScheduleTaskRows,
  type ScheduleGroup,
  type SchedulePersonRow,
  type ScheduleTaskRow,
} from "../utils/schedule-kpi";

export type ScheduleFilter = "total" | ScheduleGroup;

const TITLES: Record<ScheduleFilter, { label: string; className: string; avatar: string; active: string }> = {
  total: {
    label: "Tổng dự án",
    className: "text-[#DC2626]",
    avatar: "bg-red-100/80 text-[#DC2626]",
    active: "bg-red-50 ring-red-200",
  },
  ahead: {
    label: "Vượt tiến độ",
    className: "text-emerald-600",
    avatar: "bg-emerald-100/80 text-emerald-700",
    active: "bg-emerald-50 ring-emerald-200",
  },
  late: {
    label: "Trễ tiến độ",
    className: "text-rose-600",
    avatar: "bg-rose-100/80 text-rose-700",
    active: "bg-rose-50 ring-rose-200",
  },
  onTrack: {
    label: "Đúng tiến độ",
    className: "text-sky-600",
    avatar: "bg-sky-100/80 text-sky-700",
    active: "bg-sky-50 ring-sky-200",
  },
};

const UNIT: Record<ScheduleGroup, string> = { ahead: "việc vượt tiến độ", late: "việc trễ tiến độ", onTrack: "việc đúng tiến độ" };

const GROUPS: { key: ScheduleGroup; bar: string }[] = [
  { key: "ahead", bar: "bg-emerald-500" },
  { key: "onTrack", bar: "bg-sky-500" },
  { key: "late", bar: "bg-rose-500" },
];

const DOT: Record<ScheduleGroup, string> = { ahead: "bg-emerald-500", onTrack: "bg-sky-500", late: "bg-rose-500" };

const initialOf = (name: string) => name.split(" ").slice(-1)[0]?.charAt(0).toUpperCase() || "?";

function Avatar({ name, className }: { name: string; className: string }) {
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", className)}>
      {initialOf(name)}
    </span>
  );
}

function StackBar({ person }: { person: SchedulePersonRow }) {
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      {GROUPS.map((g) =>
        person[g.key] > 0 ? (
          <div key={g.key} className={g.bar} style={{ width: `${(person[g.key] / person.total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

function TaskItem({ task }: { task: ScheduleTaskRow }) {
  const lag =
    task.lagDays > 0 ? `Trễ ${task.lagDays} ngày` : task.lagDays < 0 ? `Sớm ${-task.lagDays} ngày` : "Đúng hạn";
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT[task.group])} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-slate-800">{task.name}</div>
        <div className="mt-0.5 truncate text-[11px] text-slate-500">
          {task.projectCode || task.projectName} · Hạn {formatDateVi(task.due)}
          {task.completed ? ` · Xong ${task.done ? formatDateVi(task.done) : ""}` : " · Đang làm"}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-[11px] font-semibold",
          task.lagDays > 0 ? "text-rose-600" : task.lagDays < 0 ? "text-emerald-600" : "text-sky-600",
        )}
      >
        {lag}
      </span>
    </li>
  );
}

export default function ScheduleStatsPage({ filter, onBack }: { filter: ScheduleFilter; onBack: () => void }) {
  const [selected, setSelected] = useState<string>();
  const { stepsByProject, loadingTasks } = useDashboardSchedule();

  const allTasks = useMemo(() => buildScheduleTaskRows(stepsByProject), [stepsByProject]);
  const people = useMemo(() => buildSchedulePeople(allTasks), [allTasks]);

  const personRows = people
    .filter((p) => filter === "total" || p[filter] > 0)
    .sort((a, b) => (filter === "total" ? b.late - a.late || b.total - a.total : b[filter] - a[filter]));
  const person = personRows.find((p) => p.name === selected) ?? personRows[0];
  const tasks = person
    ? allTasks
        .filter((t) => t.assignee === person.name && (filter === "total" || t.group === filter))
        .sort((a, b) => b.lagDays - a.lagDays || a.due.localeCompare(b.due))
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại Dashboard"
          title="Quay lại Dashboard"
          onClick={onBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <h1 className="m-0 min-w-0 truncate text-base font-bold text-slate-900">
          <span className={TITLES[filter].className}>{TITLES[filter].label}</span>
        </h1>
      </div>

      <Card surface="workspace" padding="none" rounded="lg" className="border border-slate-200/80 shadow-xs">
        <Spin spinning={loadingTasks}>
          {personRows.length === 0 ? (
            <div className="px-5 py-16 text-center text-xs text-slate-500">Không có người thực hiện nào.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
              <ul className="m-0 flex max-h-[640px] list-none flex-col gap-1 overflow-y-auto border-b border-slate-100 p-3 lg:border-r lg:border-b-0">
                {personRows.map((p) => {
                  const active = p.name === person?.name;
                  return (
                    <li key={p.name}>
                      <button
                        type="button"
                        onClick={() => setSelected(p.name)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-colors",
                          active ? cn("ring-1", TITLES[filter].active) : "bg-transparent hover:bg-slate-50",
                        )}
                      >
                        <Avatar name={p.name} className={TITLES[filter].avatar} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-slate-800">{p.name}</span>
                            {filter === "total" && (
                              <span className="shrink-0 text-[11px] text-slate-500">{p.total} việc</span>
                            )}
                          </div>
                          {filter === "total" ? (
                            <div className="mt-1.5">
                              <StackBar person={p} />
                            </div>
                          ) : (
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              <b className={TITLES[filter].className}>{p[filter]}</b> {UNIT[filter]}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {person && (
                <div className="min-w-0">
                  {tasks.length === 0 ? (
                    <div className="px-5 py-12 text-center text-xs text-slate-500">Không có công việc nào.</div>
                  ) : (
                    <ul className="m-0 max-h-[640px] list-none divide-y divide-slate-100 overflow-y-auto p-0">
                      {tasks.map((t) => (
                        <TaskItem key={t.id} task={t} />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
}
