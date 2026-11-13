import type { MyTask, MyTaskTab } from "@/shared/my-tasks/utils/my-tasks.ts";
import type { UrgentTask } from "../types/dashboard.types.ts";

const DUE_SOON_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const URGENT_KINDS: MyTaskTab[] = ["incident", "returned", "review", "accept", "todo"];

type Urgency = Pick<UrgentTask, "badge" | "badgeColor"> & { rank: number; note?: string };

const toLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export function myTaskUrl(task: Pick<MyTask, "projectId" | "step">): string {
  return `/my-tasks?projectId=${encodeURIComponent(task.projectId)}&stepId=${encodeURIComponent(task.step.id)}`;
}

function urgencyOf(kind: MyTaskTab, task: MyTask, today: string): Urgency {
  const { step } = task;
  const due = step.endDatePlanned?.slice(0, 10);
  if (kind === "incident") return { rank: 0, badge: "Sự cố", badgeColor: "danger", note: step.incidentReason };
  if (task.overdue && due) {
    return { rank: 1, badge: `Quá hạn ${Math.max(1, daysBetween(due, today))} ngày`, badgeColor: "danger" };
  }
  if (kind === "returned") {
    return { rank: 2, badge: "Bị trả về", badgeColor: "warning", note: step.rejectionReason || step.handbackReason };
  }
  if (due && daysBetween(today, due) <= DUE_SOON_DAYS) {
    return { rank: 3, badge: `Hạn chót ${shortDate(due)}`, badgeColor: "warning" };
  }
  if (kind === "review") return { rank: 4, badge: "Chờ duyệt", badgeColor: "info", note: step.submissionNote };
  if (kind === "accept") return { rank: 5, badge: "Việc mới", badgeColor: "info" };
  return { rank: 6, badge: due ? `Hạn ${shortDate(due)}` : "Đang xử lý", badgeColor: "success" };
}

export function buildUrgentTasks(groups: Record<MyTaskTab, MyTask[]>, now = new Date()): UrgentTask[] {
  const today = toLocalDate(now);
  const seen = new Set<string>();
  const rows: { task: UrgentTask; rank: number; due: string }[] = [];

  for (const kind of URGENT_KINDS) {
    for (const task of groups[kind] ?? []) {
      const id = `${task.projectId}:${task.step.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const urgency = urgencyOf(kind, task, today);
      const stepLabel = `Bước "${task.step.name}" · ${task.procedureName}`;
      rows.push({
        task: {
          id,
          title: task.projectName,
          badge: urgency.badge,
          badgeColor: urgency.badgeColor,
          description: urgency.note ? `${stepLabel}: ${urgency.note}` : stepLabel,
          actionText: "Xử lý ngay",
          targetUrl: myTaskUrl(task),
        },
        rank: urgency.rank,
        due: task.step.endDatePlanned || "9999",
      });
    }
  }

  return rows.sort((a, b) => a.rank - b.rank || a.due.localeCompare(b.due)).map((row) => row.task);
}
