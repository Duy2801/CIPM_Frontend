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

export function DisbursementRateStat({ label, rate }: { label: string; rate: number }) {
  return (
    <div className="border-t border-l border-slate-200 px-4 py-3 lg:border-t-0">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-2.5">
        <span className="text-sm font-bold text-slate-900">{rate.toFixed(1)}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#DC2626] transition-all" style={{ width: `${Math.min(100, rate)}%` }} />
        </div>
      </div>
    </div>
  );
}

export function DisbursementSummaryBox({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-1.5 truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50/60 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
