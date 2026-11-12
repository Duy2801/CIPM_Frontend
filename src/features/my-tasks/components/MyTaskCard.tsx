"use client";

import { cn } from "@/utils/cn";
import { useMyTask } from "../hooks/useMyTaskQueries";
import { useMyTaskStore } from "../hooks/useMyTaskStore";
import type { MyTaskTab } from "../utils/my-tasks";
import MyTaskCardBody from "./MyTaskCardBody";

interface MyTaskCardProps {
  kind: MyTaskTab;
  projectId: string;
  stepId: string;
  readonly?: boolean;
  proxy?: boolean;
}

export default function MyTaskCard({ kind, projectId, stepId, readonly, proxy }: MyTaskCardProps) {
  const task = useMyTask({ projectId, stepId });
  const openTask = useMyTaskStore((s) => s.openTask);
  if (!task) return null;

  const { step } = task;
  const locked = !task.reached;
  const onTurn = kind === "accept" && task.reached;
  const open = () => openTask({ projectId, stepId });
  const proxyBadge = proxy && !locked && (
    <span
      title={`Việc của ${step.assignedTo || "cán bộ khác"} — bạn có quyền làm hộ`}
      className="absolute -top-2 right-3 rounded-full bg-amber-500 px-2 py-px text-[10px] font-semibold text-white shadow-sm"
    >
      Làm hộ
    </span>
  );

  if (readonly || locked) {
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === "Enter" && open()}
        aria-label={`${step.code} ${step.name} — ${
          locked ? "chưa tới lượt" : `việc của ${step.assignedTo || "cán bộ khác"}`
        }, chỉ xem`}
        className={cn(
          "group/ro relative cursor-pointer select-none rounded-lg border bg-white/60 p-3 transition focus-visible:outline-2 focus-visible:outline-[#DC2626]",
          onTurn ? "border-violet-400 ring-1 ring-violet-200" : "border-dashed border-slate-200",
        )}
      >
        {proxyBadge}
        <div className="opacity-55 grayscale-[60%] transition group-hover/ro:opacity-80">
          <MyTaskCardBody kind={kind} projectId={projectId} stepId={stepId} />
        </div>
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-white p-3 shadow-xs transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#DC2626]",
        proxy
          ? "border-dashed border-amber-300 hover:border-amber-400"
          : onTurn
            ? "border-violet-400 ring-1 ring-violet-200 hover:border-violet-500"
            : "border-slate-200 hover:border-slate-300",
      )}
    >
      {proxyBadge}
      <MyTaskCardBody kind={kind} projectId={projectId} stepId={stepId} />
    </article>
  );
}
