import type { AuthUser } from "@/types/auth";
import { resolveRoleProfile } from "../../../utils/role-profile.ts";
import type { PersonnelRolePermissions } from "../types/personnel.types";

type PersonnelRoleProfile = Omit<PersonnelRolePermissions, "roleCode" | "userName" | "canExport">;

/**
 * Quy định phân quyền Phân hệ M5 – Nhân sự & Phân công:
 * 1. Ban Giám đốc (ADMIN / Giám đốc, DEPUTY_DIRECTOR / Phó Giám đốc):
 *    - CHỈ CÓ phân công dự án (chỉ định Người thực hiện chính / Chủ nhiệm dự án & Giám sát chính, cấp/thu hồi quyền CNDA).
 *    - KHÔNG CÓ phân công nhiệm vụ nhân viên (canAssignStaffTasks = false, canAssign = false).
 * 2. Người có quyền chủ dự án (ACTING_DIRECTOR / Quyền Chủ nhiệm dự án, hoặc cán bộ được giao quyền chủ nhiệm/phụ trách dự án):
 *    - CÓ QUYỀN thấy và thực hiện Phân công nhiệm vụ nhân viên (canAssignStaffTasks = true, canAssign = true).
 *    - KHÔNG phân công lãnh đạo dự án (canAssignProjectLeaders = false).
 * 3. Các vai trò khác: Không có quyền truy cập phân hệ M5.
 */
const ROLE_PROFILES: Record<string, PersonnelRoleProfile> = {
  ADMIN: {
    roleTitle: "Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canAccessModule: true,
    canAssignProjectLeaders: true,
    canGrantRole: true,
    canRevokeRole: true,
    canAssignStaffTasks: false,
    canAssign: false,
    isProjectLeader: false,
    canManageTeamMembers: true,
    canUrgeMembers: true,
    canManageAccounts: true,
    canManageOrganization: true,
    defaultTab: "assignments",
    scopeDescription: "Phân công dự án (chỉ định Chủ nhiệm dự án & Giám sát chính), cấp quyền chủ dự án, quản lý cơ cấu tổ chức và tài khoản hệ thống.",
    allowedDuties: [
      "Phân công Người thực hiện chính (Chủ nhiệm dự án) & Người giám sát chính cho toàn bộ dự án",
      "Cấp và thu hồi vai trò Quyền Chủ nhiệm dự án (chỉ cấp cho Người thực hiện chính)",
      "Đôn đốc tiến độ dự án cấp lãnh đạo",
      "Quản lý cơ cấu phòng ban và tài khoản hệ thống",
      "Xuất báo cáo phân công nhân sự",
    ],
    readingGuide: "Giám đốc chỉ thực hiện phân công dự án và cấp quyền chủ dự án. Việc phân công nhiệm vụ nhân viên do Chủ nhiệm dự án thực hiện.",
  },
  DEPUTY_DIRECTOR: {
    roleTitle: "Phó Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canAccessModule: true,
    canAssignProjectLeaders: true,
    canGrantRole: true,
    canRevokeRole: true,
    canAssignStaffTasks: false,
    canAssign: false,
    isProjectLeader: false,
    canManageTeamMembers: true,
    canUrgeMembers: true,
    canManageAccounts: false,
    canManageOrganization: true,
    defaultTab: "assignments",
    scopeDescription: "Phân công dự án (chỉ định Chủ nhiệm dự án & Giám sát chính) và cấp/thu hồi vai trò Quyền CNDA trong các dự án phụ trách.",
    allowedDuties: [
      "Phân công Người thực hiện chính (Chủ nhiệm dự án) & Người giám sát chính cho dự án phụ trách",
      "Cấp và thu hồi vai trò Quyền Chủ nhiệm dự án (chỉ cấp cho Người thực hiện chính)",
      "Đôn đốc tiến độ dự án phụ trách",
      "Theo dõi tiến độ tổng thể các dự án phụ trách",
    ],
    readingGuide: "Phó Giám đốc chỉ thực hiện phân công dự án cho các dự án phụ trách. Việc phân công nhiệm vụ nhân viên do Chủ nhiệm dự án thực hiện.",
  },
  ACTING_DIRECTOR: {
    roleTitle: "Quyền Chủ nhiệm dự án",
    department: "Tổ Công tác dự án",
    isReadOnly: false,
    canAccessModule: true,
    canAssignProjectLeaders: false,
    canGrantRole: false,
    canRevokeRole: false,
    canAssignStaffTasks: true,
    canAssign: true,
    isProjectLeader: true,
    canManageTeamMembers: true,
    canUrgeMembers: true,
    canManageAccounts: false,
    canManageOrganization: false,
    defaultTab: "project-tasks",
    scopeDescription: "Được Ban Giám đốc ủy quyền chủ dự án: Toàn quyền phân công nhiệm vụ nhân viên, quản lý thành viên tổ công tác và đôn đốc tiến độ dự án phụ trách.",
    allowedDuties: [
      "Phân công nhiệm vụ nhân viên theo các giai đoạn thực hiện dự án phụ trách",
      "Bổ nhiệm và thêm bớt thành viên trong tổ công tác dự án phụ trách",
      "Đôn đốc các thành viên thực hiện đúng tiến độ và chất lượng công việc",
      "Báo cáo tiến độ và đề xuất điều chỉnh nhân sự lên Ban Giám đốc",
    ],
    readingGuide: "Người có quyền chủ dự án có quyền xem và phân công nhiệm vụ cho nhân viên trong các dự án mình làm chủ nhiệm.",
  },
};

