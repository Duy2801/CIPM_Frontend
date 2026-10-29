/**
 * step-dependencies.ts — Thứ tự thực hiện giữa các bước cùng cấp: chia thành các "đợt"
 * (cùng đợt = làm song song; đợt sau bắt đầu khi đợt trước xong hết)
 */

import type { ProcedureStep } from "../types/procedure.types";

/** Bước cha trực tiếp: "III.1.1" → "III.1"; bước chính → null */
export const getParentCode = (code: string): string | null =>
  code.includes(".") ? code.slice(0, code.lastIndexOf(".")) : null;

/** Các bước con trực tiếp của một bước (null = các bước chính), theo thứ tự trong quy trình */
export const getSiblingSteps = (steps: ProcedureStep[], parentCode: string | null): ProcedureStep[] =>
  steps.filter((s) => getParentCode(s.code) === parentCode);

/**
 * Các đợt của một nhóm bước cùng cấp, đánh số liền 1..n.
 * Bước chưa đặt đợt thì đứng riêng một đợt ngay sau bước liền trước (làm lần lượt).
 */
export function getStageColumns(siblings: ProcedureStep[]): ProcedureStep[][] {
  let last = 0;
  const raw = siblings.map((s) => {
    last = s.flowStage ?? last + 1;
    return { step: s, stage: last };
  });
  const order = [...new Set(raw.map((r) => r.stage))].sort((a, b) => a - b);
  return order.map((stage) => raw.filter((r) => r.stage === stage).map((r) => r.step));
}

/**
 * Đặt lại đợt cho cả nhóm sau khi kéo một bước:
 * `target` = chỉ số cột thả vào; `insertAt` = chèn một đợt mới tại vị trí này (đẩy các đợt sau lùi lại).
 * Trả về đợt mới (1..n, không có đợt trống) của từng bước trong nhóm.
 */
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
