"use client";

import { useState } from "react";
import { RightOutlined, UserOutlined } from "@ant-design/icons";
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
  /** Tắt nút "Xem thêm" ở dưới (dùng khi đã phân trang ở phía trên) */
  hideLoadMore?: boolean;
}

/** Danh sách nhật ký: mỗi dòng "> ngày giờ · người thực hiện · thao tác · tên đối tượng", bấm để xem "Thay đổi: cũ → mới" */
export default function ActivityTimeline({
  entries,
  emptyText,
  showActor = true,
  showModule = false,
  pageSize = 8,
  hideLoadMore = false,
}: ActivityTimelineProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(pageSize);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs italic text-slate-400">
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

  const displayedEntries = hideLoadMore ? entries : entries.slice(0, visible);

  return (
    <div className="space-y-1.5">
      {displayedEntries.map((entry) => {
        const open = openIds.has(entry.id);
        const hasDetail = Boolean(entry.changes?.length || entry.note || entry.targetName);
        return (
          <div
            key={entry.id}
            className={`overflow-hidden rounded-lg border transition-all ${
              open ? "border-amber-300 shadow-xs bg-white ring-1 ring-amber-200/50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={() => hasDetail && toggle(entry.id)}
              className={`group flex w-full items-center gap-2 sm:gap-2.5 px-3.5 py-2 text-left text-xs sm:text-[13px] leading-normal transition-colors ${
                hasDetail ? "cursor-pointer hover:bg-slate-50/80" : "cursor-default"
              }`}
              aria-expanded={open}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-transform ${
                  open ? "rotate-90 text-amber-700" : "text-slate-400"
                } ${hasDetail ? "group-hover:text-slate-600" : "invisible"}`}
              >
                <RightOutlined className="text-[10px]" />
              </span>

              {/* Thời gian */}
              <span className="shrink-0 font-semibold tabular-nums text-slate-800 text-xs sm:text-[12.5px]">
                {formatActivityTime(entry.at)}
              </span>

              {/* Người thực hiện (badge nhỏ gọn) */}
              {showActor && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                  <UserOutlined className="text-[9px] text-slate-400" />
                  <span>{entry.actorName}</span>
                </span>
              )}

              {/* Phân hệ */}
              {showModule && (
                <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {entry.module}
                </span>
              )}

              {/* Thao tác & Tên đối tượng chi tiết trải dài vừa vặn khung hình */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs sm:text-[13px]">
                <span className="shrink-0 font-medium text-slate-900" title={entry.action}>
                  {entry.action}
                </span>
                {entry.targetName && (
                  <span
                    className="hidden sm:inline-block min-w-0 flex-1 truncate text-slate-500 font-normal"
                    title={entry.targetName}
                  >
                    — {entry.targetName}
                  </span>
                )}
              </div>
            </button>

            {open && (
              <div className="border-t border-slate-100 bg-amber-50/20 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px]">
                {entry.targetName && (
                  <div className="mb-2 text-slate-600">
                    <span className="font-medium text-slate-500">Đối tượng: </span>
                    <span className="font-semibold text-slate-800">{entry.targetName}</span>
                  </div>
                )}
                {entry.changes && entry.changes.length > 0 && (
                  <div className="mt-1.5">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Chi tiết thay đổi ({entry.changes.length})
                    </div>
                    <div className="divide-y divide-slate-200/70 rounded-lg border border-slate-200 bg-white shadow-2xs">
                      {entry.changes.map((c, i) => (
                        <div
                          key={`${c.label}-${i}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs sm:text-[12.5px]"
                        >
                          <span className="font-medium text-slate-600">{c.label}</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {c.from !== undefined && (
                              <>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 line-through text-xs">
                                  {c.from || "Trống"}
                                </span>
                                <span className="text-slate-400">→</span>
                              </>
                            )}
                            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 text-xs">
                              {c.to || "Trống"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {entry.note && (
                  <div className="mt-2 rounded-md border border-amber-200/70 bg-amber-50/70 px-2.5 py-1.5 text-xs text-amber-800">
                    <span className="font-semibold">Ghi chú: </span>
                    <span>{entry.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {!hideLoadMore && entries.length > visible && (
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
