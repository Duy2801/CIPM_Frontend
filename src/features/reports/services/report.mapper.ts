import type { ApiAuditLog } from "@/features/personnel-assignment/services/personnel.mapper";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import type { ReportFile, ReportType } from "../types/report.types";

export const REPORT_AUDIT_MODULE = "reports";

export interface ApiPerson {
  id: string;
  fullName: string;
}

export interface ApiReportType {
  id: string;
  name: string;
  isCustom: boolean;
}

export interface ApiReportFile {
  id: string;
  typeId: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  uploadedAt: string;
  uploadedBy: ApiPerson | null;
}

export const toReportType = (api: ApiReportType): ReportType => ({
  id: api.id,
  name: api.name,
  custom: api.isCustom || undefined,
});

export const toReportFile = (api: ApiReportFile): ReportFile => ({
  id: api.id,
  typeId: api.typeId,
  name: api.fileName,
  size: api.fileSize,
  uploadedAt: new Date(api.uploadedAt).getTime(),
  uploadedBy: api.uploadedBy?.fullName ?? "",
});

export const toReportActivityEntry = (log: ApiAuditLog): ActivityEntry => ({
  id: log.id,
  at: log.at,
  actorName: log.actorName || "Hệ thống",
  actorRole: log.actorRole ?? undefined,
  module: "Báo cáo",
  action: log.action,
  targetId: log.targetId ?? undefined,
  targetName: log.targetName ?? undefined,
  changes: log.changes ?? [],
  note: log.note ?? undefined,
});
