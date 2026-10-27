"use client";

import { useMemo, useState } from "react";
import { Card, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useActivityLogVersion } from "@/features/personnel-assignment/hooks/useActivityLogVersion";
import { getPersonnelActivities } from "@/features/personnel-assignment/utils/activity-log";
import { LEGAL_LOG_MODULE } from "../constants/legal-labels";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Tab "Lịch sử thay đổi": ai đã thao tác trên thư viện, vào lúc nào (lọc theo ngày, phân trang) */
export default function LegalHistoryTab() {
  // Lọc lịch sử theo một ngày (yyyy-mm-dd), rỗng = tất cả
  const [historyDate, setHistoryDate] = useState("");
  const [page, setPage] = useState(1);
  const logVersion = useActivityLogVersion();

  // Nhật ký dùng chung, lọc theo phân hệ, mới nhất lên đầu
  const history = useMemo(() => {
    const all = getPersonnelActivities().filter((e) => e.module === LEGAL_LOG_MODULE);
    return historyDate ? all.filter((e) => toLocalDate(e.at) === historyDate) : all;
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, logVersion]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedHistory = history.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200 shadow-xs bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold text-slate-900">Lịch sử thay đổi</h2>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            Ai đã thao tác trên thư viện, vào lúc nào · {history.length} thao tác
          </p>
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
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <span className="hidden whitespace-nowrap sm:inline">
                Hiển thị {pageStart + 1}–{pageStart + pagedHistory.length} / {history.length} thao tác
              </span>
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
          hideLoadMore
          emptyText={
            historyDate ? "Không có thao tác nào trong ngày đã chọn." : "Chưa có thao tác nào trên thư viện được ghi nhận."
          }
        />
      </div>
    </Card>
  );
}
