import type { AuthUser } from "@/types/auth";
import { getUserEffectivePermissions } from "@/access-control";

/** Quyền của người đăng nhập trong phân hệ Nhân sự (lấy từ ma trận phân quyền) */
export interface PersonnelPermissions {
  canAccessModule: boolean;
  canManageAccounts: boolean;
  canManageOrganization: boolean;
  canGrantRole: boolean;
  canConfigurePermissions: boolean;
  canViewAuditLogs: boolean;
}

export function getPersonnelPermissions(user: AuthUser | null): PersonnelPermissions {
  const permissions = (getUserEffectivePermissions(user) ?? []) as string[];
  const has = (code: string) => permissions.includes(code);
  return {
    canAccessModule: has("staff:view_organization"),
    canManageAccounts: has("staff:manage_users"),
    canManageOrganization: has("staff:manage_organization"),
    canGrantRole: has("staff:manage_cnda_permission"),
    canConfigurePermissions: has("system:configure_permissions"),
    canViewAuditLogs: has("system:view_audit_logs"),
  };
}
