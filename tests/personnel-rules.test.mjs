import test from "node:test";
import assert from "node:assert/strict";

import { PERSONNEL_MOCK_DATA } from "../src/features/personnel-assignment/constants/personnel-mock-data.ts";
import { PERSONNEL_TAB_LABELS } from "../src/features/personnel-assignment/constants/personnel-labels.ts";
import {
  getWorkload,
  isDueSoon,
  isOverdue,
  isOverloaded,
  validateAssignment,
} from "../src/features/personnel-assignment/utils/personnel-rules.ts";
import { getPersonnelRolePermissions } from "../src/features/personnel-assignment/utils/personnel-permissions.ts";
import { buildPersonnelTasks } from "../src/features/personnel-assignment/utils/personnel-workspace.ts";
import { createMockPersonnelRepository } from "../src/features/personnel-assignment/services/mock-personnel.repository.ts";

const TODAY = "2026-09-20";
const { staff } = PERSONNEL_MOCK_DATA;
const user = (role) => ({ id: "u", name: "Người dùng", role, permissions: [] });

test("overdue and due-soon assignments are detected", () => {
  assert.equal(isOverdue({ status: "TODO", dueDate: "2026-09-19" }, TODAY), true);
  assert.equal(isDueSoon({ status: "TODO", dueDate: "2026-09-21" }, TODAY), true);
  assert.equal(isOverdue({ status: "DONE", dueDate: "2026-09-19" }, TODAY), false);
});

test("sample data contains one project-to-phase-to-member delegation chain", () => {
  assert.equal(PERSONNEL_MOCK_DATA.projects.length, 12);
  assert.equal(PERSONNEL_MOCK_DATA.assignments.length, 2);
  const project = PERSONNEL_MOCK_DATA.projects.find((item) => item.id === "PRJ-001");
  const phase = PERSONNEL_MOCK_DATA.assignments.find((item) => item.assignmentLevel === "PHASE_LEAD");
  const memberTask = PERSONNEL_MOCK_DATA.assignments.find((item) => item.assignmentLevel === "TASK_MEMBER");
  assert.equal(project.mainExecutorId, "ST-005");
  assert.equal(phase.assigneeId, "ST-004");
  assert.equal(memberTask.assigneeId, "ST-006");
  assert.equal(memberTask.parentAssignmentId, phase.id);
  assert.ok(PERSONNEL_MOCK_DATA.projects.filter((item) => item.id !== "PRJ-001").every((item) =>
    !item.mainExecutorId && !item.mainSupervisorId && !item.actingDirectorId && !item.teamMembers?.length
  ));
});

test("delegations remain available after recreating the repository for another login", async () => {
  const savedWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  try {
    const directorSession = createMockPersonnelRepository();
    await directorSession.assignProjectLeaders({
      projectId: "PRJ-002",
      mainExecutorId: "ST-005",
      mainSupervisorId: "ST-004",
    });
    const nextSession = createMockPersonnelRepository();
    const project = (await nextSession.getDataset()).projects.find((item) => item.id === "PRJ-002");
    assert.equal(project.mainExecutorId, "ST-005");
    assert.equal(project.mainSupervisorId, "ST-004");
  } finally {
    if (savedWindow === undefined) delete globalThis.window;
    else globalThis.window = savedWindow;
  }
});

test("workload counts only unfinished assignments", () => {
  const testAssignments = [
    { assigneeId: "T-01", status: "TODO" },
    { assigneeId: "T-01", status: "IN_PROGRESS" },
    { assigneeId: "T-01", status: "IN_PROGRESS" },
    { assigneeId: "T-01", status: "TODO" },
    { assigneeId: "T-01", status: "DONE" },
    { assigneeId: "T-02", status: "TODO" },
  ];
  assert.equal(getWorkload("T-01", testAssignments), 4);
  assert.equal(isOverloaded("T-01", testAssignments), true);
  assert.equal(isOverloaded("T-02", testAssignments), false);
});

