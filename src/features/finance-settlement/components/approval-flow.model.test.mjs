import assert from "node:assert/strict";
import test from "node:test";

let approvalFlowModel;

try {
  approvalFlowModel = await import("./approval-flow.model.ts");
} catch {
  approvalFlowModel = undefined;
}

const rejectedDisbursement = {
  status: "REJECTED",
  approvals: [
    {
      role: "Kế toán trưởng",
      actor: "Đặng Thị Kim Ngân",
      at: "2026-08-11 16:30",
      action: "Từ chối",
      note: "Yêu cầu bổ sung bảo lãnh tạm ứng",
    },
  ],
};

test("rejected stage does not repeat its note inside the stage card", () => {
  const viewModel = approvalFlowModel?.getApprovalStageViewModel(
    rejectedDisbursement,
    "Kế toán trưởng",
  );

  assert.equal(viewModel?.state, "rejected");
  assert.equal(viewModel?.note, undefined);
});

test("current stage takes priority over an older rejection event", () => {
  const viewModel = approvalFlowModel?.getApprovalStageViewModel(
    { ...rejectedDisbursement, status: "PENDING_CHIEF" },
    "Kế toán trưởng",
  );

  assert.equal(viewModel?.state, "current");
});
