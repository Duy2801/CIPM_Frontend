import type { ProcedureStep } from "../types/procedure.types";
import { getSiblingSteps, getStageColumns } from "./step-dependencies";

export const getPlannedDays = (step: ProcedureStep): number =>
  step.plannedDays ?? step.durationDaysMax ?? step.durationDaysMin ?? 0;

export function getSpanDays(steps: ProcedureStep[], step: ProcedureStep): number {
  const children = getSiblingSteps(steps, step.code).filter((s) => s.isEnabled);
  if (children.length === 0) return getPlannedDays(step);
  return getStageColumns(children).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );
}

export const getProcedureDays = (steps: ProcedureStep[]): number =>
  getStageColumns(getSiblingSteps(steps, null).filter((s) => s.isEnabled)).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );
