import type { ApiAuditLog } from "@/shared/audit-logs/api/audit-log.api";
import type { ActivityItem, DashboardSummary, DisbursementTotals } from "../types/dashboard.types";

export interface ApiDashboardSummary {
  totalProjects?: number;
  completedProjects?: number;
  inProgressProjects?: number;
  totalInvestment?: number | string;
  totalDisbursed?: number | string;
  projectsByType?: { type?: string | null; count?: number; investment?: number | string }[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const toBillion = (vnd: number) => Math.round((vnd / 1_000_000_000) * 10) / 10;

export function toDashboardSummary(api: ApiDashboardSummary): DashboardSummary {
  return {
    totalProjects: api.totalProjects ?? 0,
    completedProjects: api.completedProjects ?? 0,
    inProgressProjects: api.inProgressProjects ?? 0,
    totalInvestment: Number(api.totalInvestment ?? 0),
    totalDisbursed: Number(api.totalDisbursed ?? 0),
    projectsByType: (api.projectsByType ?? []).map((t) => ({
      type: t.type ?? "",
      count: t.count ?? 0,
      investment: Number(t.investment ?? 0),
    })),
  };
}

export function toDisbursementTotals(summary: DashboardSummary, now = new Date()): DisbursementTotals {
  const remaining = Math.max(0, summary.totalInvestment - summary.totalDisbursed);
  const monthsLeft = 12 - now.getMonth();
  return {
    disbursed: toBillion(summary.totalDisbursed),
    remaining: toBillion(remaining),
    monthlySpeed: toBillion(remaining / monthsLeft),
  };
}

function formatLogTime(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function logContent(log: ApiAuditLog): string {
  if (log.note) return log.note;
  const changes = (log.changes ?? []).map((c) => (c.to ? `${c.label}: ${c.from ?? "—"} → ${c.to}` : c.label));
  return changes.length > 0 ? changes.join("; ") : log.action;
}

export function toActivityItem(log: ApiAuditLog): ActivityItem {
  return {
    id: log.id,
    time: formatLogTime(log.at),
    actor: log.actorName || "Hệ thống",
    actorTitle: log.actorRole ?? undefined,
    projectId: log.targetId ?? undefined,
    projectName: log.targetName ?? undefined,
    actionType: log.action,
    content: logContent(log),
  };
}
