import { getAuditLogsApi } from "@/shared/audit-logs/api/audit-log.api";
import { withBackend } from "@/config/backend";
import type { ActivityEntry } from "@/shared/personnel-assignment/utils/activity-log";
import type { AuthUser } from "@/types/auth";
import * as backend from "../api/report.backend";
import type { ReportFile, ReportType } from "../types/report.types";
import { mockReportRepository } from "./mock-report.repository";
import { REPORT_AUDIT_MODULE, toReportActivityEntry, toReportFile, toReportType } from "./report.mapper";

const repo = mockReportRepository;

export function getReportTypes(): Promise<ReportType[]> {
  return withBackend(
    async () => (await backend.getReportTypesApi()).map(toReportType),
    () => repo.getTypes(),
  );
}

export function addReportType(name: string, user: AuthUser | null): Promise<ReportType> {
  return withBackend(
    async () => toReportType(await backend.createReportTypeApi(name.trim())),
    () => repo.addType(name, user),
  );
}

export function removeReportType(typeId: string, user: AuthUser | null): Promise<void> {
  return withBackend(
    () => backend.deleteReportTypeApi(typeId),
    () => repo.removeType(typeId, user),
  );
}

export function getReports(): Promise<ReportFile[]> {
  return withBackend(
    async () =>
      (await backend.getReportsApi()).map(toReportFile).sort((a, b) => b.uploadedAt - a.uploadedAt),
    () => repo.getReports(),
  );
}

export function getReportContent(reportId: string): Promise<Blob> {
  return withBackend(
    () => backend.downloadReportApi(reportId, true),
    () => repo.getContent(reportId),
  );
}

export function uploadReport(typeId: string, file: File, user: AuthUser | null): Promise<ReportFile> {
  return withBackend(
    async () => toReportFile(await backend.uploadReportApi(typeId, file)),
    () => repo.upload(typeId, file, user),
  );
}

export function downloadReport(reportId: string, user: AuthUser | null): Promise<Blob> {
  return withBackend(
    () => backend.downloadReportApi(reportId, false),
    () => repo.download(reportId, user),
  );
}

export function getReportHistory(typeId?: string): Promise<ActivityEntry[]> {
  return withBackend(
    async () => (await getAuditLogsApi({ module: REPORT_AUDIT_MODULE, targetId: typeId })).map(toReportActivityEntry),
    () => repo.getHistory(typeId),
  );
}
