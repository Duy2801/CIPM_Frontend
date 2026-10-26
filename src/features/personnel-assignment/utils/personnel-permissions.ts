import type { AuthUser } from "@/types/auth";
import { getUserEffectivePermissions } from "@/access-control";

/** Quyền của người đăng nhập trong phân hệ Nhân sự (lấy từ ma trận phân quyền) */
export interface PersonnelPermissions {
  /** Được vào phân hệ Nhân sự */
  canAccessModule: boolean;
  /** Thêm tài khoản, sửa hồ sơ, khóa / mở tài khoản, ma trận phân quyền */
  canManageAccounts: boolean;
  /** Quản lý cơ cấu tổ chức (đổi tên phòng ban) */
  canManageOrganization: boolean;
  /** Cấp / thu hồi quyền theo chức danh của cán bộ */
  canGrantRole: boolean;
}

export function getPersonnelPermissions(user: AuthUser | null): PersonnelPermissions {
  const permissions = (getUserEffectivePermissions(user) ?? []) as string[];
  const has = (...codes: string[]) => codes.some((code) => permissions.includes(code));

  const canManageAccounts = has("m5.manage_accounts", "m5_personnel_assignment:accounts");
  const canAssignProjectLeaders = has("m5.assign_project_leaders", "m5_personnel_assignment:configure");
  return {
    canAccessModule: has("m5_personnel_assignment:view", "m5.view"),
    canManageAccounts,
    canManageOrganization: canAssignProjectLeaders || canManageAccounts,
    canGrantRole: has("m5.grant_cnda", "m5_personnel_assignment:grant_cnda"),
  };
}
