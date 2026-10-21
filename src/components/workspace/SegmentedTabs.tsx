"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface SegmentedTabItem<K extends string> {
  key: K;
  icon: ReactNode;
  label: string;
  badge?: number;
  /** Màu huy hiệu: vàng = việc của bạn, đỏ = cảnh báo, xám = thông tin */
  badgeTone?: "warning" | "danger" | "neutral";
}

interface SegmentedTabsProps<K extends string> {
  items: SegmentedTabItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  className?: string;
}

const BADGE_CLASSES = {
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
};

/**
 * Thanh tab dạng phân đoạn: rãnh xám, các tab chia đều, icon nằm cạnh nhãn,
 * tab đang chọn nổi lên thành thẻ trắng có bóng. Cuộn ngang khi màn hình hẹp.
 */
export default function SegmentedTabs<K extends string>({
  items,
  activeKey,
  onChange,
  className,
}: SegmentedTabsProps<K>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/70 p-1", className)}>
      <div role="tablist" className="flex min-w-max gap-1 sm:min-w-0">
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
                "relative flex min-w-[104px] flex-1 cursor-pointer select-none items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200",
                isActive
                  ? "bg-white font-semibold text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80"
                  : "font-medium text-slate-500 hover:bg-white/70 hover:text-slate-800",
              )}
            >
              <span
                className={cn(
                  "text-sm leading-none transition-colors [&_.anticon]:!m-0",
                  isActive ? "text-[#DC2626]" : "text-slate-400",
                )}
              >
                {item.icon}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-bold leading-4 text-white",
                    BADGE_CLASSES[item.badgeTone ?? "neutral"],
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
