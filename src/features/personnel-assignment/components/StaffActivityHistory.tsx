"use client";

import { useMemo, useState } from "react";
import { Text } from "@/components/ui";
import { getStaffProfileHistory } from "../utils/activity-log";
import { useActivityLogVersion } from "../hooks/useActivityLogVersion";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import ActivityTimeline from "./ActivityTimeline";

/** Lịch sử thay đổi của hồ sơ cán bộ (chỉ thay đổi trên hồ sơ này, không gộp thao tác ở các màn hình khác), mới nhất lên đầu */
export default function StaffActivityHistory({ staffId }: { staffId: string }) {
  const version = useActivityLogVersion();
  // Lọc theo một ngày cụ thể (yyyy-mm-dd)
  const [filterDate, setFilterDate] = useState("");

  const allEntries = useMemo(() => {
    return [...getStaffProfileHistory(staffId)].sort((a, b) => b.at.localeCompare(a.at));
    // đọc lại khi nhật ký có dòng mới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, version]);

  const entries = useMemo(
    () => (filterDate ? allEntries.filter((e) => toLocalDate(e.at) === filterDate) : allEntries),
    [allEntries, filterDate]
  );

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-800">
          Lịch sử thay đổi{" "}
          <span className="font-semibold normal-case text-slate-400">
            ({filterDate ? `${entries.length}/${allEntries.length}` : allEntries.length})
          </span>
        </Text>
        <ActivityDateFilter value={filterDate} onChange={setFilterDate} />
      </div>

      <ActivityTimeline
        key={filterDate}
        entries={entries}
        emptyText={filterDate ? "Không có thay đổi nào trong ngày đã chọn." : "Chưa có thay đổi nào trên hồ sơ này."}
      />
    </div>
  );
}
