import type { ProcedureStep } from "../types/procedure.types.ts";
import { getSiblingSteps, getStageColumns } from "./step-dependencies.ts";

export const getStepDays = (step: ProcedureStep): number | null =>
  step.plannedDays || step.durationDaysMax || step.durationDaysMin || null;

/**
 * Số ngày thực hiện của một bước (tạm tính ở FE, sau này chuyển sang backend tính):
 * không có bước con = số ngày đã đặt; có bước con = các lượt làm lần lượt cộng lại, lượt song song lấy bước lâu nhất.
 * Bỏ qua bước không áp dụng.
 */
export function getSpanDays(steps: ProcedureStep[], step: ProcedureStep): number {
  const active = (list: ProcedureStep[]) => list.filter((s) => s.isEnabled && s.status !== "DISABLED");
  const children = active(getSiblingSteps(steps, step.code));
  if (children.length === 0) return getStepDays(step) ?? 0;
  return getStageColumns(children).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );
}

export const buildDurationFields = (
  daysText: string,
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

const countPlannedDays = (start?: string, end?: string): number | null => {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
  return diff > 0 ? diff : null;
};

const buildDateFields = (
  start?: string,
  end?: string,
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

const getChildDateRange = (parentCode: string, steps: ProcedureStep[]) => {
  const children = steps.filter((s) => s.code.startsWith(`${parentCode}.`) && s.isEnabled);
  const starts = children.map((s) => s.startDatePlanned).filter(Boolean).sort() as string[];
  const ends = children.map((s) => s.endDatePlanned).filter(Boolean).sort() as string[];
  return { start: starts[0], end: ends[ends.length - 1] };
};

export const withParentRollups = (steps: ProcedureStep[]): ProcedureStep[] =>
  steps.map((step) => {
    if (step.code.includes(".") || step.startDatePlanned || step.endDatePlanned) return step;
    const { start, end } = getChildDateRange(step.code, steps);
    return start || end ? { ...step, ...buildDateFields(start || "", end || "") } : step;
  });
