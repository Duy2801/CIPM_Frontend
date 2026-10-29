"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDownOutlined, CaretRightOutlined, FlagFilled, PlusOutlined, TrophyFilled } from "@ant-design/icons";
import { Select } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import { getSpanDays } from "../utils/procedure-progress";
import { getSiblingSteps, getStageColumns, moveStepToStage } from "../utils/step-dependencies";

interface ProcedureRoadmapProps {
  steps: ProcedureStep[];
  /** Khoảng cách từ đáy màn hình tới thanh kéo ngang bám đáy (chừa chỗ cho chân trang) */
  stickyBottom?: number;
  /** Đổi lượt làm của các bước cùng cấp; không truyền = chỉ xem */
  onChangeStages?: (stages: Map<string, number>, description?: string) => void;
}

/** Nơi đang kéo khối tới: thả vào một cột (làm song song), hoặc vào khe giữa hai cột (tách thành lượt riêng) */
type DropTarget = { target: number } | { insertAt: number };

const sameDrop = (a: DropTarget | null, b: DropTarget) =>
  !!a && ("target" in a ? "target" in b && a.target === b.target : "insertAt" in b && a.insertAt === b.insertAt);

/** Kích thước đường đi các bước nhỏ (px) */
const NODE_W = 212;
const NODE_H = 58;
/** Lề trong của khung gom các bước song song */
const GROUP_PAD = 10;
/** Chỗ cho nhãn "N bước song song" ở đầu khung */
const GROUP_HEAD = 20;
const SLOT_W = NODE_W + GROUP_PAD * 2;
const COL_GAP = 40;
/** Khe giữa hai cột khi chỉnh được: rộng sẵn để chứa ô "Thêm vào đây" lúc kéo, không làm sơ đồ xê dịch */
const EDIT_GAP = 76;
const ROW_GAP = 10;
const PAD_X = 22;
const PAD_Y = 14;
/** Dải tiêu đề "Bước 1, 2, 3" phía trên mỗi cột */
const HEAD_H = 24;
/** Khung trống "+ Bước mới" ở cuối: kéo thẻ vào để tách thành bước riêng */
const TAIL_W = 176;
/** Ô gợi ý "Kéo thẻ vào để làm song song" ở đáy mỗi khung */
const HINT_H = 26;
const LINE = "#94A3B8";
/** Vùng sát mép khung sơ đồ (px): kéo thẻ vào đây thì sơ đồ tự cuộn ngang */
const EDGE_SCROLL_ZONE = 90;
/** Tâm trục dọc giai đoạn, tính từ mép trái khung đường đi (cột nút 36px + khoảng cách 16px + viền 1px) */
const SPINE_X = -35;

/** Giá trị nhãn thứ tự: làm lần lượt, hoặc id giai đoạn được chọn để làm song song cùng */
const SEQUENTIAL = "__sequential__";

