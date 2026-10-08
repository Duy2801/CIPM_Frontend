import { addDays, daysBetween } from "../../../utils/date.ts";
import {
  BID_DEADLINE_STEP,
  BID_STEPS,
  CONTRACT_SIGNING_DAYS,
  CONTRACT_STEP,
  RESULT_APPROVAL_STEP,
} from "../constants/bidding-steps.ts";
import type { BidPackage, BidStepInput, DeadlineStatus, PackageFilter } from "../types/bidding.types";

export function getCompletedBidSteps(pkg: Pick<BidPackage, "records">): number[] {
  return pkg.records.map((record) => record.step);
}

export function getCurrentBidStep(pkg: Pick<BidPackage, "records">): number | null {
  const completed = getCompletedBidSteps(pkg);
  return BID_STEPS.find((step) => !completed.includes(step.number))?.number ?? null;
}

export function getBidStepDefinition(step: number) {
  return BID_STEPS.find((item) => item.number === step);
}

/** Hạn nộp HSDT: ≤ 7 ngày cảnh báo cam, ≤ 3 ngày cảnh báo đỏ (BRD 4.7.3) */
export function getBidDeadlineStatus(pkg: BidPackage, today: string): DeadlineStatus {
  const current = getCurrentBidStep(pkg);
  if (!pkg.bidDeadline || current !== BID_DEADLINE_STEP) return { state: "NONE" };

  const daysLeft = daysBetween(today, pkg.bidDeadline);
  const base = { daysLeft, date: pkg.bidDeadline };
  if (daysLeft < 0) return { state: "PASSED", ...base };
  if (daysLeft <= 3) return { state: "DANGER", ...base };
  if (daysLeft <= 7) return { state: "WARNING", ...base };
  return { state: "OK", ...base };
}

/** Hợp đồng phải ký trong 30 ngày kể từ quyết định phê duyệt kết quả LCNT */
export function getContractDeadlineStatus(pkg: BidPackage, today: string): DeadlineStatus {
  if (getCurrentBidStep(pkg) !== CONTRACT_STEP) return { state: "NONE" };
  const decision = pkg.records.find((record) => record.step === RESULT_APPROVAL_STEP);
  if (!decision) return { state: "NONE" };

  const deadline = addDays(decision.completedAt, CONTRACT_SIGNING_DAYS);
  const daysLeft = daysBetween(today, deadline);
  const base = { daysLeft, date: deadline };
  if (daysLeft < 0) return { state: "PASSED", ...base };
  if (daysLeft <= 5) return { state: "DANGER", ...base };
  if (daysLeft <= 10) return { state: "WARNING", ...base };
  return { state: "OK", ...base };
}

/** Giá trị tiết kiệm = giá gói thầu − giá trúng thầu (tỷ đồng) */
export function getSavings(pkg: Pick<BidPackage, "estimatedPrice" | "winningPrice">): number {
  return pkg.winningPrice === undefined ? 0 : Math.max(0, pkg.estimatedPrice - pkg.winningPrice);
}

export type BidCompletionMode = "complete" | "submit";

export function validateBidStep(pkg: BidPackage, input: BidStepInput, mode: BidCompletionMode): string | undefined {
  const current = getCurrentBidStep(pkg);
  if (!current) return "Gói thầu đã ký hợp đồng, quy trình đã hoàn tất.";
  if (pkg.submission) return `Bước ${pkg.submission.step} đang chờ lãnh đạo phê duyệt.`;

  const definition = getBidStepDefinition(current);
  if (definition?.requiresApproval && mode === "complete") {
    return `Bước ${current} cần trình Giám đốc / Phó Giám đốc phê duyệt.`;
  }
  if (!input.documentNo.trim()) return "Vui lòng nhập số văn bản / quyết định.";
  if (!input.completedAt) return "Vui lòng chọn ngày thực hiện.";
  if (current === 4 && (!input.bidDeadline || input.bidDeadline <= input.completedAt)) {
    return "Hạn nộp hồ sơ dự thầu phải sau ngày đăng thông báo mời thầu.";
  }
  if (current === RESULT_APPROVAL_STEP) {
    if (!input.winner?.trim()) return "Vui lòng nhập tên nhà thầu trúng thầu.";
    if (!input.winningPrice || input.winningPrice <= 0) return "Vui lòng nhập giá trúng thầu.";
    if (input.winningPrice > pkg.estimatedPrice) return "Giá trúng thầu không được vượt giá gói thầu đã duyệt.";
  }
  return undefined;
}

export function matchesPackageFilter(pkg: BidPackage, filter: PackageFilter, today: string): boolean {
  const deadline = getBidDeadlineStatus(pkg, today).state;
  const contract = getContractDeadlineStatus(pkg, today).state;
  switch (filter) {
    case "ALL":
      return true;
    case "DEADLINE":
      return deadline === "WARNING" || deadline === "DANGER";
    case "PENDING_APPROVAL":
      return Boolean(pkg.submission);
    case "REJECTED":
      return Boolean(pkg.rejection) && !pkg.submission;
    case "CONTRACT_DUE":
      return contract !== "NONE";
    case "IN_PROGRESS":
      return getCurrentBidStep(pkg) !== null && !pkg.submission;
    case "DONE":
      return getCurrentBidStep(pkg) === null;
  }
}
