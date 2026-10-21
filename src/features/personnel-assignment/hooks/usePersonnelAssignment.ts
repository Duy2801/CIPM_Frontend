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
  Staff,
  StaffInput,
  TeamId,
  UrgeMemberInput,
} from "../types/personnel.types";
import { getPersonnelRolePermissions } from "../utils/personnel-permissions";
import { appendActivity, type ActivityChange } from "../utils/activity-log";
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

  // ── Nhật ký thao tác: ghi ai làm gì, lúc nào, thay đổi "cũ → mới" ──
  const actorName = currentUser?.displayName || currentUser?.name || "Không rõ";
  const actorRole = (currentUser as { roleName?: string } | null)?.roleName;
  const teamNameOf = (id?: string) => data.teams.find((t) => t.id === id)?.name ?? id ?? "";
  // Người thực hiện tự lấy theo tài khoản đang đăng nhập
  type LogInput = Omit<Parameters<typeof appendActivity>[0], "actorName">;
  const logActivity = (entry: LogInput) => appendActivity({ actorRole, ...entry, actorName });

  const STAFF_FIELD_LABELS: { key: keyof StaffInput; label: string; format?: (v: unknown) => string }[] = [
    { key: "name", label: "Họ và tên" },
    { key: "title", label: "Chức danh", format: (v) => (v ? String(v) : "Chưa có chức danh") },
    { key: "teamId", label: "Phòng ban", format: (v) => teamNameOf(v as string) },
    { key: "email", label: "Email công vụ" },
    { key: "phone", label: "Số điện thoại" },
    { key: "employment", label: "Hình thức tuyển dụng" },
    { key: "gender", label: "Giới tính" },
    { key: "dob", label: "Ngày sinh" },
    { key: "citizenId", label: "Số CCCD" },
  ];

  /** So sánh hồ sơ trước / sau khi sửa → danh sách thay đổi */
  const diffStaff = (before: Staff, input: Partial<StaffInput>): ActivityChange[] => {
    const changes: ActivityChange[] = [];
    const text = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
    STAFF_FIELD_LABELS.forEach(({ key, label, format }) => {
      if (!(key in input)) return;
      const from = text((before as unknown as Record<string, unknown>)[key]);
      const to = text(input[key]);
      if (from === to) return;
      changes.push({ label, from: format ? format(from) : from || "Trống", to: format ? format(to) : to || "Trống" });
    });
    if ("permissions" in input || "revokedPermissions" in input) {
      const sameList = (a?: string[], b?: string[]) => [...(a ?? [])].sort().join() === [...(b ?? [])].sort().join();
      if (!sameList(before.permissions, input.permissions) || !sameList(before.revokedPermissions, input.revokedPermissions)) {
        changes.push({
          label: "Quyền hạn riêng",
          from: `cấp thêm ${before.permissions?.length ?? 0}, thu hồi ${before.revokedPermissions?.length ?? 0}`,
          to: `cấp thêm ${input.permissions?.length ?? 0}, thu hồi ${input.revokedPermissions?.length ?? 0}`,
        });
      }
    }
    if ("customFields" in input && JSON.stringify(before.customFields ?? {}) !== JSON.stringify(input.customFields ?? {})) {
      changes.push({ label: "Thông tin bổ sung", from: "Trước khi sửa", to: "Đã cập nhật" });
    }
    return changes;
  };

  /** Chạy thao tác; thành công thì ghi nhật ký */
  const runAndLog = async (
    action: () => Promise<unknown>,
    successText: string,
    makeEntry: () => LogInput | null
  ) => {
    const entry = makeEntry(); // lấy dữ liệu "trước" khi thao tác làm thay đổi
    const ok = await run(action, successText);
    if (ok && entry) logActivity(entry);
    return ok;
  };

  useEffect(() => {
    let active = true;
    const load = () => {
      mockPersonnelRepository.getDataset().then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      });
    };
    load();
    if (typeof window !== "undefined") {
      window.addEventListener("cipm_personnel_dataset_updated", load);
      return () => {
        active = false;
        window.removeEventListener("cipm_personnel_dataset_updated", load);
      };
    }
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
    lockAccount: (staffId: string, reason: string) => runAndLog(
      () => mockPersonnelRepository.setAccountActive(staffId, false, reason),
      `Đã khóa tài khoản của ${nameOf(staffId)}.`,
      () => ({
        module: "Nhân sự",
        action: "Khóa tài khoản",
        targetType: "staff",
        targetId: staffId,
        targetName: nameOf(staffId),
        changes: [{ label: "Tài khoản", from: "Đang hoạt động", to: "Đang khóa" }],
        note: reason ? `Lý do: ${reason}` : undefined,
      }),
    ),
    unlockAccount: (staffId: string) => runAndLog(
      () => mockPersonnelRepository.setAccountActive(staffId, true),
      `Đã mở lại tài khoản của ${nameOf(staffId)}.`,
      () => ({
        module: "Nhân sự",
        action: "Mở lại tài khoản",
        targetType: "staff",
        targetId: staffId,
        targetName: nameOf(staffId),
        changes: [{ label: "Tài khoản", from: "Đang khóa", to: "Đang hoạt động" }],
      }),
    ),
    grantActingDirector: (input: GrantActingDirectorInput, customMessage?: string | false) => runAndLog(
      () => mockPersonnelRepository.grantActingDirector(input),
      customMessage === false
        ? ""
        : (customMessage || `Đã cấp vai trò Quyền Chủ nhiệm dự án cho ${nameOf(input.staffId)} tại ${projectOf(input.projectId)}.`),
      () => ({
        module: "Nhân sự",
        action: "Cấp quyền Chủ nhiệm dự án",
        targetType: "staff",
        targetId: input.staffId,
        targetName: nameOf(input.staffId),
        note: `Dự án: ${projectOf(input.projectId)}`,
      }),
    ),
    revokeActingDirector: (projectId: string, customMessage?: string | false) => runAndLog(
      () => mockPersonnelRepository.revokeActingDirector(projectId),
      customMessage === false
        ? ""
        : (customMessage || `Đã thu hồi vai trò Quyền Chủ nhiệm dự án tại ${projectOf(projectId)}.`),
      () => {
        const holderId = data.projects.find((p) => p.id === projectId)?.actingDirectorId;
        return {
          module: "Nhân sự",
          action: "Thu hồi quyền Chủ nhiệm dự án",
          targetType: "staff",
          targetId: holderId,
          targetName: holderId ? nameOf(holderId) : undefined,
          note: `Dự án: ${projectOf(projectId)}`,
        };
      },
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
    createTeam: (input: { id?: string; name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }) => run(
      () => mockPersonnelRepository.createTeam(input),
      `Đã thêm phòng ban / tổ chuyên môn "${input.name.trim()}".`,
    ),
    updateTeam: (id: string, input: Partial<{ name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }>) => runAndLog(
      () => mockPersonnelRepository.updateTeam(id, input),
      `Đã cập nhật thông tin phòng ban / tổ chuyên môn "${input.name?.trim() || id}".`,
      () => {
        const before = teamNameOf(id);
        const after = input.name?.trim();
        return {
          module: "Nhân sự",
          action: "Cập nhật phòng ban",
          targetType: "team",
          targetId: id,
          targetName: after || before,
          changes: after && after !== before ? [{ label: "Tên phòng ban", from: before, to: after }] : undefined,
        };
      },
    ),
    createStaff: async (input: StaffInput) => {
      let createdId: string | undefined;
      const ok = await run(async () => {
        const created = await mockPersonnelRepository.createStaff(input);
        createdId = created?.id;
        return created;
      }, `Đã thêm cán bộ ${input.name.trim()} vào hệ thống.`);
      if (ok) {
        logActivity({
          module: "Nhân sự",
          action: "Thêm cán bộ mới",
          targetType: "staff",
          targetId: createdId,
          targetName: input.name.trim(),
          changes: [
            { label: "Chức danh", to: input.title || "Chưa có chức danh" },
            { label: "Phòng ban", to: teamNameOf(input.teamId) },
            { label: "Email công vụ", to: input.email },
          ],
        });
      }
      return ok;
    },
    updateStaff: (staffId: string, input: Partial<StaffInput>, customMessage?: string | false) => runAndLog(
      () => mockPersonnelRepository.updateStaff(staffId, input),
      customMessage === false
        ? ""
        : (customMessage || `Đã cập nhật thông tin / chức danh của cán bộ ${nameOf(staffId)}.`),
      () => {
        const before = data.staff.find((s) => s.id === staffId);
        if (!before) return null;
        const changes = diffStaff(before, input);
        if (changes.length === 0) return null;
        const labels = new Set(changes.map((c) => c.label));
        const action = labels.has("Chức danh") || labels.has("Phòng ban")
          ? "Cập nhật chức danh / phòng ban"
          : labels.has("Quyền hạn riêng")
          ? "Cập nhật quyền hạn riêng"
          : "Cập nhật thông tin cá nhân";
        return { module: "Nhân sự", action, targetType: "staff", targetId: staffId, targetName: before.name, changes };
      },
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
