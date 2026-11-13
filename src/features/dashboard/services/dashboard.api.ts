import { getAuditLogsApi } from "@/shared/audit-logs/api/audit-log.api";
import { withBackend } from "@/config/backend";
import * as backend from "../api/dashboard.backend";
import { mockActivities, mockDashboardSummary, mockQuarterlyData } from "../constants/dashboard-mock-data";
import type { ActivityItem, DashboardSummary, QuarterlyData } from "../types/dashboard.types";
import { toActivityItem, toDashboardSummary } from "./dashboard.mapper";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return withBackend(async () => toDashboardSummary(await backend.getDashboardSummaryApi()), () => mockDashboardSummary);
}

export function getDashboardActivities(): Promise<ActivityItem[]> {
  return withBackend(async () => (await getAuditLogsApi({ module: "projects" })).map(toActivityItem), () => mockActivities);
}

export function getQuarterlyDisbursement(): Promise<QuarterlyData[]> {
  return withBackend(async () => [], () => mockQuarterlyData);
}
