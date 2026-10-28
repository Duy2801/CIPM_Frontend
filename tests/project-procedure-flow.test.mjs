import test from "node:test";
import assert from "node:assert/strict";

import {
  getStepFlow,
  groupStepsByStage,
  isReadyToStart,
  stageApprovalKey,
} from "../src/features/projects_works/utils/project-procedure-flow.ts";

function step(overrides) {
  return {
    id: overrides.code,
    order: 1,
    groupCode: "I",
    groupTitle: "Chủ trương đầu tư",
    name: `Bước ${overrides.code}`,
    type: "MANDATORY",
    responsibleUnit: "Tổ A",
    durationMargin: "Theo quy định",
    durationDaysMin: null,
    durationDaysMax: null,
    isEnabled: true,
    status: "NOT_STARTED",
    attachments: [],
    department: "Tổ A",
    ...overrides,
  };
}

test("vị trí trong luồng: chưa giao → đang xử lý → chờ duyệt / từ chối → hoàn thành", () => {
  assert.equal(getStepFlow(step({ code: "1" })), "UNASSIGNED");
  assert.equal(getStepFlow(step({ code: "1", assignedTo: "An" })), "IN_PROGRESS");
  assert.equal(getStepFlow(step({ code: "1", assignedTo: "An", status: "IN_PROGRESS" })), "IN_PROGRESS");
  assert.equal(
    getStepFlow(step({ code: "1", status: "IN_PROGRESS", submissionStatus: "SUBMITTED" })),
    "AWAITING_APPROVAL",
  );
  assert.equal(getStepFlow(step({ code: "1", status: "IN_PROGRESS", submissionStatus: "REJECTED" })), "RETURNED");
  assert.equal(getStepFlow(step({ code: "1", status: "COMPLETED", submissionStatus: "APPROVED" })), "COMPLETED");
  assert.equal(getStepFlow(step({ code: "1", type: "CONDITIONAL", isEnabled: false })), "DISABLED");
});

test("giai đoạn: mục lớn có bước con không phải bước việc; xong hết thì chờ BGĐ nghiệm thu", () => {
  const steps = [
    step({ code: "I", order: 1 }),
    step({ code: "I.1", order: 2, status: "COMPLETED" }),
    step({ code: "I.2", order: 3, type: "CONDITIONAL", isEnabled: false }),
    step({ code: "II", order: 4, groupCode: "II", groupTitle: "Lập dự án", status: "IN_PROGRESS", submissionStatus: "SUBMITTED" }),
  ];
  const [stageI, stageII] = groupStepsByStage("Tổ A", steps);
  assert.deepEqual(stageI.steps.map((s) => s.code), ["I.1", "I.2"]);
  assert.equal(stageI.total, 1);
  assert.equal(stageI.state, "AWAITING_DIRECTOR");
  assert.equal(stageII.state, "IN_PROGRESS");
  assert.equal(stageII.awaitingApproval, 1);
});

test("quyết định BGĐ đọc theo phòng ban, không lẫn giai đoạn cùng mã của phòng ban khác", () => {
  const steps = [step({ code: "I", status: "COMPLETED" })];
  const approvals = { [stageApprovalKey("Tổ B", "I")]: { status: "APPROVED" } };
  assert.equal(groupStepsByStage("Tổ A", steps, approvals)[0].state, "AWAITING_DIRECTOR");
  assert.equal(
    groupStepsByStage("Tổ A", steps, { [stageApprovalKey("Tổ A", "I")]: { status: "APPROVED" } })[0].state,
    "APPROVED",
  );
  assert.equal(
    groupStepsByStage("Tổ A", steps, {
      [stageApprovalKey("Tổ A", "I")]: { status: "REJECTED", rejectionReason: "Thiếu hồ sơ" },
    })[0].state,
    "RETURNED",
  );
});

test("đủ người thực hiện + ngày bắt đầu + ngày kết thúc kế hoạch thì bắt đầu luôn", () => {
  const full = { code: "1", assignedTo: "An", startDatePlanned: "2026-10-28", endDatePlanned: "2026-11-05" };
  assert.equal(isReadyToStart(step(full)), true);
  assert.equal(isReadyToStart(step({ ...full, assignedTo: undefined })), false);
  assert.equal(isReadyToStart(step({ ...full, startDatePlanned: undefined })), false);
  assert.equal(isReadyToStart(step({ ...full, endDatePlanned: undefined })), false);
  assert.equal(isReadyToStart(step({ ...full, status: "IN_PROGRESS" })), false);
  assert.equal(isReadyToStart(step({ ...full, isEnabled: false })), false);
});