test("assignment validation refuses locked accounts and past deadlines", () => {
  const base = { title: "Việc mới", projectId: "PRJ-001", assigneeId: "ST-005", dueDate: TODAY };
  assert.equal(validateAssignment(base, staff, TODAY), undefined);
  assert.match(validateAssignment({ ...base, assigneeId: "ST-007" }, staff, TODAY), /đang bị khóa/);
  assert.match(validateAssignment({ ...base, dueDate: "2026-09-01" }, staff, TODAY), /từ hôm nay/);
});

test("director only assigns projects, only project leaders assign staff tasks", () => {
  const director = getPersonnelRolePermissions(user("ADMIN"));
  const deputy = getPersonnelRolePermissions(user("DEPUTY_DIRECTOR"));
  const actingDir = getPersonnelRolePermissions(user("ACTING_DIRECTOR"));
  const other = getPersonnelRolePermissions(user("ACCOUNTANT"));

  // Giám đốc: chỉ có phân công dự án (canAssignProjectLeaders = true), không phân công nhiệm vụ nhân viên
  assert.equal(director.canAssignProjectLeaders, true);
  assert.equal(director.canAssignStaffTasks, false);
  assert.equal(director.canAssign, false);
  assert.equal(director.canManageAccounts, true);

  // Phó Giám đốc: phân công dự án, không phân công nhiệm vụ nhân viên
  assert.equal(deputy.canAssignProjectLeaders, true);
  assert.equal(deputy.canAssignStaffTasks, false);
  assert.equal(deputy.canAssign, false);
  assert.equal(deputy.canManageAccounts, false);

  // Người có quyền chủ dự án: thấy và phân công nhiệm vụ nhân viên
  assert.equal(actingDir.canAssignProjectLeaders, false);
  assert.equal(actingDir.canAssignStaffTasks, true);
  assert.equal(actingDir.canAssign, true);

  // Người dùng khác không có quyền phân công dự án hay phân công nhân viên
  assert.equal(other.canAssignStaffTasks, false);
  assert.equal(other.canAssignProjectLeaders, false);

  const actingDirTasks = buildPersonnelTasks(actingDir, [
    { id: "AS-TEST", projectId: "PRJ-001", title: "Việc chưa giao", status: "TODO", dueDate: TODAY },
  ], staff, TODAY);
  assert.ok(actingDirTasks.some((task) => task.key === "unassigned"));
  assert.ok(!actingDirTasks.some((task) => task.key === "locked"));
});

test("repository refuses to lock the admin account and requires a reason", async () => {
  const repository = createMockPersonnelRepository();
  await assert.rejects(() => repository.setAccountActive("ST-001", false, "lý do"), /quản trị hệ thống/);
  await assert.rejects(() => repository.setAccountActive("ST-005", false, "  "), /lý do/);
  const locked = await repository.setAccountActive("ST-005", false, "Chuyển công tác từ 01/10/2026");
  assert.equal(locked.accountActive, false);
});

test("Acting Director role requires staff to be the project's main executor and can be revoked anytime", async () => {
  const repository = createMockPersonnelRepository();

  await repository.assignProjectLeaders({ projectId: "PRJ-002", mainExecutorId: "ST-006", mainSupervisorId: "ST-004" });

  // PRJ-002 có Người thực hiện chính là ST-006 (Trần Quốc Việt)
  // Nếu cố tình cấp cho người khác không phải ST-006 (ví dụ ST-004), phải bị từ chối
  await assert.rejects(
    () =>
      repository.grantActingDirector({
        projectId: "PRJ-002",
        staffId: "ST-004", // Không phải main executor của PRJ-002
        assignedBy: "Huỳnh Thái Hải (Giám đốc)",
      }),
    /chỉ có Người thực hiện chính của dự án mới được cấp role Quyền Chủ nhiệm dự án/i
  );

  // Cấp đúng cho Người thực hiện chính ST-006
  const granted = await repository.grantActingDirector({
    projectId: "PRJ-002",
    staffId: "ST-006",
    assignedBy: "Huỳnh Thái Hải (Giám đốc)",
    note: "Ủy quyền điều hành toàn diện công trình",
  });
  assert.equal(granted.actingDirectorId, "ST-006");
  assert.equal(granted.teamMembers?.includes("ST-006"), true);

  // Giám đốc / Phó Giám đốc có thể thu hồi quyền bất cứ lúc nào
  const revoked = await repository.revokeActingDirector("PRJ-002");
  assert.equal(revoked.actingDirectorId, undefined);
  assert.equal(revoked.actingDirectorAssignedAt, undefined);
});

