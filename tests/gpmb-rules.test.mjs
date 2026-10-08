import test from "node:test";
import assert from "node:assert/strict";

import { GPMB_MOCK_DATA } from "../src/features/site-clearance-resettlement/constants/gpmb-mock-data.ts";
import {
  getCurrentStep,
  getLegalStatus,
  isStepApplicable,
  matchesHouseholdFilter,
  validateStepCompletion,
} from "../src/features/site-clearance-resettlement/utils/gpmb-rules.ts";
import { getGpmbRolePermissions } from "../src/features/site-clearance-resettlement/utils/gpmb-permissions.ts";
import { buildGpmbTasks } from "../src/features/site-clearance-resettlement/utils/gpmb-workspace.ts";
import { createMockGpmbRepository } from "../src/features/site-clearance-resettlement/services/mock-gpmb.repository.ts";

const TODAY = "2026-09-19";
const household = (id) => structuredClone(GPMB_MOCK_DATA.households.find((item) => item.id === id));
const user = (role) => ({ id: "u", name: "Người dùng", role, permissions: [] });
const validInput = { documentNo: "12/BB", completedAt: TODAY, fileName: "mau.pdf" };

test("steps 14 and 15 only apply to uncooperative or enforcement households", () => {
  assert.equal(isStepApplicable(14, { specialStatus: "NORMAL" }), false);
  assert.equal(isStepApplicable(14, { specialStatus: "UNCOOPERATIVE" }), true);
  assert.equal(isStepApplicable(15, { specialStatus: "UNCOOPERATIVE" }), false);
  assert.equal(isStepApplicable(15, { specialStatus: "ENFORCEMENT" }), true);
  // Hộ bình thường xong bước 13 thì chuyển thẳng sang bước 16
  assert.equal(getCurrentStep(household("HH-002")), 16);
});

test("mandatory legal deadline turns overdue after the limit", () => {
  const status = getLegalStatus(household("HH-003"), TODAY);
  assert.equal(status.state, "OVERDUE");
  assert.equal(status.daysLeft, -5);
  assert.equal(getLegalStatus(household("HH-005"), TODAY).state, "SOON");
  assert.equal(getLegalStatus(household("HH-001"), TODAY).state, "NONE");
});

test("key steps must be proposed and form steps need an attachment", () => {
  const atStep9 = household("HH-010");
  assert.match(validateStepCompletion(atStep9, validInput, "complete"), /cần gửi đề xuất/);
  assert.equal(validateStepCompletion(atStep9, validInput, "propose"), undefined);

  const atStep6 = household("HH-003");
  assert.match(validateStepCompletion(atStep6, { ...validInput, fileName: "" }, "complete"), /Mẫu 04/);
});

test("payment step opens right after the plan is delivered and needs no form", () => {
  const readyToPay = household("HH-001");
  assert.equal(getCurrentStep(readyToPay), 12);
  assert.equal(matchesHouseholdFilter(readyToPay, "PAYMENT_READY", TODAY), true);
  assert.equal(validateStepCompletion(readyToPay, { ...validInput, fileName: "" }, "complete"), undefined);
});

test("only compensation officers edit, directors approve", () => {
  const officer = getGpmbRolePermissions(user("COMPENSATION_OFFICER"));
  const director = getGpmbRolePermissions(user("ADMIN"));
  assert.deepEqual([officer.canEdit, officer.canApprove], [true, false]);
  assert.deepEqual([director.canEdit, director.canApprove], [false, true]);

  const directorTasks = buildGpmbTasks(director, GPMB_MOCK_DATA.households, TODAY);
  assert.equal(directorTasks.find((task) => task.key === "approve")?.count, 2);
  assert.ok(!directorTasks.some((task) => task.key === "rejected"));
});

test("repository approves a proposal and moves the household forward", async () => {
  const repository = createMockGpmbRepository();
  const updated = await repository.approveProposal("HH-004", "Huỳnh Thái Hải");
  assert.equal(updated.proposal, undefined);
  assert.equal(getCurrentStep(updated), 10);
  assert.equal(matchesHouseholdFilter(updated, "PENDING_APPROVAL", TODAY), false);
  await assert.rejects(() => repository.completeStep("HH-010", validInput, "Phạm Quốc Bảo"), /đề xuất/);
});
