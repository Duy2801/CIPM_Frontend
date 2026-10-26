"use client";

import { useMemo, useState } from "react";
import { Pagination, Text } from "@/components/ui";
import { getStaffProfileHistory } from "../utils/activity-log";
import { useActivityLogVersion } from "../hooks/useActivityLogVersion";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import ActivityTimeline from "./ActivityTimeline";

const PAGE_SIZE = 5;

/** Lịch sử thay đổi của hồ sơ cán bộ (chỉ thay đổi trên hồ sơ này, không gộp thao tác ở các màn hình khác), mới nhất lên đầu */
export default function StaffActivityHistory({ staffId }: { staffId: string }) {
  const version = useActivityLogVersion();
  // Lọc theo một ngày cụ thể (yyyy-mm-dd)
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [prevStaffId, setPrevStaffId] = useState(staffId);

  // Đổi cán bộ thì đặt lại trang và ngày lọc khi render
  if (prevStaffId !== staffId) {
    setPrevStaffId(staffId);
    setCurrentPage(1);
    setFilterDate("");
  }

  const allEntries = useMemo(() => {
    return [...getStaffProfileHistory(staffId)].sort((a, b) => b.at.localeCompare(a.at));
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, version]);

  const entries = useMemo(
    () => (filterDate ? allEntries.filter((e) => toLocalDate(e.at) === filterDate) : allEntries),
    [allEntries, filterDate]
  );

  const handleDateChange = (val: string) => {
    setFilterDate(val);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedEntries = entries.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-800">
          Lịch sử thay đổi{" "}
          <span className="font-semibold normal-case text-slate-400">
            ({filterDate ? `${entries.length}/${allEntries.length}` : allEntries.length})
          </span>
        </Text>
        <ActivityDateFilter value={filterDate} onChange={handleDateChange} />
      </div>

      <ActivityTimeline
        key={`${staffId}-${filterDate}-${safePage}`}
        entries={pagedEntries}
        hideLoadMore={true}
        emptyText={filterDate ? "Không có thay đổi nào trong ngày đã chọn." : "Chưa có thay đổi nào trên hồ sơ này."}
      />

      {entries.length > PAGE_SIZE && (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">
            Hiển thị <strong className="font-semibold text-slate-700">{startIndex + 1}</strong>–
            <strong className="font-semibold text-slate-700">{Math.min(startIndex + PAGE_SIZE, entries.length)}</strong> trong số{" "}
            <strong className="font-semibold text-slate-700">{entries.length}</strong> thay đổi
          </span>
          <Pagination
            size="small"
            current={safePage}
            pageSize={PAGE_SIZE}
            total={entries.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
