"use client";

import { cn } from "@/utils/cn";

export default function DisbursementStat({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-sm font-bold",
            accent ? "text-[#DC2626]" : "text-slate-900",
          )}
        >
          {value}
        </span>
        {hint && <span className="text-[11px] text-slate-400">· {hint}</span>}
      </div>
    </div>
  );
}
