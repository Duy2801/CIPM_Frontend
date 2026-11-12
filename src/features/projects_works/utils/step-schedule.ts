
import type { ProcedureStep } from "../../construction-procedures/types/procedure.types.ts";
import { getSiblingSteps, getStageColumns } from "../../construction-procedures/utils/step-dependencies.ts";
import { getSpanDays } from "../../construction-procedures/utils/step-duration.ts";

const DAY_MS = 86_400_000;

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

export function scheduleSteps(
  steps: ProcedureStep[],
  startDate: string,
): Map<string, { start: string; end?: string; days: number }> {
  const active = steps.filter((s) => s.isEnabled && s.status !== "DISABLED");
  const result = new Map<string, { start: string; end?: string; days: number }>();

  const walk = (parentCode: string | null, start: string) => {
    let offset = 0;
    for (const column of getStageColumns(getSiblingSteps(active, parentCode))) {
      const colStart = addDays(start, offset);
      let longest = 0;
      for (const step of column) {
        const days = getSpanDays(active, step);
        longest = Math.max(longest, days);
        result.set(step.id, { start: colStart, end: days > 0 ? addDays(colStart, days - 1) : undefined, days });
        walk(step.code, colStart);
      }
      offset += longest;
    }
  };

  walk(null, startDate);
  return result;
}

export function withPlannedDates(steps: ProcedureStep[], projectStart?: string): ProcedureStep[] {
  if (!projectStart || !/^\d{4}-\d{2}-\d{2}$/.test(projectStart)) return steps;
  const departments = [...new Set(steps.map((s) => s.department ?? ""))];
  const plan = new Map<string, { start: string; end?: string; days: number }>();
  for (const dept of departments) {
    const deptSteps = steps.filter((s) => (s.department ?? "") === dept).sort((a, b) => a.order - b.order);
    scheduleSteps(deptSteps, projectStart).forEach((value, id) => plan.set(id, value));
  }
  let changed = false;
  const next = steps.map((step) => {
    const p = plan.get(step.id);
    if (!p || (step.startDatePlanned && step.endDatePlanned)) return step;
    const startDatePlanned = step.startDatePlanned || p.start;
    const endDatePlanned =
      step.endDatePlanned || (step.startDatePlanned && p.days > 0 ? addDays(step.startDatePlanned, p.days - 1) : p.end);
    if (startDatePlanned === step.startDatePlanned && endDatePlanned === step.endDatePlanned) return step;
    changed = true;
    return { ...step, startDatePlanned, endDatePlanned };
  });
  return changed ? next : steps;
}
