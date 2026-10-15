import type { AuthUser, Role } from "@/types/auth";
import { canDo, getUserEffectivePermissions } from "../access-control.ts";

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
 * Tra cứu thông tin hồ sơ vai trò (Role Profile) kết hợp với Quyền hạn động từ Ma trận phân quyền.
 * - Các thuộc tính trình bày (tiêu đề vai trò, phòng ban, hướng dẫn nghiệp vụ) lấy theo Role.
 * - Các cờ phân quyền hành vi (canView, canInput, canApprove, canConfigure, canExport)
 *   được tính ĐỘNG hoàn toàn dựa trên Ma trận phân quyền (Matrix).
 */
export function resolveRoleProfile<TProfile extends object>(
  user: AuthUser | null,
  profiles: Partial<Record<string, TProfile>>,
  fallback: TProfile,
  moduleKey: string,
): TProfile & ResolvedRoleFields {
  const role = user?.role as Role | undefined;
  const profile = (role && profiles[role]) || fallback;
  const permissions = getUserEffectivePermissions(user);

  return {
    ...profile,
    roleCode: role ?? "GUEST",
    userName: user?.displayName || user?.name || "Khách truy cập",
    canView: canDo(permissions, moduleKey, "view"),
    canInput: canDo(permissions, moduleKey, "input"),
    canApprove: canDo(permissions, moduleKey, "approve"),
    canConfigure: canDo(permissions, moduleKey, "configure"),
    canExport: canDo(permissions, moduleKey, "export"),
  };
}