const NO_ACCESS_PROFILE: PersonnelRoleProfile = {
  roleTitle: "Cán bộ / Chuyên viên",
  department: "BQL ĐTXD Hà Tiên",
  isReadOnly: false,
  canAccessModule: true,
  canAssignProjectLeaders: false,
  canGrantRole: false,
  canRevokeRole: false,
  canAssignStaffTasks: false,
  canAssign: false,
  isProjectLeader: false,
  canManageTeamMembers: false,
  canUrgeMembers: false,
  canManageAccounts: false,
  canManageOrganization: false,
  defaultTab: "project-team",
  scopeDescription: "Theo dõi nhân sự dự án, nộp tài liệu giai đoạn và xem duyệt hồ sơ trong tổ công tác.",
  allowedDuties: ["Xem nhân sự dự án", "Theo dõi dự án của tổ", "Nộp hồ sơ chuyên môn"],
  readingGuide: "Cán bộ, tổ trưởng và thành viên theo dõi phân công và duyệt tài liệu tại tab Nhân sự dự án.",
};

export interface PersonnelContext {
  projects?: Array<{
    id: string;
    mainExecutorId?: string;
    actingDirectorId?: string;
    mainSupervisorId?: string;
    teamMembers?: string[];
    cndaRevoked?: boolean;
  }>;
  staff?: Array<{ id: string; email?: string; name: string; title?: string }>;
  assignments?: Array<{ id: string; projectId: string; assigneeId?: string; coAssigneeIds?: string[] }>;
  teams?: Array<{ id: string; name: string; leaderId: string }>;
}

