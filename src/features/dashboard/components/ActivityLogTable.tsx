"use client";

import React from "react";
import { Button, Spin } from "@/components/ui";
import { useActivityLog } from "../hooks/useActivityLog";
import { useDashboardStore } from "../hooks/useDashboardStore";
import ActivityLogRow from "./ActivityLogRow";

export default function ActivityLogTable({ onOpen }: { onOpen: (activityId: string) => void }) {
  const { rows, hasFilter, isLoading } = useActivityLog();
  const resetFilter = useDashboardStore((s) => s.resetActivityFilter);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <th className="py-2.5 px-3 w-[130px]">THỜI GIAN</th>
            <th className="py-2.5 px-3 w-[240px]">DỰ ÁN / CÔNG TRÌNH</th>
            <th className="py-2.5 px-3 w-[180px]">NGƯỜI THỰC HIỆN</th>
            <th className="py-2.5 px-3">NỘI DUNG CÔNG VIỆC CHÍNH</th>
            <th className="py-2.5 px-3 text-right w-[80px]">THAO TÁC</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-slate-500">
                {isLoading ? (
                  <Spin size="small" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-xs sm:text-sm text-slate-600">
                      Không tìm thấy nhật ký điều hành phù hợp với bộ lọc.
                    </span>
                    {hasFilter && (
                      <Button scale="xs" intent="outline" onClick={resetFilter}>
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ) : (
            rows.map((item) => <ActivityLogRow key={item.id} activityId={item.id} onOpen={onOpen} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
