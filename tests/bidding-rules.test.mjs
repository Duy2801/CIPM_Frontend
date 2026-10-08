import test from "node:test";
import assert from "node:assert/strict";

import { BIDDING_MOCK_DATA } from "../src/features/bidding-management/constants/bidding-mock-data.ts";
import {
  getBidDeadlineStatus,
  getContractDeadlineStatus,
  getSavings,
  validateBidStep,
} from "../src/features/bidding-management/utils/bidding-rules.ts";
import { getBiddingRolePermissions } from "../src/features/bidding-management/utils/bidding-permissions.ts";
import { buildBiddingTasks } from "../src/features/bidding-management/utils/bidding-workspace.ts";
import { createMockBiddingRepository } from "../src/features/bidding-management/services/mock-bidding.repository.ts";

const TODAY = "2026-09-19";
const pkg = (id) => structuredClone(BIDDING_MOCK_DATA.packages.find((item) => item.id === id));
const user = (role) => ({ id: "u", name: "Người dùng", role, permissions: [] });

test("bid submission deadline warns at 7 days and turns red at 3 days", () => {
  assert.equal(getBidDeadlineStatus(pkg("PKG-001"), TODAY).state, "DANGER");
  assert.equal(getBidDeadlineStatus(pkg("PKG-007"), TODAY).state, "WARNING");
  assert.equal(getBidDeadlineStatus(pkg("PKG-003"), TODAY).state, "NONE");
});

test("contract must be signed within 30 days of the result decision", () => {
  const status = getContractDeadlineStatus(pkg("PKG-002"), TODAY);
  assert.equal(status.date, "2026-09-24");
  assert.equal(status.state, "DANGER");
});

test("approval steps must be submitted and the winning price is capped", () => {
  const atStep2 = pkg("PKG-005");
  const input = { documentNo: "01/TTr", completedAt: TODAY };
  assert.match(validateBidStep(atStep2, input, "complete"), /trình Giám đốc/);
  assert.equal(validateBidStep(atStep2, input, "submit"), undefined);

  const atStep8 = pkg("PKG-009");
  atStep8.records.push({ step: 7, completedAt: TODAY, documentNo: "x", by: "x" });
  assert.match(
    validateBidStep(atStep8, { ...input, winner: "NT A", winningPrice: 0.6 }, "submit"),
    /không được vượt/,
  );
});

test("savings and role tasks", () => {
  assert.equal(Math.round(getSavings(pkg("PKG-002")) * 100) / 100, 0.07);
  const director = buildBiddingTasks(getBiddingRolePermissions(user("ADMIN")), BIDDING_MOCK_DATA.packages, TODAY);
  assert.equal(director.find((task) => task.key === "approve")?.count, 2);
  const engineer = buildBiddingTasks(getBiddingRolePermissions(user("TECHNICAL_OFFICER")), BIDDING_MOCK_DATA.packages, TODAY);
  assert.equal(engineer[0].tone, "danger");
  assert.ok(!engineer.some((task) => task.key === "approve"));
});

test("repository records the winner when step 8 is approved", async () => {
  const repository = createMockBiddingRepository();
  const approved = await repository.approveSubmission("PKG-003", "Huỳnh Thái Hải");
  assert.equal(approved.winner, "Công ty CP Xây dựng Kiên Giang");
  assert.equal(approved.records.at(-1).approvedBy, "Huỳnh Thái Hải");
  const created = await repository.createPackage(
    { name: "Gói mới", projectId: "PRJ-004", type: "Xây lắp", method: "Chỉ định thầu", estimatedPrice: 1 },
    "Lê Hoàng Minh",
  );
  assert.equal(created.code, "DA-004-GT-003");
});
