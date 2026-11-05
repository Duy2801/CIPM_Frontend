"use client";

import { useMemo, useState } from "react";
import { Card, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import type { ProcedureHistoryLog } from "@/features/construction-procedures/types/procedure.types";
import type { ProjectItem } from "../../types/project.types";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** "YYYY-MM-DD", "YYYY-MM-DD HH:mm" hoặc ISO → ISO (giờ Việt Nam khi không có múi giờ) */
const toIso = (value: string) => {
  if (!value) return new Date(0).toISOString();
  const hasZone = /T.*(Z|[+-]\d{2}:?\d{2})$/.test(value);
  const local = value.includes("T") ? value : value.length > 10 ? value.replace(" ", "T") : `${value}T00:00`;
  const d = new Date(hasZone ? value : `${local.slice(0, 16)}:00+07:00`);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};

/** Nhật ký của dự án (thông tin chung + quy trình) theo dạng dùng chung của các màn hình lịch sử */
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
    // Lý do thường đã nằm trong mô tả — chỉ thêm khi mô tả chưa có
    note:
      [log.details, log.reason && !log.details?.includes(log.reason) ? `Lý do: ${log.reason}` : undefined]
        .filter(Boolean)
        .join(" · ") || undefined,
  }));
  return [...info, ...procedure].sort((a, b) => b.at.localeCompare(a.at));
}

/** Tab "Lịch sử": ai đã thay đổi gì trên dự án, vào lúc nào (lọc theo ngày, phân trang) — cùng kiểu các màn hình khác */
export default function ProjectHistoryTab({
  project,
  procedureLogs,
}: {
  project: ProjectItem;
  procedureLogs: ProcedureHistoryLog[];
}) {
  // Lọc theo một ngày (yyyy-mm-dd), rỗng = tất cả
  const [historyDate, setHistoryDate] = useState("");
  const [page, setPage] = useState(1);

  const history = useMemo(() => {
    const all = buildEntries(project, procedureLogs);
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
  }, [project, procedureLogs, historyDate]);

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
