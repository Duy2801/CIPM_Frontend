import type { ProcedureStep, StepType } from "@/shared/construction-procedures/types/procedure.types";
import { fromRoman } from "@/shared/construction-procedures/utils/step-dependencies.ts";
import { buildDurationFields } from "@/shared/construction-procedures/utils/step-duration.ts";

export const toRoman = (num: number): string => {
  const romanMap: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
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

export const getStepDepth = (code: string): number => code.split(".").length - 1;

export const getRootCode = (code: string): string => code.split(".")[0];

export const isDescendantOf = (code: string, ancestorCode: string): boolean => code.startsWith(`${ancestorCode}.`);

export const getAncestorCodes = (code: string): string[] =>
  code.split(".").slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join("."));

export const getNextParentCode = (steps: ProcedureStep[]): string => {
  const parents = steps.filter((s) => !s.code.includes("."));
  if (parents.length === 0) return "I";
  const maxRoman = Math.max(0, ...parents.map((p) => fromRoman(p.code)));
  return toRoman(maxRoman > 0 ? maxRoman + 1 : parents.length + 1);
};

export const getNextSubCode = (parentCode: string, steps: ProcedureStep[]): string => {
  const childDepth = getStepDepth(parentCode) + 1;
  const childNums = steps
    .filter((s) => isDescendantOf(s.code, parentCode) && getStepDepth(s.code) === childDepth)
    .map((c) => parseInt(c.code.split(".")[childDepth], 10))
    .filter((n) => !isNaN(n));
  return `${parentCode}.${Math.max(0, ...childNums) + 1}`;
};

export const insertStepHierarchically = (
  steps: ProcedureStep[],
  newStep: ProcedureStep,
  parentCode?: string | null,
): ProcedureStep[] => {
  let lastIndex = -1;
  if (parentCode) {
    steps.forEach((s, i) => {
      if (s.code === parentCode || isDescendantOf(s.code, parentCode)) lastIndex = i;
    });
  }
  const result = [...steps];
  if (lastIndex === -1) result.push(newStep);
  else result.splice(lastIndex + 1, 0, newStep);
  return result.map((s, idx) => ({ ...s, order: idx + 1 }));
};

export interface NewStepInput {
  code: string;
  name: string;
  type: StepType;
  days: string;
  assignedTo?: string;
  assignedToId?: string;
  supervisor?: string;
  supervisorId?: string;
}

export function buildNewStep(steps: ProcedureStep[], parentCode: string | null, input: NewStepInput): ProcedureStep {
  const code = input.code.trim() || (parentCode ? getNextSubCode(parentCode, steps) : getNextParentCode(steps));
  const name = input.name.trim();
  const rootCode = parentCode ? getRootCode(parentCode) : code;
  const parent = parentCode ? steps.find((s) => s.code === parentCode) : undefined;
  return {
    id: `dept-step-${Date.now()}-${code}`,
    order: steps.length + 1,
    code,
    groupCode: rootCode,
    groupTitle: parentCode ? steps.find((s) => s.code === rootCode)?.name || "Quy trình thực hiện" : name,
    name,
    type: input.type,
    responsibleUnit: parent?.responsibleUnit || "Chủ đầu tư",
    assignedTo: input.assignedTo || undefined,
    assignedToId: input.assignedTo ? input.assignedToId : undefined,
    assignedAt: input.assignedTo ? new Date().toISOString().slice(0, 10) : undefined,
    supervisor: input.supervisor || undefined,
    supervisorId: input.supervisor ? input.supervisorId : undefined,
    ...buildDurationFields(input.days),
    isEnabled: true,
    status: "NOT_STARTED",
    attachments: [],
    notes: "",
  };
}
