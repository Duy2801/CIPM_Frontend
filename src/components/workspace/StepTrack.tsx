"use client";

import { Tooltip } from "@/components/ui";
import type { WorkspaceStep } from "./workspace.types";

interface StepTrackProps {
  steps: readonly WorkspaceStep[];
  completed: number[];
  current?: number | null;
  /** Bước không áp dụng cho hồ sơ này (hiển thị gạch chéo) */
  skipped?: number[];
  /** Bước hiện tại đang ở trạng thái xấu (quá hạn, bị trả lại) */
  currentTone?: "normal" | "danger";
  /** Chỉ hiện số thứ tự, tên bước nằm trong tooltip (dùng khi quy trình dài) */
  compact?: boolean;
  ariaLabel: string;
  /** Cho phép click vào từng bước để xem chi tiết */
  onStepClick?: (stepNumber: number) => void;
}

/** Thanh tiến độ nhiều bước dạng rút gọn, dùng cho quy trình tất toán, đấu thầu, GPMB */
export default function StepTrack({
  steps,
  completed,
  current,
  skipped = [],
  currentTone = "normal",
  compact,
  ariaLabel,
  onStepClick,
}: StepTrackProps) {
  return (
    <ol
      className="m-0 grid list-none gap-1.5 p-0"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label={ariaLabel}
    >
      {steps.map((step) => {
        const done = completed.includes(step.number);
        const isSkipped = skipped.includes(step.number);
        const isCurrent = step.number === current;
        const barClass = done
          ? "bg-emerald-500"
          : isCurrent
            ? currentTone === "danger" ? "bg-rose-500" : "bg-teal-600"
            : isSkipped
              ? "bg-[repeating-linear-gradient(45deg,#e2e8f0_0_3px,transparent_3px_6px)]"
              : "bg-slate-200";
        const textClass = done
          ? "text-emerald-700"
          : isCurrent
            ? currentTone === "danger" ? "font-semibold text-rose-700" : "font-semibold text-teal-800"
            : "text-slate-400";
        const stateText = done ? "đã xong" : isCurrent ? "đang thực hiện" : isSkipped ? "không áp dụng" : "chưa tới";

        return (
          <Tooltip key={step.number} title={`Bước ${step.number}: ${step.label} (${stateText})`}>
            <li
              aria-current={isCurrent ? "step" : undefined}
              className={`min-w-0 ${onStepClick ? "cursor-pointer group hover:opacity-85" : "cursor-default"}`}
              onClick={onStepClick ? () => onStepClick(step.number) : undefined}
            >
              <span className={`block h-2 rounded-full transition-transform ${onStepClick ? "group-hover:scale-y-125" : ""} ${barClass}`} />
              <span className={`mt-1 block truncate text-center text-[11px] leading-4 ${onStepClick ? "group-hover:font-bold" : ""} ${textClass}`}>
                {compact ? step.number : `${step.number}. ${step.label}`}
              </span>
            </li>
          </Tooltip>
        );
      })}
    </ol>
  );
}
