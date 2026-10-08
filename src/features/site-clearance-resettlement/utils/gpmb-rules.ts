import { daysBetween } from "../../../utils/date.ts";
import { GPMB_STEPS, PAYMENT_STEP, PLAN_APPROVAL_STEP } from "../constants/gpmb-steps.ts";
import type {
  Household,
  HouseholdFilter,
  LegalStatus,
  StepCompletionInput,
} from "../types/gpmb.types";

const SOON_THRESHOLD_DAYS = 3;

/**
 * Bước 14 chỉ áp dụng cho hộ không đồng ý phương án,
 * bước 15 chỉ áp dụng cho hộ không bàn giao đất (BRD 4.6.4).
 */
export function isStepApplicable(step: number, household: Pick<Household, "specialStatus">): boolean {
  if (step === 14) return household.specialStatus === "UNCOOPERATIVE" || household.specialStatus === "ENFORCEMENT";
  if (step === 15) return household.specialStatus === "ENFORCEMENT";
  return true;
}

export function getCompletedSteps(household: Pick<Household, "records">): number[] {
  return household.records.map((record) => record.step);
}

export function getSkippedSteps(household: Pick<Household, "specialStatus" | "records">): number[] {
  const completed = getCompletedSteps(household);
  return GPMB_STEPS
    .map((step) => step.number)
    .filter((step) => !isStepApplicable(step, household) && !completed.includes(step));
}

/** Bước hộ dân đang thực hiện, null khi đã xong toàn bộ quy trình */
export function getCurrentStep(household: Pick<Household, "specialStatus" | "records">): number | null {
  const completed = getCompletedSteps(household);
  const next = GPMB_STEPS.find(
    (step) => isStepApplicable(step.number, household) && !completed.includes(step.number),
  );
  return next?.number ?? null;
}

export function getStepDefinition(step: number) {
  return GPMB_STEPS.find((item) => item.number === step);
}

export function hasReceivedPayment(household: Pick<Household, "records">): boolean {
  return getCompletedSteps(household).includes(PAYMENT_STEP);
}

/** Thời hạn pháp lý của bước hiện tại, đếm theo ngày lịch từ ngày bắt đầu bước */
export function getLegalStatus(household: Household, today: string): LegalStatus {
  const current = getCurrentStep(household);
  const limitDays = current ? getStepDefinition(current)?.legalDays : undefined;
  if (!current || !limitDays) return { state: "NONE" };

  const daysLeft = limitDays - daysBetween(household.currentStepStartedAt, today);
  if (daysLeft < 0) return { state: "OVERDUE", daysLeft, limitDays };
  if (daysLeft <= SOON_THRESHOLD_DAYS) return { state: "SOON", daysLeft, limitDays };
  return { state: "OK", daysLeft, limitDays };
}

export type CompletionMode = "complete" | "propose";

/** Kiểm tra điều kiện trước khi hoàn thành / đề xuất bước hiện tại. Trả về lý do nếu bị chặn. */
export function validateStepCompletion(
  household: Household,
  input: StepCompletionInput,
  mode: CompletionMode,
): string | undefined {
  const current = getCurrentStep(household);
  if (!current) return "Hộ dân đã hoàn tất toàn bộ quy trình GPMB.";
  if (household.proposal) return `Bước ${household.proposal.step} đang chờ lãnh đạo duyệt, chưa thể cập nhật thêm.`;

  const definition = getStepDefinition(current);
  if (current === PAYMENT_STEP && !getCompletedSteps(household).includes(PLAN_APPROVAL_STEP)) {
    return "Chỉ được chi trả khi phương án bồi thường (bước 9) đã được phê duyệt.";
  }
  if (definition?.requiresApproval && mode === "complete") {
    return `Bước ${current} là bước quan trọng, cần gửi đề xuất để Giám đốc / Phó Giám đốc duyệt.`;
  }
  if (!input.documentNo.trim()) return "Vui lòng nhập số văn bản / biên bản của bước này.";
  if (!input.completedAt) return "Vui lòng chọn ngày thực hiện.";
  if (definition?.forms && !input.fileName?.trim()) {
    return `Bước ${current} bắt buộc đính kèm biểu mẫu (${definition.forms}).`;
  }
  return undefined;
}

export function matchesHouseholdFilter(household: Household, filter: HouseholdFilter, today: string): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "OVERDUE":
      return getLegalStatus(household, today).state === "OVERDUE";
    case "SOON":
      return getLegalStatus(household, today).state === "SOON";
    case "PENDING_APPROVAL":
      return Boolean(household.proposal);
    case "REJECTED":
      return Boolean(household.rejection) && !household.proposal;
    case "SPECIAL":
      return household.specialStatus !== "NORMAL";
    case "PAYMENT_READY":
      return getCurrentStep(household) === PAYMENT_STEP;
    case "DONE":
      return getCurrentStep(household) === null;
  }
}
