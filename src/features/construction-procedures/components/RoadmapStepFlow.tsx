"use client";

import { useState, type ReactNode } from "react";
import { CaretDownOutlined, CaretRightOutlined, PlusOutlined } from "@ant-design/icons";
import {
  COL_GAP,
  EDIT_GAP,
  GROUP_HEAD,
  GROUP_PAD,
  HEAD_H,
  HINT_H,
  LINE,
  NODE_H,
  NODE_W,
  PAD_X,
  PAD_Y,
  ROW_GAP,
  SPINE_X,
  TAIL_W,
} from "../constants/roadmap-layout";
import { Button } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import { getSpanDays } from "../utils/procedure-progress";
import { getSiblingSteps, getStageColumns, moveStepToStage } from "../utils/step-dependencies";

export interface RoadmapStepView {
  onClick?: (step: ProcedureStep) => void;
  tone?: (step: ProcedureStep) => string | undefined;
  badge?: (step: ProcedureStep) => ReactNode;
  cardWidth?: number;
  cardHeight?: number;
  /** Chữ to hơn (thẻ lớn) */
  large?: boolean;
}

/** Bước vừa chuyển lượt: làm song song với một bước cùng cấp, hoặc tách thành lượt riêng (vị trí tính từ 0) */
export interface StageMove {
  stepId: string;
  drop: { parallelWith: string } | { insertAt: number };
}

export type ChangeStagesHandler = (stages: Map<string, number>, description?: string, move?: StageMove) => void;

type DropTarget = { target: number } | { insertAt: number };

const sameDrop = (a: DropTarget | null, b: DropTarget) =>
  !!a && ("target" in a ? "target" in b && a.target === b.target : "insertAt" in b && a.insertAt === b.insertAt);

