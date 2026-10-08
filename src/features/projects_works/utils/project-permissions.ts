import type { AuthUser } from "@/types/auth";
import type { ProjectItem } from "../types/project.types";

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

  const permissions = user.permissions ?? [];
  const hasInput = permissions.includes("m2_projects:input");
  const hasApprove = permissions.includes("m2_projects:approve");

  // 1. Ban Giám đốc / Quyền phê duyệt
  if (hasApprove || isBoardOfDirectors(user)) {
    return {
      allowed: true,
      roleDescription: "Ban Giám đốc (Toàn quyền chỉ đạo & phê duyệt)",
    };
  }

  // 2. Quyền nhập liệu (m2_projects:input) hoặc Tổ Giám sát – Kỹ thuật
  if (hasInput || isTechnicalInspectionTeam(user)) {
    return {
      allowed: true,
      roleDescription: "Tổ Giám sát – Kỹ thuật (Chuyên trách hiện trường)",
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
      "Chỉ người phụ trách dự án, Tổ Giám sát – KT và Ban Giám đốc mới có quyền cập nhật tiến độ theo Quy tắc 4.2.4.",
    roleDescription: "Chỉ xem (Không có quyền cập nhật)",
  };
}

/**
 * Quy tắc phân quyền xóa hoặc đóng dự án:
 * Chỉ Ban Giám đốc hoặc người có quyền m2_projects:configure / m2_projects:approve mới có thẩm quyền xóa hoặc đóng dự án.
 */
export function canDeleteOrCloseProject(user: AuthUser | null): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: "Bạn cần đăng nhập để thao tác đóng hoặc xóa dự án.",
    };
  }

  const permissions = user.permissions ?? [];
  if (permissions.includes("m2_projects:configure") || permissions.includes("m2_projects:approve") || isBoardOfDirectors(user)) {
    return {
      allowed: true,
      roleDescription: "Ban Giám đốc có thẩm quyền quản lý vòng đời dự án.",
    };
  }

  return {
    allowed: false,
    reason: "Chỉ Ban Giám đốc hoặc cán bộ được cấp quyền quản trị mới có quyền đóng hoặc xóa dự án khỏi hệ thống.",
  };
}

export interface ProjectExportScopeResult {
  canExport: boolean;
  scope: "ALL" | "OWN_PROJECTS" | "NONE";
  reason?: string;
}

/**
 * Căn cứ: BRD BQL-BRD-2026-003, Mục 5 Ma trận phân quyền người dùng:
 * | Xuất báo cáo PDF/Excel | GĐ: ✓ | PGĐ: ✓ | Tổ KT: DA mình | KT trưởng: TC mình | KT viên: TC mình | Tổ BT: BT mình |
 * - GĐ & PGĐ: Toàn quyền xuất toàn bộ danh sách dự án (scope = ALL)
 * - Tổ KT: Chỉ xuất các dự án do mình phụ trách / giám sát kỹ thuật (scope = OWN_PROJECTS)
 * - Các vai trò khác (KT trưởng, KT viên, Tổ BT, Hành chính): Không có quyền xuất báo cáo danh mục dự án (scope = NONE)
 */
export function getProjectExportScope(user: AuthUser | null): ProjectExportScopeResult {
  if (!user) {
    return { canExport: false, scope: "NONE", reason: "Chưa đăng nhập" };
  }

  // 1. Ban Giám đốc (ADMIN / DEPUTY_DIRECTOR): Toàn quyền
  if (isBoardOfDirectors(user)) {
    return { canExport: true, scope: "ALL" };
  }

  // 2. Tổ Giám sát – Kỹ thuật (TECHNICAL_OFFICER): Chỉ xuất DA mình
  if (isTechnicalInspectionTeam(user) || user.role === "TECHNICAL_OFFICER") {
    return { canExport: true, scope: "OWN_PROJECTS" };
  }

  // 3. Các vai trò khác: Bị chặn xuất báo cáo dự án
  return {
    canExport: false,
    scope: "NONE",
    reason: "Theo Ma trận phân quyền BRD Mục 5, quyền xuất báo cáo dự án chỉ dành cho Ban Giám đốc và Cán bộ kỹ thuật phụ trách dự án (DA mình).",
  };
}

