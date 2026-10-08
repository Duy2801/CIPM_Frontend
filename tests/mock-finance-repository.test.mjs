import test from "node:test";
import assert from "node:assert/strict";

import { createMockFinanceRepository } from "../src/features/finance-settlement/services/mock-finance.repository.ts";

test("mock repository returns isolated dataset copies", async () => {
  const repository = createMockFinanceRepository();
  const first = await repository.getDataset();
  const second = await repository.getDataset();

  first.projects[0].name = "Đã thay đổi";
  assert.notEqual(second.projects[0].name, "Đã thay đổi");
});

test("mock repository advances approval in the required order", async () => {
  const repository = createMockFinanceRepository();
  const dataset = await repository.getDataset();
  const draft = dataset.disbursements.find((item) => item.status === "PENDING_CHIEF");
  assert.ok(draft);

  const chiefApproved = await repository.approveDisbursement(draft.id);
  assert.equal(chiefApproved.status, "PENDING_DIRECTOR");

  const directorApproved = await repository.approveDisbursement(draft.id);
  assert.equal(directorApproved.status, "APPROVED");

  await assert.rejects(() => repository.approveDisbursement(draft.id), /đã hoàn tất/i);
});

test("mock repository blocks an invalid settlement step", async () => {
  const repository = createMockFinanceRepository();
  const dataset = await repository.getDataset();
  const settlement = dataset.settlements.find((item) => item.completedSteps.length === 1);
  assert.ok(settlement);

  await assert.rejects(
    () => repository.completeSettlementStep(settlement.id, 3, {}),
    /bước 2/i,
  );
});