/** Mỗi nhóm giai đoạn làm song song một màu riêng (vị trí giữ nguyên, nhìn màu là biết nhóm) */
const GROUP_TONES = [
  { node: "border-violet-500 text-violet-600", pill: "bg-violet-50 ring-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  { node: "border-sky-500 text-sky-600", pill: "bg-sky-50 ring-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  { node: "border-emerald-500 text-emerald-600", pill: "bg-emerald-50 ring-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { node: "border-amber-500 text-amber-600", pill: "bg-amber-50 ring-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { node: "border-fuchsia-500 text-fuchsia-600", pill: "bg-fuchsia-50 ring-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
];

/**
 * Đường đi các bước nhỏ của một giai đoạn, trái → phải, mọi khối canh trên một đường giữa.
 * Các bước làm song song gom chung một khung: chỉ một mũi tên vào và một mũi tên ra khung.
 * Kéo thả khối vào khung / cột khác để làm song song, thả vào khe để tách thành lượt riêng.
 */
function StepFlow({
  steps,
  parent,
  onChangeStages,
  entryArrow = true,
  entryColor = "#F87171",
  collapsed,
  onToggleBranch,
}: {
  steps: ProcedureStep[];
  parent: ProcedureStep;
  onChangeStages?: (stages: Map<string, number>, description?: string) => void;
  /** Mũi tên cong từ trục bên trái vào bước đầu tiên */
  entryArrow?: boolean;
  /** Màu mũi tên vào: đỏ = từ nút giai đoạn, xanh = từ thẻ bước cha (tuyến bước con) */
  entryColor?: string;
  /** Các bước đang thu gọn phần bước con */
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const children = getSiblingSteps(steps, parent.code);
  const canDrag = !!onChangeStages && children.length > 1;
  const columns = children.length > 0 ? getStageColumns(children) : [[parent]];

  // Chỉnh được thì mỗi bước là một khung (có ô gợi ý thả thêm thẻ vào); chỉ xem thì bước một thẻ không cần khung
  const framed = (col: ProcedureStep[]) => canDrag || col.length > 1;
  const headOf = (col: ProcedureStep[]) => (col.length > 1 ? GROUP_HEAD : 0);
  const colHeight = (col: ProcedureStep[]) =>
    framed(col)
      ? GROUP_PAD * 2 + headOf(col) + col.length * NODE_H + (col.length - 1) * ROW_GAP + (canDrag ? ROW_GAP + HINT_H : 0)
      : NODE_H;
  const bodyH = Math.max(...columns.map(colHeight));
  // Thả mà không đổi gì thì không hiện chỗ thả: vào chính cột của thẻ, hoặc hai khe sát cột khi thẻ đứng một mình
  const dragCol = draggingId ? columns.findIndex((col) => col.some((c) => c.id === draggingId)) : -1;
  const dragAlone = dragCol >= 0 && columns[dragCol].length === 1;
  const isNoop = (drop: DropTarget) =>
    "target" in drop
      ? drop.target === dragCol
      : dragAlone && (drop.insertAt === dragCol || drop.insertAt === dragCol + 1);
  // Khe giữa các cột cố định (không đổi khi bắt đầu kéo, để thẻ không bị nhảy chỗ dưới con trỏ)
  const gap = canDrag ? EDIT_GAP : COL_GAP;
  const slotX = (ci: number) => PAD_X + ci * (SLOT_W + gap);
  const lastRight = slotX(columns.length - 1) + SLOT_W;
  const tailX = lastRight + COL_GAP;
  // Khung "Tạo khung mới" ở cuối: chỉ cần khi bước cuối đang gom từ 2 thẻ (để tách ra),
  // hoặc lúc đang kéo một thẻ mà thả vào cuối thì có tác dụng
  const showTail =
    canDrag &&
    (columns[columns.length - 1].length > 1 || (!!draggingId && !isNoop({ insertAt: columns.length })));
  const width = (showTail ? tailX + TAIL_W : lastRight) + PAD_X;
  const height = PAD_Y * 2 + HEAD_H + bodyH;
  const centerY = PAD_Y + HEAD_H + bodyH / 2;
  // Mép trái / phải của cột: có khung thì tính theo khung, không thì theo thẻ
  const edgeLeft = (ci: number) => slotX(ci) + (framed(columns[ci]) ? 0 : GROUP_PAD);
  const edgeRight = (ci: number) => slotX(ci) + SLOT_W - (framed(columns[ci]) ? 0 : GROUP_PAD);
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
          // Mô tả để hỏi xác nhận: gộp vào bước nào (làm song song với ai) hay tách thành bước riêng ở đâu
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
          onChangeStages?.(moveStepToStage(children, draggingId, drop), description);
        }
        endDrag();
      }}
    >
      {/* Khe giữa / khung mới tự sáng lên ở ô của nó, ở đây chỉ vẽ khi thả vào cột */}
      {sameDrop(over, drop) &&
        "target" in drop && (
          // Thả vào cột: làm song song với các bước trong cột
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
    return (
      <div
        key={s.id}
        data-roadmap-card={s.id}
        draggable={canDrag}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", s.id);
          // Đổi giao diện sau khi trình duyệt đã bắt đầu kéo (đổi ngay có thể làm hủy thao tác kéo)
          setTimeout(() => setDraggingId(s.id), 0);
        }}
        onDragEnd={endDrag}
        className={`absolute flex flex-col justify-center rounded-lg border bg-white px-3 transition-shadow hover:shadow-md ${
          optional ? "border-dashed border-amber-300" : "border-slate-200"
        } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${draggingId === s.id ? "opacity-35" : ""}`}
        style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
        title={[
          `${s.code}. ${s.name}`,
          `${getSpanDays(steps, s)} ngày${s.assignedTo ? ` · ${s.assignedTo}` : ""}`,
          ...grand.map((g) => `  ${g.code}. ${g.name}`),
        ].join("\n")}
      >
        <div className="flex items-center gap-1.5 text-[10px] leading-none">
          <span className="font-mono font-bold text-[#DC2626]">{s.code}</span>
          {optional && <span className="shrink-0 whitespace-nowrap rounded bg-amber-50 px-1 py-px font-semibold text-amber-700">Nếu có</span>}
          {grand.length > 0 && (
            // Mở / thu phần bước con hiện ngay bên dưới tuyến này
            <button
              type="button"
              draggable={false}
              onClick={() => onToggleBranch(s.code)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 whitespace-nowrap rounded px-1 py-px font-medium text-sky-600 hover:bg-sky-50"
              title={collapsed.has(s.code) ? "Hiện các bước con bên dưới" : "Ẩn các bước con"}
            >
              {/* Đang mở thì tuyến con đã hiện bên dưới, chỉ để mũi tên thu gọn; thu gọn rồi mới ghi số bước con */}
              {collapsed.has(s.code) ? (
                <>
                  <CaretRightOutlined className="text-[8px]" />
                  {getSiblingSteps(steps, s.code).length} bước con
                </>
              ) : (
                <CaretDownOutlined className="text-[9px]" />
              )}
            </button>
          )}
          <span className="ml-auto shrink-0 whitespace-nowrap text-slate-400">{getSpanDays(steps, s)} ngày</span>
        </div>
        <div className="mt-1 line-clamp-2 text-[11.5px] leading-[1.3] text-slate-700">{s.name}</div>
      </div>
    );
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Tiêu đề từng cột: Bước 1, 2, 3... */}
      {columns.map((col, ci) => (
        <div
          key={`head-${col[0].id}`}
          className="absolute flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400"
          style={{ left: slotX(ci), top: PAD_Y, width: SLOT_W, height: HEAD_H - 6 }}
        >
          Bước {ci + 1}
        </div>
      ))}

      {/* Khung của từng bước: tím = đang gom nhiều thẻ làm song song; đáy khung có ô gợi ý thả thêm thẻ */}
      {/* Khe giữa hai bước: đang kéo thì mở thành ô "Thêm vào đây" */}
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
              <PlusOutlined className="text-[12px]" />
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
            style={{ left: slotX(ci), top: frameTop(col), width: SLOT_W, height: h }}
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

      {/* Mũi tên cong từ nút giai đoạn chạy vào bước nhỏ đầu tiên */}
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

      {/* Một mũi tên giữa hai cột liền nhau */}
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
        if (!framed(col)) return node(col[0], slotX(ci) + GROUP_PAD, centerY - NODE_H / 2);
        const top = frameTop(col) + GROUP_PAD + headOf(col);
        return col.map((s, k) => node(s, slotX(ci) + GROUP_PAD, top + k * (NODE_H + ROW_GAP)));
      })}

      {/* Khung trống cuối hàng: cho biết có thể kéo thẻ vào để tạo bước mới */}
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
            // Cao bằng khung một thẻ cho thẳng hàng
            style={{ left: tailX, top: centerY - colHeight([parent]) / 2, width: TAIL_W, height: colHeight([parent]) }}
            title="Kéo một thẻ bước vào đây để tách thành bước riêng, làm sau các bước trước"
          >
            <span className="flex items-center gap-1 text-[11.5px] font-semibold">
              <PlusOutlined className="text-[10px]" /> Tạo khung mới
            </span>
            <span className="text-[10px] opacity-80">Kéo thẻ vào đây</span>
          </div>
        </>
      )}

      {/* Vùng thả khi đang kéo: từng cột (gộp làm song song) + các khe giữa cột + khung mới ở cuối */}
      {draggingId && (
        <>
          {columns.map((_, ci) => !isNoop({ target: ci }) && dropZone({ target: ci }, slotX(ci), SLOT_W))}
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

/** Màu tuyến bước con (đường thả xuống từ thẻ bước cha) */
const BRANCH_COLOR = "#7DD3FC";

/**
 * Tuyến bước con của một thẻ: nằm ngay dưới, bắt đầu thẳng dưới thẻ cha; một đường đứt
 * thả từ đáy thẻ cha xuống rồi cong vào bước con đầu tiên. Vị trí thẻ cha đo trên màn hình.
 */
function BranchBlock({
  steps,
  branch,
  onChangeStages,
  collapsed,
  onToggleBranch,
}: {
  steps: ProcedureStep[];
  branch: ProcedureStep;
  onChangeStages?: (stages: Map<string, number>, description?: string) => void;
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // cx: tâm thẻ cha so với mép trái vùng chứa; rise: khoảng từ đáy thẻ cha xuống đầu khối này
  const [anchor, setAnchor] = useState<{ cx: number; rise: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const measure = () => {
      const card = host.parentElement?.querySelector(`[data-roadmap-card="${branch.id}"]`);
      if (!card) return;
      const c = card.getBoundingClientRect();
      const next = {
        cx: Math.round(c.left + c.width / 2 - host.getBoundingClientRect().left),
        rise: Math.round(el.getBoundingClientRect().top - c.bottom),
      };
      setAnchor((prev) => (prev && prev.cx === next.cx && prev.rise === next.rise ? prev : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    if (host.parentElement) observer.observe(host.parentElement);
    return () => observer.disconnect();
  }, [branch.id]);

  // Trục của tuyến con (x = -SPINE_X so với khung) nằm thẳng dưới tâm thẻ cha
  const left = anchor ? anchor.cx + SPINE_X * -1 - 1 : 0;
  return (
    <div ref={ref} className="relative mt-3" style={{ marginLeft: left, visibility: anchor ? "visible" : "hidden" }}>
      {anchor && (
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
          <path
            d={`M ${SPINE_X + 1} ${-anchor.rise} L ${SPINE_X + 1} 1`}
            stroke={BRANCH_COLOR}
            strokeWidth={1.75}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="w-max rounded-xl border border-sky-100 bg-sky-50/30">
        <StepFlow
          steps={steps}
          parent={branch}
          onChangeStages={onChangeStages}
          entryColor={BRANCH_COLOR}
          collapsed={collapsed}
          onToggleBranch={onToggleBranch}
        />
      </div>
      <SubBranches
        steps={steps}
        parent={branch}
        onChangeStages={onChangeStages}
        collapsed={collapsed}
        onToggleBranch={onToggleBranch}
      />
    </div>
  );
}

/** Các tuyến bước con của những thẻ (thuộc tuyến này) có bước con; lồng tiếp bao nhiêu cấp cũng được */
function SubBranches({
  steps,
  parent,
  onChangeStages,
  collapsed,
  onToggleBranch,
}: {
  steps: ProcedureStep[];
  parent: ProcedureStep;
  onChangeStages?: (stages: Map<string, number>, description?: string) => void;
  collapsed: Set<string>;
  onToggleBranch: (code: string) => void;
}) {
  const branches = getSiblingSteps(steps, parent.code).filter(
    (c) => !collapsed.has(c.code) && getSiblingSteps(steps, c.code).length > 0,
  );
  if (branches.length === 0) return null;
  return (
    <div>
      {branches.map((b) => (
        <BranchBlock
          key={b.id}
          steps={steps}
          branch={b}
          onChangeStages={onChangeStages}
          collapsed={collapsed}
          onToggleBranch={onToggleBranch}
        />
      ))}
    </div>
  );
}

/**
 * Sơ đồ quy trình: các giai đoạn thẳng hàng từ trên xuống, mỗi giai đoạn gắn nhãn "làm sau" hoặc
 * "song song với giai đoạn trên"; bên phải là đường đi ngang các bước nhỏ của giai đoạn đó.
 */
export default function ProcedureRoadmap({ steps, stickyBottom = 0, onChangeStages }: ProcedureRoadmapProps) {
  const mainStages = useMemo(() => getStageColumns(getSiblingSteps(steps, null)), [steps]);

  // Thanh kéo ngang riêng bám đáy màn hình, chạy đồng bộ với khung sơ đồ → lúc nào cũng thấy để kéo
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => setScrollWidth(body.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    return () => observer.disconnect();
  }, [mainStages.length]);
  // Bước nhỏ đang thu gọn phần bước con (mặc định mở hết)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggleBranch = (code: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const syncScroll = (from: HTMLDivElement | null, to: HTMLDivElement | null) => {
    if (from && to && to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  };

  if (mainStages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs italic text-slate-400">
        Quy trình chưa có bước nào để vẽ sơ đồ.
      </div>
    );
  }

  const mains = mainStages.flat();
  // Giai đoạn luôn đứng theo thứ tự trong quy trình; song song chỉ thể hiện bằng màu + nhãn
  const ordered = getSiblingSteps(steps, null);
  const stageOf = (id: string) => mainStages.findIndex((col) => col.some((m) => m.id === id));
  const parallelStages = mainStages.map((col, si) => (col.length > 1 ? si : -1)).filter((si) => si >= 0);
  const toneOf = (si: number) => {
    const g = parallelStages.indexOf(si);
    return g >= 0 ? GROUP_TONES[g % GROUP_TONES.length] : null;
  };

  /** Đặt giai đoạn làm lần lượt, hoặc làm song song cùng một giai đoạn bất kỳ đã chọn */
  const setOrder = (step: ProcedureStep, si: number, value: string) => {
    if (value === SEQUENTIAL) {
      if (mainStages[si].length > 1)
        onChangeStages?.(
          moveStepToStage(mains, step.id, { insertAt: si + 1 }),
          `Giai đoạn ${step.code} làm lần lượt, không song song với giai đoạn khác.`,
        );
      return;
    }
    const target = stageOf(value);
    if (target >= 0 && target !== si)
      onChangeStages?.(
        moveStepToStage(mains, step.id, { target }),
        `Giai đoạn ${step.code} làm song song với giai đoạn ${mainStages[target].map((m) => m.code).join(", ")}.`,
      );
  };

  const phase = (s: ProcedureStep) => {
    const si = stageOf(s.id);
    // Các giai đoạn làm cùng lúc với giai đoạn này; không có = làm lần lượt
    const partners = mainStages[si].filter((m) => m.id !== s.id);
    const tone = toneOf(si);
    return (
      <div key={s.id} className="relative flex gap-4 pb-7">
        {/* Đoạn trục dọc xuống giai đoạn sau */}
        <span className="absolute bottom-0 left-[17px] top-5 w-0.5 bg-slate-200" />
        <div className="relative z-10 flex w-9 shrink-0 justify-center pt-0.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white font-mono text-[12px] font-bold ring-4 ring-white ${
              tone ? tone.node : "border-[#DC2626] text-[#DC2626]"
            }`}
          >
            {s.code}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5">
            <span className="text-[14.5px] font-semibold text-slate-900">{s.name}</span>
            {mains.length > 1 &&
              (onChangeStages ? (
                <span className={`inline-flex items-center rounded-full pl-2.5 ring-1 ${tone ? tone.pill : "bg-slate-50 ring-slate-200"}`}>
                  {tone && <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />}
                  <Select
                    size="small"
                    variant="borderless"
                    value={partners[0]?.id ?? SEQUENTIAL}
                    onChange={(v) => setOrder(s, si, v as string)}
                    options={[
                      { value: SEQUENTIAL, label: "Làm lần lượt" },
                      ...ordered
                        .filter((m) => m.id !== s.id)
                        .map((m) => ({ value: m.id, label: `Song song với ${m.code}`, title: m.name })),
                    ]}
                    // Ô đã chọn chỉ hiện mã các giai đoạn làm cùng cho gọn
                    labelRender={() => (
                      <span className={`text-[11.5px] font-medium ${tone ? tone.text : "text-slate-600"}`}>
                        {partners.length ? `Song song với ${partners.map((m) => m.code).join(", ")}` : "Làm lần lượt"}
                      </span>
                    )}
                    popupMatchSelectWidth={false}
                  />
                </span>
              ) : (
                tone && (
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1 ${tone.pill} ${tone.text}`}>
                    Song song với {partners.map((m) => m.code).join(", ")}
                  </span>
                )
              ))}
          </div>
          <div className="mt-2 w-max min-w-full rounded-xl border border-slate-100 bg-slate-50/60">
            <StepFlow
              steps={steps}
              parent={s}
              onChangeStages={onChangeStages}
              collapsed={collapsed}
              onToggleBranch={toggleBranch}
            />
          </div>
          <SubBranches
            steps={steps}
            parent={s}
            onChangeStages={onChangeStages}
            collapsed={collapsed}
            onToggleBranch={toggleBranch}
          />
        </div>
      </div>
    );
  };

  const capNode = (icon: React.ReactNode, label: string, last = false) => (
    <div className={`relative flex gap-4 ${last ? "pb-3" : "pb-6"}`}>
      {!last && <span className="absolute bottom-0 left-[17px] top-4 w-0.5 bg-slate-200" />}
      <div className="relative z-10 flex w-9 shrink-0 justify-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white ring-4 ring-white">
          {icon}
        </span>
      </div>
      <span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white">
      {/* Khung sơ đồ: ẩn thanh kéo của chính nó, dùng thanh bám đáy bên dưới */}
      <div
        ref={bodyRef}
        onScroll={() => syncScroll(bodyRef.current, barRef.current)}
        // Đang kéo thẻ tới sát mép trái / phải thì tự cuộn ngang theo (càng sát mép càng nhanh)
        onDragOver={(e) => {
          const body = bodyRef.current;
          if (!body) return;
          const rect = body.getBoundingClientRect();
          const fromLeft = e.clientX - rect.left;
          const fromRight = rect.right - e.clientX;
          if (fromLeft < EDGE_SCROLL_ZONE) body.scrollLeft -= Math.ceil(((EDGE_SCROLL_ZONE - fromLeft) / EDGE_SCROLL_ZONE) * 28);
          else if (fromRight < EDGE_SCROLL_ZONE) body.scrollLeft += Math.ceil(((EDGE_SCROLL_ZONE - fromRight) / EDGE_SCROLL_ZONE) * 28);
        }}
        className="overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="relative w-max min-w-full px-5 pb-2 pt-5">
          {capNode(<FlagFilled />, "Bắt đầu")}
          {ordered.map(phase)}
          {capNode(<TrophyFilled />, "Hoàn thành", true)}
        </div>
      </div>
      <div
        ref={barRef}
        onScroll={() => syncScroll(barRef.current, bodyRef.current)}
        className="sticky z-10 overflow-x-scroll overflow-y-hidden rounded-b-lg border-t border-slate-200 bg-white"
        style={{ bottom: stickyBottom }}
      >
        <div style={{ width: scrollWidth, height: 1 }} />
      </div>
    </div>
  );
}
