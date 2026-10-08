"use client";

import { SETTLEMENT_STEPS } from "../constants/finance-labels";

interface SettlementStepperProps {
  completedSteps: number[];
  nextStep: number | null;
}

/** Thanh tiến độ 5 bước tất toán dạng rút gọn, dùng trên thẻ dự án */
export default function SettlementStepper({ completedSteps, nextStep }: SettlementStepperProps) {
  return (
    <ol className="m-0 grid list-none grid-cols-5 gap-1 p-0" aria-label="Tiến độ 5 bước tất toán">
      {SETTLEMENT_STEPS.map((step) => {
        const done = completedSteps.includes(step.number);
        const isNext = step.number === nextStep;
        return (
          <li key={step.number} aria-current={isNext ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${
                done ? "bg-emerald-500" : isNext ? "bg-teal-600" : "bg-slate-200"
              }`}
            />
            <span
              className={`mt-1 block truncate text-[10px] leading-4 ${
                done ? "text-emerald-700" : isNext ? "font-semibold text-teal-800" : "text-slate-400"
              }`}
            >
              {step.number}. {step.shortTitle}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
