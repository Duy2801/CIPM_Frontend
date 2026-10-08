import test from "node:test";
import assert from "node:assert/strict";

import { FINANCE_MOCK_DATA } from "../src/features/finance-settlement/constants/finance-mock-data.ts";
import {
  canActOnSettlementStep,
  getFinanceRolePermissions,
} from "../src/features/finance-settlement/utils/finance-permissions.ts";
import { getNextSettlementStep } from "../src/features/finance-settlement/utils/finance-rules.ts";
import { buildFinanceTasks } from "../src/features/finance-settlement/utils/finance-workspace.ts";

const userWithRole = (role, permissions = []) => ({
  id: "u",
  name: "Người dùng",
  role,
  permissions,
});

const buildFor = (role) =>
  buildFinanceTasks({
    permissions: getFinanceRolePermissions(userWithRole(role)),
    disbursements: FINANCE_MOCK_DATA.disbursements,
    settlements: FINANCE_MOCK_DATA.settlements,
    plans: FINANCE_MOCK_DATA.capitalPlans,
    overdueCount: 0,
    dueSoonCount: 0,
    contractWarningCount: 1,
  });

test("each approver sees the disbursements waiting at their own level first", () => {
  const chief = buildFor("CHIEF_ACCOUNTANT").find((task) => task.key === "my-turn");
  assert.equal(chief?.statusFilter, "PENDING_CHIEF");
  assert.equal(chief?.count, 1);

  const director = buildFor("ADMIN").find((task) => task.key === "my-turn");
  assert.equal(director?.statusFilter, "PENDING_DIRECTOR");
  assert.equal(director?.count, 1);

  const accountant = buildFor("ACCOUNTANT");
  assert.equal(accountant[0].key, "my-turn");
  assert.equal(accountant[0].statusFilter, "REJECTED");
});

test("read-only roles get watch items but no action task", () => {
  const tasks = buildFor("TECHNICAL_OFFICER");
  assert.ok(tasks.every((task) => task.key !== "my-turn" && task.key !== "settlement"));
  assert.ok(tasks.some((task) => task.key === "contract-cap"));
});

test("tasks with nothing to do are hidden", () => {
  const tasks = buildFor("CHIEF_ACCOUNTANT");
  assert.ok(tasks.every((task) => task.count > 0));
  assert.ok(!tasks.some((task) => task.key === "overdue"));
});

test("settlement steps follow the role matrix", () => {
  const accountant = getFinanceRolePermissions(userWithRole("ACCOUNTANT"));
  assert.equal(canActOnSettlementStep(1, accountant), true);
  assert.equal(canActOnSettlementStep(2, accountant), false);
  assert.equal(canActOnSettlementStep(5, accountant), false);

  const deputy = getFinanceRolePermissions(userWithRole("DEPUTY_DIRECTOR"));
  assert.equal(deputy.isReadOnly, true);
  assert.equal(canActOnSettlementStep(1, deputy), false);
});

test("export is granted only by the module permission", () => {
  assert.equal(getFinanceRolePermissions(userWithRole("ADMINISTRATIVE_OFFICER")).canExport, false);
  assert.equal(
    getFinanceRolePermissions(userWithRole("ACCOUNTANT", ["m4_finance_settlement:export"])).canExport,
    true,
  );
});

test("getNextSettlementStep returns the first unfinished step", () => {
  assert.equal(getNextSettlementStep([]), 1);
  assert.equal(getNextSettlementStep([1, 2]), 3);
  assert.equal(getNextSettlementStep([1, 2, 3, 4, 5]), null);
});
