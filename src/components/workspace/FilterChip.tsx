"use client";

import type { ReactNode } from "react";

interface FilterChipProps {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
  /** Chấm màu đánh dấu nhóm hồ sơ đến lượt người đang đăng nhập */
  highlight?: boolean;
}

export default function FilterChip({ active, count, onClick, children, highlight }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
        active
          ? "border-[#0B2546] bg-[#0B2546] text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
      }`}
    >
      {highlight && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />}
      {children}
      <span className={active ? "text-white/80" : "text-slate-400"}>{count}</span>
    </button>
  );
}
