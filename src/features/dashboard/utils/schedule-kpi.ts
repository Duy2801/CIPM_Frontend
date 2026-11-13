import type { ProjectItem } from "@/features/projects_works/types/project.types";

export type ScheduleGroup = "ahead" | "late" | "onTrack";

export const SEVERE_LAG = 25;

export interface ScheduleProject {
  id: string;
  code: string;
  name: string;
  diff: number;
}

export interface ScheduleBucket {
  count: number;
  share: number;
  avgDiff: number;
  projects: ScheduleProject[];
}

export interface ScheduleKpi {
  total: number;
  running: number;
  completed: number;
  closed: number;
  ahead: ScheduleBucket;
  late: ScheduleBucket & { severe: number };
  onTrack: ScheduleBucket & { completed: number };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function scheduleGroupOf(project: Pick<ProjectItem, "actualProgress" | "plannedProgress">): ScheduleGroup {
  const diff = round1((project.actualProgress ?? 0) - (project.plannedProgress ?? 0));
  if (diff > 0) return "ahead";
  if (diff < 0) return "late";
  return "onTrack";
}

export function buildScheduleKpi(projects: ProjectItem[]): ScheduleKpi {
  const total = projects.length;
  const groups: Record<ScheduleGroup, ScheduleProject[]> = { ahead: [], late: [], onTrack: [] };
  for (const p of projects) {
    groups[scheduleGroupOf(p)].push({
      id: p.id,
      code: p.code,
      name: p.name,
      diff: round1((p.actualProgress ?? 0) - (p.plannedProgress ?? 0)),
    });
  }
  const bucket = (list: ScheduleProject[], order: (a: ScheduleProject, b: ScheduleProject) => number): ScheduleBucket => ({
    count: list.length,
    share: total > 0 ? round1((list.length / total) * 100) : 0,
    avgDiff: list.length > 0 ? round1(list.reduce((s, p) => s + p.diff, 0) / list.length) : 0,
    projects: [...list].sort(order),
  });
  const completedIds = new Set(projects.filter((p) => p.actualProgress >= 100).map((p) => p.id));
  return {
    total,
    running: projects.filter((p) => p.status !== "closed" && p.actualProgress < 100).length,
    completed: completedIds.size,
    closed: projects.filter((p) => p.status === "closed").length,
    ahead: bucket(groups.ahead, (a, b) => b.diff - a.diff),
    late: {
      ...bucket(groups.late, (a, b) => a.diff - b.diff),
      severe: groups.late.filter((p) => -p.diff >= SEVERE_LAG).length,
    },
    onTrack: {
      ...bucket(groups.onTrack, (a, b) => a.name.localeCompare(b.name, "vi")),
      completed: groups.onTrack.filter((p) => completedIds.has(p.id)).length,
    },
  };
}

export interface TaskScheduleKpi {
  total: number;
  ahead: number;
  late: number;
  onTrack: number;
}

type ScheduledStep = {
  isEnabled: boolean;
  status: string;
  endDatePlanned?: string;
  actualEndDate?: string;
};

export function taskScheduleGroupOf(step: ScheduledStep, today: string): ScheduleGroup | null {
  if (!step.isEnabled || step.status === "SKIPPED" || step.status === "DISABLED" || !step.endDatePlanned) return null;
  const due = step.endDatePlanned.slice(0, 10);
  if (step.status === "COMPLETED") {
    const done = step.actualEndDate?.slice(0, 10);
    if (!done || done === due) return "onTrack";
    return done < due ? "ahead" : "late";
  }
  return today > due ? "late" : "onTrack";
}

export function buildTaskKpi(steps: ScheduledStep[], today = new Date().toISOString().slice(0, 10)): TaskScheduleKpi {
  const kpi: TaskScheduleKpi = { total: 0, ahead: 0, late: 0, onTrack: 0 };
  for (const step of steps) {
    const group = taskScheduleGroupOf(step, today);
    if (!group) continue;
    kpi.total += 1;
    kpi[group] += 1;
  }
  return kpi;
}

export interface DailyPoint {
  date: string;
  weekday: string;
  completed: number;
  planned: number;
}

export interface LastWeekReport {
  start: string;
  end: string;
  closeDate: string;
  days: DailyPoint[];
  completed: number;
  planned: number;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

export function closedWeekRange(weeksAgo = 0, today = new Date()) {
  const close = addDays(today, -((today.getDay() + 6) % 7) - 7 * weeksAgo);
  return { monday: addDays(close, -7), close, start: dayKey(addDays(close, -7)), end: dayKey(addDays(close, -1)) };
}

export function buildLastWeekReport(steps: ScheduledStep[], weeksAgo = 0, today = new Date()): LastWeekReport {
  const { monday, close } = closedWeekRange(weeksAgo, today);
  const days: DailyPoint[] = WEEKDAYS.map((weekday, i) => ({
    date: dayKey(addDays(monday, i)),
    weekday,
    completed: 0,
    planned: 0,
  }));
  const find = (date?: string) => {
    const key = date?.slice(0, 10);
    return key ? days.find((d) => d.date === key) : undefined;
  };
  for (const step of steps) {
    if (!step.isEnabled || step.status === "SKIPPED" || step.status === "DISABLED") continue;
    const due = find(step.endDatePlanned);
    if (due) due.planned += 1;
    if (step.status === "COMPLETED") {
      const done = find(step.actualEndDate);
      if (done) done.completed += 1;
    }
  }
  return {
    start: days[0].date,
    end: days[6].date,
    closeDate: dayKey(close),
    days,
    completed: days.reduce((sum, d) => sum + d.completed, 0),
    planned: days.reduce((sum, d) => sum + d.planned, 0),
  };
}
