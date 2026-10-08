import type {
  DisbursementValidationErrors,
  DisbursementValidationInput,
  SettlementStepContext,
  SettlementStepResult,
} from "../types/finance.types";

export function formatVndBillions(value: number): string {
  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value)} tỷ`;
}

export function getContractUsagePercent(
  disbursed: number,
  contractValue: number,
): { percent: number; isWarning: boolean } {
  const percent = contractValue > 0
    ? Math.round((disbursed / contractValue) * 1000) / 10
    : 0;

  return { percent, isWarning: percent >= 95 };
}

export function validateDisbursement(
  input: DisbursementValidationInput,
): DisbursementValidationErrors {
  const errors: DisbursementValidationErrors = {};

  if (input.amount <= 0) {
    errors.amount = "Số tiền phải lớn hơn 0.";
  } else if (
    input.contractRemaining !== undefined &&
    input.amount > input.contractRemaining
  ) {
    errors.amount = "Số tiền vượt giá trị hợp đồng còn lại.";
  }

  const decimalPart = String(input.amount).split(".")[1];
  if (decimalPart && decimalPart.length > 3) {
    errors.amountPrecision = "Số tiền chỉ được có tối đa 3 chữ số thập phân.";
  }

  if (input.projectDisbursed + input.amount > input.projectInvestment) {
    errors.projectLimit = "Tổng giải ngân vượt tổng mức đầu tư được phê duyệt.";
  }

  if (input.evidenceCount < 1) {
    errors.evidence = "Cần ít nhất 1 file chứng từ trước khi lưu.";
  }

  return errors;
}

export function getWorkingDaysUntil(targetDate: string, fromDate?: string): number {
  const start = new Date(`${fromDate ?? new Date().toISOString().slice(0, 10)}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  const direction = target >= start ? 1 : -1;
  const cursor = new Date(start);
  let count = 0;

  while (cursor.getTime() !== target.getTime()) {
    cursor.setDate(cursor.getDate() + direction);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += direction;
  }

  return count;
}

export function canCompleteSettlementStep(
  step: number,
  context: SettlementStepContext,
): SettlementStepResult {
  if (step < 1 || step > 5) {
    return { allowed: false, reason: "Bước tất toán không hợp lệ." };
  }

  const missingPrevious = Array.from({ length: step - 1 }, (_, index) => index + 1)
    .find((previous) => !context.completedSteps.includes(previous));
  if (missingPrevious) {
    return { allowed: false, reason: `Cần hoàn tất bước ${missingPrevious} trước.` };
  }

  if (step === 1 && !context.approvedDecisionFile) {
    return { allowed: false, reason: "Cần đính kèm quyết định phê duyệt quyết toán." };
  }
  if (
    step === 2 &&
    (context.disbursedAmount !== context.approvedSettlementAmount || !context.advanceRecovered)
  ) {
    return { allowed: false, reason: "Số liệu chưa khớp hoặc tạm ứng chưa thu hồi hết." };
  }
  if (step === 3 && !context.treasuryClosedDate) {
    return { allowed: false, reason: "Cần ghi nhận ngày tất toán tại KBNN." };
  }
  if (step === 4 && !context.warrantyReturned) {
    return { allowed: false, reason: "Chưa xác nhận hoàn trả bảo lãnh bảo hành từ M8." };
  }

  return { allowed: true };
}

/** Bước tất toán kế tiếp cần làm (1–5), hoặc null khi đã hoàn tất cả 5 bước */
export function getNextSettlementStep(completedSteps: number[]): number | null {
  for (let step = 1; step <= 5; step += 1) {
    if (!completedSteps.includes(step)) return step;
  }
  return null;
}