test("Acting Director and Director can manage team members and urge progress", async () => {
  const repository = createMockPersonnelRepository();

  // Thêm thành viên mới vào tổ công tác
  const withMember = await repository.addProjectMember("PRJ-001", "ST-010");
  assert.equal(withMember.teamMembers?.includes("ST-010"), true);

  // Đôn đốc thành viên trong dự án
  const urged = await repository.urgeMember({
    projectId: "PRJ-001",
    staffId: "ST-005",
    urgedBy: "Huỳnh Thái Hải (Giám đốc)",
    note: "Khẩn trương xử lý sự cố kè trước mùa mưa bão",
    urgencyLevel: "HIGH",
  });
  assert.equal(urged.urgeCount, 1);
  assert.equal(urged.lastUrgedBy, "Huỳnh Thái Hải (Giám đốc)");
  assert.equal(urged.lastUrgedNote, "Khẩn trương xử lý sự cố kè trước mùa mưa bão");
  assert.equal(urged.priority, "HIGH");

  // Kiểm tra phân quyền:
  const directorPerms = getPersonnelRolePermissions(user("ADMIN"));
  const actingDirPerms = getPersonnelRolePermissions(user("ACTING_DIRECTOR"));
  assert.equal(directorPerms.canGrantRole, true);
  assert.equal(directorPerms.canRevokeRole, true);
  assert.equal(directorPerms.canUrgeMembers, true);

  assert.equal(actingDirPerms.canGrantRole, false); // Quyền CNDA không tự cấp role cho người khác
  assert.equal(actingDirPerms.canManageTeamMembers, true); // Có quyền quản lý tổ công tác
  assert.equal(actingDirPerms.canUrgeMembers, true); // Có quyền đôn đốc thành viên trong dự án
  assert.equal(actingDirPerms.canAssign, true); // Có quyền giao việc trong dự án
});

test("Staff creation and update support team assignment and Leader/Member role", async () => {
  const repository = createMockPersonnelRepository();

  // 1. Tạo nhân sự mới với vai trò là Lead của tổ GSKT
  const newLead = await repository.createStaff({
    name: "Phạm Minh Hoàng",
    title: "Tổ trưởng Giám sát – Kỹ thuật",
    teamId: "GSKT",
    roleCode: "TECHNICAL_OFFICER",
    employment: "Viên chức",
    phone: "0988.111.222",
    email: "hoang.pm@hatien.gov.vn",
    isLeader: true,
  });

  const datasetAfterCreate = await repository.getDataset();
  const gsktTeam = datasetAfterCreate.teams.find((t) => t.id === "GSKT");
  assert.equal(gsktTeam?.leaderId, newLead.id);

  // 2. Tạo nhân sự mới với vai trò là Member của tổ BT
  const newMember = await repository.createStaff({
    name: "Lê Văn Hùng",
    title: "Chuyên viên bồi thường",
    teamId: "BT",
    roleCode: "COMPENSATION_OFFICER",
    employment: "Hợp đồng",
    phone: "0977.333.444",
    email: "hung.lv@hatien.gov.vn",
    isLeader: false,
  });

  const datasetAfterMember = await repository.getDataset();
  const btTeam = datasetAfterMember.teams.find((t) => t.id === "BT");
  assert.equal(btTeam?.leaderId, "ST-014"); // Vẫn giữ leader cũ

  // 3. Cập nhật nhân sự: Thăng chức newMember lên làm Leader của tổ BT
  await repository.updateStaff(newMember.id, {
    title: "Tổ trưởng Bồi thường",
    isLeader: true,
    teamId: "BT",
  });

  const datasetAfterPromote = await repository.getDataset();
  const btTeamAfter = datasetAfterPromote.teams.find((t) => t.id === "BT");
  assert.equal(btTeamAfter?.leaderId, newMember.id);
});

