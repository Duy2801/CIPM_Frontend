"use client";

import { useMemo, useState } from "react";
import { Card, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import ActivityDateFilter, { toLocalDate } from "@/features/personnel-assignment/components/ActivityDateFilter";
import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useReportHistory } from "../hooks/useReportQueries";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/**
 * Lịch sử thao tác: ai nhập / xuất Excel, thêm / xóa loại báo cáo, vào lúc nào (lọc theo ngày, phân trang).
 * Truyền `typeId` để chỉ xem lịch sử của một báo cáo.
 */
export default function ReportHistoryTab({ typeId, title = "Lịch sử thao tác" }: { typeId?: string; title?: string } = {}) {
  const { data: all = [] } = useReportHistory(typeId);
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const history = useMemo(() => (date ? all.filter((e) => toLocalDate(e.at) === date) : all), [all, date]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        {/* title rỗng = không hiện tiêu đề (trang báo cáo đã có tiêu đề "Lịch sử · …" ở trên) */}
        {title ? <h2 className="m-0 text-base font-bold text-slate-900">{title}</h2> : <span />}
        <div className="flex flex-wrap items-center gap-3">
          <ActivityDateFilter
            value={date}
            onChange={(val) => {
              setDate(val);
              setPage(1);
            }}
          />
          {history.length > PAGE_SIZE && (
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={history.length}
              onChange={setPage}
              showSizeChanger={false}
              size="small"
            />
          )}
        </div>
      </div>
      <div className="p-4">
        <ActivityTimeline
          key={`${date}-${currentPage}`}
          entries={paged}
          hideLoadMore
          emptyText={date ? "Không có thao tác nào trong ngày đã chọn." : "Chưa có thao tác nào trên báo cáo được ghi nhận."}
        />
      </div>
    </Card>
  );
}
