import assert from "node:assert/strict";
import test from "node:test";
import { createMockPersonnelRepository } from "../src/features/personnel-assignment/services/mock-personnel.repository.ts";

const phaseId = "AS-DEMO-PHASE-001";
const childId = "AS-DEMO-TASK-001";

test("bước con qua tổ trưởng và CNDA trước khi giai đoạn hoàn thành", async () => {
  const repository = createMockPersonnelRepository();
  const secondChild = await repository.createAssignment({
    title: "Kiểm tra nghiệm thu bước tiếp theo",
    projectId: "PRJ-001",
    stage: "VI",
    stepCode: "VI.2",
    teamId: "GSKT",
    teamLeaderId: "ST-004",
    assigneeId: "ST-006",
    parentAssignmentId: phaseId,
    assignmentLevel: "TASK_MEMBER",
  }, "Tổ trưởng");

  await assert.rejects(repository.requestCompletion(phaseId), /bước con/);
  await repository.requestCompletion(childId);
  const leadApproved = await repository.acceptAssignment(childId);
  assert.equal(leadApproved.approvalStage, "LEAD_APPROVED");
  assert.equal(leadApproved.status, "PENDING_APPROVAL");
  await assert.rejects(repository.requestCompletion(phaseId), /CNDA duyệt/);

  const projectApproved = await repository.acceptAssignment(childId);
  assert.equal(projectApproved.approvalStage, "PROJECT_APPROVED");
  assert.equal(projectApproved.status, "PENDING_APPROVAL");
  await assert.rejects(repository.requestCompletion(phaseId), /CNDA duyệt/);

  await repository.requestCompletion(secondChild.id);
  await repository.acceptAssignment(secondChild.id);
  await repository.acceptAssignment(secondChild.id);

  await repository.requestCompletion(phaseId);
  await repository.acceptAssignment(phaseId);
  const { assignments } = await repository.getDataset();
  assert.equal(assignments.find((item) => item.id === phaseId).status, "DONE");
  assert.equal(assignments.find((item) => item.id === childId).status, "DONE");
  assert.equal(assignments.find((item) => item.id === secondChild.id).status, "DONE");
});

test("CNDA từ chối bước con thì thành viên phải gửi lại từ đầu", async () => {
  const repository = createMockPersonnelRepository();
  await repository.requestCompletion(childId);
  await repository.acceptAssignment(childId);
  const rejected = await repository.rejectAssignment(childId, "Bổ sung biên bản kiểm tra");
  assert.equal(rejected.status, "IN_PROGRESS");
  assert.equal(rejected.approvalStage, "RETURNED_TO_LEAD");
  assert.equal(rejected.rejectionNote, "Bổ sung biên bản kiểm tra");
  await assert.rejects(repository.requestCompletion(childId), /Chờ tổ trưởng/);
  const returned = await repository.returnToMember(childId);
  assert.equal(returned.approvalStage, undefined);
  await repository.requestCompletion(childId);
  const resubmitted = await repository.acceptAssignment(childId);
  assert.equal(resubmitted.approvalStage, "LEAD_APPROVED");
});
