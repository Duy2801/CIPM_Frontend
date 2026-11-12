"use client";

export default function ProjectProgressCell({ actualProgress }: { actualProgress: number }) {
  return (
    <div className="w-[110px] max-w-full mx-auto flex flex-col items-center gap-1">
      <span className="text-center tabular-nums text-xs font-medium text-slate-800">{actualProgress}%</span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`Tiến độ ${actualProgress}%`}>
        <div style={{ width: `${actualProgress}%` }} className="h-full rounded-full bg-[#DC2626] transition-all" />
      </div>
    </div>
  );
}
