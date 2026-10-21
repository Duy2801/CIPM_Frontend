"use client";

import { useMemo, useState } from "react";
import { Text } from "@/components/ui";
import type { Staff } from "../types/personnel.types";
import { getActivitiesByActor, getStaffProfileHistory } from "../utils/activity-log";
import { useActivityLogVersion } from "../hooks/useActivityLogVersion";
import ActivityDateFilter, { toLocalDate } from "./ActivityDateFilter";
import ActivityTimeline from "./ActivityTimeline";

/** Lịch sử trong hồ sơ cán bộ: gộp thay đổi trên hồ sơ người này + việc người này đã thực hiện, mới nhất lên đầu */
export default function StaffActivityHistory({ staff }: { staff: Staff }) {
  const version = useActivityLogVersion();
  // Lọc theo một ngày cụ thể (yyyy-mm-dd)
  const [filterDate, setFilterDate] = useState("");

  const allEntries = useMemo(() => {
    const merged = new Map([...getStaffProfileHistory(staff.id), ...getActivitiesByActor(staff.name)].map((e) => [e.id, e]));
    return [...merged.values()].sort((a, b) => b.at.localeCompare(a.at));
    // đọc lại khi hồ sơ hoặc nhật ký thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, version]);

  const entries = useMemo(
    () => (filterDate ? allEntries.filter((e) => toLocalDate(e.at) === filterDate) : allEntries),
    [allEntries, filterDate]
  );

  return (
    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-800">
          Lịch sử thao tác{" "}
          <span className="font-semibold normal-case text-slate-400">
            ({filterDate ? `${entries.length}/${allEntries.length}` : allEntries.length})
          </span>
        </Text>
        <ActivityDateFilter value={filterDate} onChange={setFilterDate} />
      </div>

      <ActivityTimeline
        key={filterDate}
        entries={entries}
        showModule
        emptyText={filterDate ? "Không có thao tác nào trong ngày đã chọn." : "Chưa có thao tác nào được ghi nhận."}
      />
    </div>
  );
}
