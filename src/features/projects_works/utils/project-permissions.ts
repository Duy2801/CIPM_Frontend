import type { AuthUser } from "@/types/auth";
import type { ProjectItem } from "../types/project.types";
import { canDo, getUserEffectivePermissions } from "@/access-control";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  roleDescription?: string;
}

export function isTechnicalInspectionTeam(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "TECHNICAL_OFFICER" ||
    user.role === "ACTING_DIRECTOR" ||
    Boolean(user.department?.toLowerCase().includes("giám sát")) ||
    Boolean(user.department?.toLowerCase().includes("kỹ thuật"))
  );
}

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

export function canUpdateProjectProgress(
  user: AuthUser | null,
  project: ProjectItem | null
): PermissionCheckResult {
  if (!project) {
    return { allowed: false, reason: "Dự án không tồn tại." };
  }

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
  const hasInput = canDo(permissions, "m2_projects", "input") || (permissions as string[]).includes("m2_projects:progress");
  const hasApprove = canDo(permissions, "m2_projects", "approve");

  if (hasApprove) {
    return {
      allowed: true,
      roleDescription: "Quyền phê duyệt / Chỉ đạo dự án",
    };
  }

  if (hasInput) {
    return {
      allowed: true,
      roleDescription: "Quyền cập nhật tiến độ dự án",
    };
  }

  if (isProjectPersonInCharge(user, project)) {
    return {
      allowed: true,
      roleDescription: `Người phụ trách / Giám sát (${project.managerName})`,
    };
  }

  return {
    allowed: false,
    reason:
      "Chỉ người phụ trách dự án hoặc chức danh được cấp quyền cập nhật tiến độ trong Ma trận phân quyền mới có thể thực hiện.",
    roleDescription: "Chỉ xem (Không có quyền cập nhật)",
  };
}

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

