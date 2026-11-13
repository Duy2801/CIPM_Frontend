"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasBackendSession } from "@/config/backend";
import { getProjectHistory } from "@/shared/projects_works/services/project.api";
import { projectKeys, useProject } from "@/shared/projects_works/hooks/useProjectList";
import { Card, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import ActivityDateFilter, { toLocalDate } from "@/shared/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/shared/personnel-assignment/components/ActivityTimeline";
import type { ActivityEntry } from "@/shared/personnel-assignment/utils/activity-log";
import type { ProcedureHistoryLog } from "@/shared/construction-procedures/types/procedure.types";
import type { ProjectItem } from "@/shared/projects_works/types/project.types";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

const toIso = (value: string) => {
  if (!value) return new Date(0).toISOString();
  const hasZone = /T.*(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const local = value.includes("T") ? value : value.length > 10 ? value.replace(" ", "T") : `${value}T00:00`;
  const d = new Date(hasZone ? value : `${local.slice(0, 16)}:00+07:00`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};

function buildEntries(project: ProjectItem, procedureLogs: ProcedureHistoryLog[]): ActivityEntry[] {
  const info: ActivityEntry[] = (project.progressHistory ?? []).map((h) => ({
    id: `info-${h.id}`,
    at: toIso(h.updatedAt),
    actorName: h.updatedBy,
    module: "Thông tin dự án",
    action: "Cập nhật thông tin dự án",
    targetName: project.name,
    changes:
      h.oldProgress !== h.newProgress
        ? [{ label: "Tiến độ", from: `${h.oldProgress}%`, to: `${h.newProgress}%` }]
        : undefined,
    note: h.note || undefined,
  }));
  const procedure: ActivityEntry[] = procedureLogs.map((log) => ({
    id: `proc-${log.id}`,
    at: toIso(log.timestamp),
    actorName: log.performedBy,
    actorRole: log.role,
    module: "Quy trình",
    action: log.actionLabel,
    targetType: "procedure",
    note:
      [log.details, log.reason && !log.details?.includes(log.reason) ? `Lý do: ${log.reason}` : undefined]
        .filter(Boolean)
        .join(" · ") || undefined,
  }));
  return [...info, ...procedure].sort((a, b) => b.at.localeCompare(a.at));
}

export default function ProjectHistoryTab({
  projectId,
  procedureLogs,
}: {
  projectId: string;
  procedureLogs: ProcedureHistoryLog[];
}) {
  const project = useProject(projectId);
  const [historyDate, setHistoryDate] = useState("");
  const [page, setPage] = useState(1);

  const isBackend = hasBackendSession();
  const remote = useQuery({
    queryKey: projectKeys.history(projectId),
    queryFn: () => getProjectHistory(projectId),
    enabled: isBackend,
  });
  const remoteEntries = remote.data;

  const history = useMemo(() => {
    const all = isBackend
      ? [...(remoteEntries ?? [])].sort((a, b) => b.at.localeCompare(a.at))
      : project
        ? buildEntries(project, procedureLogs)
        : [];
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
  }, [isBackend, remoteEntries, project, procedureLogs, historyDate]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedHistory = history.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold text-slate-900">Lịch sử thay đổi</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActivityDateFilter
            value={historyDate}
            onChange={(val) => {
              setHistoryDate(val);
              setPage(1);
            }}
          />
          {history.length > 0 && (
            <div className="flex items-center text-xs text-slate-500">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={history.length}
                onChange={setPage}
                showSizeChanger={false}
                size="small"
              />
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <ActivityTimeline
          key={`${historyDate}-${currentPage}`}
          entries={pagedHistory}
          showModule
          hideLoadMore
          emptyText={
            historyDate ? "Không có thao tác nào trong ngày đã chọn." : "Chưa có thao tác nào trên dự án được ghi nhận."
          }
        />
      </div>
    </Card>
  );
}
