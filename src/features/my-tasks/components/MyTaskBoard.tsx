"use client";

import { useState } from "react";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  HolderOutlined,
  InboxOutlined,
  ProjectOutlined,
  StopOutlined,
  SyncOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Dropdown, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import {
  DROP_HINT,
  MY_TASK_COLUMN_ORDER,
  MY_TASK_COLUMNS,
  REJECTED_FILTERS,
  dropActionOf,
  matchesRejectedFilter,
  type MyTaskColumn,
  type MyTaskDropAction,
  type RejectedFilter,
} from "../constants/my-task-tabs";
import type { MyTask, MyTaskTab } from "../utils/my-tasks";

/** Một thẻ trên bảng: việc + loại việc (quyết định nhãn, mốc ngày, có kéo được không) */
export interface MyTaskItem {
  kind: MyTaskTab;
  task: MyTask;
  /** Việc của người khác: hiện mờ để biết dự án đang làm tới đâu; mở xem được, không kéo / thao tác được */
  readonly?: boolean;
}

interface MyTaskBoardProps {
  columns: Record<MyTaskColumn, MyTaskItem[]>;
  onOpen: (task: MyTask) => void;
  /** Thả thẻ vào cột: tiếp nhận / nộp kết quả / duyệt / từ chối / báo sự cố / xử lý xong sự cố */
  onDrop: (item: MyTaskItem, action: MyTaskDropAction) => void;
}

const date = (value?: string) => (value ? formatDateVi(value) : "—");
const keyOf = (item: MyTaskItem) => `${item.task.projectId}:${item.task.step.id}`;
/** Màu + biểu tượng riêng của từng cột (viền trên, ô biểu tượng) */
const COLUMN_STYLE: Record<MyTaskColumn, { icon: React.ReactNode; bar: string; iconBox: string }> = {
  accept: {
    icon: <InboxOutlined />,
    bar: "border-t-violet-500",
    iconBox: "bg-violet-100 text-violet-600",
  },
  processing: {
    icon: <SyncOutlined />,
    bar: "border-t-blue-500",
    iconBox: "bg-blue-100 text-blue-600",
  },
  pending: {
    icon: <ClockCircleOutlined />,
    bar: "border-t-amber-500",
    iconBox: "bg-amber-100 text-amber-600",
  },
  done: {
    icon: <CheckCircleOutlined />,
    bar: "border-t-emerald-500",
    iconBox: "bg-emerald-100 text-emerald-600",
  },
  rejected: {
    icon: <StopOutlined />,
    bar: "border-t-rose-500",
    iconBox: "bg-rose-100 text-rose-600",
  },
};

/** Việc kéo được: việc mới giao, việc mình cần nộp / nộp lại, việc chờ mình duyệt, sự cố */
const isDraggable = (kind: MyTaskTab) =>
  kind === "accept" || kind === "todo" || kind === "returned" || kind === "review" || kind === "incident";

/**
 * Bảng việc 5 cột: Chờ tiếp nhận · Đang xử lý · Chờ duyệt · Hoàn thành · Từ chối / Sự cố.
 * Kéo việc mới giao sang Đang xử lý = tiếp nhận; việc đang làm sang Chờ duyệt = nộp kết quả, sang Từ chối / Sự cố = báo sự cố;
 * việc chờ duyệt sang Hoàn thành = duyệt, sang Từ chối / Sự cố = từ chối; sự cố về Đang xử lý = đã xử lý xong.
 */
