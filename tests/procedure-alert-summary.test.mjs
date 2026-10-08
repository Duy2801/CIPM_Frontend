import test from "node:test";
import assert from "node:assert/strict";

import { getProcedureAlertSummary } from "../src/features/construction-procedures/utils/procedure-rules.ts";

function createStep(overrides) {
  return {
    id: "step",
    order: 1,
    code: "I",
    groupCode: "I",
    groupTitle: "Chủ trương đầu tư",
    name: "Bước kiểm thử",
    type: "MANDATORY",
    responsibleUnit: "Chủ đầu tư",
    durationMargin: "5–10 ngày",
    durationDaysMin: 5,
    durationDaysMax: 10,
    isEnabled: true,
    status: "IN_PROGRESS",
    attachments: [],
    ...overrides,
  };
}

test("groups overdue and due-soon steps while ignoring completed or disabled steps", () => {
  const summary = getProcedureAlertSummary([
    createStep({ id: "late", code: "IV", endDatePlanned: "2026-09-10" }),
    createStep({ id: "soon", code: "V", endDatePlanned: "2026-09-20" }),
    createStep({ id: "done", status: "COMPLETED", endDatePlanned: "2026-09-01" }),
    createStep({ id: "off", isEnabled: false, status: "DISABLED", endDatePlanned: "2026-09-01" }),
  ], "2026-09-16");

  assert.deepEqual(summary.overdue.map((item) => item.step.id), ["late"]);
  assert.equal(summary.overdue[0].daysRemaining, -6);
  assert.deepEqual(summary.dueSoon.map((item) => item.step.id), ["soon"]);
  assert.equal(summary.dueSoon[0].daysRemaining, 4);
});