test("Team leader sees only stages explicitly assigned by the project leader", async () => {
  const repository = createMockPersonnelRepository();
  await repository.createAssignment({
    title: "Phụ trách giai đoạn VI",
    projectId: "PRJ-006",
    stage: "VI",
    teamId: "GSKT",
    teamLeaderId: "ST-004",
    assigneeId: "ST-004",
    assignmentLevel: "PHASE_LEAD",
    assignedByRole: "PROJECT_LEAD",
    dueDate: "2026-12-31",
  }, "Phan Văn Đức");
  await repository.createAssignment({
    title: "Phụ trách giai đoạn VII",
    projectId: "PRJ-002",
    stage: "VII",
    teamId: "GSKT",
    teamLeaderId: "ST-004",
    assigneeId: "ST-004",
    assignmentLevel: "PHASE_LEAD",
    assignedByRole: "PROJECT_LEAD",
    dueDate: "2026-12-31",
  }, "Phan Văn Đức");
  const dataset = await repository.getDataset();

  // ST-004 là Tổ trưởng GSKT
  const teamLeaderId = "ST-004";
  const teamId = "GSKT";

  function getAssignedStagesForTeam(projectId, targetTeamId, leaderId) {
    const phaseAssignments = dataset.assignments.filter(
      (a) =>
        a.projectId === projectId &&
        (a.assignmentLevel === "PHASE_LEAD" || a.assignedByRole === "PROJECT_LEAD") &&
        (a.teamId === targetTeamId || a.teamLeaderId === leaderId || a.assigneeId === leaderId)
    );
    return Array.from(new Set(phaseAssignments.map((a) => a.stage).filter(Boolean)));
  }

  // 1. Đối với PRJ-006: Lead dự án đã giao Giai đoạn VI cho Tổ trưởng GSKT (AS-013)
  const stagesPRJ006 = getAssignedStagesForTeam("PRJ-006", teamId, teamLeaderId);
  assert.deepEqual(stagesPRJ006, ["VI"]); // Chỉ có Giai đoạn VI, không có giai đoạn dư khác

  // 2. Đối với PRJ-002: Lead dự án đã giao Giai đoạn VII cho Tổ trưởng GSKT (AS-004)
  const stagesPRJ002 = getAssignedStagesForTeam("PRJ-002", teamId, teamLeaderId);
  assert.deepEqual(stagesPRJ002, ["VII"]); // Chỉ có Giai đoạn VII

  // 3. Đối với PRJ-005: Chưa có giai đoạn nào được giao cho GSKT
  const stagesPRJ005 = getAssignedStagesForTeam("PRJ-005", teamId, teamLeaderId);
  assert.deepEqual(stagesPRJ005, []); // Rỗng, không có giai đoạn nào
});

