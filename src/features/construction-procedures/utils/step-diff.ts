import type { ProcedureStep, StepChange } from "@/shared/construction-procedures/types/procedure.types";
import { getParentCode, getSiblingSteps, getStageColumns } from "@/shared/construction-procedures/utils/step-dependencies.ts";

const stepDaysText = (s: ProcedureStep) => {
  const d = s.plannedDays ?? s.durationDaysMax ?? s.durationDaysMin;
  return d ? `${d} ngày` : s.durationMargin || "—";
};

const typeLabel = (s: ProcedureStep) => (s.type === "MANDATORY" ? "Bắt buộc" : "Nếu có");

const stageNumberOf = (steps: ProcedureStep[], step: ProcedureStep) =>
  getStageColumns(getSiblingSteps(steps, getParentCode(step.code))).findIndex((col) => col.some((s) => s.id === step.id)) + 1;

export function diffSteps(before: ProcedureStep[], after: ProcedureStep[]): StepChange[] {
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
    if (p.type !== s.type) changes.push({ label: `Loại ${tag}`, from: typeLabel(p), to: typeLabel(s) });
    if (p.isEnabled !== s.isEnabled) changes.push({ label: `Áp dụng ${tag}`, from: p.isEnabled ? "Bật" : "Tắt", to: s.isEnabled ? "Bật" : "Tắt" });
    const fromStage = stageNumberOf(before, p);
    const toStage = stageNumberOf(after, s);
    if (fromStage !== toStage) changes.push({ label: `Thứ tự ${tag}`, from: `Bước ${fromStage}`, to: `Bước ${toStage}` });
  });
  before.filter((s) => !nextIds.has(s.id)).forEach((s) => changes.push({ label: `Xóa bước [${s.code}]`, from: s.name }));
  return changes;
}

export const isOrderOnlyChange = (changes: StepChange[]): boolean =>
  changes.length > 0 && changes.every((c) => c.label.startsWith("Thứ tự"));
