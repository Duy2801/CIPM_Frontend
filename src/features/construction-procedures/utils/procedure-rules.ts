import type {
  AlertLevel,
  ProcedureStep,
} from "@/shared/construction-procedures/types/procedure.types";

export interface ProcedureAlertItem {
  step: ProcedureStep;
  daysRemaining: number;
}

export interface ProcedureAlertSummary {
  overdue: ProcedureAlertItem[];
  dueSoon: ProcedureAlertItem[];
}

export function calculateDaysRemaining(
  endDatePlanned?: string,
  referenceDateStr?: string
): number | null {
  if (!endDatePlanned) return null;

  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  refDate.setHours(0, 0, 0, 0);

  const targetDate = new Date(endDatePlanned);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getStepAlertLevel(
  step: ProcedureStep,
  referenceDateStr?: string
): AlertLevel {
  if (
    step.status === "COMPLETED" ||
    step.status === "SKIPPED" ||
    !step.isEnabled
  ) {
    return "NORMAL";
  }

  if (!step.endDatePlanned) {
    return "NORMAL";
  }

  const daysRemaining = calculateDaysRemaining(step.endDatePlanned, referenceDateStr);
  if (daysRemaining === null) return "NORMAL";

  if (daysRemaining < 0) {
    return "DANGER_RED";
  }

  if (daysRemaining <= 7) {
    return "WARNING_YELLOW";
  }

  return "NORMAL";
}

export function getProcedureAlertSummary(
  steps: ProcedureStep[],
  referenceDateStr?: string,
): ProcedureAlertSummary {
  const summary: ProcedureAlertSummary = { overdue: [], dueSoon: [] };

  steps.forEach((step) => {
    const alertLevel = getStepAlertLevel(step, referenceDateStr);
    const daysRemaining = calculateDaysRemaining(step.endDatePlanned, referenceDateStr);
    if (daysRemaining === null) return;

    if (alertLevel === "DANGER_RED") {
      summary.overdue.push({ step, daysRemaining });
    } else if (alertLevel === "WARNING_YELLOW") {
      summary.dueSoon.push({ step, daysRemaining });
    }
  });

  return summary;
}

export function isHeadingStep(step: ProcedureStep, allSteps: ProcedureStep[]): boolean {
  return !step.code.includes(".") && allSteps.some((s) => s.code.startsWith(`${step.code}.`));
}

