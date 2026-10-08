"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionFeedback } from "@/components/workspace";
import { getStoredUser, useAuth } from "@/features/auth";
import type { AuthUser } from "@/types/auth";
import { todayIso } from "@/utils/date";
import { mockPersonnelRepository } from "../services/mock-personnel.repository";
import type {
  AssignmentInput,
  GrantActingDirectorInput,
  PersonnelDataset,
  ProjectDocumentSubmission,
  ProjectLeadershipInput,
  StaffInput,
  TeamId,
  UrgeMemberInput,
} from "../types/personnel.types";
import { getPersonnelRolePermissions } from "../utils/personnel-permissions";
import { isOverdue, isOverloaded } from "../utils/personnel-rules";
import { buildPersonnelTasks } from "../utils/personnel-workspace";

const EMPTY_DATASET: PersonnelDataset = { teams: [], staff: [], projects: [], assignments: [] };

export function usePersonnelAssignment() {
  const { user } = useAuth();
  const currentUser: AuthUser | null = user ?? getStoredUser();
  const [data, setData] = useState<PersonnelDataset>(EMPTY_DATASET);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<TeamId | "ALL">("ALL");
  const today = todayIso();

  const currentStaff = useMemo(() => {
    if (!currentUser) return undefined;
    return data.staff.find(
      (s) =>
        s.id === currentUser.id ||
        (currentUser.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.displayName && s.name.toLowerCase() === currentUser.displayName.toLowerCase())
    );
  }, [currentUser, data.staff]);

  const permissions = useMemo(
    () =>
      getPersonnelRolePermissions(currentUser, {
        projects: data.projects,
        staff: data.staff,
        assignments: data.assignments,
        teams: data.teams,
      }),
    [currentUser, data.projects, data.staff, data.assignments, data.teams],
  );

  const refresh = useCallback(async () => {
    setData(await mockPersonnelRepository.getDataset());
  }, []);
  const { feedback, run, clearFeedback } = useActionFeedback(refresh);

  useEffect(() => {
    let active = true;
    mockPersonnelRepository.getDataset().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const staff = useMemo(
    () => data.staff.filter((person) => teamId === "ALL" || person.teamId === teamId),
    [data.staff, teamId],
  );

  /** Lọc theo phân quyền CNDA, Tổ trưởng (Lead tổ) và theo thành viên */
  const assignments = useMemo(() => {
    let list = data.assignments;

    // Nếu người dùng không phải Director (Admin / Ban Giám đốc có quyền quản lý toàn cục):
    const isDirector = permissions.canAssignProjectLeaders || permissions.canGrantRole;
    if (!isDirector && (permissions.isProjectLeader || permissions.isMember || permissions.isTeamLeader)) {
      const leadProjectSet = new Set(permissions.actingProjectIds || []);
      const memberProjectSet = new Set(permissions.memberProjectIds || []);

      const myStaffId = currentStaff?.id;
      const myTeamId = permissions.leadingTeamId || currentStaff?.teamId;
      const staffInMyTeamIds = new Set(
        data.staff.filter((s) => s.teamId === myTeamId).map((s) => s.id)
      );

      list = list.filter((item) => {
        // 1. Nếu là dự án mà user là Lead: xem toàn bộ công việc trong dự án đó
        if (leadProjectSet.has(item.projectId)) {
          return true;
        }
        // 2. Nếu user là Tổ trưởng: thấy các nhiệm vụ của tổ mình hoặc do thành viên trong tổ thực hiện
        if (permissions.isTeamLeader) {
          if (item.teamId === myTeamId || (item.assigneeId && staffInMyTeamIds.has(item.assigneeId))) {
            return true;
          }
        }
        // 3. Nếu là Thành viên: chỉ thấy công việc giao cho mình
        if (memberProjectSet.has(item.projectId) || item.assigneeId === myStaffId || (item.coAssigneeIds || []).includes(myStaffId || "")) {
          return item.assigneeId === myStaffId || (item.coAssigneeIds || []).includes(myStaffId || "");
        }
        return false;
      });
    }

    if (teamId === "ALL") return list;
    const ids = new Set(staff.map((person) => person.id));
    return list.filter((item) => item.assigneeId && ids.has(item.assigneeId));
  }, [
    data.assignments,
    data.staff,
    currentUser,
    permissions.canAssignProjectLeaders,
    permissions.canGrantRole,
    permissions.isProjectLeader,
    permissions.isMember,
    permissions.isTeamLeader,
    permissions.leadingTeamId,
    permissions.actingProjectIds,
    permissions.memberProjectIds,
    staff,
    teamId,
  ]);

  const kpis = useMemo(() => ({
    staffCount: staff.length,
    contractCount: staff.filter((person) => person.employment === "Hợp đồng").length,
    open: assignments.filter((item) => item.status !== "DONE").length,
    overdue: assignments.filter((item) => isOverdue(item, today)).length,
    done: assignments.filter((item) => item.status === "DONE").length,
    total: assignments.length,
    overloaded: staff.filter((person) => isOverloaded(person.id, data.assignments)).length,
  }), [assignments, data.assignments, staff, today]);

  const tasks = useMemo(
    () => buildPersonnelTasks(permissions, assignments, staff, today),
    [assignments, permissions, staff, today],
  );

  const nameOf = (staffId?: string) => data.staff.find((person) => person.id === staffId)?.name ?? "";
  const projectOf = (projectId?: string) => data.projects.find((p) => p.id === projectId)?.name ?? "Dự án";

  return {
    data,
    loading,
    today,
    teamId,
    setTeamId,
    currentUser,
    currentStaff,
    permissions,
    staff,
    assignments,
    kpis,
    tasks,
    feedback,
    clearFeedback,
    assignProjectLeaders: (input: ProjectLeadershipInput) => run(
      () => mockPersonnelRepository.assignProjectLeaders(input),
      `Đã phân công ${nameOf(input.mainExecutorId)} (Chủ nhiệm) & ${nameOf(input.mainSupervisorId)} (Giám sát chính) cho ${projectOf(input.projectId)}.`,
    ),
    createAssignment: (input: AssignmentInput) => run(
      () => mockPersonnelRepository.createAssignment(input, permissions.userName),
      `Đã giao nhiệm vụ giai đoạn cho ${nameOf(input.assigneeId)}.`,
    ),
    updateAssignment: (id: string, input: AssignmentInput) => run(
      () => mockPersonnelRepository.updateAssignment(id, input),
      `Đã cập nhật nhiệm vụ, người thực hiện chính: ${nameOf(input.assigneeId)}.`,
    ),
    deleteAssignment: (id: string) => run(
      () => mockPersonnelRepository.deleteAssignment(id),
      "Đã xóa nhiệm vụ thành công.",
    ),
    startAssignment: (id: string) => run(
      () => mockPersonnelRepository.startAssignment(id),
      "Đã bắt đầu thực hiện nhiệm vụ.",
    ),
    completeAssignment: (id: string, submission?: Partial<ProjectDocumentSubmission>) => run(
      () => mockPersonnelRepository.completeAssignment(id, submission),
      "Đã ghi nhận nhiệm vụ hoàn thành và đính kèm hồ sơ nghiệm thu.",
    ),
    acceptAssignment: (id: string, note?: string) => run(
      () => mockPersonnelRepository.acceptAssignment(id, note),
      "Đã chấp nhận kết quả hoàn thành nhiệm vụ và nghiệm thu hồ sơ.",
    ),
    undoAcceptAssignment: (id: string) => run(
      () => mockPersonnelRepository.undoAcceptAssignment(id),
      "Đã hoàn tác phê duyệt, đưa nhiệm vụ về trạng thái chờ duyệt.",
    ),
    rejectAssignment: (id: string, reason: string) => run(
      () => mockPersonnelRepository.rejectAssignment(id, reason),
      "Đã từ chối kết quả và yêu cầu cán bộ hoàn thiện lại nhiệm vụ.",
    ),
    returnToMember: (id: string) => run(
      () => mockPersonnelRepository.returnToMember(id),
      "Đã chuyển bước con lại cho thành viên chỉnh sửa.",
    ),
    requestCompletion: (id: string, submission?: Partial<ProjectDocumentSubmission>) => run(
      () => mockPersonnelRepository.requestCompletion(id, submission),
      "Đã gửi xác nhận hoàn thành nhiệm vụ, chờ lãnh đạo nghiệm thu.",
    ),
    addAssignmentSubmission: (assignmentId: string, submission: Partial<ProjectDocumentSubmission>) => run(
      () => mockPersonnelRepository.addAssignmentSubmission(assignmentId, submission),
      "Đã đính kèm tệp tài liệu vào nhiệm vụ thành công.",
    ),
    addAssignmentSubmissions: (assignmentId: string, submissions: Partial<ProjectDocumentSubmission>[]) => run(
      () => mockPersonnelRepository.addAssignmentSubmissions(assignmentId, submissions),
      `Đã đính kèm ${submissions.length} tệp tài liệu thành công.`,
    ),
    removeAssignmentSubmission: (assignmentId: string, submissionId: string) => run(
      () => mockPersonnelRepository.removeAssignmentSubmission(assignmentId, submissionId),
      "Đã xóa tệp đính kèm.",
    ),
    lockAccount: (staffId: string, reason: string) => run(
      () => mockPersonnelRepository.setAccountActive(staffId, false, reason),
      `Đã khóa tài khoản của ${nameOf(staffId)}.`,
    ),
    unlockAccount: (staffId: string) => run(
      () => mockPersonnelRepository.setAccountActive(staffId, true),
      `Đã mở lại tài khoản của ${nameOf(staffId)}.`,
    ),
    grantActingDirector: (input: GrantActingDirectorInput) => run(
      () => mockPersonnelRepository.grantActingDirector(input),
      `Đã cấp role Quyền Chủ nhiệm dự án cho ${nameOf(input.staffId)} tại ${projectOf(input.projectId)}.`,
    ),
    revokeActingDirector: (projectId: string) => run(
      () => mockPersonnelRepository.revokeActingDirector(projectId),
      `Đã thu hồi role Quyền Chủ nhiệm dự án tại ${projectOf(projectId)}.`,
    ),
    addProjectMember: (projectId: string, staffId: string) => run(
      () => mockPersonnelRepository.addProjectMember(projectId, staffId),
      `Đã thêm ${nameOf(staffId)} vào tổ công tác ${projectOf(projectId)}.`,
    ),
    addProjectMembers: (projectId: string, staffIds: string[]) => run(
      () => mockPersonnelRepository.addProjectMembers(projectId, staffIds),
      `Đã thêm ${staffIds.length} thành viên vào tổ công tác ${projectOf(projectId)}.`,
    ),
    removeProjectMember: (projectId: string, staffId: string) => run(
      () => mockPersonnelRepository.removeProjectMember(projectId, staffId),
      `Đã đưa ${nameOf(staffId)} ra khỏi tổ công tác ${projectOf(projectId)}.`,
    ),
    createStaff: (input: StaffInput) => run(
      () => mockPersonnelRepository.createStaff(input),
      `Đã thêm cán bộ ${input.name.trim()} vào hệ thống.`,
    ),
    updateStaff: (staffId: string, input: Partial<StaffInput>) => run(
      () => mockPersonnelRepository.updateStaff(staffId, input),
      `Đã cập nhật thông tin / chức vụ của cán bộ ${nameOf(staffId)}.`,
    ),
    updateProjectPermissions: (projectId: string, grantedPermissions: string[]) => run(
      () => mockPersonnelRepository.updateProjectPermissions(projectId, grantedPermissions),
      `Đã cập nhật quyền ủy quyền cho ${projectOf(projectId)}.`,
    ),
    urgeMember: (input: UrgeMemberInput) => run(
      () => mockPersonnelRepository.urgeMember(input),
      `Đã gửi đôn đốc tiến độ đến ${nameOf(input.staffId)} cho dự án ${projectOf(input.projectId)}.`,
    ),
    reviewLeadSubmission: (params: {
      assignmentId: string;
      submissionId: string;
      approved: boolean;
      leadName: string;
      feedbackNote?: string;
    }) => run(
      () => mockPersonnelRepository.reviewLeadSubmission(params),
      params.approved
        ? "Đã phê duyệt tài liệu và chuyển về cho Người thực hiện chính."
        : "Đã yêu cầu thành viên chỉnh sửa lại tài liệu.",
    ),
    submitProjectToDirector: (params: {
      projectId: string;
      targetRole: "GIAM_DOC" | "PHO_GIAM_DOC";
      targetStaffName?: string;
      note?: string;
      submittedBy?: string;
    }) => run(
      () => mockPersonnelRepository.submitProjectToDirector(params),
      `Đã gửi tờ trình lên ${params.targetRole === "GIAM_DOC" ? "Giám đốc" : "Phó Giám đốc"} phê duyệt nghiệm thu toàn bộ dự án.`
    ),
    reviewProjectDirector: (params: {
      projectId: string;
      approved: boolean;
      note?: string;
      reviewedBy?: string;
    }) => run(
      () => mockPersonnelRepository.reviewProjectDirector(params),
      params.approved
        ? "Ban Giám đốc đã phê duyệt kết thúc và nghiệm thu toàn diện dự án."
        : "Đã gửi thông báo yêu cầu Chủ nhiệm dự án hoàn thiện lại hồ sơ."
    ),
  };
}

export type PersonnelController = ReturnType<typeof usePersonnelAssignment>;