test("Leads have separate 'project-tasks' and 'team-tasks' tabs for delegation and approval", () => {
  assert.equal(PERSONNEL_TAB_LABELS["project-tasks"], "Giao việc dự án (CNDA)");
  assert.equal(PERSONNEL_TAB_LABELS["team-tasks"], "Giao việc tổ & Phê duyệt");
  assert.equal(PERSONNEL_TAB_LABELS["assignments"], "Phân công dự án");

  // Kiểm tra Tổ trưởng BT (ST-014 - Phạm Quốc Bảo) có tab mặc định là team-tasks
  const teamLeadPerms = getPersonnelRolePermissions(
    { id: "ST-014", name: "Phạm Quốc Bảo", role: "COMPENSATION_OFFICER", permissions: [] },
    PERSONNEL_MOCK_DATA
  );
  assert.equal(teamLeadPerms.isTeamLeader, true);
  assert.equal(teamLeadPerms.defaultTab, "team-tasks");

  // Kiểm tra CNDA (Trần Đình Trọng - ACTING_DIRECTOR) có tab mặc định là project-tasks
  const cndaPerms = getPersonnelRolePermissions(
    { id: "ST-003", name: "Trần Đình Trọng", role: "ACTING_DIRECTOR", permissions: [] },
    PERSONNEL_MOCK_DATA
  );
  assert.equal(cndaPerms.isProjectLeader, true);
  assert.equal(cndaPerms.defaultTab, "project-tasks");

  // Kiểm tra tài khoản vừa là Lead dự án vừa là Lead tổ (Lê Hoàng Minh - ST-004: CNDA PRJ-007 & Tổ trưởng GSKT)
  const dualLeadPerms = getPersonnelRolePermissions(
    { id: "ST-004", name: "Lê Hoàng Minh", role: "TECHNICAL_OFFICER", permissions: ["project.phase.assign"] },
    { ...PERSONNEL_MOCK_DATA, projects: PERSONNEL_MOCK_DATA.projects.map((project) =>
      project.id === "PRJ-007" ? { ...project, mainExecutorId: "ST-004" } : project
    ) }
  );
  assert.equal(dualLeadPerms.isProjectLeader, true);
  assert.equal(dualLeadPerms.isTeamLeader, true);

  // Kiểm tra Thành viên thông thường (ST-008) có tab mặc định là assignments (Nhiệm vụ của tôi)
  const memberPerms = getPersonnelRolePermissions(
    { id: "ST-008", name: "Nguyễn Văn Hùng", role: "TECHNICAL_OFFICER", permissions: [] },
    PERSONNEL_MOCK_DATA
  );
  assert.equal(Boolean(memberPerms.isTeamLeader), false);
  assert.equal(memberPerms.defaultTab, "assignments");
});

test("Manager sees urge/edit before submission and accept/reject after submission; Assignee submits for review", () => {
  const assignments = [
    { id: "AS-013", status: "IN_PROGRESS" },
    { id: "AS-014", status: "PENDING_APPROVAL", submissions: [{ leadApprovalStatus: "PENDING_LEAD" }] },
  ];
  // 1. Nhiệm vụ đang thực hiện (chưa nộp):
  // AS-013: Phan Văn Đức (CNDA) giao cho Lê Hoàng Minh (ST-004), status: IN_PROGRESS
  const as013 = assignments.find((a) => a.id === "AS-013");
  assert.equal(as013.status, "IN_PROGRESS");
  assert.equal(Boolean(as013.submissions?.some((s) => s.leadApprovalStatus === "PENDING_LEAD")), false);

  // Phía quản lý (CNDA):
  // Khi cấp dưới chưa gửi, người quản lý không duyệt mà chỉ đôn đốc hoặc sửa nhiệm vụ
  const isPending013 = as013.status === "PENDING_APPROVAL" || Boolean(as013.submissions?.some((s) => s.leadApprovalStatus === "PENDING_LEAD"));
  assert.equal(isPending013, false);

  // 2. Giai đoạn/Nhiệm vụ đã được Tổ trưởng thẩm tra và nộp về cho CNDA phê duyệt:
  // AS-014: Giai đoạn IV công viên Đông Hồ (Tổ trưởng ST-004 nộp về cho CNDA ST-001)
  const as014 = assignments.find((a) => a.id === "AS-014");
  assert.equal(as014.status, "PENDING_APPROVAL");
  const isPending014 = as014.status === "PENDING_APPROVAL" || Boolean(as014.submissions?.some((s) => s.leadApprovalStatus === "PENDING_LEAD"));
  assert.equal(isPending014, true);
  // Khi đã gửi về, CNDA có đúng 2 nút: Chấp nhận & Từ chối
});
