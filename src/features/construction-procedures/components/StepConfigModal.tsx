"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BranchesOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  LARGE_MODAL_BODY_STYLE,
  LARGE_MODAL_CONTAINER_STYLE,
  LARGE_MODAL_PROPS,
  Modal,
  Select,
  Tag,
  Tooltip,
  toast,
} from "@/components/ui";
import { App } from "antd";
import type { ProcedureStep, StepType } from "../types/procedure.types";

/** Phạm vi một lần lưu trên trang chi tiết: tab Sơ đồ và tab Danh sách lưu riêng */
export type SaveScope = "flow" | "info" | "all" | "auto";

/** Một thay đổi giữa hai bản quy trình, để ghi lịch sử */
export interface StepChange {
  label: string;
  from?: string;
  to?: string;
}

const stepDaysText = (s: ProcedureStep) => {
  const d = s.plannedDays ?? s.durationDaysMax ?? s.durationDaysMin;
  return d ? `${d} ngày` : s.durationMargin || "—";
};

/** Lượt làm của bước trong nhóm cùng cấp (1, 2, 3...) để ghi lịch sử đổi thứ tự */
const stageNumberOf = (steps: ProcedureStep[], step: ProcedureStep) =>
  getStageColumns(getSiblingSteps(steps, getParentCode(step.code))).findIndex((col) => col.some((s) => s.id === step.id)) + 1;

/** So hai bản: thêm / xóa bước, đổi tên, người thực hiện, thời gian, loại, bật tắt, thứ tự làm */
function diffSteps(before: ProcedureStep[], after: ProcedureStep[]): StepChange[] {
  const prevById = new Map(before.map((s) => [s.id, s]));
  const nextIds = new Set(after.map((s) => s.id));
  const changes: StepChange[] = [];
  after.forEach((s) => {
    const p = prevById.get(s.id);
    if (!p) {
      changes.push({ label: `Thêm bước [${s.code}]`, to: s.name });
      return;
    }
    const tag = `[${s.code}]`;
    if (p.name !== s.name) changes.push({ label: `Tên bước ${tag}`, from: p.name, to: s.name });
    if ((p.assignedTo ?? "") !== (s.assignedTo ?? ""))
      changes.push({ label: `Người thực hiện ${tag}`, from: p.assignedTo || "Chưa giao", to: s.assignedTo || "Chưa giao" });
    if (stepDaysText(p) !== stepDaysText(s)) changes.push({ label: `Thời gian ${tag}`, from: stepDaysText(p), to: stepDaysText(s) });
    if (p.type !== s.type)
      changes.push({ label: `Loại ${tag}`, from: p.type === "MANDATORY" ? "Bắt buộc" : "Nếu có", to: s.type === "MANDATORY" ? "Bắt buộc" : "Nếu có" });
    if (p.isEnabled !== s.isEnabled) changes.push({ label: `Áp dụng ${tag}`, from: p.isEnabled ? "Bật" : "Tắt", to: s.isEnabled ? "Bật" : "Tắt" });
    const fromStage = stageNumberOf(before, p);
    const toStage = stageNumberOf(after, s);
    if (fromStage !== toStage) changes.push({ label: `Thứ tự ${tag}`, from: `Bước ${fromStage}`, to: `Bước ${toStage}` });
  });
  before.filter((s) => !nextIds.has(s.id)).forEach((s) => changes.push({ label: `Xóa bước [${s.code}]`, from: s.name }));
  return changes;
}

interface StepConfigModalProps {
  open: boolean;
  steps: ProcedureStep[];
  currentProcedureId?: string;
  departmentTitle?: string;
  projectName?: string;
  /** "page": hiện ngay trên trang (quản lý danh mục quy trình), không có nút Đóng */
  variant?: "modal" | "page";
  /** Trang danh mục: nút "Đóng" quay lại danh sách quy trình */
  onBack?: () => void;
  /** Trang thêm quy trình mới: chưa có quy trình để lưu, bấm "Tạo quy trình" thì trả các bước về */
  onCreateNew?: (steps: ProcedureStep[]) => void;
  onClose: () => void;
  /** scope: "flow" = chỉ lưu thứ tự làm (tab Sơ đồ), "info" = chỉ lưu thông tin các bước (tab Danh sách), "all" = cả hai */
  onSaveConfig: (updatedSteps: ProcedureStep[], profileId?: string, scope?: SaveScope, changes?: StepChange[]) => void;
}

import {
  getTemplateSteps,
  loadCustomProfiles,
  saveCustomProfiles,
  loadHiddenTemplateIds,
  saveHiddenTemplateIds,
  saveTemplateOverride,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import { createProcedure, getProcedureDepartmentOptions, getProcedureSteps } from "../utils/procedure-library";
import { getParentCode, getSiblingSteps, getStageColumns } from "../utils/step-dependencies";
import ProcedureChangeHistory from "./ProcedureChangeHistory";
import ProcedureRoadmap from "./ProcedureRoadmap";
import CreateProcedureModal, { type CreateProcedureValues } from "./CreateProcedureModal";
import {
  getDepartmentStaff,
  DEPARTMENT_PROCEDURE_TEMPLATES,
  isSameDepartment,
} from "../constants/procedure-department-templates";

// Helper số La Mã cho bước chính (I, II, III...)
const toRoman = (num: number): string => {
  const romanMap: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let res = "";
  let n = num;
  for (const [val, sym] of romanMap) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res || "I";
};

const fromRoman = (str: string): number => {
  const romanMap: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
  };
  let sum = 0;
  let prev = 0;
  const upper = str.toUpperCase().trim();
  for (let i = upper.length - 1; i >= 0; i--) {
    const val = romanMap[upper[i]] || 0;
    if (val < prev) sum -= val;
    else sum += val;
    prev = val;
  }
  return sum;
};

// Cấp của bước theo mã: "III" = 0 (bước chính), "III.1" = 1, "III.1.1" = 2... (không giới hạn số cấp)
const getStepDepth = (code: string): number => code.split(".").length - 1;

// Bước gốc (cấp 1) chứa bước này: "III.1.1" → "III"
const getRootCode = (code: string): string => code.split(".")[0];

// Bước con / cháu... của một bước (mọi cấp bên dưới)
const isDescendantOf = (code: string, ancestorCode: string): boolean => code.startsWith(`${ancestorCode}.`);

// Các bước tổ tiên từ gần gốc tới cha: "III.1.1" → ["III", "III.1"]
const getAncestorCodes = (code: string): string[] =>
  code.split(".").slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join("."));

/* ---------- Sơ đồ cấp bậc ở cột "Mã bước": trục mảnh nối các nút, kiểu timeline ---------- */

/** Mỗi cấp lùi vào bao nhiêu px */
const FLOW_INDENT = 20;
/** Bán kính nút: bước chính là vòng tròn có mã, bước con là chấm nhỏ */
const MAIN_NODE_R = 13;
const SUB_NODE_R = 4;
/** Khoảng trống bên trái dành cho nút thu / mở (mọi cấp thẳng một cột) */
const FLOW_GUTTER = 26;
/** Tâm nút (cũng là vị trí trục) của một cấp */
const flowX = (level: number) => FLOW_GUTTER + MAIN_NODE_R + level * FLOW_INDENT;
const nodeR = (level: number) => (level === 0 ? MAIN_NODE_R : SUB_NODE_R);

/** Màu trục: bước chính xám nhạt, nhánh bước con hồng nhạt */
const flowColor = (level: number) => (level === 0 ? "#CBD5E1" : "#FCA5A5");

/** Một đoạn trục dọc đi qua tâm cấp `level` */
function FlowVLine({ level, style }: { level: number; style: React.CSSProperties }) {
  return <span className="absolute w-[1.5px]" style={{ left: flowX(level) - 0.75, background: flowColor(level), ...style }} />;
}

interface StepFlowCellProps {
  code: string;
  depth: number;
  /** Có bước liền trên cùng cấp */
  incoming: boolean;
  /** Bước con đầu tiên: nhánh rẽ từ bước cha vào */
  fromParent: boolean;
  /** Trục đi tiếp xuống: còn bước cùng cấp phía dưới, hoặc đang mở các bước con */
  outgoing: boolean;
  /** Trục của các cấp trên chạy xuyên qua dòng này */
  passLevels: number[];
  childCount: number;
  expanded: boolean;
  onToggle: () => void;
}

