"use client";

import { useMemo, useState } from "react";
import { Text } from "@/components/ui";
import { useStaffActivity } from "../hooks/usePersonnelQueries";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import ActivityTimeline from "./ActivityTimeline";

/** Số dòng hiện trước; bấm "Xem thêm" để hiện thêm từng ấy dòng */
const PAGE_SIZE = 5;

/** Lịch sử thay đổi của hồ sơ cán bộ (chỉ thay đổi trên hồ sơ này, không gộp thao tác ở các màn hình khác), mới nhất lên đầu */
export default function StaffActivityHistory({ staffId }: { staffId: string }) {
  const { data: history } = useStaffActivity(staffId);
  // Lọc theo một ngày cụ thể (yyyy-mm-dd)
  const [filterDate, setFilterDate] = useState("");
  const [prevStaffId, setPrevStaffId] = useState(staffId);

  // Đổi cán bộ thì đặt lại ngày lọc khi render
  if (prevStaffId !== staffId) {
    setPrevStaffId(staffId);
    setFilterDate("");
  }

  const allEntries = useMemo(
    () => [...(history ?? [])].sort((a, b) => String(b.at).localeCompare(String(a.at))),
    [history]
  );

  const entries = useMemo(
    () => (filterDate ? allEntries.filter((e) => toLocalDate(e.at) === filterDate) : allEntries),
    [allEntries, filterDate]
  );


  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-[#DC2626]">
          Lịch sử thay đổi{" "}
          <span className="font-semibold normal-case text-slate-400">
            ({filterDate ? `${entries.length}/${allEntries.length}` : allEntries.length})
          </span>
        </Text>
        <ActivityDateFilter value={filterDate} onChange={setFilterDate} />
      </div>

      {/* Hiện 5 dòng, bấm "Xem thêm" ở dưới để hiện thêm 5 dòng nữa */}
      <ActivityTimeline
        key={`${staffId}-${filterDate}`}
        entries={entries}
        pageSize={PAGE_SIZE}
        emptyText={filterDate ? "Không có thay đổi nào trong ngày đã chọn." : "Chưa có thay đổi nào trên hồ sơ này."}
      />

    </div>
  );
}
