import type { AuthUser } from "@/types/auth";
import type { ProjectItem } from "../types/project.types";
import { canDo, getUserEffectivePermissions } from "@/access-control";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  roleDescription?: string;
}

/**
 * Kiểm tra xem người dùng hiện tại có thuộc Ban Giám đốc hay không.
 */
export function isBoardOfDirectors(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "ADMIN" ||
    user.role === "DEPUTY_DIRECTOR" ||
    user.department === "Ban Giám đốc"
  );
}

/**
 * Kiểm tra xem người dùng có thuộc Tổ Giám sát – Kỹ thuật hay không.
 */
export function isTechnicalInspectionTeam(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "TECHNICAL_OFFICER" ||
    user.role === "ACTING_DIRECTOR" ||
    Boolean(user.department?.toLowerCase().includes("giám sát")) ||
    Boolean(user.department?.toLowerCase().includes("kỹ thuật"))
  );
}

/**
 * Kiểm tra xem người dùng có phải là người phụ trách hoặc giám sát của dự án cụ thể này không.
 */
export function isProjectPersonInCharge(
  user: AuthUser | null,
  project: ProjectItem
): boolean {
  if (!user) return false;
  const userDisplayName = (user.displayName || user.name || "").trim().toLowerCase();
  const userName = (user.name || "").trim().toLowerCase();

  const manager = project.managerName.trim().toLowerCase();
  const supervisor = project.supervisorName.trim().toLowerCase();

  return (
    userDisplayName === manager ||
    userName === manager ||
    userDisplayName === supervisor ||
    userName === supervisor
  );
}

/**
 * Quy tắc 4: Chỉ người phụ trách dự án, Tổ Giám sát – KT, và Ban Giám đốc được cập nhật tiến độ.
 */
export function canUpdateProjectProgress(
  user: AuthUser | null,
  project: ProjectItem | null
): PermissionCheckResult {
  if (!project) {
    return { allowed: false, reason: "Dự án không tồn tại." };
  }

  // Nếu dự án đã đóng, không cho phép cập nhật tiến độ
  if (project.status === "closed") {
    return {
      allowed: false,
      reason: "Dự án đã đóng. Vui lòng mở lại trạng thái hoạt động nếu cần tiếp tục cập nhật.",
      roleDescription: "Dự án đã đóng",
    };
  }

  if (!user) {
    return {
      allowed: false,
      reason: "Bạn cần đăng nhập để thực hiện cập nhật tiến độ dự án.",
    };
  }

  const permissions = getUserEffectivePermissions(user);
  const hasInput = canDo(permissions, "m2_projects", "input") || permissions.includes("m2_projects:progress" as any);
  const hasApprove = canDo(permissions, "m2_projects", "approve");

  // 1. Quyền phê duyệt / Ban Giám đốc được cấp quyền
  if (hasApprove) {
    return {
      allowed: true,
      roleDescription: "Quyền phê duyệt / Chỉ đạo dự án",
    };
  }

  // 2. Quyền nhập liệu (m2_projects:input)
  if (hasInput) {
    return {
      allowed: true,
      roleDescription: "Quyền cập nhật tiến độ dự án",
    };
  }

  // 3. Người phụ trách dự án cụ thể
  if (isProjectPersonInCharge(user, project)) {
    return {
      allowed: true,
      roleDescription: `Người phụ trách / Giám sát (${project.managerName})`,
    };
  }

  return {
    allowed: false,
    reason:
      "Chỉ người phụ trách dự án hoặc vai trò được cấp quyền cập nhật tiến độ trong Ma trận phân quyền mới có thể thực hiện.",
    roleDescription: "Chỉ xem (Không có quyền cập nhật)",
  };
}

/**
 * Quy tắc phân quyền xóa hoặc đóng dự án:
 * Dựa vào quyền m2_projects:configure / m2_projects:approve trong Ma trận phân quyền.
 */
export function canDeleteOrCloseProject(user: AuthUser | null): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: "Bạn cần đăng nhập để thao tác đóng hoặc xóa dự án.",
    };
  }

  const permissions = getUserEffectivePermissions(user);
  if (canDo(permissions, "m2_projects", "configure") || canDo(permissions, "m2_projects", "approve")) {
    return {
      allowed: true,
      roleDescription: "Có quyền đóng hoặc quản lý vòng đời dự án.",
    };
  }

  return {
    allowed: false,
    reason: "Bạn không có quyền đóng hoặc xóa dự án trong Ma trận phân quyền.",
  };
}

export interface ProjectExportScopeResult {
  canExport: boolean;
  scope: "ALL" | "OWN_PROJECTS" | "NONE";
  reason?: string;
}

/**
 * Quyền xuất báo cáo danh mục dự án theo Ma trận phân quyền
 */
export function getProjectExportScope(user: AuthUser | null): ProjectExportScopeResult {
  if (!user) {
    return { canExport: false, scope: "NONE", reason: "Chưa đăng nhập" };
  }

  const permissions = getUserEffectivePermissions(user);
  if (canDo(permissions, "m2_projects", "export")) {
    return { canExport: true, scope: "ALL" };
  }

  // Người phụ trách dự án cụ thể có thể xuất dự án mình
  if (isTechnicalInspectionTeam(user) || user.role === "TECHNICAL_OFFICER") {
    return { canExport: true, scope: "OWN_PROJECTS" };
  }

  return {
    canExport: false,
    scope: "NONE",
    reason: "Vai trò của bạn chưa được cấp quyền xuất báo cáo dự án trong Ma trận phân quyền.",
  };
}

