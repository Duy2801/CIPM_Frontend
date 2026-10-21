"use client";

import { useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import { formatActivityTime, type ActivityEntry } from "../utils/activity-log";

interface ActivityTimelineProps {
  entries: ActivityEntry[];
  emptyText: string;
  /** Hiện tên người thực hiện (tắt khi danh sách là việc của chính một người) */
  showActor?: boolean;
  /** Hiện phân hệ (Nhân sự, Tài chính, Thủ tục XDCB...) */
  showModule?: boolean;
  /** Số dòng hiện trước, phần còn lại bấm "Xem thêm" */
  pageSize?: number;
}

/** Danh sách nhật ký: mỗi dòng "> ngày giờ · người thực hiện · thao tác", bấm để xem "Thay đổi: cũ → mới" */
export default function ActivityTimeline({
  entries,
  emptyText,
  showActor = true,
  showModule = false,
  pageSize = 8,
}: ActivityTimelineProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(pageSize);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs italic text-slate-400">
        {emptyText}
      </div>
    );
  }

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-1.5">
      {entries.slice(0, visible).map((entry) => {
        const open = openIds.has(entry.id);
        const hasDetail = Boolean(entry.changes?.length || entry.note || entry.targetName);
        return (
          <div key={entry.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => hasDetail && toggle(entry.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs ${
                hasDetail ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
              }`}
              aria-expanded={open}
            >
              <RightOutlined
                className={`shrink-0 text-[10px] text-slate-400 transition-transform ${open ? "rotate-90" : ""} ${
                  hasDetail ? "" : "invisible"
                }`}
              />
              <span className="shrink-0 font-semibold tabular-nums text-slate-800">{formatActivityTime(entry.at)}</span>
              {showActor && <span className="shrink-0 text-slate-500">{entry.actorName}</span>}
              {showModule && (
                <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 text-[10px] text-slate-500">
                  {entry.module}
                </span>
              )}
              <span className="min-w-0 truncate text-slate-700" title={entry.action}>
                {entry.action}
              </span>
            </button>

            {open && (
              <div className="border-t border-slate-100 px-3 py-2.5 text-xs">
                {entry.targetName && (
                  <div className="mb-1.5 text-slate-500">
                    Đối tượng: <span className="font-medium text-slate-700">{entry.targetName}</span>
                  </div>
                )}
                {entry.changes && entry.changes.length > 0 && (
                  <>
                    <div className="mb-1 font-semibold text-slate-800">Thay đổi</div>
                    <div className="space-y-1 rounded-md bg-slate-50 px-2.5 py-2">
                      {entry.changes.map((c, i) => (
                        <div key={`${c.label}-${i}`} className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-slate-500">{c.label}:</span>
                          {c.from !== undefined && (
                            <>
                              <span className="text-slate-600">{c.from || "Trống"}</span>
                              <span className="text-slate-400">→</span>
                            </>
                          )}
                          <span className="font-semibold text-slate-900">{c.to || "Trống"}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {entry.note && <div className="mt-1.5 text-slate-500">{entry.note}</div>}
              </div>
            )}
          </div>
        );
      })}
      {entries.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + pageSize)}
          className="w-full cursor-pointer rounded-lg border border-dashed border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          Xem thêm ({entries.length - visible})
        </button>
      )}
    </div>
  );
}
