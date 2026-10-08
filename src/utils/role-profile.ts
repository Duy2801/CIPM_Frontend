import type { AuthUser, Role } from "@/types/auth";
import { canDo } from "../access-control.ts";

export interface ResolvedRoleFields {
  roleCode: string;
  userName: string;
  /** Có quyền xem phân hệ (`<module>:view`) */
  canView: boolean;
  /** Có quyền nhập/sửa dữ liệu (`<module>:input`) */
  canInput: boolean;
  /** Có quyền phê duyệt (`<module>:approve`) */
  canApprove: boolean;
  /** Có quyền quản trị/cấu hình/xóa (`<module>:configure`) */
  canConfigure: boolean;
  /** Có quyền xuất báo cáo (`<module>:export`) */
  canExport: boolean;
}

/**
 * Tra cứu thông tin hồ sơ vai trò (Role Profile) kết hợp với Quyền hạn động (Permissions).
 * - Các thuộc tính trình bày (tiêu đề vai trò, phòng ban, hướng dẫn nghiệp vụ) lấy theo Role.
 * - Các cờ phân quyền hành vi (canView, canInput, canApprove, canConfigure, canExport)
 *   được tính ĐỘNG hoàn toàn dựa trên mảng `user.permissions`.
 */
export function resolveRoleProfile<TProfile extends object>(
  user: AuthUser | null,
  profiles: Partial<Record<string, TProfile>>,
  fallback: TProfile,
  moduleKey: string,
): TProfile & ResolvedRoleFields {
  const role = user?.role as Role | undefined;
  const profile = (role && profiles[role]) || fallback;
  const permissions = user?.permissions ?? [];
  const hasGranular = permissions.length > 0;
  const p = profile as Record<string, unknown>;

  const defaultCanView = p.canAccessModule !== false;
  const defaultCanInput = Boolean(p.canEdit ?? p.canManageIncidents ?? false);
  const defaultCanApprove = Boolean(p.canApprove ?? false);
  const defaultCanConfigure = Boolean(p.canManageBond ?? false);
  const defaultCanExport = (p.exportScope ?? "NONE") !== "NONE";

  return {
    ...profile,
    roleCode: role ?? "GUEST",
    userName: user?.displayName || user?.name || "Khách truy cập",
    canView: hasGranular ? canDo(permissions, moduleKey, "view") : defaultCanView,
    canInput: hasGranular ? canDo(permissions, moduleKey, "input") : defaultCanInput,
    canApprove: hasGranular ? canDo(permissions, moduleKey, "approve") : defaultCanApprove,
    canConfigure: hasGranular ? canDo(permissions, moduleKey, "configure") : defaultCanConfigure,
    canExport: hasGranular ? canDo(permissions, moduleKey, "export") : defaultCanExport,
  };
}
