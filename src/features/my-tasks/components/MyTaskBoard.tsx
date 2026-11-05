"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import {
  ApartmentOutlined,
  LeftOutlined,
  LockOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
import { Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import {
  DROP_HINT,
  MY_TASK_COLUMN_ORDER,
  MY_TASK_COLUMNS,
  dropActionOf,
  type MyTaskColumn,
  type MyTaskDropAction,
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
const COLUMN_STYLE: Record<
  MyTaskColumn,
  { icon: React.ReactNode; bar: string; iconBox: string; header: string; title: string }
> = {
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

/** Việc kéo được: việc mình cần nộp / nộp lại, việc chờ mình duyệt, sự cố (việc chờ tiếp nhận: mở thẻ, bấm "Thực hiện") */
const isDraggable = (kind: MyTaskTab) =>
  kind === "todo" || kind === "returned" || kind === "review" || kind === "incident";

/**
 * Bảng việc 6 cột: Chờ tiếp nhận · Đang xử lý · Chờ duyệt · Hoàn thành · Từ chối · Sự cố.
 * Việc mới giao: mở thẻ, bấm "Thực hiện" để chuyển sang Đang xử lý; việc đang làm sang Chờ duyệt = nộp kết quả, sang Sự cố = báo sự cố;
 * việc chờ duyệt sang Hoàn thành = duyệt, sang Từ chối = từ chối; sự cố về Đang xử lý = đã xử lý xong.
 */
export default function MyTaskBoard({ columns, onOpen, onDrop }: MyTaskBoardProps) {
  const [dragging, setDragging] = useState<MyTaskItem | null>(null);
  const [over, setOver] = useState<MyTaskColumn | null>(null);

  const endDrag = () => {
    setDragging(null);
    setOver(null);
  };

  const { ref: boardRef, canLeft, canRight, columnWidth, scrollByColumn, panHandlers } = useHorizontalBoard();

  return (
    <div className="relative">
      {/* Nút cuộn ngang cho máy không có chuột cuộn ngang (laptop) */}
      {canLeft && <ScrollButton side="left" onClick={() => scrollByColumn(-1)} />}
      {canRight && <ScrollButton side="right" onClick={() => scrollByColumn(1)} />}
    <div
      ref={boardRef}
      {...panHandlers}
      className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {MY_TASK_COLUMN_ORDER.map((col) => {
        const meta = MY_TASK_COLUMNS[col];
        const action = dragging ? dropActionOf(dragging.kind, col) : null;
        const items = columns[col];
        return (
          <section
            key={col}
            aria-label={meta.label}
            // Cột co giãn theo màn hình: vừa khít số cột nguyên, không bị cắt nửa cột
            style={columnWidth ? { width: columnWidth } : undefined}
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
              // Cột cao vừa màn hình, thẻ cuộn bên trong cột (kiểu Trello) — không tràn ra ngoài
              "flex h-[calc(100vh-240px)] min-h-[360px] w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-t-[3px] border-b-[3px] bg-slate-100/70 shadow-xs transition-colors",
              action ? "border-dashed border-slate-300" : "border-slate-200/80",
              COLUMN_STYLE[col].bar,
              action && over === col && "border-[#DC2626] bg-red-50/60",
              dragging && !action && "opacity-60",
            )}
          >
            <ColumnHeader
              column={col}
              hint={meta.hint}
              label={meta.label}
            />
            <div data-board-scroll className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 py-2.5 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
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
                  {meta.empty}
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
    </div>
  );
}

/** Cột hẹp nhất cho phép và khoảng cách giữa các cột (gap-3) */
const MIN_COLUMN_WIDTH = 320;
const COLUMN_GAP = 12;

/** Màn hình rộng bao nhiêu thì hiện vừa khít bấy nhiêu cột, chia đều bề ngang */
const fitColumnWidth = (boardWidth: number) => {
  const perView = Math.max(1, Math.floor((boardWidth + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP)));
  return Math.floor((boardWidth - COLUMN_GAP * (perView - 1)) / perView);
};

/**
 * Cuộn ngang bảng việc:
 * - Nhấn giữ chuột trái vào chỗ trống của bảng rồi kéo để kéo ngang.
 * - Nút ‹ › hai bên khi còn cột bị khuất.
 */
function useHorizontalBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ canLeft: false, canRight: false });
  const [columnWidth, setColumnWidth] = useState<number>();
  const pan = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setEdges({
        canLeft: el.scrollLeft > 4,
        canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    const resize = () => {
      setColumnWidth(fitColumnWidth(el.clientWidth));
      sync();
    };
    resize();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, []);

  /** Bước của một cột (bề rộng cột + khoảng cách) */
  const step = () => (columnWidth ?? MIN_COLUMN_WIDTH) + COLUMN_GAP;
  /** Bấm ‹ ›: qua đúng một cột, luôn dừng thẳng mép cột (kể cả khi đang lệch giữa chừng) */
  const scrollByColumn = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / step()) + dir;
    el.scrollTo({ left: Math.max(0, index * step()), behavior: "smooth" });
  };
  /** Thả tay sau khi kéo: trượt về mép cột gần nhất */
  const snapToColumn = (el: HTMLElement) =>
    el.scrollTo({ left: Math.round(el.scrollLeft / step()) * step(), behavior: "smooth" });

  const panHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // Chỉ chuột trái, bấm vào chỗ trống (không phải thẻ, nút, ô nhập)
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("article,button,a,input,textarea,[role='button']")) return;
      pan.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const p = pan.current;
      if (!p) return;
      const dx = e.clientX - p.x;
      if (!p.moved && Math.abs(dx) < 4) return;
      if (!p.moved) {
        p.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = "grabbing";
        e.currentTarget.style.userSelect = "none";
      }
      e.currentTarget.scrollLeft = p.left - dx;
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (pan.current?.moved) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        e.currentTarget.style.cursor = "";
        e.currentTarget.style.userSelect = "";
        snapToColumn(e.currentTarget);
      }
      pan.current = null;
    },
  };
  return { ref, ...edges, columnWidth, scrollByColumn, panHandlers: { ...panHandlers, onPointerCancel: panHandlers.onPointerUp } };
}

function ScrollButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Xem cột bên trái" : "Xem cột bên phải"}
      title={side === "left" ? "Cột trước" : "Cột tiếp theo"}
      className={cn(
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md transition hover:border-[#DC2626] hover:text-[#DC2626]",
        side === "left" ? "-left-2" : "-right-2",
      )}
    >
      {side === "left" ? <LeftOutlined /> : <RightOutlined />}
    </button>
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
    <header className={cn("flex items-center justify-center gap-2.5 border-b border-slate-200/80 px-3 py-3", style.header)}>
      <Tooltip title={hint} placement="topLeft">
        <span
          className={cn("flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded-lg text-sm", style.iconBox)}
          aria-hidden
        >
          {style.icon}
        </span>
      </Tooltip>
      <h2 className={cn("m-0 min-w-0 truncate text-[15px] font-bold tracking-tight", style.title)}>{label}</h2>
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
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-500">
      <LockOutlined className="text-[9px]" />
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
        {/* Thứ tự: Dự án · Quy trình → Bước → Giai đoạn · Người thực hiện */}
        <div className="flex items-start gap-1.5">
          <dl className="m-0 min-w-0 flex-1 space-y-1 text-xs">
            <InfoRow icon={<ProjectOutlined />} label="Dự án" value={task.projectName} strong />
            <InfoRow icon={<ApartmentOutlined />} label="Quy trình" value={task.procedureName} />
          </dl>
          {draggable && (
            <HolderOutlined className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-500" aria-hidden />
          )}
          {/* Bước chưa tới lượt: khóa, chờ bước trước hoàn thành */}
          {!task.reached && (
            <Tooltip title="Chưa tới lượt — chờ bước trước hoàn thành">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <LockOutlined className="text-xs" />
              </span>
            </Tooltip>
          )}
        </div>

        {/* Mã + tên bước trên cùng một dòng, dài thì xuống dòng */}
        <div className="mt-2 flex items-start gap-1.5 border-t border-slate-100 pt-2">
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
        </div>

        <dl className="m-0 mt-2 space-y-1 text-xs">
          <InfoRow icon={<FlagOutlined />} label="Giai đoạn" value={step.groupCode} />
          <InfoRow icon={<UserOutlined />} label="Người thực hiện" value={step.assignedTo || "Chưa giao"} />
        </dl>

        {kind === "incident" && step.incidentReason && (
          <p className="m-0 mt-2 line-clamp-2 rounded bg-orange-50 px-2 py-1 text-[11px] text-orange-700" title={step.incidentReason}>
            {step.incidentReason}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-[11px]">
          {/* Chờ tiếp nhận: chân thẻ cho biết bước đã tới lượt chưa */}
          {kind === "accept" && <TurnBadge reached={task.reached} />}
          <span className="ml-auto shrink-0 tabular-nums text-slate-500">
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
