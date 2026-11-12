"use client";

import type React from "react";
import { EyeOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { type CategorySummary, type DisbursementEntry } from "../../../utils/project-disbursement";
import { GRID, money, percent } from "./disbursement-format";

export default function DisbursementCategoryRow({
  row,
  totalInvestment,
  open,
  onToggle,
  entries,
  canDisburse,
  onDisburse,
  onWithdraw,
  onView,
}: {
  row: CategorySummary;
  totalInvestment: number;
  open: boolean;
  onToggle: () => void;
  entries: DisbursementEntry[];
  canDisburse: boolean;
  onDisburse: () => void;
  onWithdraw: () => void;
  onView: (entry: DisbursementEntry) => void;
}) {
  const hasData = row.count > 0;
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const share = percent(row.total, totalInvestment);
  const muted = hasData ? "" : "text-slate-300";

  return (
    <div className="border-b border-slate-100">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          GRID,
          "group cursor-pointer px-4 py-3 text-xs transition-colors hover:bg-slate-50",
          open && "bg-red-50/40 hover:bg-red-50/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <RightOutlined
            className={cn(
              "w-3 shrink-0 text-[10px] text-slate-400 transition-transform",
              open && "rotate-90 !text-[#DC2626]",
            )}
          />
          <span
            className={cn(
              "truncate font-medium",
              hasData ? "text-slate-800" : "text-slate-500",
            )}
            title={row.category}
          >
            {row.category}
          </span>
        </span>
        <span className={cn("text-center text-slate-700", muted)}>
          {hasData ? row.count : "—"}
        </span>
        <span className={cn("text-center font-semibold text-slate-900", muted)}>
          {hasData ? money(row.total) : "—"}
        </span>
        <span className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-[#DC2626]"
              style={{ width: `${share}%` }}
            />
          </span>
          <span
            className={cn(
              "w-11 shrink-0 text-left text-xs font-medium text-slate-700",
              muted,
            )}
          >
            {share.toFixed(1)}%
          </span>
        </span>
        <span className={cn("text-center text-slate-600", muted)}>
          {row.lastDate ? formatDateVi(row.lastDate) : "—"}
        </span>
        <span className="flex justify-center gap-1.5">
          {canDisburse &&
            (hasData ? (
              <>
                <Button
                  intent="outline"
                  scale="xs"
                  onClick={act(onDisburse)}
                  className="!h-7 px-2.5 !text-xs"
                >
                  Giải ngân thêm
                </Button>
                <Button
                  intent="outline"
                  scale="xs"
                  onClick={act(onWithdraw)}
                  disabled={row.total <= 0}
                  className="!h-7 px-2.5 !text-xs hover:!border-rose-400 hover:!text-rose-600"
                >
                  Thu hồi
                </Button>
              </>
            ) : (
              <Button
                intent="outline"
                scale="xs"
                onClick={act(onDisburse)}
                className="!h-7 px-2.5 !text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                Giải ngân
              </Button>
            ))}
        </span>
      </div>

      {open && !hasData && (
        <div className="border-t border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 pl-9 text-xs text-slate-400">
          Chưa có đợt giải ngân nào.
          {canDisburse && (
            <button
              type="button"
              onClick={onDisburse}
              className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#DC2626] hover:underline"
            >
              Giải ngân ngay
            </button>
          )}
        </div>
      )}
      {open && hasData && (
        <ul className="m-0 list-none border-t border-slate-100 bg-slate-50/60 p-0">
          {entries.map((e) => {
            const withdraw = e.kind === "withdraw";
            const files = e.attachments?.length ?? 0;
            return (
              <li
                key={e.id}
                onClick={() => onView(e)}
                className={cn(
                  GRID,
                  "group/entry cursor-pointer border-b border-slate-100 px-4 py-2 text-xs transition-colors last:border-b-0 hover:bg-white",
                )}
              >
                <span className="min-w-0 pl-5">
                  <span className="block truncate font-medium text-slate-700" title={e.content}>
                    {withdraw && <span className="mr-1.5 font-semibold text-rose-600">Thu hồi ·</span>}
                    {e.content || <span className="font-normal italic text-slate-400">Không có nội dung</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {e.createdBy}
                    {files > 0 && ` · ${files} tệp đính kèm`}
                  </span>
                </span>
                <span />
                <span className={cn("text-center font-semibold", withdraw ? "text-rose-600" : "text-slate-800")}>
                  {withdraw ? "−" : ""}
                  {money(e.amount)}
                </span>
                <span />
                <span className="text-center text-slate-600">{formatDateVi(e.date)}</span>
                <span className="flex justify-center">
                  <Tooltip title="Xem chi tiết">
                    <button
                      type="button"
                      aria-label="Xem chi tiết đợt"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onView(e);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-sm text-slate-400 transition-colors hover:bg-red-50 hover:text-[#DC2626] group-hover/entry:text-slate-600"
                    >
                      <EyeOutlined />
                    </button>
                  </Tooltip>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
