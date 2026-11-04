/**
 * step-schedule.ts — Tự tính ngày bắt đầu / kết thúc kế hoạch của các bước quy trình trong dự án.
 *
 * Mốc: ngày bắt đầu dự án. Mỗi bước kéo dài đúng số ngày đã đặt ở phân hệ Quy trình dự án.
 * Cùng một cấp: các bước cùng lượt (flowStage) làm song song, bắt đầu cùng ngày;
 * lượt sau bắt đầu khi bước lâu nhất của lượt trước xong. Bước con bắt đầu cùng ngày với bước cha.
 */

import type { ProcedureStep } from "../../construction-procedures/types/procedure.types.ts";
import { getSiblingSteps, getStageColumns } from "../../construction-procedures/utils/step-dependencies.ts";
import { getSpanDays } from "../../construction-procedures/utils/step-duration.ts";

const DAY_MS = 86_400_000;

/** Cộng số ngày vào ngày dạng yyyy-mm-dd */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Lịch kế hoạch của các bước một phòng ban (chỉ bước đang áp dụng), theo mã bước */
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

/**
 * Điền ngày bắt đầu / kết thúc kế hoạch cho các bước chưa có (tính riêng từng phòng ban).
 * Ngày đã đặt tay giữ nguyên. Không có ngày bắt đầu dự án thì không tính.
 */
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
    // Đã có ngày bắt đầu đặt tay thì hạn tính từ ngày đó
    const endDatePlanned =
      step.endDatePlanned || (step.startDatePlanned && p.days > 0 ? addDays(step.startDatePlanned, p.days - 1) : p.end);
    if (startDatePlanned === step.startDatePlanned && endDatePlanned === step.endDatePlanned) return step;
    changed = true;
    return { ...step, startDatePlanned, endDatePlanned };
  });
  return changed ? next : steps;
}