export default function MyTaskBoard({ columns, onOpen, onDrop }: MyTaskBoardProps) {
  const [dragging, setDragging] = useState<MyTaskItem | null>(null);
  const [over, setOver] = useState<MyTaskColumn | null>(null);
  const [rejectedFilter, setRejectedFilter] = useState<RejectedFilter>("all");

  const endDrag = () => {
    setDragging(null);
    setOver(null);
  };

  return (
    <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {MY_TASK_COLUMN_ORDER.map((col) => {
        const meta = MY_TASK_COLUMNS[col];
        const action = dragging ? dropActionOf(dragging.kind, col) : null;
        const all = columns[col];
        const items = col === "rejected" ? all.filter((item) => matchesRejectedFilter(item.kind, rejectedFilter)) : all;
        return (
          <section
            key={col}
            aria-label={meta.label}
            onDragOver={(e) => {
              if (!action) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (over !== col) setOver(col);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((cur) => (cur === col ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && action) onDrop(dragging, action);
              endDrag();
            }}
            className={cn(
              "flex min-h-[320px] w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-t-[3px] bg-slate-50/80 transition-colors sm:w-[360px] xl:h-[calc(100vh-200px)]",
              COLUMN_STYLE[col].bar,
              action ? "border-dashed border-slate-300" : "border-slate-200/80",
              action && over === col && "border-[#DC2626] bg-red-50/60",
              dragging && !action && "opacity-60",
            )}
          >
            <ColumnHeader
              column={col}
              hint={meta.hint}
              label={
                col === "rejected" ? (
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      selectable: true,
                      selectedKeys: [rejectedFilter],
                      onClick: ({ key }) => setRejectedFilter(key as RejectedFilter),
                      items: REJECTED_FILTERS.map((f) => ({
                        key: f.value,
                        label: <span className="text-[13px]">{f.label}</span>,
                      })),
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Lọc từ chối hay sự cố"
                      className="-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1 py-0.5 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                    >
                      {REJECTED_FILTERS.find((f) => f.value === rejectedFilter)?.label}
                      <DownOutlined className="text-[9px] text-slate-400" />
                    </button>
                  </Dropdown>
                ) : (
                  meta.label
                )
              }
            />
            <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5">
              {action && (
                <div
                  className={cn(
                    "rounded-lg border border-dashed px-3 py-2.5 text-center text-xs font-medium",
                    over === col ? "border-[#DC2626] text-[#DC2626]" : "border-slate-300 text-slate-500",
                  )}
                >
                  {DROP_HINT[action]}
                </div>
              )}
              {items.length === 0 && !action ? (
                <p className="m-0 px-2 py-8 text-center text-xs text-slate-400">
                  {col === "rejected" && all.length > 0 ? "Không có việc nào theo bộ lọc." : meta.empty}
                </p>
              ) : (
                items.map((item) => (
                  <TaskCard
                    key={`${item.kind}:${keyOf(item)}`}
                    item={item}
                    dragging={dragging ? keyOf(dragging) === keyOf(item) : false}
                    onOpen={onOpen}
                    onDragStart={() => setDragging(item)}
                    onDragEnd={endDrag}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}

    </div>
  );
}

function ColumnHeader({
  column,
  label,
  hint,
}: {
  column: MyTaskColumn;
  label: React.ReactNode;
  hint: string;
}) {
  const style = COLUMN_STYLE[column];
  return (
    <header className="flex items-center gap-2.5 border-b border-slate-200/80 bg-white px-3 py-2.5">
      <Tooltip title={hint} placement="topLeft">
        <span
          className={cn("flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded-lg text-sm", style.iconBox)}
          aria-hidden
        >
          {style.icon}
        </span>
      </Tooltip>
      <h2 className="m-0 min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">{label}</h2>
    </header>
  );
}

function TaskCard({
  item: { kind, task, readonly },
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  item: MyTaskItem;
  dragging: boolean;
  onOpen: (task: MyTask) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { step } = task;
  const locked = !task.reached;
  const draggable = !readonly && !locked && isDraggable(kind);
  const time = timeInfo(kind, task);
  // Chờ tiếp nhận: bước đang tới lượt được viền tím (màu cột) để biết lúc này làm được bước nào
  const onTurn = kind === "accept" && task.reached;

  if (readonly || locked) {
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpen(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen(task);
        }}
        aria-label={`${step.code} ${step.name} — ${
          locked ? "chưa tới lượt" : `việc của ${step.assignedTo || "cán bộ khác"}`
        }, chỉ xem`}
        className={cn(
          "group/ro relative cursor-pointer select-none rounded-lg border bg-white/60 p-3 transition focus-visible:outline-2 focus-visible:outline-[#DC2626]",
          // Việc của người khác đang tới lượt: viền tím rõ (không làm mờ viền) để biết đợt này đang làm những bước nào
          onTurn ? "border-violet-400 ring-1 ring-violet-200" : "border-dashed border-slate-200",
        )}
      >
        <div className="opacity-55 grayscale-[60%] transition group-hover/ro:opacity-80">
          <CardBody kind={kind} task={task} time={time} />
        </div>
      </article>
    );
  }

  return (
    <article
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", step.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(task);
      }}
      className={cn(
        "group relative rounded-lg border bg-white p-3 shadow-xs transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#DC2626]",
        onTurn
          ? "border-violet-400 ring-1 ring-violet-200 hover:border-violet-500"
          : "border-slate-200 hover:border-slate-300",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        dragging && "opacity-40",
      )}
    >
      <CardBody kind={kind} task={task} time={time} draggable={draggable} />
    </article>
  );
}

/** Nhãn lượt làm ở cột Chờ tiếp nhận */
function TurnBadge({ reached }: { reached: boolean }) {
  return reached ? (
    <span className="inline-block rounded-full bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
      Đang tới lượt
    </span>
  ) : (
    <span className="inline-block rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-500">
      Chưa tới lượt
    </span>
  );
}

/** Nội dung thẻ: mã · tên bước · dự án / giai đoạn / người thực hiện · quy trình + mốc thời gian */
function CardBody({
  kind,
  task,
  time,
  draggable = false,
}: {
  kind: MyTaskTab;
  task: MyTask;
  time: ReturnType<typeof timeInfo>;
  draggable?: boolean;
}) {
  const { step } = task;
  return (
    <>
        {/* Mã + tên bước trên cùng một dòng, dài thì xuống dòng */}
        <div className="flex items-start gap-1.5">
          <p className="m-0 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-900 group-hover:text-[#DC2626]">
            <span className="mr-1.5 font-mono text-[12px] font-semibold text-slate-500">{step.code}</span>
            {step.name}
          </p>
          {kind === "returned" && step.rejectionReason && (
            <Tooltip title={`Lý do từ chối: ${step.rejectionReason}`}>
              <ExclamationCircleOutlined className="mt-0.5 shrink-0 cursor-help text-rose-500" />
            </Tooltip>
          )}
          {kind === "incident" && step.incidentReason && (
            <Tooltip title={`Sự cố: ${step.incidentReason}`}>
              <WarningOutlined className="mt-0.5 shrink-0 cursor-help text-orange-500" />
            </Tooltip>
          )}
          {draggable && (
            <HolderOutlined className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-500" aria-hidden />
          )}
        </div>

        <dl className="m-0 mt-2 space-y-1 text-xs">
          <InfoRow icon={<ProjectOutlined />} label="Dự án" value={task.projectName} strong />
          <InfoRow icon={<FlagOutlined />} label="Giai đoạn" value={step.groupCode} />
          <InfoRow icon={<UserOutlined />} label="Người thực hiện" value={step.assignedTo || "Chưa giao"} />
        </dl>

        {kind === "incident" && step.incidentReason && (
          <p className="m-0 mt-2 line-clamp-2 rounded bg-orange-50 px-2 py-1 text-[11px] text-orange-700" title={step.incidentReason}>
            {step.incidentReason}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
          {/* Chờ tiếp nhận: chân thẻ cho biết bước đã tới lượt chưa; cột khác hiện tên quy trình */}
          {kind === "accept" ? (
            <TurnBadge reached={task.reached} />
          ) : (
            <span className="truncate text-slate-400" title={task.procedureName}>
              {task.procedureName}
            </span>
          )}
          <span className="shrink-0 tabular-nums text-slate-500">
            {time.label} {time.value}
          </span>
        </div>
    </>
  );
}

/** Một dòng thông tin trên thẻ: biểu tượng · nhãn · giá trị (dài thì cắt, rê chuột xem đủ) */
function InfoRow({ icon, label, value, strong }: { icon: React.ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[11px] text-slate-400" aria-hidden>
        {icon}
      </span>
      <dt className="w-[92px] shrink-0 text-slate-400">{label}</dt>
      <dd className={cn("m-0 min-w-0 flex-1 truncate", strong ? "font-semibold text-slate-800" : "text-slate-600")} title={value}>
        {value}
      </dd>
    </div>
  );
}

/** Mốc thời gian trên thẻ: hạn làm / ngày nộp / ngày duyệt / ngày từ chối */
export function timeInfo(kind: MyTaskTab, task: MyTask): { label: string; value: string; raw?: string } {
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
    case "incident":
      return { label: "Báo", value: date(step.incidentReportedAt), raw: step.incidentReportedAt };
    default:
      return { label: "Hạn", value: date(step.endDatePlanned), raw: step.endDatePlanned };
  }
}
