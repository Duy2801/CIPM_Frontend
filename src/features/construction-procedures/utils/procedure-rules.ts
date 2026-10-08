/**
 * procedure-rules.ts — Engine xử lý các quy tắc nghiệp vụ BRD 4.3.3
 *
 * Quy tắc 7: Không thể chuyển sang bước kế tiếp khi bước hiện tại chưa hoàn thành,
 *            trừ khi đánh dấu "Bỏ qua" kèm lý do bằng văn bản.
 * Quy tắc 8: Khi còn ≤ 7 ngày đến hạn kế hoạch của một bước mà chưa hoàn thành: cảnh báo vàng.
 * Quy tắc 9: Khi quá hạn kế hoạch: cảnh báo đỏ, hiển thị nổi bật Dashboard.
 * Quy tắc 10: Mỗi bước bắt buộc phải đính kèm ít nhất 1 văn bản trước khi đánh dấu hoàn thành.
 * Quy tắc 11: Lịch sử thay đổi trạng thái các bước được lưu trữ vĩnh viễn, không thể xóa.
 */

import type {
  AlertLevel,
  ProcedureStep,
} from "../types/procedure.types";

export interface ProcedureAlertItem {
  step: ProcedureStep;
  daysRemaining: number;
}

export interface ProcedureAlertSummary {
  overdue: ProcedureAlertItem[];
  dueSoon: ProcedureAlertItem[];
}

/**
 * Tính số ngày còn lại đến hạn kế hoạch
 * Âm nghĩa là quá hạn (ví dụ: -3 ngày)
 */
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

/**
 * Quy tắc 8 & 9: Đánh giá mức độ cảnh báo hạn kế hoạch
 */
export function getStepAlertLevel(
  step: ProcedureStep,
  referenceDateStr?: string
): AlertLevel {
  // Bước đã xong, bỏ qua hoặc đã tắt thì không cảnh báo
  if (
    step.status === "COMPLETED" ||
    step.status === "SKIPPED" ||
    !step.isEnabled
  ) {
    return "NORMAL";
  }

  // Chưa có ngày hạn kế hoạch
  if (!step.endDatePlanned) {
    return "NORMAL";
  }

  const daysRemaining = calculateDaysRemaining(step.endDatePlanned, referenceDateStr);
  if (daysRemaining === null) return "NORMAL";

  // Quy tắc 9: Quá hạn kế hoạch -> Cảnh báo đỏ
  if (daysRemaining < 0) {
    return "DANGER_RED";
  }

  // Quy tắc 8: Còn ≤ 7 ngày đến hạn kế hoạch -> Cảnh báo vàng
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

/**
 * Kiểm tra xem bước có được phép thao tác (Bắt đầu / Hoàn thành / Bỏ qua) hay không
 * Hỗ trợ thực hiện song song giữa các giai đoạn và các bước (không bắt buộc tuần tự).
 */
export function getStepSequenceValidation(
  stepId: string,
  steps: ProcedureStep[]
): {
  isCurrentOrReady: boolean;
  canOperate: boolean;
  blockingStep: ProcedureStep | null;
  reasonMessage: string;
} {
  // Lấy danh sách các bước đang kích hoạt (active)
  const activeSteps = steps.filter((s) => s.isEnabled);
  const targetStep = activeSteps.find((s) => s.id === stepId);

  if (!targetStep) {
    return {
      isCurrentOrReady: false,
      canOperate: false,
      blockingStep: null,
      reasonMessage: "Bước này đang bị vô hiệu hóa (tắt).",
    };
  }

  // Cho phép các giai đoạn và bước chạy song song với nhau
  return {
    isCurrentOrReady: true,
    canOperate: true,
    blockingStep: null,
    reasonMessage: "Sẵn sàng thực hiện (chạy song song).",
  };
}

/**
 * Quy tắc 10: Kiểm tra điều kiện bắt buộc có ít nhất 1 văn bản trước khi hoàn thành
 */
export function validateStepCompletion(step: ProcedureStep): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!step.attachments || step.attachments.length === 0) {
    return {
      isValid: false,
      errorMessage:
        "Quy tắc 10: Mỗi bước bắt buộc phải đính kèm ít nhất 1 văn bản pháp lý trước khi đánh dấu hoàn thành.",
    };
  }

  return { isValid: true };
}

/**
 * Thống kê tổng hợp tình trạng quy trình của dự án
 */
export function calculateProcedureKpis(
  steps: ProcedureStep[],
  referenceDateStr?: string
) {
  const activeSteps = steps.filter((s) => s.isEnabled);
  const disabledCount = steps.filter((s) => !s.isEnabled).length;
  const totalActive = activeSteps.length;

  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let skippedCount = 0;
  let dangerRedCount = 0;
  let warningYellowCount = 0;

  activeSteps.forEach((s) => {
    if (s.status === "COMPLETED") completedCount++;
    else if (s.status === "IN_PROGRESS") inProgressCount++;
    else if (s.status === "SKIPPED") skippedCount++;
    else if (s.status === "NOT_STARTED") notStartedCount++;

    const alert = getStepAlertLevel(s, referenceDateStr);
    if (alert === "DANGER_RED") dangerRedCount++;
    else if (alert === "WARNING_YELLOW") warningYellowCount++;
  });

  const completionRate =
    totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

  return {
    totalSteps: steps.length,
    activeStepsCount: totalActive,
    disabledCount,
    completedCount,
    inProgressCount,
    notStartedCount,
    skippedCount,
    dangerRedCount,
    warningYellowCount,
    completionRate,
  };
}