function StepFlowCell({
  code,
  depth,
  incoming,
  fromParent,
  outgoing,
  passLevels,
  childCount,
  expanded,
  onToggle,
}: StepFlowCellProps) {
  const x = flowX(depth);
  const r = nodeR(depth);
  const isMain = depth === 0;
  return (
    // Phủ hết chiều cao dòng (bù py-2.5 của dòng) để trục liền mạch giữa các dòng
    // Mã dài ở cấp sâu thì ô tự giãn ra, không đè lên tên bước
    <div className="relative min-w-32 shrink-0 self-stretch -my-2.5">
      {passLevels.map((level) => (
        <FlowVLine key={level} level={level} style={{ top: 0, bottom: 0 }} />
      ))}

      {incoming && <FlowVLine level={depth} style={{ top: 0, height: `calc(50% - ${r}px)` }} />}

      {/* Bước con đầu tiên: nhánh bo cong rẽ từ trục bước cha */}
      {fromParent && (
        <span
          className="absolute rounded-bl-[10px] border-b-[1.5px] border-l-[1.5px]"
          style={{
            left: flowX(depth - 1) - 0.75,
            top: 0,
            height: "calc(50% + 0.75px)",
            width: x - r - flowX(depth - 1) + 0.75,
            borderColor: flowColor(depth),
          }}
        />
      )}

      {outgoing && <FlowVLine level={depth} style={{ top: `calc(50% + ${r}px)`, bottom: 0 }} />}

      <div className="relative flex h-full items-center" style={{ paddingLeft: x - r }}>
        {isMain ? (
          <span
            className={`relative z-10 flex items-center justify-center rounded-full px-1 text-[10.5px] font-semibold transition-all duration-200 ${
              expanded
                ? "bg-[#DC2626] text-white shadow-[0_2px_6px_rgba(220,38,38,0.25)]"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
            style={{ minWidth: MAIN_NODE_R * 2, height: MAIN_NODE_R * 2 }}
          >
            {code}
          </span>
        ) : (
          <>
            <span
              className={`relative z-10 shrink-0 rounded-full transition-all ${
                expanded
                    ? "bg-[#DC2626] ring-[1.5px] ring-red-200"
                    : "bg-white ring-[1.5px] ring-red-300"
              }`}
              style={{ width: SUB_NODE_R * 2, height: SUB_NODE_R * 2 }}
            />
            <span
              className="ml-2 whitespace-nowrap pr-2 font-mono text-[11px] font-medium tracking-tight text-slate-500"
            >
              {code}
            </span>
          </>
        )}
      </div>

      {/* Nút thu / mở nằm phía trước, mọi cấp thẳng một cột */}
      {childCount > 0 && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2">
          <Tooltip title={expanded ? "Thu gọn các bước con" : `Mở ${childCount} bước con`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Thu gọn" : "Mở"} bước con của ${code}`}
              // Cùng kiểu mũi tên thu / mở nhóm ở Phân công nhân sự
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <RightOutlined className={`text-[11px] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
            </button>
          </Tooltip>
        </span>
      )}
    </div>
  );
}

// Gợi ý mã bước cha tiếp theo (I, II, III...)
const getNextParentCode = (steps: ProcedureStep[]): string => {
  const parents = steps.filter((s) => !s.code.includes("."));
  if (parents.length === 0) return "I";
  let maxRoman = 0;
  for (const p of parents) {
    const num = fromRoman(p.code);
    if (num > maxRoman) maxRoman = num;
  }
  return toRoman(maxRoman > 0 ? maxRoman + 1 : parents.length + 1);
};

// Gợi ý mã bước con tiếp theo, ở bất kỳ cấp nào (II → II.1, II.2...; III.1 → III.1.1, III.1.2...)
const getNextSubCode = (parentCode: string, steps: ProcedureStep[]): string => {
  const childDepth = getStepDepth(parentCode) + 1;
  // Chỉ xét bước con trực tiếp (đúng 1 cấp bên dưới), bỏ qua các cấp sâu hơn
  const children = steps.filter((s) => isDescendantOf(s.code, parentCode) && getStepDepth(s.code) === childDepth);
  let maxChildNum = 0;
  for (const c of children) {
    const childNum = parseInt(c.code.split(".")[childDepth], 10);
    if (!isNaN(childNum) && childNum > maxChildNum) {
      maxChildNum = childNum;
    }
  }
  return `${parentCode}.${maxChildNum + 1}`;
};

// Chèn bước con đúng vào sau nhóm bước của cha nó
const insertStepHierarchically = (
  steps: ProcedureStep[],
  newStep: ProcedureStep,
  parentCode?: string
): ProcedureStep[] => {
  if (!parentCode) {
    return [...steps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
  }
  let lastIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].code === parentCode || steps[i].code.startsWith(`${parentCode}.`)) {
      lastIndex = i;
    }
  }
  if (lastIndex === -1) {
    return [...steps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
  }
  const result = [...steps];
  result.splice(lastIndex + 1, 0, newStep);
  return result.map((s, idx) => ({ ...s, order: idx + 1 }));
};

/** Số ngày từ ngày bắt đầu đến ngày kết thúc (tính cả hai đầu); thiếu ngày thì null */
const countPlannedDays = (start?: string, end?: string): number | null => {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
  return diff > 0 ? diff : null;
};

/** Thông tin thời gian của bước suy ra từ ngày bắt đầu / kết thúc */
const buildDateFields = (
  start?: string,
  end?: string
): Pick<
  ProcedureStep,
  "startDatePlanned" | "endDatePlanned" | "plannedDays" | "durationMargin" | "durationDaysMin" | "durationDaysMax"
> => {
  const days = countPlannedDays(start, end);
  return {
    startDatePlanned: start || undefined,
    endDatePlanned: end || undefined,
    plannedDays: days ?? undefined,
    durationMargin: days ? `${days} ngày` : "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
  };
};

/** Khoảng ngày của mục lớn (I, II...): ngày bắt đầu sớm nhất và ngày kết thúc muộn nhất của các bước con đang áp dụng */
const getChildDateRange = (parentCode: string, steps: ProcedureStep[]) => {
  const children = steps.filter((s) => isDescendantOf(s.code, parentCode) && s.isEnabled);
  const starts = children.map((s) => s.startDatePlanned).filter(Boolean).sort() as string[];
  const ends = children.map((s) => s.endDatePlanned).filter(Boolean).sort() as string[];
  return { start: starts[0], end: ends[ends.length - 1] };
};

/**
 * Mục lớn (bước cấp 1: I, II...) nhập người thực hiện và thời gian như bước con.
 * Chưa nhập ngày thì tự lấy theo khoảng ngày của các bước con.
 */
const withParentRollups = (steps: ProcedureStep[]): ProcedureStep[] =>
  steps.map((step) => {
    if (step.code.includes(".") || step.startDatePlanned || step.endDatePlanned) return step;
    const { start, end } = getChildDateRange(step.code, steps);
    return start || end ? { ...step, ...buildDateFields(start || "", end || "") } : step;
  });

/** Thời gian cố định (số ngày) của bước; để trống = "Theo quy định" */
const buildDurationFields = (
  daysText: string
): Pick<ProcedureStep, "durationMargin" | "durationDaysMin" | "durationDaysMax" | "plannedDays"> => {
  const n = Number(daysText);
  const days = daysText.trim() && Number.isInteger(n) && n > 0 ? n : null;
  return {
    durationMargin: days ? `${days} ngày` : "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
    plannedDays: days ?? undefined,
  };
};

/** Số ngày cố định của bước: số ngày kế hoạch, không có thì lấy mức tối đa của khoảng cũ (VD "5–10 ngày" → 10) */
const getStepDays = (step: ProcedureStep): number | null =>
  step.plannedDays || step.durationDaysMax || step.durationDaysMin || null;

/** Độ rộng các cột dùng chung giữa tiêu đề và các dòng */
const ASSIGNEE_COL = "w-48 shrink-0";
const EMAIL_COL = "w-40 shrink-0";
const DATE_COL = "w-20 shrink-0";
const TYPE_COL = "w-24 shrink-0";

const STEP_TYPE_OPTIONS = [
  { value: "MANDATORY", label: "Bắt buộc" },
  { value: "CONDITIONAL", label: "Nếu có" },
];

/** Hiển thị thời gian của bước (chỉ xem) */
function StepDuration({ step }: { step: ProcedureStep }) {
  const days = getStepDays(step);
  return (
    <div className={`${DATE_COL} hidden sm:block text-center text-xs font-medium text-slate-700`}>
      {days ? `${days} ngày` : step.durationMargin || <span className="text-slate-300 select-none">—</span>}
    </div>
  );
}

/** Nhập số ngày khi thêm / sửa bước */
function StepDurationInput({ days, onChange }: { days: string; onChange: (value: string) => void }) {
  return (
    <div className={`${DATE_COL} hidden sm:flex items-center justify-center gap-1.5 text-xs text-slate-500`} onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min={1}
        value={days}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Số ngày"
        className="h-7 w-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none rounded-md border border-slate-200 bg-white px-1 text-center text-xs text-slate-700 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
      />
      <span>ngày</span>
    </div>
  );
}

/** Khung của bảng cấu hình: popup lớn (mặc định) hoặc khối nằm ngay trên trang */
/** Nút ✓ (lưu / thêm) và ✕ (bỏ) của dòng đang nhập */
function RowSaveCancel({ onSave, onCancel, saveTitle }: { onSave: () => void; onCancel: () => void; saveTitle: string }) {
  return (
    <>
      <Tooltip title={`${saveTitle} (Enter)`}>
        <button
          type="button"
          onClick={onSave}
          aria-label={saveTitle}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#DC2626] bg-[#DC2626] text-white shadow-2xs transition-colors hover:bg-[#B91C1C]"
        >
          <CheckOutlined className="text-xs" />
        </button>
      </Tooltip>
      <Tooltip title="Bỏ (Esc)">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Bỏ"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-2xs transition-colors hover:bg-slate-100"
        >
          <CloseOutlined className="text-xs" />
        </button>
      </Tooltip>
    </>
  );
}

/**
 * Cột thao tác của dòng nhập bước mới: ✓ để thêm, ✕ để bỏ; bấm ra ngoài dòng cũng tự thêm
 * (chưa gõ tên thì bỏ dòng), Enter để thêm, Esc để bỏ.
 */
function InlineRowActions({ hasValue, onSave, onCancel }: { hasValue: boolean; onSave: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ hasValue, onSave, onCancel });
  useEffect(() => {
    latest.current = { hasValue, onSave, onCancel };
  });
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const row = ref.current?.parentElement;
      const target = e.target as Element | null;
      // Danh sách thả xuống của ô chọn gắn vào body → vẫn tính là trong dòng
      if (!row || !target || row.contains(target) || target.closest("[class*='ant-select-dropdown'], .ant-modal-root, .ant-modal-wrap")) return;
      if (latest.current.hasValue) latest.current.onSave();
      else latest.current.onCancel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return (
    <div ref={ref} className="w-28 shrink-0 flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <RowSaveCancel saveTitle="Thêm bước" onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

/** Chiều cao chân trang bám đáy (dạng trang) — thanh kéo ngang của bảng bám ngay phía trên */
const STICKY_FOOTER_HEIGHT = 56;

function StepConfigFrame({
  variant,
  open,
  onClose,
  title,
  footer,
  children,
}: {
  variant: "modal" | "page";
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** null = ẩn chân (VD: tab lịch sử) */
  footer: React.ReactNode | null;
  children: React.ReactNode;
}) {
  if (variant === "page") {
    return (
      // Không giới hạn chiều cao: cả trang cuộn theo bảng, chân (nút Lưu) bám đáy màn hình
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className={`flex flex-col px-4 pt-4 ${footer ? "" : "pb-4"}`}>{children}</div>
        {footer && (
          <div
            className="sticky bottom-0 z-10 flex items-center rounded-b-xl border-t border-slate-200 bg-slate-50 px-4"
            style={{ height: STICKY_FOOTER_HEIGHT }}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnHidden
      // Cùng kích thước với popup Quản lý chức danh
      {...LARGE_MODAL_PROPS}
      styles={{ container: LARGE_MODAL_CONTAINER_STYLE, body: LARGE_MODAL_BODY_STYLE }}
      title={title}
      footer={footer ? [<div key="footer-row">{footer}</div>] : null}
    >
      {children}
    </Modal>
  );
}

export default function StepConfigModal({
  open,
  steps,
  currentProcedureId,
  departmentTitle,
  projectName,
  variant = "modal",
  onBack,
  onCreateNew,
  onClose,
  onSaveConfig,
}: StepConfigModalProps) {
  const { modal } = App.useApp();
  const isPage = variant === "page";
  const isDraft = isPage && !!onCreateNew;
  const autoSave = !!isPage && !isDraft;
  /** Trang chi tiết (tự lưu): thêm / sửa phải xác nhận trước khi áp dụng; nơi khác áp dụng luôn */
  const confirmChange = (title: string, content: string, onOk: () => void, onCancel?: () => void) => {
    if (!autoSave) {
      onOk();
      return;
    }
    modal.confirm({ title, content, okText: "Đồng ý", cancelText: "Hủy", onOk, onCancel });
  };
  // Hàng tiêu đề bảng nằm ngoài vùng kéo ngang → kéo theo phần thân để cột luôn thẳng hàng
  const headerScrollRef = useRef<HTMLDivElement>(null);
  // Trên trang: thanh kéo ngang riêng bám đáy màn hình (trên chân trang) để luôn kéo ngang được
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [tableOverflows, setTableOverflows] = useState(false);
  useEffect(() => {
    const body = bodyScrollRef.current;
    if (!isPage || !body) return;
    const measure = () => {
      setTableScrollWidth(body.scrollWidth);
      setTableOverflows(body.scrollWidth > body.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    return () => observer.disconnect();
  }, [isPage]);
  const [localSteps, setLocalSteps] = useState<ProcedureStep[]>(steps);
  const [filterType, setFilterType] = useState<"ALL" | "MANDATORY" | "CONDITIONAL" | "DISABLED">("ALL");
  const [viewMode, setViewMode] = useState<"flow" | "table" | "history">(isDraft ? "table" : "flow");

  // Các bước đang mở bước con; mới vào chỉ hiện các bước chính
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => new Set());
  const toggleExpanded = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  // Mở bước này và mọi bước cha của nó (để thấy dòng thêm bước con)
  const expandTo = (code: string) =>
    setExpandedCodes((prev) => new Set([...prev, ...getAncestorCodes(code), code]));
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Quản lý quy trình (kịch bản)
  const [customProfiles, setCustomProfiles] = useState<CustomProcedureProfile[]>([]);
  // Quy trình mẫu đã xóa khỏi danh sách (lưu trình duyệt)
  const [hiddenTemplateIds, setHiddenTemplateIds] = useState<string[]>(() => loadHiddenTemplateIds());
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    currentProcedureId || ""
  );

  // Modal 1: Tạo quy trình mới
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);

  // Tìm quy trình mẫu chuẩn tương ứng với phòng ban (nếu có)
  const deptTemplate = useMemo(() => {
    if (!departmentTitle) return null;
    return (
      DEPARTMENT_PROCEDURE_TEMPLATES[departmentTitle] ||
      Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((tpl) =>
        isSameDepartment(tpl.department, departmentTitle)
      ) ||
      null
    );
  }, [departmentTitle]);

  // Cán bộ chọn làm người thực hiện: thuộc phòng ban của Lead (nếu mở cho phòng ban), không thì toàn bộ nhân sự
  const staffList = useMemo(() => getDepartmentStaff(departmentTitle || undefined), [departmentTitle]);
  const staffOptions = useMemo(
    () => staffList.map((st) => ({ value: st.name, label: `${st.name} (${st.title})` })),
    [staffList]
  );
  // Email của người thực hiện: tự lấy theo cán bộ đã chọn, không phải nhập
  const emailOf = (name?: string) => (name ? staffList.find((st) => st.name === name)?.email : undefined);
  const renderEmail = (name?: string) => {
    const email = emailOf(name);
    return (
      <div className={`${EMAIL_COL} truncate pl-2 text-xs ${email ? "text-slate-600" : "text-slate-300"}`} title={email}>
        {email ?? "—"}
      </div>
    );
  };
  // Ô đã chọn chỉ hiện tên; danh sách thả xuống vẫn kèm chức danh
  const showStaffName = ({ value }: { value: string | number }) => String(value);
  // Ghi nhận người giao việc khi chọn người thực hiện
  const buildAssignment = (name?: string): Pick<ProcedureStep, "assignedTo" | "assignedToId" | "assignedBy" | "assignedAt"> => ({
    assignedTo: name || undefined,
    assignedToId: name ? staffList.find((s) => s.name === name)?.id : undefined,
    assignedBy: name && departmentTitle ? `Lead ${departmentTitle}` : undefined,
    assignedAt: name ? new Date().toISOString().slice(0, 10) : undefined,
  });

  // Cập nhật thông tin của bất kỳ bước nào trong danh sách
  const handleUpdateStep = (stepId: string, updates: Partial<ProcedureStep>) => {
    setLocalSteps((prev) => {
      const updated = prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
      syncToCurrentProfile(updated);
      return updated;
    });
  };

  // Inline thêm bước chính (Cha) trực tiếp trong danh sách
  const [isAddingParentInline, setIsAddingParentInline] = useState(false);
  const [inlineParentCode, setInlineParentCode] = useState<string>("");
  const [inlineParentName, setInlineParentName] = useState<string>("");
  const [inlineParentType, setInlineParentType] = useState<"MANDATORY" | "CONDITIONAL">("MANDATORY");
  const [inlineParentUnit, setInlineParentUnit] = useState<string>("Chủ đầu tư");
  const [inlineParentAssignee, setInlineParentAssignee] = useState<string>("");
  const [inlineParentDays, setInlineParentDays] = useState<string>("");
  const [inlineParentError, setInlineParentError] = useState<string>("");

  // Trạng thái thêm bước con trực tiếp bên dưới bước cha khi click vào cha
  const [activeParentForSub, setActiveParentForSub] = useState<string | null>(null);
  const [inlineChildCode, setInlineChildCode] = useState<string>("");
  const [inlineChildName, setInlineChildName] = useState<string>("");
  const [inlineChildUnit, setInlineChildUnit] = useState<string>("Chủ đầu tư");
  const [inlineChildAssignee, setInlineChildAssignee] = useState<string>("");
  const [inlineChildDays, setInlineChildDays] = useState<string>("");
  const [inlineChildType, setInlineChildType] = useState<"MANDATORY" | "CONDITIONAL">("MANDATORY");
  const [inlineChildError, setInlineChildError] = useState<string>("");

  // Theo dõi các bước mới thêm trong session này (chưa lưu cấu hình)
  const [newlyAddedStepIds, setNewlyAddedStepIds] = useState<Set<string>>(new Set());

  // Bản đã lưu gần nhất: mỗi tab chỉ ghi phần của mình lên bản này, phần chưa lưu của tab kia giữ nguyên
  // So sánh trên bản đã tính lại thời gian bước cha, để vừa mở trang không bị coi là có thay đổi
  const savedStepsRef = useRef<ProcedureStep[]>(withParentRollups(steps));
  const lastSavedJsonRef = useRef<string | null>(null);

  // Tải custom profiles khi mở modal
  useEffect(() => {
    if (open) {
      const loaded = loadCustomProfiles();
      setCustomProfiles(loaded);
      savedStepsRef.current = withParentRollups(steps);
      // Vừa lưu xong, trang cha nạp lại đúng bản vừa lưu → giữ các chỉnh sửa chưa lưu của tab còn lại
      if (lastSavedJsonRef.current !== JSON.stringify(steps)) setLocalSteps(steps);
      lastSavedJsonRef.current = null;
      setSelectedProfileId(currentProcedureId || "");
      setNewlyAddedStepIds(new Set()); // Reset danh sách bước mới khi mở modal
      if (departmentTitle) {
        setInlineChildUnit(departmentTitle);
      }
    }
  }, [open, steps, currentProcedureId, departmentTitle]);


  // Danh sách các bước cha hiện có (không chứa dấu chấm)
  const parentSteps = useMemo(() => {
    return localSteps.filter((s) => !s.code.includes("."));
  }, [localSteps]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const totalCount = localSteps.length;
    const mandatoryCount = localSteps.filter((s) => s.type === "MANDATORY").length;
    const conditionalCount = localSteps.filter((s) => s.type === "CONDITIONAL").length;
    const enabledConditionalCount = localSteps.filter((s) => s.type === "CONDITIONAL" && s.isEnabled).length;
    const disabledCount = conditionalCount - enabledConditionalCount;
    const totalActiveSteps = mandatoryCount + enabledConditionalCount;

    return {
      totalCount,
      mandatoryCount,
      conditionalCount,
      enabledConditionalCount,
      disabledCount,
      totalActiveSteps,
    };
  }, [localSteps]);

  // Điều chỉnh số ngày kế hoạch
  const handleDaysChange = (stepId: string, delta: number) => {
    setLocalSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id === stepId) {
          // Giới hạn số ngày theo biên độ của chính bước đó (không có thì 1–180 ngày)
          const current = s.plannedDays || s.durationDaysMin || 10;
          const min = s.durationDaysMin || 1;
          const max = s.durationDaysMax || 180;
          const updatedDays = Math.min(max, Math.max(min, current + delta));
          return {
            ...s,
            plannedDays: updatedDays,
          };
        }
        return s;
      });
      syncToCurrentProfile(updated);
      return updated;
    });
  };

  // Đồng bộ bước vào custom profile nếu đang chọn profile tự tạo
  const syncToCurrentProfile = (newSteps: ProcedureStep[]) => {
    // Trên trang chi tiết chỉ lưu khi bấm nút lưu của từng tab
    if (isPage) return;
    if (selectedProfileId.startsWith("custom_")) {
      const updated = customProfiles.map((p) =>
        p.id === selectedProfileId ? { ...p, steps: newSteps } : p
      );
      setCustomProfiles(updated);
      saveCustomProfiles(updated);
    }
  };

  // Chọn quy trình để xem / chỉnh trong hộp cấu hình (chỉ áp dụng khi bấm "Lưu cấu hình" nên không thông báo)
  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);

    // 1. Kiểm tra template theo phòng ban
    const deptTpl = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === profileId);
    if (deptTpl) {
      const loadedSteps = getTemplateSteps(deptTpl);
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
      return;
    }

    // 2. Kiểm tra custom profile
    const target = customProfiles.find((p) => p.id === profileId);
    if (target) {
      const loadedSteps = target.steps || [];
      setLocalSteps(loadedSteps);
      setNewlyAddedStepIds(new Set());
    }
  };

  // Xóa quy trình khỏi danh sách: quy trình tự tạo thì xóa hẳn, quy trình mẫu thì ẩn đi — hỏi xác nhận trước
  const handleDeleteProfile = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const custom = customProfiles.find((p) => p.id === profileId);
    const template = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === profileId);
    const name = custom?.name || template?.name || "";

    modal.confirm({
      centered: true,
      width: 440,
      zIndex: 1400,
      title: "Xóa quy trình?",
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Quy trình <strong className="text-slate-800">{name}</strong> sẽ bị xóa khỏi danh sách chọn. Các dự án đang áp
          dụng vẫn giữ nguyên các bước đã cấu hình.
        </p>
      ),
      okText: "Xóa quy trình",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        if (custom) {
          const updated = customProfiles.filter((p) => p.id !== profileId);
          setCustomProfiles(updated);
          saveCustomProfiles(updated);
        } else if (template) {
          const updated = [...new Set([...hiddenTemplateIds, profileId])];
          setHiddenTemplateIds(updated);
          saveHiddenTemplateIds(updated);
        }
        toast.info("Đã xóa quy trình", `Đã xóa quy trình "${name}" khỏi danh sách.`);

        if (selectedProfileId === profileId) {
          setSelectedProfileId("");
          setLocalSteps(isPage ? [] : steps);
          setNewlyAddedStepIds(new Set());
        }
      },
    });
  };

  // Mở modal tạo quy trình mới
  const handleOpenCreateProfile = () => setIsCreateProfileOpen(true);

  // Xác nhận tạo quy trình mới: lưu ngay vào danh mục rồi mở để thêm bước
  const handleConfirmCreateProfile = ({ name, department, copyFromId }: CreateProcedureValues) => {
    const initialSteps = copyFromId ? getProcedureSteps(copyFromId) : [];
    const newProfile = createProcedure({ name, department, steps: initialSteps });
    setCustomProfiles(loadCustomProfiles());
    setSelectedProfileId(newProfile.id);
    setLocalSteps(initialSteps);
    setNewlyAddedStepIds(new Set());
    setIsCreateProfileOpen(false);

    toast.success(
      "Đã tạo quy trình mới",
      `Đã lưu quy trình "${name}" (${initialSteps.length} bước). Về sau bạn và các dự án khác có thể chọn dùng lại ngay lập tức!`
    );
  };

  // Mở dòng nhập inline thêm bước chính (Cha)
  const handleOpenAddParentStep = () => {
    if (isAddingParentInline) {
      setIsAddingParentInline(false);
      return;
    }
    setIsAddingParentInline(true);
    setInlineParentCode(getNextParentCode(localSteps));
    setInlineParentName("");
    setInlineParentType("MANDATORY");
    setInlineParentUnit(departmentTitle || "Chủ đầu tư");
    setInlineParentAssignee("");
    setInlineParentDays("");
    setInlineParentError("");
    // Đóng inline bước con nếu đang mở
    setActiveParentForSub(null);
  };

  // Bước chính từ dòng nhập inline (chưa đưa vào danh sách)
  const buildInlineParentStep = (steps: ProcedureStep[]): ProcedureStep => {
    const finalCode = inlineParentCode.trim() || getNextParentCode(steps);
    const assigneeStaff = staffList.find((s) => s.name === inlineParentAssignee);
    return {
      id: `dept-step-${Date.now()}-${finalCode}`,
      order: steps.length + 1,
      code: finalCode,
      groupCode: finalCode,
      groupTitle: inlineParentName.trim(),
      name: inlineParentName.trim(),
      type: inlineParentType,
      responsibleUnit: inlineParentUnit || departmentTitle || "Chủ đầu tư",
      department: departmentTitle || undefined,
      assignedTo: inlineParentAssignee || undefined,
      assignedToId: assigneeStaff?.id,
      assignedBy: inlineParentAssignee && departmentTitle ? `Lead ${departmentTitle}` : undefined,
      assignedAt: inlineParentAssignee ? new Date().toISOString().slice(0, 10) : undefined,
      ...buildDurationFields(inlineParentDays),
      isEnabled: true,
      status: "NOT_STARTED",
      attachments: [],
      notes: "",
    };
  };

  // Thêm bước chính được nhập inline (Enter)
  const handleSaveInlineParent = (keepOpen = false) => {
    if (!inlineParentName.trim()) {
      setInlineParentError("Vui lòng nhập tên bước chính");
      return;
    }
    confirmChange(
      "Thêm bước chính?",
      `Thêm bước [${inlineParentCode}] "${inlineParentName.trim()}" vào quy trình.`,
      () => applyInlineParent(keepOpen),
      // Hủy: bỏ luôn dòng đang thêm
      () => {
        setIsAddingParentInline(false);
        setInlineParentName("");
        setInlineParentError("");
      },
    );
  };
  const applyInlineParent = (keepOpen: boolean) => {
    const newStep = buildInlineParentStep(localSteps);
    const updated = [...localSteps, newStep].map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => new Set([...prev, newStep.id]));
    if (keepOpen) {
      setInlineParentName("");
      setInlineParentError("");
      setInlineParentCode(getNextParentCode(updated));
    } else {
      setIsAddingParentInline(false);
      setInlineParentName("");
      setInlineParentError("");
    }
  };

  // Click trực tiếp vào bước cha để mở dòng thêm bước con ngay bên dưới
  const handleParentRowClick = (parentCode: string) => {
    if (activeParentForSub === parentCode) {
      setActiveParentForSub(null);
      return;
    }
    const parentObj = localSteps.find((s) => s.code === parentCode);
    expandTo(parentCode);
    setActiveParentForSub(parentCode);
    setInlineChildCode(getNextSubCode(parentCode, localSteps));
    setInlineChildName("");
    setInlineChildUnit(parentObj?.responsibleUnit || departmentTitle || "Chủ đầu tư");
    setInlineChildAssignee("");
    setInlineChildDays("");
    setInlineChildType("MANDATORY");
    setInlineChildError("");
  };

  // Bước con từ dòng nhập inline dưới bước cha (chưa đưa vào danh sách)
  const buildInlineChildStep = (parentCode: string, steps: ProcedureStep[]): ProcedureStep => {
    const finalCode = inlineChildCode.trim() || getNextSubCode(parentCode, steps);
    const rootCode = getRootCode(parentCode);
    const rootObj = steps.find((p) => p.code === rootCode);
    const assigneeStaff = staffList.find((s) => s.name === inlineChildAssignee);

    return {
      id: `dept-step-${Date.now()}-${finalCode}`,
      order: steps.length + 1,
      code: finalCode,
      groupCode: rootCode,
      groupTitle: rootObj?.name || "Quy trình thực hiện",
      name: inlineChildName.trim(),
      type: inlineChildType,
      responsibleUnit: inlineChildUnit || departmentTitle || "Chủ đầu tư",
      department: departmentTitle || undefined,
      assignedTo: inlineChildAssignee || undefined,
      assignedToId: assigneeStaff?.id,
      assignedBy: inlineChildAssignee && departmentTitle ? `Lead ${departmentTitle}` : undefined,
      assignedAt: inlineChildAssignee ? new Date().toISOString().slice(0, 10) : undefined,
      ...buildDurationFields(inlineChildDays),
      isEnabled: true,
      status: "NOT_STARTED",
      attachments: [],
      notes: "",
    };
  };

  // Thêm bước con được nhập trực tiếp bên dưới bước cha (Enter)
  const handleSaveInlineChild = (keepOpen = false) => {
    if (!activeParentForSub) return;
    if (!inlineChildName.trim()) {
      setInlineChildError("Vui lòng nhập tên bước con");
      return;
    }
    confirmChange(
      "Thêm bước con?",
      `Thêm bước [${inlineChildCode}] "${inlineChildName.trim()}" vào bước [${activeParentForSub}].`,
      () => applyInlineChild(keepOpen),
      // Hủy: bỏ luôn dòng đang thêm
      () => {
        setActiveParentForSub(null);
        setInlineChildName("");
        setInlineChildError("");
        setInlineChildAssignee("");
      },
    );
  };
  const applyInlineChild = (keepOpen: boolean) => {
    if (!activeParentForSub) return;
    const newStep = buildInlineChildStep(activeParentForSub, localSteps);
    const updated = insertStepHierarchically(localSteps, newStep, activeParentForSub);
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => new Set([...prev, newStep.id]));

    if (keepOpen) {
      setInlineChildName("");
      setInlineChildError("");
      setInlineChildAssignee("");
      setInlineChildCode(getNextSubCode(activeParentForSub, updated));
    } else {
      setActiveParentForSub(null);
      setInlineChildName("");
      setInlineChildError("");
      setInlineChildAssignee("");
    }
  };

  // Mở modal thêm bước con
  const handleOpenAddSubStep = (defaultParentCode?: string) => {
    if (parentSteps.length === 0) {
      handleOpenAddParentStep();
      return;
    }
    const targetParent = defaultParentCode || parentSteps[parentSteps.length - 1]?.code || parentSteps[0]?.code;
    handleParentRowClick(targetParent);
  };

  // Xóa bước khỏi quy trình
  const handleRemoveStep = (stepId: string) => {
    const target = localSteps.find((s) => s.id === stepId);
    if (!target) return;
    // Xóa bước kèm toàn bộ bước con bên dưới để không còn bước con mồ côi
    const removedIds = new Set(
      localSteps.filter((s) => s.id === stepId || isDescendantOf(s.code, target.code)).map((s) => s.id)
    );
    const updated = localSteps.filter((s) => !removedIds.has(s.id)).map((s, idx) => ({ ...s, order: idx + 1 }));
    setLocalSteps(updated);
    syncToCurrentProfile(updated);
    setNewlyAddedStepIds((prev) => {
      const next = new Set(prev);
      removedIds.forEach((id) => next.delete(id));
      return next;
    });
    if (activeParentForSub && (activeParentForSub === target.code || isDescendantOf(activeParentForSub, target.code))) {
      setActiveParentForSub(null);
    }
  };

  // Sửa bước ngay trên dòng (bút chì): tên, thời gian, loại
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    responsibleUnit: string;
    type: StepType;
    days: string;
    assignedTo: string;
  }>({
    name: "",
    responsibleUnit: "",
    type: "MANDATORY",
    days: "",
    assignedTo: "",
  });
  // Giữ nguyên khoảng thời gian dạng chữ (VD "Theo HĐ") nếu không sửa số ngày
  const [editDaysTouched, setEditDaysTouched] = useState(false);
  const [editError, setEditError] = useState("");
  // Bấm vào ô người thực hiện để sửa thì giữ con trỏ ở ô đó, không nhảy sang ô tên
  const [editFocusAssignee, setEditFocusAssignee] = useState(false);

  const startEditStep = (step: ProcedureStep, focusAssignee = false) => {
    setActiveParentForSub(null);
    setEditingStepId(step.id);
    setEditFocusAssignee(focusAssignee);
    setEditDraft({
      name: step.name,
      responsibleUnit: step.responsibleUnit,
      type: step.type,
      days: getStepDays(step) ? String(getStepDays(step)) : "",
      assignedTo: step.assignedTo || "",
    });
    setEditDaysTouched(false);
    setEditError("");
  };
  const cancelEditStep = () => {
    setEditingStepId(null);
    setEditError("");
  };
  const saveEditStep = () => {
    if (!editingStepId) return;
    const name = editDraft.name.trim();
    if (!name) {
      setEditError("Vui lòng nhập tên bước");
      return;
    }
    const current = localSteps.find((s) => s.id === editingStepId);
    // Không sửa gì thì đóng luôn, khỏi hỏi
    const unchanged =
      !!current &&
      current.name === name &&
      current.type === editDraft.type &&
      (current.assignedTo || "") === editDraft.assignedTo &&
      !editDaysTouched;
    if (unchanged) {
      cancelEditStep();
      return;
    }
    // Hủy: bỏ các chỉnh sửa, dòng trở về như cũ
    confirmChange("Lưu thay đổi?", `Cập nhật bước [${current?.code ?? ""}] "${name}".`, applyEditStep, cancelEditStep);
  };
  const applyEditStep = () => {
    if (!editingStepId) return;
    const name = editDraft.name.trim();
    const isMandatory = editDraft.type === "MANDATORY";
    const current = localSteps.find((s) => s.id === editingStepId);
    handleUpdateStep(editingStepId, {
      name,
      // Bước chính: tên nhóm hiển thị ở màn hình chính đi theo tên bước
      ...(current && !current.code.includes(".") ? { groupTitle: name } : {}),
      responsibleUnit: editDraft.responsibleUnit.trim() || current?.responsibleUnit || "",
      type: editDraft.type,
      ...(editDaysTouched ? buildDurationFields(editDraft.days) : {}),
      ...((current?.assignedTo || "") !== editDraft.assignedTo ? buildAssignment(editDraft.assignedTo || undefined) : {}),
      // Đổi sang bắt buộc thì bước luôn được áp dụng
      ...(isMandatory && current && !current.isEnabled
        ? { isEnabled: true, status: current.status === "DISABLED" ? "NOT_STARTED" : current.status }
        : {}),
    });
    // Chỉ đóng nếu vẫn đang sửa đúng dòng này (lúc chờ xác nhận có thể đã mở dòng khác)
    const editedId = editingStepId;
    setEditingStepId((cur) => (cur === editedId ? null : cur));
    setEditError("");
  };

  // Đang sửa một dòng: bấm ra ngoài dòng là tự lưu và trở về như cũ (Esc = bỏ sửa)
  const editingRowRef = useRef<HTMLDivElement>(null);
  const saveEditRef = useRef(saveEditStep);
  useEffect(() => {
    saveEditRef.current = saveEditStep;
  });
  useEffect(() => {
    if (!editingStepId) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      // Danh sách thả xuống của ô chọn nằm ngoài dòng (gắn vào body) → vẫn tính là trong dòng
      if (!target || editingRowRef.current?.contains(target) || target.closest("[class*='ant-select-dropdown'], .ant-modal-root, .ant-modal-wrap")) return;
      saveEditRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [editingStepId]);

  // Bấm thùng rác: luôn hỏi trước khi xóa (bước có bước con thì xóa luôn các bước con); chỉ áp dụng khi bấm "Lưu cấu hình"
  const confirmRemoveStep = (step: ProcedureStep) => {
    const childCount = localSteps.filter((s) => isDescendantOf(s.code, step.code)).length;
    modal.confirm({
      centered: true,
      width: 440,
      icon: null,
      zIndex: 1400,
      title: `Xóa bước [${step.code}] ${step.name}?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          {childCount > 0 && (
            <>
              Bước này có <strong>{childCount}</strong> bước con bên dưới, tất cả sẽ bị xóa cùng.{" "}
            </>
          )}
          {isDraft
            ? "Quy trình chỉ được lưu khi bạn bấm \"Tạo quy trình\"."
            : isPage
            ? "Thay đổi được lưu vào quy trình khi bạn bấm \"Lưu quy trình\"."
            : "Thay đổi chỉ áp dụng cho dự án khi bạn bấm \"Lưu cấu hình\"."}
        </p>
      ),
      okText: "Xóa bước",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => handleRemoveStep(step.id),
    });
  };

  // Thêm quy trình mới: sang bước 2 (sơ đồ) khi đã có ít nhất một bước
  const goToFlowStep = () => {
    if (localSteps.length === 0 && !inlineParentName.trim()) {
      toast.warning("Chưa có bước nào", "Thêm ít nhất một bước chính trước khi cấu hình sơ đồ quy trình.");
      return;
    }
    setViewMode("flow");
  };

  // Trang chi tiết quy trình: mỗi thay đổi tự lưu ngay (gom các thao tác liền nhau trong nửa giây thành một lần)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  // Chân trang (nút lưu) chỉ có khi không tự lưu; thanh kéo ngang bám đáy chừa chỗ cho chân trang nếu có
  const hasFooter = !(viewMode === "history" || autoSave);
  const stickyBarBottom = isPage && hasFooter ? STICKY_FOOTER_HEIGHT : 0;
  useEffect(() => {
    if (!autoSave || !selectedProfileId) return;
    const timer = setTimeout(() => {
      const finalSteps = withParentRollups(localSteps);
      if (JSON.stringify(finalSteps) === JSON.stringify(savedStepsRef.current)) return;
      const changes = diffSteps(savedStepsRef.current, finalSteps);
      if (customProfiles.some((p) => p.id === selectedProfileId)) {
        const updated = customProfiles.map((p) => (p.id === selectedProfileId ? { ...p, steps: finalSteps } : p));
        setCustomProfiles(updated);
        saveCustomProfiles(updated);
      } else {
        saveTemplateOverride(selectedProfileId, finalSteps);
      }
      savedStepsRef.current = finalSteps;
      lastSavedJsonRef.current = JSON.stringify(finalSteps);
      setAutoSavedAt(new Date());
      onSaveConfig(finalSteps, selectedProfileId, "auto", changes);
    }, 500);
    return () => clearTimeout(timer);
    // Chỉ chạy lại khi các bước thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSteps, autoSave, selectedProfileId]);

  // Lưu cấu hình
  const handleSave = (scope: SaveScope = "all") => {
    // Dòng nhập bước đang gõ dở (chưa nhấn Enter) cũng được lưu luôn
    let pendingSteps = localSteps;
    if (isAddingParentInline && inlineParentName.trim()) {
      pendingSteps = [...pendingSteps, buildInlineParentStep(pendingSteps)].map((s, idx) => ({ ...s, order: idx + 1 }));
    }
    if (activeParentForSub && inlineChildName.trim()) {
      pendingSteps = insertStepHierarchically(
        pendingSteps,
        buildInlineChildStep(activeParentForSub, pendingSteps),
        activeParentForSub,
      );
    }
    if (scope !== "flow") {
      setIsAddingParentInline(false);
      setInlineParentName("");
      setActiveParentForSub(null);
      setInlineChildName("");
    }
    const draftSteps = withParentRollups(scope === "flow" ? localSteps : pendingSteps);
    const saved = new Map(savedStepsRef.current.map((st) => [st.id, st]));
    const draftById = new Map(draftSteps.map((st) => [st.id, st]));
    const finalSteps =
      scope === "flow"
        ? // Lưu tiến độ: bản đã lưu + thứ tự làm mới (bước thêm / sửa chưa lưu thì chưa ghi)
          savedStepsRef.current.map((st) => ({ ...st, flowStage: draftById.get(st.id)?.flowStage }))
        : scope === "info"
          ? // Lưu quy trình: thông tin các bước mới, thứ tự làm giữ như bản đã lưu
            draftSteps.map((st) => (saved.has(st.id) ? { ...st, flowStage: saved.get(st.id)?.flowStage } : st))
          : draftSteps;
    if (isPage) {
      if (onCreateNew) {
        onCreateNew(finalSteps);
        return;
      }
      // Trang danh mục: lưu thẳng vào quy trình đang chọn, trang vẫn mở
      if (!selectedProfileId) {
        toast.warning("Chưa chọn quy trình", "Vui lòng chọn hoặc thêm một quy trình trước khi lưu.");
        return;
      }
      if (customProfiles.some((p) => p.id === selectedProfileId)) {
        const updated = customProfiles.map((p) => (p.id === selectedProfileId ? { ...p, steps: finalSteps } : p));
        setCustomProfiles(updated);
        saveCustomProfiles(updated);
      } else {
        saveTemplateOverride(selectedProfileId, finalSteps);
      }
      savedStepsRef.current = finalSteps;
      lastSavedJsonRef.current = JSON.stringify(finalSteps);
      setLocalSteps(draftSteps);
      if (scope !== "flow") setNewlyAddedStepIds(new Set());
      onSaveConfig(finalSteps, selectedProfileId, scope);
      return;
    }
    onSaveConfig(finalSteps, selectedProfileId);
    onClose();
  };

  // Danh sách hiển thị theo bộ lọc & tìm kiếm
  const filteredSteps = useMemo(() => {
    return localSteps.filter((step) => {
      let matchFilter = true;
      if (filterType === "MANDATORY") {
        matchFilter = step.type === "MANDATORY";
      } else if (filterType === "CONDITIONAL") {
        matchFilter = step.type === "CONDITIONAL";
      } else if (filterType === "DISABLED") {
        matchFilter = !step.isEnabled;
      }

      const matchSearch =
        searchTerm.trim() === "" ||
        step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.responsibleUnit.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [localSteps, filterType, searchTerm]);

  // Đang tìm / lọc thì hiện hết để không giấu kết quả trong bước đang thu gọn
  const isFiltering = filterType !== "ALL" || searchTerm.trim() !== "";
  const visibleSteps = useMemo(
    () =>
      isFiltering
        ? filteredSteps
        : filteredSteps.filter((s) => getAncestorCodes(s.code).every((code) => expandedCodes.has(code))),
    [filteredSteps, expandedCodes, isFiltering]
  );

  // Quan hệ giữa các dòng để vẽ trục: bước liền trước / liền sau cùng cấp, số bước con
  const flowLinks = useMemo(() => {
    const codes = new Set(filteredSteps.map((s) => s.code));
    const prev = new Map<string, ProcedureStep>();
    const next = new Map<string, ProcedureStep>();
    const lastByParent = new Map<string, ProcedureStep>();
    const childCount = new Map<string, number>();
    for (const s of filteredSteps) {
      const parent = getParentCode(s.code) ?? "";
      const before = lastByParent.get(parent);
      if (before) {
        prev.set(s.code, before);
        next.set(before.code, s);
      }
      lastByParent.set(parent, s);
      if (parent) childCount.set(parent, (childCount.get(parent) ?? 0) + 1);
    }
    return { codes, prev, next, childCount };
  }, [filteredSteps]);



  const getFlowProps = (step: ProcedureStep) => {
    const parent = getParentCode(step.code);
    const prevStep = flowLinks.prev.get(step.code);
    const childCount = flowLinks.childCount.get(step.code) ?? 0;
    const expanded = isFiltering || expandedCodes.has(step.code);
    return {
      depth: getStepDepth(step.code),
      incoming: !!prevStep,
      fromParent: !prevStep && !!parent && flowLinks.codes.has(parent),
      outgoing: flowLinks.next.has(step.code) || (expanded && childCount > 0),
      // Bước tổ tiên còn bước kế tiếp cùng cấp → trục của nó chạy xuyên qua dòng này
      passLevels: getAncestorCodes(step.code).flatMap((code, level) => (flowLinks.next.has(code) ? [level] : [])),
      childCount,
      expanded,
    };
  };

  const expandableCodes = useMemo(() => [...flowLinks.childCount.keys()], [flowLinks]);
  const allExpanded = expandableCodes.length > 0 && expandableCodes.every((code) => expandedCodes.has(code));

  // Xác định bước cuối cùng của bước cha đang active để hiển thị dòng nhập bên dưới
  const lastCodeForActiveParent = useMemo(() => {
    if (!activeParentForSub) return null;
    let lastCode = activeParentForSub;
    for (const s of visibleSteps) {
      if (s.code === activeParentForSub || s.code.startsWith(`${activeParentForSub}.`)) {
        lastCode = s.code;
      }
    }
    return lastCode;
  }, [activeParentForSub, visibleSteps]);

  // Render dòng nhập bước con trực tiếp bên dưới bước cha
  const renderInlineChildRow = () => {
    if (!activeParentForSub) return null;
    const childDepth = getStepDepth(activeParentForSub) + 1;

    return (
      <div className="flex flex-col gap-1 px-3.5 py-2 bg-red-50/70 border-y border-red-200 border-l-[3px] border-l-[#DC2626] shadow-2xs transition-all">
        <div className="flex items-center gap-3 w-full">
          {/* Mã bước (thụt lề theo cấp) */}
          <div className="w-32 shrink-0 flex items-center gap-0.5" style={{ paddingLeft: FLOW_GUTTER + FLOW_INDENT * childDepth }}>
            <span className="text-[#DC2626] font-mono text-xs select-none">└</span>
            <Input
              value={inlineChildCode}
              onChange={(e) => setInlineChildCode(e.target.value)}
              className="h-7 w-16 min-w-0 shrink text-center font-mono font-bold text-[11px] bg-white border-red-200 p-0.5"
              placeholder="Mã"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineChild(true);
                if (e.key === "Escape") setActiveParentForSub(null);
              }}
            />
          </div>

          {/* Tên bước con */}
          <div className="min-w-0 flex-1 pr-2">
            <Input
              value={inlineChildName}
              onChange={(e) => {
                setInlineChildName(e.target.value);
                if (inlineChildError) setInlineChildError("");
              }}
              placeholder={`Nhập tên bước con thuộc [${activeParentForSub}] (nhấn Enter để thêm)...`}
              autoFocus
              className={`h-7 text-xs bg-white w-full ${
                inlineChildError ? "border-rose-500 ring-1 ring-rose-200" : "border-red-300 focus:border-[#DC2626]"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineChild(true);
                if (e.key === "Escape") setActiveParentForSub(null);
              }}
            />
          </div>

          {/* Người thực hiện */}
          <div className={ASSIGNEE_COL}>
            <Select
              value={inlineChildAssignee || undefined}
              onChange={setInlineChildAssignee}
              size="small"
              className="w-full text-xs"
              placeholder="— Phân công —"
              allowClear
              showSearch
              optionFilterProp="label"
              options={staffOptions}
              labelRender={showStaffName}
            />
          </div>
          {renderEmail(inlineChildAssignee)}

          {/* Thời gian (số ngày cố định) */}
          <StepDurationInput
            days={inlineChildDays}
            onChange={setInlineChildDays}
          />

          {/* Loại */}
          <div className={`${TYPE_COL} flex items-center justify-center`}>
            <Select
              value={inlineChildType}
              onChange={setInlineChildType}
              size="small"
              className="w-24 text-xs"
              options={STEP_TYPE_OPTIONS}
            />
          </div>

          {/* Thao tác */}
          <InlineRowActions
            hasValue={!!inlineChildName.trim()}
            onSave={() => handleSaveInlineChild(false)}
            onCancel={() => setActiveParentForSub(null)}
          />
        </div>

        {/* Thông báo lỗi nằm riêng ở dòng dưới, thẳng hàng với ô nhập tên, không làm lệch hàng controls */}
        {inlineChildError && (
          <div className="flex items-center gap-3 w-full">
            <div className="w-16 shrink-0" />
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[11px] text-rose-500 font-medium m-0 pt-0.5 leading-normal">
                {inlineChildError}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render dòng nhập bước chính (Cha) trực tiếp ở cuối danh sách
  const renderInlineParentRow = () => {
    if (!isAddingParentInline) return null;
    return (
      <div className="flex flex-col gap-1 px-3.5 py-2 bg-indigo-50/60 border-y border-indigo-300 border-l-[3px] border-l-indigo-500 shadow-2xs">
        <div className="flex items-center gap-3 w-full">
          {/* Mã bước */}
          <div className="w-32 shrink-0 flex items-center gap-1.5 text-left" style={{ paddingLeft: FLOW_GUTTER }}>
            <Input
              value={inlineParentCode}
              onChange={(e) => setInlineParentCode(e.target.value)}
              className="h-7 w-14 text-center font-mono font-bold text-[11px] bg-white border-indigo-300 p-0.5"
              placeholder="Mã"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineParent(false);
                if (e.key === "Escape") setIsAddingParentInline(false);
              }}
            />
          </div>

          {/* Tên bước chính */}
          <div className="min-w-0 flex-1 pr-2">
            <Input
              value={inlineParentName}
              onChange={(e) => {
                setInlineParentName(e.target.value);
                if (inlineParentError) setInlineParentError("");
              }}
              placeholder="Nhập tên bước chính (nhấn Enter để thêm)..."
              autoFocus
              className={`h-7 text-xs bg-white w-full font-semibold ${
                inlineParentError ? "border-rose-500 ring-1 ring-rose-200" : "border-indigo-400 focus:border-indigo-600"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInlineParent(false);
                if (e.key === "Escape") setIsAddingParentInline(false);
              }}
            />
          </div>

          {/* Người thực hiện */}
          <div className={ASSIGNEE_COL}>
            <Select
              value={inlineParentAssignee || undefined}
              onChange={setInlineParentAssignee}
              size="small"
              className="w-full text-xs"
              placeholder="— Phân công —"
              allowClear
              showSearch
              optionFilterProp="label"
              options={staffOptions}
              labelRender={showStaffName}
            />
          </div>
          {renderEmail(inlineParentAssignee)}

          {/* Thời gian (số ngày cố định) */}
          <StepDurationInput
            days={inlineParentDays}
            onChange={setInlineParentDays}
          />

          {/* Loại */}
          <div className={`${TYPE_COL} flex items-center justify-center`}>
            <Select
              value={inlineParentType}
              onChange={setInlineParentType}
              size="small"
              className="w-24 text-xs"
              options={STEP_TYPE_OPTIONS}
            />
          </div>

          {/* Thao tác */}
          <InlineRowActions
            hasValue={!!inlineParentName.trim()}
            onSave={() => handleSaveInlineParent(false)}
            onCancel={() => setIsAddingParentInline(false)}
          />
        </div>

        {/* Thông báo lỗi nằm riêng ở dòng dưới, thẳng hàng với ô nhập tên, không làm lệch hàng controls */}
        {inlineParentError && (
          <div className="flex items-center gap-3 w-full">
            <div className="w-16 shrink-0" />
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[11px] text-rose-500 font-medium m-0 pt-0.5 leading-normal">
                {inlineParentError}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeProfile =
    customProfiles.find((p) => p.id === selectedProfileId) ||
    Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((d) => d.id === selectedProfileId) ||
    null;

  // Một danh sách chung (không chia nhóm): quy trình mẫu chưa xóa (mẫu của phòng ban mình lên đầu) + quy trình tự tạo
  const profileSelectOptions = useMemo(() => {
    const templates = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).filter((d) => !hiddenTemplateIds.includes(d.id));
    const sortedTemplates = deptTemplate
      ? [...templates.filter((d) => d.id === deptTemplate.id), ...templates.filter((d) => d.id !== deptTemplate.id)]
      : templates;

    return [
      ...sortedTemplates.map((d) => {
        const stepCount = getTemplateSteps(d).length;
        return {
          value: d.id,
          label: `${d.shortName} (${d.department})`,
          name: d.name,
          stepCount,
          isCustom: false,
          badge: `${stepCount} bước`,
        };
      }),
      ...customProfiles.map((p) => ({
        value: p.id,
        label: p.name,
        name: p.name,
        stepCount: p.steps?.length || 0,
        isCustom: true,
        badge: `${p.steps?.length || 0} bước`,
      })),
    ];
  }, [customProfiles, deptTemplate, hiddenTemplateIds]);

  return (
    <>
      <StepConfigFrame
        variant={variant}
        open={open}
        onClose={onClose}
        title={
          isPage ? null : (
            <div className="flex items-center justify-between pr-6 w-full">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {departmentTitle ? (
                      <>
                        Thêm Quy trình Thủ tục — <span className="text-[#DC2626]">{departmentTitle}</span>
                      </>
                    ) : (
                      "Cấu hình Quy trình Thủ tục Dự án"
                    )}
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    {projectName
                      ? `Tùy chỉnh quy trình, thêm bước chính và bước con phù hợp`
                      : "Tùy chỉnh hoặc thêm mới quy trình, thêm bước cha và bước con phù hợp với dự án"}
                  </p>
                </div>
              </div>
            </div>
          )
        }
        // Tab Sơ đồ: "Lưu tiến độ" (thứ tự làm); tab Danh sách: "Lưu quy trình" (thông tin bước); tab Lịch sử: không có
        footer={!hasFooter ? null : (
          <div className="flex items-center justify-end w-full">
            <div className="flex items-center gap-2">
              {/* Thêm quy trình mới đi theo 2 bước: 1. nhập các bước → 2. cấu hình sơ đồ rồi mới tạo */}
              {isDraft && viewMode === "flow" && (
                <Button scale="compact" onClick={() => setViewMode("table")}>
                  Quay lại
                </Button>
              )}
              {isDraft && viewMode === "table" ? (
                <Button
                  intent="primary"
                  scale="compact"
                  className="bg-[#DC2626] border-[#DC2626] text-white"
                  onClick={goToFlowStep}
                >
                  Cấu hình quy trình
                </Button>
              ) : (
              <Button
                intent="primary"
                scale="compact"
                icon={<SaveOutlined />}
                className="bg-[#DC2626] border-[#DC2626] text-white"
                onClick={() => handleSave(isPage && !isDraft ? (viewMode === "flow" ? "flow" : "info") : "all")}
              >
                {isDraft ? "Tạo quy trình" : !isPage ? "Lưu cấu hình" : viewMode === "flow" ? "Lưu tiến độ" : "Lưu quy trình"}
              </Button>
              )}
              {/* Trang thêm quy trình mới: thoát bằng nút quay lại trên tiêu đề trang */}
              {!isDraft && (
                <Button scale="compact" onClick={isPage ? onBack : onClose}>
                  Đóng
                </Button>
              )}
            </div>
          </div>
        )}
      >
        <div className="flex-1 min-h-0 flex flex-col gap-3 pr-1 pb-2 text-xs">
          {/* Thanh công cụ 2 dòng (chỉ ở popup; trên trang thì tiêu đề trang và dòng "+ Thêm bước chính" đã đủ) */}
          {!isPage && (
          <div className="flex flex-col gap-2.5 bg-slate-50/90 p-3 rounded-lg border border-slate-200/80 shrink-0">
            {/* Dòng 1: Quản lý Quy trình & Thao tác chính */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Trái: Badge phòng ban (nếu có) + Chọn quy trình cũ/mẫu + Nút Thêm quy trình mới */}
              <div className="flex flex-wrap items-center gap-2">
                {departmentTitle && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] font-bold text-xs shadow-2xs shrink-0">
                    <BranchesOutlined className="text-sm" />
                    <span>{departmentTitle}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
                  <BranchesOutlined className="text-[#DC2626] text-sm" />
                  <span>Quy trình:</span>
                </div>

                <Select
                  // Quy trình đang áp dụng không còn trong danh sách (VD: mẫu chuẩn hệ thống đã bỏ) → hiện gợi ý thay vì mã
                  value={
                    profileSelectOptions.some((o) => o.value === selectedProfileId)
                      ? selectedProfileId
                      : undefined
                  }
                  placeholder="-- Chọn quy trình để dùng ngay --"
                  onChange={handleSelectProfile}
                  className="w-72 sm:w-80 text-xs"
                  size="small"
                  popupMatchSelectWidth={420}
                  options={profileSelectOptions}
                  optionRender={(option) => {
                    const data = option.data as {
                      value: string;
                      label: string;
                      name?: string;
                      stepCount?: number;
                      isCustom?: boolean;
                      badge?: string;
                    };
                    return (
                      <div className="flex items-center justify-between w-full py-0.5">
                        <span
                          className="truncate pr-2 font-medium text-slate-800 text-xs"
                          title={data?.name || data?.label}
                        >
                          {data?.label}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {data?.badge && (
                            <Tag intent="subtle" scale="sm">
                              {data.badge}
                            </Tag>
                          )}
                          <Tooltip title="Xóa quy trình này">
                            <button
                              type="button"
                              aria-label={`Xóa quy trình ${data?.name || data?.label}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => handleDeleteProfile(data.value, e)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                            >
                              <DeleteOutlined className="text-[11px]" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  }}
                />

                <Button
                  intent="outline"
                  scale="compact"
                  icon={<FolderAddOutlined className="text-[#DC2626]" />}
                  onClick={handleOpenCreateProfile}
                  className="h-8 text-xs font-semibold text-[#DC2626] border-red-200 hover:bg-red-50 shrink-0 shadow-2xs"
                >
                  Thêm quy trình mới
                </Button>
              </div>

              {/* Phải: Thêm bước chính */}
              <Button
                intent="primary"
                scale="compact"
                icon={<PlusOutlined />}
                onClick={handleOpenAddParentStep}
                className="h-8 text-xs font-semibold bg-[#DC2626] border-[#DC2626] text-white hover:bg-[#B91C1C] shadow-2xs shrink-0"
              >
                Thêm bước chính
              </Button>
            </div>

            {/* Dòng 2: Tìm kiếm & Bộ lọc */}
            <div className="flex items-center justify-between gap-3">
                {/* Trái: Ô tìm kiếm rộng rãi */}
                <Input
                  placeholder="Tìm mã bước (I, II...), tên bước hoặc đơn vị phụ trách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="h-8 text-xs flex-1 max-w-md"
                />

                {/* Phải: Bộ lọc Tabs + Nút Reset */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-md border border-slate-200 bg-slate-200/60 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterType("ALL")}
                      className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "ALL"
                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Tất cả ({stats.totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("MANDATORY")}
                      className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "MANDATORY"
                        ? "bg-white text-blue-700 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Bắt buộc ({stats.mandatoryCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("CONDITIONAL")}
                      className={`rounded px-2.5 py-1 font-medium transition-all cursor-pointer ${filterType === "CONDITIONAL"
                        ? "bg-white text-amber-700 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Nếu có ({stats.conditionalCount})
                    </button>
                  </div>
                </div>
              </div>
          </div>
          )}

          {/* Tab: sơ đồ / danh sách / lịch sử */}
          <div className="flex shrink-0 items-center gap-3">
            <div role="tablist" aria-label="Cách xem các bước" className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {(
                // Thêm quy trình mới: thêm bước trước rồi mới xem sơ đồ, chưa có lịch sử
                isDraft
                  ? ([
                      ["table", "1. Danh sách các bước"],
                      ["flow", "2. Sơ đồ quy trình"],
                    ] as const)
                  : ([
                      ["flow", "Sơ đồ quy trình"],
                      ["table", "Danh sách các bước"],
                      ["history", "Lịch sử thay đổi"],
                    ] as const)
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === mode}
                  onClick={() => (isDraft && mode === "flow" ? goToFlowStep() : setViewMode(mode))}
                  className={`cursor-pointer rounded-md px-3 py-1 transition-all ${
                    viewMode === mode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Trang chi tiết tự lưu: báo nhẹ lần lưu gần nhất thay cho nút Lưu */}
            {autoSave && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircleFilled className={autoSavedAt ? "text-emerald-500" : "text-slate-300"} />
                {autoSavedAt
                  ? `Đã tự lưu lúc ${autoSavedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                  : "Thay đổi được tự lưu"}
              </span>
            )}
          </div>

          {viewMode === "flow" && (
            <ProcedureRoadmap
              steps={localSteps}
              stickyBottom={stickyBarBottom}
              onChangeStages={(stages, description) =>
                confirmChange("Lưu thay đổi thứ tự?", description ?? "Cập nhật thứ tự thực hiện (song song / lần lượt) của các bước.", () =>
                  stages.forEach((flowStage, stepId) => handleUpdateStep(stepId, { flowStage })),
                )
              }
            />
          )}
          {viewMode === "history" && (
            <ProcedureChangeHistory procedureId={selectedProfileId || currentProcedureId} steps={localSteps} />
          )}

          {/* Bảng danh sách các bước: kéo ngang khi màn hình hẹp, tên bước luôn đủ rộng để đọc */}
          <div className={`flex-1 flex flex-col rounded-lg border border-slate-200 bg-white min-h-0 ${viewMode !== "table" ? "hidden" : ""}`}>
            {/* Header bảng: trên trang thì bám ngay dưới thanh tiêu đề khi cuộn xuống */}
            <div
              ref={headerScrollRef}
              className={`shrink-0 overflow-hidden rounded-t-lg border-b border-slate-200 bg-slate-100 ${isPage ? "sticky z-10" : ""}`}
              // Bám ngay dưới thanh tiêu đề trang (cao 60px, cố định)
              style={isPage ? { top: 60 } : undefined}
            >
            <div className="flex min-w-[1080px] items-center gap-3 border-l-[3px] border-l-transparent px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <div className="flex w-32 shrink-0 items-center gap-1.5 pl-1 text-left">
                Mã bước
                {!isFiltering && expandableCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedCodes(allExpanded ? new Set() : new Set(expandableCodes))}
                    className="cursor-pointer rounded px-1 text-[10px] font-semibold normal-case tracking-normal text-[#DC2626] hover:bg-red-50"
                  >
                    {allExpanded ? "Thu gọn" : "Mở hết"}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">Tên bước / Bước con</div>
              <div className={ASSIGNEE_COL}>Người thực hiện</div>
              <div className={`${EMAIL_COL} pl-2`}>Email</div>
              <div className={`${DATE_COL} hidden sm:block text-center`}>Thời gian</div>
              <div className={`${TYPE_COL} text-center`}>Loại</div>
              <div className="w-28 shrink-0 text-center">Thao tác</div>
            </div>
            </div>

            <div
              ref={bodyScrollRef}
              onScroll={(e) => {
                const left = e.currentTarget.scrollLeft;
                if (headerScrollRef.current) headerScrollRef.current.scrollLeft = left;
                if (stickyBarRef.current && stickyBarRef.current.scrollLeft !== left) stickyBarRef.current.scrollLeft = left;
              }}
              className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
              // Trên trang đã có thanh kéo ngang bám đáy màn hình → ẩn thanh của chính bảng
              style={isPage ? { scrollbarWidth: "none" } : undefined}
            >
            <div className="flex h-full min-w-[1080px] flex-col">

            {/* Danh sách các hàng */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin] min-h-0">
              {/* Trang thêm mới: bảng trống thì để trống, thêm bước bằng nút "Thêm bước chính" phía trên */}
              {filteredSteps.length === 0 && isDraft ? null : filteredSteps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626] mb-3 border border-red-100 shadow-2xs">
                    <FolderAddOutlined className="text-2xl" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {departmentTitle
                      ? `Quy trình chuyên môn của ${departmentTitle} chưa có bước nào`
                      : localSteps.length === 0
                      ? activeProfile
                        ? `Quy trình "${activeProfile.name}" hiện chưa có bước nào`
                        : isPage
                        ? "Chưa chọn quy trình"
                        : "Dự án hiện chưa có bước thủ tục nào"
                      : "Không tìm thấy bước thủ tục phù hợp với từ khóa"}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                    {departmentTitle
                      ? `Là Lead (Tổ trưởng) ${departmentTitle}, bạn hãy thêm các bước quy trình chuyên môn (bước chính I, II... và bước con I.1, I.2...) và phân công cho thành viên trong tổ.`
                      : localSteps.length === 0
                      ? activeProfile
                        ? isPage
                          ? "Quy trình này chưa có bước nào. Hãy thêm bước chính (I, II...) và bước con để hoàn thiện quy trình:"
                          : "Dự án đã áp dụng quy trình này. Hãy thêm bước chính (I, II...) và bước con để hoàn thiện quy trình:"
                        : isPage
                        ? "Chọn một quy trình ở ô \"Quy trình\" phía trên, hoặc thêm quy trình mới:"
                        : "Bạn có thể áp dụng ngay quy trình mẫu chuẩn có sẵn hoặc thêm bước chính thủ công bên dưới:"
                      : "Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc chuyển sang tab bộ lọc khác."}
                  </p>
                  {localSteps.length === 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {deptTemplate && (
                        <Button
                          intent="primary"
                          scale="compact"
                          icon={<BranchesOutlined />}
                          onClick={() => handleSelectProfile(deptTemplate.id)}
                          className="bg-[#DC2626] border-[#DC2626] text-white font-semibold h-8.5 px-4 shadow-2xs hover:bg-[#B91C1C]"
                        >
                          Áp dụng {deptTemplate.shortName}
                        </Button>
                      )}
                      {/* Đã có quy trình đang chọn thì không gợi ý tạo quy trình mới nữa */}
                      {!activeProfile && (
                        <Button
                          intent="outline"
                          scale="compact"
                          icon={<FolderAddOutlined className="text-[#DC2626]" />}
                          onClick={handleOpenCreateProfile}
                          className="font-semibold h-8.5 px-4 text-[#DC2626] border-red-200 hover:bg-red-50 shadow-2xs"
                        >
                          Thêm quy trình mới
                        </Button>
                      )}
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAddParentStep}
                        className="font-semibold h-8.5 px-4 text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]"
                      >
                        Thêm bước chính thủ công
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                visibleSteps.map((step) => {
                  const isMandatory = step.type === "MANDATORY";
                  const flow = getFlowProps(step);
                  const isSubStep = flow.depth > 0;
                  // Bước nào cũng có thể thêm bước con (không giới hạn số cấp)
                  const isCurrentParentActive = activeParentForSub === step.code;
                  const isEditing = editingStepId === step.id;

                  return (
                    <div key={step.id}>
                      <div
                        ref={isEditing ? editingRowRef : undefined}
                        // Bấm vào dòng là sửa luôn; bấm ra ngoài dòng thì tự lưu
                        onClick={isEditing ? undefined : () => startEditStep(step)}
                        className={`group flex items-center gap-3 px-3.5 py-2.5 transition-colors ${isEditing ? "" : "cursor-pointer"} ${isEditing
                          ? // Đang sửa: luôn sáng rõ và nổi bật, kể cả bước đang tắt
                            "bg-red-50/70 border-l-[3px] border-l-[#DC2626] ring-1 ring-inset ring-red-200"
                          : isSubStep
                            ? isCurrentParentActive
                              ? "bg-red-50/60 border-l-[3px] border-l-[#DC2626]"
                              : "bg-slate-50/40 hover:bg-slate-50 border-l-[3px] border-l-transparent"
                            : isCurrentParentActive
                              ? "bg-red-50/60 border-l-[3px] border-l-[#DC2626]"
                              : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
                          }`}
                      >
                        {/* Mã bước: nút tròn trên trục cấp bậc, thu / mở bước con */}
                        <StepFlowCell {...flow} code={step.code} onToggle={() => toggleExpanded(step.code)} />

                        {/* Tên bước */}
                        <div className="min-w-0 flex-1 pr-2">
                          {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Input
                                autoFocus={!editFocusAssignee}
                                value={editDraft.name}
                                onChange={(e) => {
                                  setEditDraft((d) => ({ ...d, name: e.target.value }));
                                  if (editError) setEditError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditStep();
                                  if (e.key === "Escape") cancelEditStep();
                                }}
                                placeholder="Tên bước (nhấn Enter để lưu)..."
                                className={`h-7 text-xs bg-white w-full ${
                                  editError ? "border-rose-500 ring-1 ring-rose-200" : "border-red-300 focus:border-[#DC2626]"
                                }`}
                              />
                              {editError && <div className="mt-0.5 text-[11px] text-rose-600">{editError}</div>}
                            </div>
                          ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`min-w-0 leading-snug line-clamp-2 ${isSubStep ? "text-xs font-medium text-slate-700" : "text-xs font-bold text-slate-900"
                                }`}
                              title={step.name}
                            >
                              {step.name}
                            </span>
                            {step.notes && (
                              <Tooltip title={<span className="whitespace-pre-line">{step.notes}</span>} placement="topLeft">
                                <InfoCircleOutlined className="text-slate-400 hover:text-slate-600 text-xs cursor-help shrink-0" />
                              </Tooltip>
                            )}
                            {isCurrentParentActive && (
                              <span className="text-[10px] font-semibold text-[#DC2626] bg-red-100/80 px-1.5 py-0.2 rounded shrink-0">
                                Đang thêm bước con
                              </span>
                            )}
                          </div>
                          )}

                          {/* Hiện phụ thời gian trên màn hình nhỏ */}
                          <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 md:hidden mt-0.5">
                            <span className="text-[#DC2626] font-medium">{step.durationMargin}</span>
                          </div>
                        </div>

                        {/* Người thực hiện: bấm vào là chuyển dòng sang chế độ sửa rồi mới chọn */}
                        <div
                          className={ASSIGNEE_COL}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditing) startEditStep(step, true);
                          }}
                        >
                          <Select
                            value={(isEditing ? editDraft.assignedTo : step.assignedTo) || undefined}
                            placeholder="— Chọn cán bộ —"
                            size="small"
                            className="w-full text-xs"
                            allowClear={isEditing}
                            showSearch
                            optionFilterProp="label"
                            // Chỉ ghi vào bản nháp, hỏi một lần khi lưu (tick / bấm ra ngoài)
                            onChange={(val) => setEditDraft((d) => ({ ...d, assignedTo: (val as string | undefined) || "" }))}
                            options={staffOptions}
                            labelRender={showStaffName}
                          />
                        </div>
                        {renderEmail(isEditing ? editDraft.assignedTo || undefined : step.assignedTo)}

                        {/* Thời gian: số ngày cố định (chỉ xem; sửa bằng nút bút chì) */}
                        {isEditing ? (
                          <StepDurationInput
                            days={editDraft.days}
                            onChange={(val) => {
                              setEditDraft((d) => ({ ...d, days: val }));
                              setEditDaysTouched(true);
                            }}
                          />
                        ) : (
                          <StepDuration step={step} />
                        )}

                        {/* Loại */}
                        <div className={`${TYPE_COL} flex items-center justify-center`}>
                          {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={editDraft.type}
                                onChange={(val) => setEditDraft((d) => ({ ...d, type: val as StepType }))}
                                size="small"
                                className="w-24 text-xs"
                                options={STEP_TYPE_OPTIONS}
                              />
                            </div>
                          ) : isMandatory ? (
                            <Tooltip title="Bước bắt buộc (luôn áp dụng)">
                              <Tag intent="brand" scale="sm">
                                Bắt buộc
                              </Tag>
                            </Tooltip>
                          ) : (
                            <Tag intent="warning" scale="sm">
                              Nếu có
                            </Tag>
                          )}
                        </div>

                        {/* Thao tác: Thêm bước con, Sửa, Xóa (đang sửa: ✓ lưu / ✕ bỏ) */}
                        <div
                          className="w-28 shrink-0 flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Đang sửa: ✓ lưu, ✕ bỏ (bấm ra ngoài dòng cũng lưu) */}
                          {isEditing && <RowSaveCancel saveTitle="Lưu thay đổi" onSave={saveEditStep} onCancel={cancelEditStep} />}

                          {/* 1. Nút thêm bước con (mọi cấp) */}
                          {!isEditing && (
                            <Tooltip
                              title={
                                isCurrentParentActive
                                  ? "Đang mở thêm bước con (nhấn để đóng)"
                                  : `Thêm bước con cho [${step.code}]`
                              }
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleParentRowClick(step.code);
                                }}
                                className={`flex h-7 w-7 items-center justify-center rounded-md border transition-all cursor-pointer shadow-2xs ${
                                  isCurrentParentActive
                                    ? "border-[#DC2626] bg-[#DC2626] text-white ring-2 ring-red-200"
                                    : "border-red-200 bg-red-50 text-[#DC2626] hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                                }`}
                                aria-label="Thêm quy trình con"
                              >
                                <PlusOutlined className="text-xs font-bold" />
                              </button>
                            </Tooltip>
                          )}

                          {/* 2. Nút sửa bước ngay trên dòng */}
                          {!isEditing && (
                            <Tooltip title={`Sửa bước [${step.code}]`}>
                              <button
                                type="button"
                                onClick={() => startEditStep(step)}
                                aria-label={`Sửa bước ${step.code}`}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-2xs transition-colors cursor-pointer hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                              >
                                <EditOutlined className="text-xs" />
                              </button>
                            </Tooltip>
                          )}

                          {/* 3. Nút xóa bước (mọi bước, luôn hỏi trước khi xóa) */}
                          {!isEditing && (
                          <Tooltip title={`Xóa bước [${step.code}]`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRemoveStep(step);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-2xs transition-colors cursor-pointer hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Xóa bước ${step.code}`}
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Tooltip>
                          )}

                        </div>
                      </div>

                      {/* Hiển thị dòng nhập bước con trực tiếp bên dưới bước cha / các bước con hiện có */}
                      {step.code === lastCodeForActiveParent && renderInlineChildRow()}
                    </div>
                  );
                })
              )}
            </div>
            {/* Dòng nhập inline bước chính (Cha) hiện ngay cuối danh sách */}
            {renderInlineParentRow()}
            </div>
            </div>

            {/* Trên trang: ô thêm bước chính phủ hết bề ngang bảng (nằm ngoài vùng kéo ngang nên luôn ở giữa) */}
            {isPage && !isAddingParentInline && (
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={handleOpenAddParentStep}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-red-200 bg-red-50/30 py-3 text-sm font-semibold text-[#DC2626] transition-all hover:border-[#DC2626] hover:bg-red-50/70"
                >
                  <PlusOutlined className="text-xs" />
                  Thêm bước chính
                </button>
              </div>
            )}

            {/* Thanh kéo ngang luôn hiện: bám đáy màn hình, ngay trên chân trang */}
            {isPage && tableOverflows && (
              <div
                ref={stickyBarRef}
                onScroll={(e) => {
                  const left = e.currentTarget.scrollLeft;
                  if (bodyScrollRef.current && bodyScrollRef.current.scrollLeft !== left) bodyScrollRef.current.scrollLeft = left;
                }}
                className="sticky z-10 shrink-0 overflow-x-auto overflow-y-hidden rounded-b-lg border-t border-slate-200 bg-white"
                style={{ bottom: stickyBarBottom }}
              >
                <div style={{ width: tableScrollWidth, height: 1 }} />
              </div>
            )}
          </div>
        </div>
      </StepConfigFrame>

      {/* MODAL: THÊM / TẠO QUY TRÌNH MỚI */}
      {isCreateProfileOpen && (
        <CreateProcedureModal
          sourceOptions={profileSelectOptions.map((opt) => ({
            value: opt.value,
            label: `${opt.label} · ${opt.stepCount} bước`,
          }))}
          departmentOptions={getProcedureDepartmentOptions()}
          defaultDepartment={departmentTitle}
          onClose={() => setIsCreateProfileOpen(false)}
          onCreate={handleConfirmCreateProfile}
        />
      )}

    </>
  );
}
