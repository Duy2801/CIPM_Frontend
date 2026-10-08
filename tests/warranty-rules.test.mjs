import test from "node:test";
import assert from "node:assert/strict";

import { WARRANTY_MOCK_DATA } from "../src/features/warranty-maintenance/constants/warranty-mock-data.ts";
import {
  getBondReturnBlocker,
  getCountdown,
  isIncidentOverdue,
  validateIncident,
} from "../src/features/warranty-maintenance/utils/warranty-rules.ts";
import { getWarrantyRolePermissions } from "../src/features/warranty-maintenance/utils/warranty-permissions.ts";
import { buildWarrantyTasks } from "../src/features/warranty-maintenance/utils/warranty-workspace.ts";
import { createMockWarrantyRepository } from "../src/features/warranty-maintenance/services/mock-warranty.repository.ts";

const TODAY = "2026-09-19";
const { warranties, incidents } = WARRANTY_MOCK_DATA;
const warranty = (id) => warranties.find((item) => item.id === id);
const user = (role) => ({ id: "u", name: "Người dùng", role, permissions: [] });

test("countdown colours follow the 90 / 30 day thresholds", () => {
  const urgent = getCountdown(warranty("WR-001"), TODAY);
  assert.equal(urgent.expiryDate, "2026-10-10");
  assert.equal(urgent.daysLeft, 21);
  assert.equal(urgent.level, "URGENT");
  assert.equal(getCountdown(warranty("WR-002"), TODAY).level, "WATCH");
  assert.equal(getCountdown(warranty("WR-003"), TODAY).level, "SAFE");
  assert.equal(getCountdown(warranty("WR-004"), TODAY).level, "EXPIRED");
});

test("bond can only be returned after expiry with no open incidents", () => {
  assert.equal(getBondReturnBlocker(warranty("WR-004"), incidents, TODAY), undefined);
  assert.match(getBondReturnBlocker(warranty("WR-006"), incidents, TODAY), /sự cố/);
  assert.match(getBondReturnBlocker(warranty("WR-001"), incidents, TODAY), /Còn 21 ngày/);
  assert.match(getBondReturnBlocker(warranty("WR-005"), incidents, TODAY), /đã được xử lý/);
});

test("incident deadlines and validation", () => {
  assert.equal(isIncidentOverdue(incidents[0], TODAY), true);
  assert.equal(isIncidentOverdue(incidents[3], TODAY), false);
  assert.match(
    validateIncident({ warrantyId: "WR-001", foundDate: TODAY, requiredFixDate: "2026-09-01", description: "x", location: "y", severity: "NORMAL" }),
    /không được trước/,
  );
});

test("technical officers manage incidents, chief accountant manages bonds", () => {
  const tech = getWarrantyRolePermissions(user("TECHNICAL_OFFICER"));
  const chief = getWarrantyRolePermissions(user("CHIEF_ACCOUNTANT"));
  const director = getWarrantyRolePermissions(user("ADMIN"));
  assert.deepEqual([tech.canManageIncidents, tech.canManageBond], [true, false]);
  assert.deepEqual([chief.canManageIncidents, chief.canManageBond], [false, true]);
  assert.equal(director.isReadOnly, true);

  const chiefTasks = buildWarrantyTasks(chief, warranties, incidents, TODAY);
  const bond = chiefTasks.find((task) => task.key === "bond-ready");
  assert.equal(bond?.count, 4);
  assert.equal(bond?.tone, "warning");
});

test("repository blocks returning a bond while incidents are open", async () => {
  const repository = createMockWarrantyRepository();
  await assert.rejects(() => repository.closeBond("WR-006", "RETURNED", ""), /sự cố/);
  const returned = await repository.closeBond("WR-004", "RETURNED", "");
  assert.equal(returned.bondStatus, "RETURNED");
});