export function getPersonnelRolePermissions(
  user: AuthUser | null,
  context?: PersonnelContext,
): PersonnelRolePermissions {
  const baseProfile = resolveRoleProfile(user, ROLE_PROFILES, NO_ACCESS_PROFILE, "m5_personnel_assignment");
  const permissions = (user?.permissions ?? []) as string[];

  const hasView = permissions.includes("m5_personnel_assignment:view");
  const hasInput = permissions.includes("m5_personnel_assignment:input");
  const hasApprove = permissions.includes("m5_personnel_assignment:approve");
  const hasConfigure = permissions.includes("m5_personnel_assignment:configure");
  const hasPhaseAssign = permissions.includes("project.phase.assign");
  const hasReportExport = permissions.includes("project.report.export");

  // 1. Kiểm tra nếu người dùng có quyền quản trị/phân công lãnh đạo dự án
  const isDirector = user?.role === "ADMIN" || user?.role === "DEPUTY_DIRECTOR" || hasApprove || hasConfigure;

  // 2. Tìm cán bộ tương ứng trong danh sách nhân sự (khớp theo ID, Email hoặc Họ tên)
  let matchingStaffId: string | undefined;
  let matchingStaff: { id: string; email?: string; name: string; title?: string } | undefined;
  if (context?.staff && user) {
    const userDisplayName = (user.displayName || user.name || "").trim().toLowerCase();
    const userEmail = (user.email || "").trim().toLowerCase();

    matchingStaff = context.staff.find(
      (s) =>
        s.id === user.id ||
        (userEmail && s.email?.trim().toLowerCase() === userEmail) ||
        (userDisplayName && s.name.trim().toLowerCase() === userDisplayName)
    );
    matchingStaffId = matchingStaff?.id;
  }

  // 3. Tìm các dự án mà cán bộ này phụ trách chính hoặc được cấp role Quyền CNDA (chưa bị thu hồi)
  const cndaProjects = context?.projects && matchingStaffId
    ? context.projects.filter(
        (p) =>
          ((p.actingDirectorId === matchingStaffId || p.mainExecutorId === matchingStaffId) && !p.cndaRevoked),
      )
    : [];
  const actingProjectIds = cndaProjects.map((p) => p.id);

  // 4. Tìm các dự án cán bộ tham gia với tư cách thành viên / phối hợp (không bao gồm dự án đã là Lead)
  const memberProjects = context?.projects && matchingStaffId
    ? context.projects.filter((p) => {
        if (actingProjectIds.includes(p.id)) return false;
        if (p.mainSupervisorId === matchingStaffId) return true;
        if ((p.teamMembers || []).includes(matchingStaffId)) return true;
        if (context.assignments?.some((a) => a.projectId === p.id && (a.assigneeId === matchingStaffId || (a.coAssigneeIds || []).includes(matchingStaffId)))) return true;
        return false;
      })
    : [];
  const memberProjectIds = memberProjects.map((p) => p.id);

  // 5. Kiểm tra xem cán bộ có phải là Tổ trưởng / Lead tổ chuyên môn không
  const leadingTeam = (context?.teams || []).find(
    (t) => t.leaderId === matchingStaffId && t.id !== "BGD"
  );
  const isTeamLeader = Boolean(leadingTeam);

  // 6. Nếu là Ban Giám đốc / Có quyền approve/configure
  if (isDirector) {
    return {
      ...baseProfile,
      canAccessModule: true,
      canAssignProjectLeaders: true,
      canGrantRole: true,
      canRevokeRole: true,
      canManageAccounts: hasConfigure || user?.role === "ADMIN",
      canManageOrganization: true,
      canAssignStaffTasks: false,
      canAssign: false,
      isProjectLeader: false,
    };
  }

  // 7. Nếu người dùng có role trực tiếp là ACTING_DIRECTOR / PROJECT_LEADER hoặc có dự án được phân quyền CNDA và có quyền thao tác
  if (user?.role === "ACTING_DIRECTOR" || user?.role === "PROJECT_LEADER" || (actingProjectIds.length > 0 && (hasInput || hasPhaseAssign))) {
    return {
      ...baseProfile,
      ...ROLE_PROFILES.ACTING_DIRECTOR,
      roleCode: user?.role ?? "ACTING_DIRECTOR",
      userName: user?.displayName || user?.name || "Quyền Chủ nhiệm dự án",
      canExport: Boolean(user?.permissions?.includes("m5_personnel_assignment:export") || hasReportExport),
      canAccessModule: true,
      canAssignProjectLeaders: false,
      canAssignStaffTasks: true,
      canAssign: true,
      isProjectLeader: true,
      isTeamLeader,
      leadingTeamId: leadingTeam?.id as any,
      leadingTeamName: leadingTeam?.name,
      isMember: memberProjectIds.length > 0,
      actingProjectIds,
      memberProjectIds,
    };
  }

  // 8. Nếu cán bộ là Tổ trưởng chuyên môn (Lead tổ)
  if (isTeamLeader) {
    return {
      ...baseProfile,
      roleTitle: matchingStaff?.title || "Tổ trưởng chuyên môn",
      userName: user?.displayName || user?.name || "Tổ trưởng chuyên môn",
      canAccessModule: true,
      canExport: Boolean(user?.permissions?.includes("m5_personnel_assignment:export") || hasReportExport),
      isMember: true,
      isTeamLeader: true,
      leadingTeamId: leadingTeam?.id as any,
      leadingTeamName: leadingTeam?.name,
      canAssign: true,
      canAssignStaffTasks: true,
      canAssignProjectLeaders: false,
      canGrantRole: false,
      canRevokeRole: false,
      canUrgeMembers: true,
      canManageTeamMembers: true,
      canManageAccounts: false,
      canManageOrganization: false,
      isProjectLeader: false,
      memberProjectIds,
      defaultTab: "team-tasks",
      scopeDescription: `Tổ trưởng ${leadingTeam?.name}: Nhận giai đoạn từ Chủ nhiệm dự án, giao việc chi tiết cho cán bộ thành viên trong tổ và duyệt nghiệm thu kết quả.`,
      allowedDuties: [
        `Nhận giai đoạn và bước quy trình do Chủ nhiệm dự án giao cho ${leadingTeam?.name}`,
        "Phân công nhiệm vụ chi tiết cho cán bộ thành viên trong tổ",
        "Đôn đốc tiến độ và duyệt nghiệm thu hồ sơ do thành viên nộp",
      ],
      readingGuide: "Tổ trưởng theo dõi giai đoạn dự án, phân công chi tiết cho thành viên trong tổ và duyệt nghiệm thu kết quả.",
    };
  }

  // 9. Cán bộ / Thành viên tham gia tổ công tác dự án
  return {
    ...baseProfile,
    roleTitle: matchingStaff?.title || "Thành viên dự án",
    userName: user?.displayName || user?.name || "Thành viên dự án",
    canAccessModule: true,
    isMember: true,
    canAssign: false,
    canAssignStaffTasks: false,
    canAssignProjectLeaders: false,
    canGrantRole: false,
    canRevokeRole: false,
    canUrgeMembers: false,
    canManageTeamMembers: false,
    canManageAccounts: false,
    canManageOrganization: false,
    isProjectLeader: false,
    memberProjectIds,
    defaultTab: "assignments",
    scopeDescription: "Theo dõi nhiệm vụ được giao theo giai đoạn, phối hợp cùng tổ công tác và gửi xác nhận hoàn thành công việc kèm hồ sơ.",
    allowedDuties: [
      "Xem nhiệm vụ được phân công và giai đoạn thực hiện của bản thân",
      "Xem danh sách tổ công tác, Chủ nhiệm dự án (người thực hiện chính) và Tổ trưởng",
      "Đính kèm hồ sơ, tài liệu và xác nhận đã làm xong để Tổ trưởng / CNDA nghiệm thu",
    ],
    readingGuide: "Thành viên theo dõi các nhiệm vụ của mình theo từng giai đoạn dự án, cập nhật tiến độ và gửi xác nhận kèm hồ sơ tài liệu.",
  };
}
