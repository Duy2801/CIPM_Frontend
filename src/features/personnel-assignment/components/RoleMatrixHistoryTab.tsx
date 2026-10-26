"use client";

import { useMemo, useState } from "react";
import { Button, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import { useActivityLogVersion } from "../hooks/useActivityLogVersion";
import { getPermissionChangeHistory } from "../utils/activity-log";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import ActivityTimeline from "./ActivityTimeline";

/** Tab "Lịch sử thay đổi quyền" trong modal quản lý chức danh (ai cũng xem được), lọc theo ngày */
export default function RoleMatrixHistoryTab({ onClose }: { onClose: () => void }) {
  // Lọc lịch sử thay đổi quyền theo một ngày (yyyy-mm-dd)
  const [historyDate, setHistoryDate] = useState("");
  const [page, setPage] = useState(1);
  const logVersion = useActivityLogVersion();

  const permissionHistory = useMemo(() => {
    const all = getPermissionChangeHistory();
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, logVersion]);

  const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(permissionHistory.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedHistory = permissionHistory.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
      {/* Lọc ngày nằm bên phải */}
      <div className="px-6 pb-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {permissionHistory.length > 0 && (
            <span>
              Tổng số <strong className="text-slate-800">{permissionHistory.length}</strong> lần thay đổi
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <ActivityDateFilter
            value={historyDate}
            onChange={(val) => {
              setHistoryDate(val);
              setPage(1);
            }}
          />
          {permissionHistory.length > 0 && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <span className="hidden whitespace-nowrap sm:inline">
                Hiển thị {pageStart + 1}–{pageStart + pagedHistory.length} / {permissionHistory.length}
              </span>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={permissionHistory.length}
                onChange={setPage}
                showSizeChanger={false}
                size="small"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto [scrollbar-width:thin] min-h-0 px-6 pb-4">
        <ActivityTimeline
          key={`${historyDate}-${currentPage}`}
          entries={pagedHistory}
          hideLoadMore
          emptyText={
            historyDate ? "Không có thay đổi quyền nào trong ngày đã chọn." : "Chưa có thay đổi quyền nào được ghi nhận."
          }
        />
      </div>
      <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <span className="text-xs text-slate-500">{permissionHistory.length} lần thay đổi</span>
        <Button
          intent="outline"
          className="!border-slate-300 text-xs h-8.5 rounded-lg text-slate-700 hover:text-slate-900"
          onClick={onClose}
        >
          Đóng
        </Button>
      </div>
    </>
  );
}
