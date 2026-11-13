"use client";

import React from "react";
import { Flex } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useDisbursementChart } from "../hooks/useDisbursementChart";

const GRID_COLS: Record<number, string> = { 3: "grid-cols-3", 4: "grid-cols-4" };
const BAR_COLUMN = "flex flex-col items-center flex-1 max-w-[30px] sm:max-w-[40px] 2xl:max-w-[48px] h-full justify-end";

const percentOf = (value: number, max: number) => Math.min(100, Math.round((value / max) * 100));

export default function DisbursementBars() {
  const { items, maxScale } = useDisbursementChart();
  const gridCols = GRID_COLS[items.length] ?? "grid-cols-5";

  return (
    <div className="w-full pt-4 pb-2 select-none relative">
      <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-dashed border-slate-200 w-full" />
        ))}
      </div>

      <div
        className={cn(
          "grid gap-2 sm:gap-6 items-end h-[190px] px-2 sm:px-4 border-b border-slate-200 relative z-10",
          gridCols,
        )}
      >
        {items.map((item) => (
          <Flex key={item.label} vertical align="center" justify="end" className="h-full">
            <Flex align="end" justify="center" gap={4} className="w-full h-full pb-0.5">
              <div className={BAR_COLUMN}>
                <span className="text-[10px] sm:text-[10.5px] font-mono text-slate-500 font-bold mb-1 whitespace-nowrap">
                  {item.plan} tỷ
                </span>
                <div
                  style={{ height: `${percentOf(item.plan, maxScale)}%` }}
                  className="w-full rounded-t bg-[#cbd5e1] hover:brightness-95 transition-all"
                />
              </div>
              <div className={BAR_COLUMN}>
                <span
                  className={cn(
                    "text-[10px] sm:text-[10.5px] font-mono font-bold mb-1 whitespace-nowrap",
                    item.actual > 0 ? "text-slate-800" : "text-slate-400 font-semibold",
                  )}
                >
                  {item.actual > 0 ? `${item.actual} tỷ` : "Dự kiến"}
                </span>
                <div
                  style={{ height: item.actual > 0 ? `${percentOf(item.actual, maxScale)}%` : "6px" }}
                  className={cn(
                    "w-full rounded-t transition-all",
                    item.actual > 0 ? "bg-[#2a78d6] hover:brightness-110" : "bg-slate-100",
                  )}
                />
              </div>
            </Flex>
          </Flex>
        ))}
      </div>

      <div className={cn("grid gap-2 sm:gap-6 pt-3 text-center", gridCols)}>
        {items.map((item) => (
          <div key={item.label} className="flex justify-center items-center">
            {item.isCurrent ? (
              <span className="bg-sky-50 text-[#2a78d6] border border-sky-200 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold inline-block">
                {item.label}
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