export default function RoadmapStepFlow({
  steps,
  parent,
  onChangeStages,
  entryArrow = true,
  entryColor = "#F87171",
  collapsed,
  onToggleBranch,
  stepView,
}: {
  steps: ProcedureStep[];
  parent: ProcedureStep;
  onChangeStages?: ChangeStagesHandler;
  entryArrow?: boolean;
  entryColor?: string;
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
  stepView?: RoadmapStepView;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const children = getSiblingSteps(steps, parent.code);
  const canDrag = !!onChangeStages && children.length > 1;
  const nodeW = stepView?.cardWidth ?? NODE_W;
  const nodeH = stepView?.cardHeight ?? NODE_H;
  const slotW = nodeW + GROUP_PAD * 2;
  const large = !!stepView?.large;
  const columns = children.length > 0 ? getStageColumns(children) : [[parent]];

  const framed = (col: ProcedureStep[]) => canDrag || col.length > 1;
  const headOf = (col: ProcedureStep[]) => (col.length > 1 ? GROUP_HEAD : 0);
  const colHeight = (col: ProcedureStep[]) =>
    framed(col)
      ? GROUP_PAD * 2 + headOf(col) + col.length * nodeH + (col.length - 1) * ROW_GAP + (canDrag ? ROW_GAP + HINT_H : 0)
      : nodeH;
  const bodyH = Math.max(...columns.map(colHeight));
  const dragCol = draggingId ? columns.findIndex((col) => col.some((c) => c.id === draggingId)) : -1;
  const dragAlone = dragCol >= 0 && columns[dragCol].length === 1;
  const isNoop = (drop: DropTarget) =>
    "target" in drop
      ? drop.target === dragCol
      : dragAlone && (drop.insertAt === dragCol || drop.insertAt === dragCol + 1);
  const gap = canDrag ? EDIT_GAP : COL_GAP;
  const slotX = (ci: number) => PAD_X + ci * (slotW + gap);
  const lastRight = slotX(columns.length - 1) + slotW;
  const tailX = lastRight + COL_GAP;
  const showTail =
    canDrag &&
    (columns[columns.length - 1].length > 1 || (!!draggingId && !isNoop({ insertAt: columns.length })));
  const width = (showTail ? tailX + TAIL_W : lastRight) + PAD_X;
  const height = PAD_Y * 2 + HEAD_H + bodyH;
  const centerY = PAD_Y + HEAD_H + bodyH / 2;
  const edgeLeft = (ci: number) => slotX(ci) + (framed(columns[ci]) ? 0 : GROUP_PAD);
  const edgeRight = (ci: number) => slotX(ci) + slotW - (framed(columns[ci]) ? 0 : GROUP_PAD);
  const frameTop = (col: ProcedureStep[]) => centerY - colHeight(col) / 2;

  const endDrag = () => {
    setDraggingId(null);
    setOver(null);
  };
  const dropZone = (drop: DropTarget, x: number, w: number) => (
    <div
      key={"target" in drop ? `col-${drop.target}` : `gap-${drop.insertAt}`}
      className="absolute top-0 z-20"
      style={{ left: x, width: w, height }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!sameDrop(over, drop)) setOver(drop);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggingId) {
          const moved = children.find((c) => c.id === draggingId);
          const description =
            "target" in drop
              ? `Gộp [${moved?.code}] vào Bước ${drop.target + 1}, làm song song với ${columns[drop.target].map((c) => c.code).join(", ")}.`
              : `Tách [${moved?.code}] thành bước riêng, đặt ${
                  drop.insertAt === 0
                    ? "lên đầu"
                    : drop.insertAt >= columns.length
                      ? "ở cuối"
                      : `giữa Bước ${drop.insertAt} và Bước ${drop.insertAt + 1}`
                }.`;
          const partner = "target" in drop ? columns[drop.target]?.find((c) => c.id !== draggingId) : undefined;
          onChangeStages?.(moveStepToStage(children, draggingId, drop), description, {
            stepId: draggingId,
            drop: "target" in drop ? { parallelWith: partner?.id ?? "" } : { insertAt: drop.insertAt },
          });
        }
        endDrag();
      }}
    >
      {sameDrop(over, drop) &&
        "target" in drop && (
          <div className="absolute inset-y-1.5 inset-x-0 rounded-xl border-2 border-dashed border-violet-400 bg-violet-100/40">
            <span className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              Gộp vào Bước {drop.target + 1} · làm song song
            </span>
          </div>
        )}
    </div>
  );

  const node = (s: ProcedureStep, x: number, y: number) => {
    const grand = steps.filter((g) => g.code.startsWith(`${s.code}.`));
    const optional = s.type === "CONDITIONAL";
    const tone = stepView?.tone?.(s);
    const badge = stepView?.badge?.(s);
    return (
      <div
        key={s.id}
        data-roadmap-card={s.id}
        draggable={canDrag}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", s.id);
          setTimeout(() => setDraggingId(s.id), 0);
        }}
        onDragEnd={endDrag}
        onClick={stepView?.onClick ? () => stepView.onClick?.(s) : undefined}
        className={`absolute flex flex-col justify-center rounded-lg border transition-shadow ${large ? "px-4" : "px-3"} hover:shadow-md ${
          tone ?? (optional ? "border-dashed border-amber-300 bg-white" : "border-slate-200 bg-white")
        } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${stepView?.onClick ? "cursor-pointer" : ""} ${
          draggingId === s.id ? "opacity-35" : ""
        }`}
        style={{ left: x, top: y, width: nodeW, height: nodeH }}
        title={[
          `${s.code}. ${s.name}`,
          `${getSpanDays(steps, s)} ngày${s.assignedTo ? ` · ${s.assignedTo}` : ""}`,
          ...grand.map((g) => `  ${g.code}. ${g.name}`),
        ].join("\n")}
      >
        <div className={`flex items-center gap-1.5 leading-none ${large ? "text-xs" : "text-[10px]"}`}>
          <span className="font-mono font-bold text-[#DC2626]">{s.code}</span>
          {optional && <span className="shrink-0 whitespace-nowrap rounded bg-amber-50 px-1 py-px font-semibold text-amber-700">Nếu có</span>}
          {grand.length > 0 && (
            <Button
              type="text"
              size="small"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBranch(s.code);
              }}
              title={collapsed.has(s.code) ? "Hiện các bước con bên dưới" : "Ẩn các bước con"}
              className="!h-auto !gap-0.5 !px-1 !py-px text-[10px] font-medium !text-sky-600 hover:!bg-sky-50"
            >
              {collapsed.has(s.code) ? (
                <>
                  <CaretRightOutlined className="text-[8px]" />
                  {getSiblingSteps(steps, s.code).length} bước con
                </>
              ) : (
                <CaretDownOutlined className="text-[9px]" />
              )}
            </Button>
          )}
          <span className="ml-auto shrink-0 whitespace-nowrap text-slate-400">{getSpanDays(steps, s)} ngày</span>
        </div>
        <div
          className={`line-clamp-2 text-slate-700 ${large ? "mt-1.5 text-sm font-medium leading-snug" : "mt-1 text-[11.5px] leading-[1.3]"}`}
        >
          {s.name}
        </div>
        {badge && (
          <div className={large ? "mt-1.5 text-xs leading-normal" : "mt-1 truncate text-[10.5px] leading-none"}>{badge}</div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" style={{ width, height }}>
      {columns.map((col, ci) => (
        <div
          key={`head-${col[0].id}`}
          className="absolute flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400"
          style={{ left: slotX(ci), top: PAD_Y, width: slotW, height: HEAD_H - 6 }}
        >
          Bước {ci + 1}
        </div>
      ))}

      {canDrag &&
        columns.slice(1).map((col, i) => {
          const ci = i + 1;
          const gx = slotX(ci) - gap / 2;
          const h = colHeight([parent]);
          return draggingId && !isNoop({ insertAt: ci }) ? (
            <div
              key={`gap-${col[0].id}`}
              className={`absolute flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-center text-[10.5px] font-semibold transition-colors ${
                sameDrop(over, { insertAt: ci })
                  ? "border-[#DC2626] bg-red-50 text-[#DC2626] shadow-sm"
                  : "border-[#FCA5A5] bg-white text-[#EF4444]"
              }`}
              style={{ left: gx - (gap - 12) / 2, top: centerY - h / 2, width: gap - 12, height: h }}
            >
              <span className="px-1 leading-tight">Thêm vào đây</span>
            </div>
          ) : null;
        })}

      {columns.map((col, ci) => {
        if (!framed(col)) return null;
        const h = colHeight(col);
        const group = col.length > 1;
        return (
          <div
            key={`group-${col[0].id}`}
            className={`absolute rounded-xl border ${group ? "border-violet-200 bg-violet-50/60" : "border-dashed border-slate-200 bg-white/50"}`}
            style={{ left: slotX(ci), top: frameTop(col), width: slotW, height: h }}
          >
            {group && (
              <span className="absolute left-2.5 top-1 text-[10px] font-semibold text-violet-600">
                {col.length} bước làm song song
              </span>
            )}
            {canDrag && (
              <div
                className={`absolute flex items-center justify-center gap-1 rounded-md border border-dashed text-[10px] ${
                  draggingId && !isNoop({ target: ci })
                    ? "border-violet-300 bg-violet-50 text-violet-600"
                    : "border-slate-200 text-slate-400"
                }`}
                style={{ left: GROUP_PAD, right: GROUP_PAD, bottom: GROUP_PAD, height: HINT_H }}
              >
                <PlusOutlined className="text-[9px]" /> Kéo thẻ vào để làm song song
              </div>
            )}
          </div>
        );
      })}

      {entryArrow && (
      <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
        <path
          d={`M ${SPINE_X} 0 C ${SPINE_X} ${centerY * 0.8}, ${SPINE_X + 10} ${centerY}, ${SPINE_X + 34} ${centerY} L ${edgeLeft(0) - 3} ${centerY}`}
          fill="none"
          stroke={entryColor}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <path
          d={`M ${edgeLeft(0) - 9} ${centerY - 4} L ${edgeLeft(0) - 1} ${centerY} L ${edgeLeft(0) - 9} ${centerY + 4} z`}
          fill={entryColor}
        />
      </svg>
      )}

      <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
        {columns.slice(0, -1).map((_, ci) => {
          const x1 = edgeRight(ci);
          const x2 = edgeLeft(ci + 1);
          return (
            <g key={ci}>
              <path d={`M ${x1} ${centerY} L ${x2 - 2} ${centerY}`} stroke={LINE} strokeWidth={1.75} strokeLinecap="round" />
              <path d={`M ${x2 - 8} ${centerY - 4} L ${x2 - 1} ${centerY} L ${x2 - 8} ${centerY + 4} z`} fill={LINE} />
            </g>
          );
        })}
      </svg>

      {columns.map((col, ci) => {
        if (!framed(col)) return node(col[0], slotX(ci) + GROUP_PAD, centerY - nodeH / 2);
        const top = frameTop(col) + GROUP_PAD + headOf(col);
        return col.map((s, k) => node(s, slotX(ci) + GROUP_PAD, top + k * (nodeH + ROW_GAP)));
      })}

      {showTail && (
        <>
          <div
            className={`absolute flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-center transition-colors ${
              sameDrop(over, { insertAt: columns.length })
                ? "border-[#DC2626] bg-red-50 text-[#DC2626] shadow-sm"
                : draggingId && !isNoop({ insertAt: columns.length })
                  ? "border-[#FCA5A5] bg-red-50/40 text-[#DC2626]"
                  : "border-slate-200 text-slate-400"
            }`}
            style={{ left: tailX, top: centerY - colHeight([parent]) / 2, width: TAIL_W, height: colHeight([parent]) }}
            title="Kéo một thẻ bước vào đây để tách thành bước riêng, làm sau các bước trước"
          >
            <span className="flex items-center gap-1 text-[11.5px] font-semibold">
              Tạo khung mới
            </span>
            <span className="text-[10px] opacity-80">Kéo thẻ vào đây</span>
          </div>
        </>
      )}

      {draggingId && (
        <>
          {columns.map((_, ci) => !isNoop({ target: ci }) && dropZone({ target: ci }, slotX(ci), slotW))}
          {columns.map(
            (_, ci) =>
              !isNoop({ insertAt: ci }) &&
              dropZone({ insertAt: ci }, ci === 0 ? 0 : slotX(ci) - gap, ci === 0 ? PAD_X : gap),
          )}
          {!isNoop({ insertAt: columns.length }) && dropZone({ insertAt: columns.length }, lastRight, width - lastRight)}
        </>
      )}
    </div>
  );
}
