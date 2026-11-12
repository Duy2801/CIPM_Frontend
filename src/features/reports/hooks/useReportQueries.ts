"use client";

import { useIsMutating, useQuery } from "@tanstack/react-query";
import { getReportContent, getReportHistory, getReports, getReportTypes } from "../services/report.api";
import { DEFAULT_REPORT_TYPES } from "../services/report-types";
import { reportTypeOf } from "../utils/report-format";

export const reportKeys = {
  all: ["reports"] as const,
  types: () => [...reportKeys.all, "types"] as const,
  files: () => [...reportKeys.all, "files"] as const,
  content: (reportId: string) => [...reportKeys.all, "content", reportId] as const,
  history: (typeId?: string) => [...reportKeys.all, "history", typeId ?? "all"] as const,
  import: () => [...reportKeys.all, "import"] as const,
};

export function useReportTypes() {
  const { data } = useQuery({ queryKey: reportKeys.types(), queryFn: getReportTypes, staleTime: Infinity });
  return data ?? DEFAULT_REPORT_TYPES;
}

export function useReportFiles() {
  return useQuery({ queryKey: reportKeys.files(), queryFn: getReports, staleTime: Infinity });
}

export function useReportType(typeId: string) {
  return useReportTypes().find((t) => t.id === typeId);
}

export function useReportOf(typeId: string) {
  const { data: files = [] } = useReportFiles();
  return files.find((r) => reportTypeOf(r) === typeId);
}

export function useReportContent(reportId: string | undefined) {
  return useQuery({
    queryKey: reportKeys.content(reportId ?? ""),
    queryFn: () => getReportContent(reportId!),
    enabled: Boolean(reportId),
    staleTime: Infinity,
  });
}

export function useReportHistory(typeId?: string) {
  return useQuery({ queryKey: reportKeys.history(typeId), queryFn: () => getReportHistory(typeId) });
}

export function useReportImporting() {
  return useIsMutating({ mutationKey: reportKeys.import() }) > 0;
}
