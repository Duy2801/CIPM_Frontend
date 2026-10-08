import test from "node:test";
import assert from "node:assert/strict";

import {
  canCompleteSettlementStep,
  formatVndBillions,
  getContractUsagePercent,
  getWorkingDaysUntil,
  validateDisbursement,
} from "../src/features/finance-settlement/utils/finance-rules.ts";

test("formatVndBillions keeps at most three decimal places", () => {
  assert.equal(formatVndBillions(12.3456), "12,346 tỷ");
  assert.equal(formatVndBillions(12), "12 tỷ");
});

test("getContractUsagePercent exposes the 95 percent threshold", () => {
  assert.deepEqual(getContractUsagePercent(9.5, 10), {
    percent: 95,
    isWarning: true,
  });
  assert.equal(getContractUsagePercent(9.49, 10).isWarning, false);
});

test("validateDisbursement rejects a payment beyond the remaining contract value", () => {
  const errors = validateDisbursement({
    amount: 1.001,
    contractRemaining: 1,
    projectDisbursed: 8,
    projectInvestment: 20,
    evidenceCount: 1,
  });

  assert.equal(errors.amount, "Số tiền vượt giá trị hợp đồng còn lại.");
});

test("validateDisbursement rejects a payment beyond total project investment", () => {
  const errors = validateDisbursement({
    amount: 2.5,
    contractRemaining: 5,
    projectDisbursed: 18,
    projectInvestment: 20,
    evidenceCount: 1,
  });

  assert.equal(errors.projectLimit, "Tổng giải ngân vượt tổng mức đầu tư được phê duyệt.");
});

test("validateDisbursement requires evidence and no more than three decimals", () => {
  const errors = validateDisbursement({
    amount: 1.2345,
    contractRemaining: 5,
    projectDisbursed: 1,
    projectInvestment: 20,
    evidenceCount: 0,
  });

  assert.equal(errors.amountPrecision, "Số tiền chỉ được có tối đa 3 chữ số thập phân.");
  assert.equal(errors.evidence, "Cần ít nhất 1 file chứng từ trước khi lưu.");
});

test("getWorkingDaysUntil ignores weekends", () => {
  assert.equal(getWorkingDaysUntil("2026-09-18", "2026-09-14"), 4);
  assert.equal(getWorkingDaysUntil("2026-09-21", "2026-09-18"), 1);
});

test("canCompleteSettlementStep requires sequential steps and reconciliation data", () => {
  const base = {
    completedSteps: [1],
    approvedDecisionFile: true,
    disbursedAmount: 18,
    approvedSettlementAmount: 18,
    advanceRecovered: true,
    treasuryClosedDate: undefined,
    warrantyReturned: false,
  };

  assert.equal(canCompleteSettlementStep(2, base).allowed, true);
  assert.equal(canCompleteSettlementStep(3, base).allowed, false);
  assert.match(canCompleteSettlementStep(3, base).reason ?? "", /bước 2/i);
});

