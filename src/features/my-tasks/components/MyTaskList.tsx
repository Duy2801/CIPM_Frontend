"use client";

import { useState } from "react";
import { CheckOutlined, CloseOutlined, ExclamationCircleOutlined, RightOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Pagination, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { MY_TASK_KIND_META } from "../constants/my-task-tabs";
import type { MyTask, MyTaskTab } from "../utils/my-tasks";

/** Một dòng trong danh sách: việc + loại việc (quyết định nhãn, mốc ngày, nút thao tác) */
export interface MyTaskItem {
  kind: MyTaskTab;
  task: MyTask;
}

interface MyTaskListProps {
  items: MyTaskItem[];
  emptyText: string;
  onOpen: (task: MyTask) => void;
  onSubmit: (task: MyTask) => void;
  onApprove: (task: MyTask) => void;
  onReject: (task: MyTask) => void;
}

type RowActions = Pick<MyTaskListProps, "onOpen" | "onSubmit" | "onApprove" | "onReject">;

const PAGE_SIZE = 15;
const date = (value?: string) => (value ? formatDateVi(value) : "—");

/** Danh sách việc: mỗi việc một dòng (nhãn · tên việc / dự án · giai đoạn), mốc ngày và thao tác bên phải */
export default function MyTaskList({ items, emptyText, ...actions }: MyTaskListProps) {
  const [page, setPage] = useState(1);
  const lastPage = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, lastPage);
  const visible = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (items.length === 0) {
    return <div className="py-14 text-center text-sm text-slate-400">{emptyText}</div>;
  }

  return (
    <div>
      <ul className="m-0 list-none divide-y divide-slate-100 p-0">
        {visible.map((item) => (
          <TaskRow key={`${item.kind}:${item.task.projectId}:${item.task.step.id}`} item={item} {...actions} />
        ))}
      </ul>
      {items.length > PAGE_SIZE && (
        <div className="flex justify-end border-t border-slate-100 px-4 py-2.5">
          <Pagination size="small" current={current} pageSize={PAGE_SIZE} total={items.length} onChange={setPage} showSizeChanger={false} />
        </div>
      )}
    </div>
  );
}

function TaskRow({ item: { kind, task }, onOpen, onSubmit, onApprove, onReject }: RowActions & { item: MyTaskItem }) {
  const { step } = task;
  const meta = MY_TASK_KIND_META[kind];
  const showAssignee = kind === "review" || kind === "approved" || kind === "rejected";
  const time = timeInfo(kind, task);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(task);
      }}
      className="group flex cursor-pointer flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4"
    >
      {/* Nhãn loại việc · tên việc / dự án */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("shrink-0 rounded border px-1.5 py-px text-[11px] font-medium", meta.chipClass)}>{meta.chip}</span>
          <span className="shrink-0 font-mono text-xs font-semibold text-slate-500">{step.code}</span>
          <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#DC2626]" title={step.name}>
            {step.name}
          </span>
          {kind === "returned" && step.rejectionReason && (
            <Tooltip title={`Lý do từ chối: ${step.rejectionReason}`}>
              <ExclamationCircleOutlined className="shrink-0 cursor-help text-rose-500" />
            </Tooltip>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500" title={`${task.projectName} · ${task.procedureName}`}>
          <span className="font-medium text-slate-700">{task.projectName}</span>
          <Dot />
          {task.procedureName}
          <Dot />
          Giai đoạn {step.groupCode}
          {showAssignee && step.assignedTo && (
            <>
              <Dot />
              Người làm: <span className="text-slate-700">{step.assignedTo}</span>
            </>
          )}
        </div>
      </div>

      {/* Mốc thời gian */}
      <div className="shrink-0 text-xs sm:w-32 sm:text-right">
        <span className="text-slate-400">{time.label} </span>
        <span className={cn("font-medium tabular-nums", time.danger ? "text-rose-600" : "text-slate-700")}>{time.value}</span>
        {time.danger && <div className="text-[11px] font-semibold text-rose-600">Quá hạn</div>}
      </div>

      {/* Thao tác */}
      <div className="flex shrink-0 items-center gap-1.5 sm:w-44 sm:justify-end" onClick={(e) => e.stopPropagation()}>
        {(kind === "todo" || kind === "returned") && (
          <Button
            intent="primary"
            scale="compact"
            icon={<SendOutlined />}
            onClick={() => onSubmit(task)}
            className="!border-[#DC2626] !bg-[#DC2626] font-semibold hover:!bg-[#B91C1C]"
          >
            {kind === "returned" ? "Nộp lại" : "Nộp kết quả"}
          </Button>
        )}
        {kind === "review" && (
          <>
            <Button
              intent="primary"
              scale="compact"
              icon={<CheckOutlined />}
              onClick={() => onApprove(task)}
              className="!border-emerald-600 !bg-emerald-600 font-semibold hover:!bg-emerald-700"
            >
              Duyệt
            </Button>
            <Button
              intent="outline"
              scale="compact"
              icon={<CloseOutlined />}
              onClick={() => onReject(task)}
              className="!border-slate-200 !text-slate-600 hover:!border-rose-300 hover:!text-rose-600"
            >
              Từ chối
            </Button>
          </>
        )}
        {kind !== "todo" && kind !== "returned" && kind !== "review" && (
          <RightOutlined className="text-xs text-slate-300 group-hover:text-slate-500" aria-hidden />
        )}
      </div>
    </li>
  );
}

const Dot = () => <span className="mx-1.5 text-slate-300">·</span>;

/** Mốc thời gian hiện ở dòng: hạn làm / ngày nộp / ngày duyệt / ngày từ chối */
export function timeInfo(kind: MyTaskTab, task: MyTask): { label: string; value: string; raw?: string; danger?: boolean } {
  const { step } = task;
  switch (kind) {
    case "submitted":
    case "review":
      return { label: "Nộp", value: date(step.submittedAt), raw: step.submittedAt };
    case "done":
    case "approved":
      return { label: "Duyệt", value: date(step.approvedAt), raw: step.approvedAt };
    case "rejected":
      return { label: "Từ chối", value: date(step.rejectedAt), raw: step.rejectedAt };
    default:
      return { label: "Hạn", value: date(step.endDatePlanned), raw: step.endDatePlanned, danger: task.overdue };
  }
}
