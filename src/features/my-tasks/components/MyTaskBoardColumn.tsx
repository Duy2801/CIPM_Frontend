"use client";

import type { ReactNode } from "react";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { MY_TASK_COLUMNS, type MyTaskColumn } from "@/shared/my-tasks/constants/my-task-tabs";
import { useMyTaskColumns } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import MyTaskCard from "./MyTaskCard";

const COLUMN_STYLE: Record<MyTaskColumn, { icon: ReactNode; bar: string; iconBox: string; header: string; title: string }> = {
  accept: {
    icon: <InboxOutlined />,
    bar: "border-t-violet-500 border-b-violet-500",
    iconBox: "bg-violet-500 text-white shadow-sm shadow-violet-200",
    header: "bg-gradient-to-b from-violet-50 to-white",
    title: "text-violet-900",
  },
  processing: {
    icon: <SyncOutlined />,
    bar: "border-t-blue-500 border-b-blue-500",
    iconBox: "bg-blue-500 text-white shadow-sm shadow-blue-200",
    header: "bg-gradient-to-b from-blue-50 to-white",
    title: "text-blue-900",
  },
  pending: {
    icon: <ClockCircleOutlined />,
    bar: "border-t-amber-500 border-b-amber-500",
    iconBox: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    header: "bg-gradient-to-b from-amber-50 to-white",
    title: "text-amber-900",
  },
  done: {
    icon: <CheckCircleOutlined />,
    bar: "border-t-emerald-500 border-b-emerald-500",
    iconBox: "bg-emerald-500 text-white shadow-sm shadow-emerald-200",
    header: "bg-gradient-to-b from-emerald-50 to-white",
    title: "text-emerald-900",
  },
  incident: {
    icon: <WarningOutlined />,
    bar: "border-t-orange-500 border-b-orange-500",
    iconBox: "bg-orange-500 text-white shadow-sm shadow-orange-200",
    header: "bg-gradient-to-b from-orange-50 to-white",
    title: "text-orange-900",
  },
  rejected: {
    icon: <StopOutlined />,
    bar: "border-t-rose-500 border-b-rose-500",
    iconBox: "bg-rose-500 text-white shadow-sm shadow-rose-200",
    header: "bg-gradient-to-b from-rose-50 to-white",
    title: "text-rose-900",
  },
};

interface MyTaskBoardColumnProps {
  column: MyTaskColumn;
  width?: number;
}

export default function MyTaskBoardColumn({ column, width }: MyTaskBoardColumnProps) {
  const items = useMyTaskColumns().columns[column];
  const meta = MY_TASK_COLUMNS[column];
  const style = COLUMN_STYLE[column];

  return (
    <section
      aria-label={meta.label}
      style={width ? { width } : undefined}
      className={cn(
        "flex h-full min-h-[360px] w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 border-t-[3px] border-b-[3px] bg-slate-100/70 shadow-xs",
        style.bar,
      )}
    >
      <header className={cn("flex items-center justify-center gap-2.5 border-b border-slate-200/80 px-3 py-3", style.header)}>
        <Tooltip title={meta.hint} placement="topLeft">
          <span
            className={cn("flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded-lg text-sm", style.iconBox)}
            aria-hidden
          >
            {style.icon}
          </span>
        </Tooltip>
        <h2 className={cn("m-0 min-w-0 truncate text-[15px] font-bold tracking-tight", style.title)}>{meta.label}</h2>
      </header>

      <div
        data-board-scroll
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 py-2.5 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]"
      >
        {items.length === 0 ? (
          <p className="m-0 px-2 py-8 text-center text-xs text-slate-400">{meta.empty}</p>
        ) : (
          items.map(({ kind, task, readonly, proxy }) => (
            <MyTaskCard
              key={`${kind}:${task.projectId}:${task.step.id}`}
              kind={kind}
              projectId={task.projectId}
              stepId={task.step.id}
              readonly={readonly}
              proxy={proxy}
            />
          ))
        )}
      </div>
    </section>
  );
}
