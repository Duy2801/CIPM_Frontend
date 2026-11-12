"use client";

import type { SegmentedTabItem } from "@/components/workspace";
import { cn } from "@/utils/cn";

export type DetailTab = "info" | `proc:${string}` | "disbursement" | "history";

export default function ProjectDetailTabBar({
  items,
  activeKey,
  onChange,
}: {
  items: SegmentedTabItem<DetailTab>[];
  activeKey: DetailTab;
  onChange: (key: DetailTab) => void;
}) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <div role="tablist" className="flex min-w-0 gap-1.5 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.key)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border-0 px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#DC2626] font-semibold text-white shadow-[0_2px_6px_rgba(220,38,38,0.25)]"
                  : "bg-transparent font-medium text-slate-600 hover:bg-red-50 hover:text-[#DC2626]",
              )}
            >
              <span className="text-[15px] leading-none">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
