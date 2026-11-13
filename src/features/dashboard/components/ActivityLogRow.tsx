"use client";

import React from "react";
import { Button } from "@/components/ui";
import { useDashboardActivity } from "../hooks/useDashboardQueries";
import { resolveActivityTime } from "../utils/activity-time";

export default function ActivityLogRow({ activityId, onOpen }: { activityId: string; onOpen: (id: string) => void }) {
  const item = useDashboardActivity(activityId);
  if (!item) return null;
  const { date, timeOfDay } = resolveActivityTime(item.time);

  return (
    <tr className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => onOpen(item.id)}>
      <td className="py-3 px-3 font-mono whitespace-nowrap text-xs">
        <div className="font-semibold text-slate-800">{date}</div>
        <div className="text-slate-500 mt-0.5">{timeOfDay}</div>
      </td>
      <td className="py-3 px-3">
        <div className="font-semibold text-slate-900 text-xs line-clamp-1 group-hover:text-[#DC2626] transition-colors">
          {item.projectName || "Dự án Ban QLDA"}
        </div>
        {item.projectCode && <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.projectCode}</div>}
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="font-semibold text-slate-900 text-xs">{item.actor}</div>
        <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
          {item.actorTitle || item.actorDepartment || "Cán bộ chuyên môn"}
        </div>
      </td>
      <td className="py-3 px-3 text-slate-700 leading-relaxed text-xs">
        <div className="line-clamp-2">{item.content}</div>
      </td>
      <td className="py-3 px-3 text-right">
        <Button
          intent="link"
          scale="xs"
          className="!text-[#DC2626] text-xs font-semibold hover:underline !p-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(item.id);
          }}
        >
          Chi tiết
        </Button>
      </td>
    </tr>
  );
}
