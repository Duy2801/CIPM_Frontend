/**
 * procedure-progress.ts — Thời gian kế hoạch của bước / nhánh bước (dùng cho sơ đồ và lịch sử quy trình)
 */

import type { ProcedureStep } from "../types/procedure.types";
import { getSiblingSteps, getStageColumns } from "./step-dependencies";

/** Số ngày kế hoạch của một bước (không tính bước con) */
export const getPlannedDays = (step: ProcedureStep): number =>
  step.plannedDays ?? step.durationDaysMax ?? step.durationDaysMin ?? 0;

/** Thời gian cả nhánh: có bước con thì cộng các đợt con (mỗi đợt lấy bước lâu nhất), không thì số ngày của bước */
export function getSpanDays(steps: ProcedureStep[], step: ProcedureStep): number {
  const children = getSiblingSteps(steps, step.code).filter((s) => s.isEnabled);
  if (children.length === 0) return getPlannedDays(step);
  return getStageColumns(children).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );
}

/** Tổng số ngày hoàn thành cả quy trình: các giai đoạn nối tiếp cộng dồn, giai đoạn song song lấy cái lâu nhất */
export const getProcedureDays = (steps: ProcedureStep[]): number =>
  getStageColumns(getSiblingSteps(steps, null).filter((s) => s.isEnabled)).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );
