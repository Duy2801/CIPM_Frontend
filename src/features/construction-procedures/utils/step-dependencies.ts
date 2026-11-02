import type { ProcedureStep } from "../types/procedure.types";

export const getParentCode = (code: string): string | null =>
  code.includes(".") ? code.slice(0, code.lastIndexOf(".")) : null;

export const getSiblingSteps = (steps: ProcedureStep[], parentCode: string | null): ProcedureStep[] =>
  steps.filter((s) => getParentCode(s.code) === parentCode);

export function getStageColumns(siblings: ProcedureStep[]): ProcedureStep[][] {
  let last = 0;
  const raw = siblings.map((s) => {
    last = s.flowStage ?? last + 1;
    return { step: s, stage: last };
  });
  const order = [...new Set(raw.map((r) => r.stage))].sort((a, b) => a - b);
  return order.map((stage) => raw.filter((r) => r.stage === stage).map((r) => r.step));
}

export function moveStepToStage(
  siblings: ProcedureStep[],
  stepId: string,
  drop: { target: number } | { insertAt: number }
): Map<string, number> {
  const columns = getStageColumns(siblings).map((col) => col.filter((s) => s.id !== stepId));
  const moved = siblings.find((s) => s.id === stepId);
  if (moved) {
    if ("target" in drop) (columns[drop.target] ??= []).push(moved);
    else columns.splice(drop.insertAt, 0, [moved]);
  }
  const result = new Map<string, number>();
  columns.filter((col) => col.length > 0).forEach((col, i) => col.forEach((s) => result.set(s.id, i + 1)));
  return result;
}

export function fromRoman(str: string): number {
  const romanMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
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
}

const codeRanks = (code: string): number[] =>
  code.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : fromRoman(part)));

export function compareStepCodes(a: string, b: string): number {
  const ra = codeRanks(a);
  const rb = codeRanks(b);
  for (let i = 0; i < Math.min(ra.length, rb.length); i++) {
    if (ra[i] !== rb[i]) return ra[i] - rb[i];
  }
  return ra.length - rb.length;
}

export function applyStageOrder(steps: ProcedureStep[], stages: Map<string, number>): ProcedureStep[] {
  const staged = steps.map((s) => (stages.has(s.id) ? { ...s, flowStage: stages.get(s.id) } : s));
  const first = staged.find((s) => stages.has(s.id));
  if (!first) return staged;

  const siblings = getSiblingSteps(staged, getParentCode(first.code));
  const codes = siblings.map((s) => s.code).sort(compareStepCodes);
  const ordered = siblings
    .map((step, index) => ({ step, index }))
    .sort((a, b) => (a.step.flowStage ?? Infinity) - (b.step.flowStage ?? Infinity) || a.index - b.index)
    .map(({ step }) => step);
  const rename = new Map(ordered.map((s, i) => [s.code, codes[i]]));

  const renameCode = (code: string) => {
    for (const [from, to] of rename) {
      if (code === from || code.startsWith(`${from}.`)) return to + code.slice(from.length);
    }
    return code;
  };

  return staged
    .map((s) => {
      const code = renameCode(s.code);
      const groupCode = renameCode(s.groupCode);
      return code === s.code && groupCode === s.groupCode ? s : { ...s, code, groupCode };
    })
    .sort((a, b) => compareStepCodes(a.code, b.code))
    .map((s, index) => ({ ...s, order: index + 1 }));
}
