import type { Permission } from "@/types/auth";

export interface RoutePermission {
  route: string;
  permission: Permission;
  label: string;
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { route: "/dashboard", permission: "dashboard:view", label: "Bang dieu khien" },
  { route: "/projects_works", permission: "m2_projects:view", label: "M2 - Du an & Cong trinh" },
  {
    route: "/construction-procedures",
    permission: "m3_construction_procedures:view",
    label: "M3 - Quy trinh du an",
  },
  {
    route: "/finance-settlement",
    permission: "m4_finance_settlement:view",
    label: "M4 - Tai chinh & Quyet toan",
  },
  {
    route: "/personnel-assignment",
    permission: "m5_personnel_assignment:view",
    label: "Nhan su & Phan cong",
  },
  {
    route: "/site-clearance-resettlement",
    permission: "m6_site_clearance:view",
    label: "M6 - GPMB, Boi thuong TDC",
  },
  { route: "/bidding-management", permission: "m7_bidding:view", label: "M7 - Quan ly Dau thau" },
  { route: "/warranty-maintenance", permission: "m8_warranty:view", label: "M8 - Bao hanh & Bao tri" },
  { route: "/legal-ai-library", permission: "legal_library:view", label: "Thu vien Phap ly + AI" },
];

export const ROUTE_KEYS = ROUTE_PERMISSIONS.map((permission) => permission.route);

export const DEFAULT_AUTHORIZED_ROUTE = "/dashboard";

export function hasPermission(
  permissions: Permission[],
  permission: Permission,
): boolean {
  return permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: Permission[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.some((permission) =>
    permissions.includes(permission),
  );
}

export function hasAllPermissions(
  permissions: Permission[],
  requiredPermissions: Permission[],
): boolean {
  return requiredPermissions.every((permission) =>
    permissions.includes(permission),
  );
}

export function getRoutePermission(pathname: string): RoutePermission | undefined {
  return ROUTE_PERMISSIONS.find((permission) =>
    pathname === permission.route || pathname.startsWith(`${permission.route}/`),
  );
}

export function canAccessPath(
  permissions: Permission[],
  pathname: string,
): boolean {
  if (pathname === "/") return true;

  const routePermission = getRoutePermission(pathname);
  if (!routePermission) return true;

  return hasPermission(permissions, routePermission.permission);
}

export function getFirstAllowedRoute(permissions: Permission[]): string {
  const permission = ROUTE_PERMISSIONS.find((routePermission) =>
    hasPermission(permissions, routePermission.permission),
  );

  return permission?.route ?? DEFAULT_AUTHORIZED_ROUTE;
}

/** Các hành vi của hệ thống: xem, nhập/sửa, duyệt, cấu hình/quản trị, xuất báo cáo, tài khoản */
export type ModuleAction = "view" | "input" | "approve" | "configure" | "export" | "accounts" | (string & {});

/**
 * Kiểm tra xem người dùng có quyền thực hiện hành vi cụ thể trên phân hệ hay không.
 * Ví dụ: canDo(permissions, "m7_bidding", "approve") -> true/false
 */
export function canDo(
  permissions: Permission[] = [],
  moduleKey: string,
  action: ModuleAction,
): boolean {
  return permissions.includes(`${moduleKey}:${action}` as Permission);
}

export const STORAGE_KEY_PERMISSIONS = "cipm_role_permissions_matrix_v2";
/** Mã các chức danh đang tắt trong ma trận phân quyền: người giữ chức danh này tạm thời không có quyền nào */
export const STORAGE_KEY_LOCKED_ROLES = "cipm_locked_roles_v1";

/** Mã các chức danh đã xóa (kể cả chức danh mặc định của hệ thống) */
export const STORAGE_KEY_DELETED_ROLES = "cipm_deleted_roles_v1";

function readCodeList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string") : [];
  } catch {
    return [];
  }
}

export function getDeletedRoleCodes(): string[] {
  return readCodeList(STORAGE_KEY_DELETED_ROLES);
}

export function getLockedRoleCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY_LOCKED_ROLES) || "[]");
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string") : [];
  } catch {
    return [];
  }
}

import type { AuthUser } from "@/types/auth";
import {
  DEFAULT_ROLE_PERMISSIONS_MAP,
  MATRIX_PERMISSIONS,
} from "@/features/personnel-assignment/constants/role-matrix-data";

/**
 * Chuyển đổi danh sách ID quyền trong ma trận (ví dụ "m6.input_survey", "m4.create_disbursement", "m5.manage_accounts")
 * sang mã quyền chuẩn Permission và lưu giữ cả ID ma trận để đối chiếu chính xác từng checkbox.
 */
export function convertMatrixPermIdsToPermissionCodes(permIds: string[]): Permission[] {
  const result = new Set<Permission>();
  permIds.forEach((id) => {
    // Luôn đưa chính ID ma trận vào permission set (ví dụ "m5.manage_accounts", "m2.create_edit")
    result.add(id as Permission);

    if (id.includes(":")) {
      result.add(id as Permission);
    }
    const match = MATRIX_PERMISSIONS.find((p) => p.id === id);
    if (match && match.code) {
      result.add(match.code as Permission);
    }
  });
  return Array.from(result);
}

/**
 * Lấy danh sách quyền hiệu lực (Effective Permissions) của một RoleCode từ Ma trận phân quyền.
 * Ma trận phân quyền (trong localStorage hoặc mặc định hệ thống) là nguồn chân lý duy nhất (Single Source of Truth).
 */
export function getRoleEffectivePermissions(roleCode?: string): Permission[] {
  if (!roleCode) return [];

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        const matrixMap = JSON.parse(stored);
        if (
          matrixMap &&
          Object.prototype.hasOwnProperty.call(matrixMap, roleCode) &&
          Array.isArray(matrixMap[roleCode])
        ) {
          return convertMatrixPermIdsToPermissionCodes(matrixMap[roleCode]);
        }
      }
    } catch (e) {
      console.error("Lỗi đọc ma trận phân quyền từ localStorage:", e);
    }
  }

  // Fallback to DEFAULT_ROLE_PERMISSIONS_MAP
  const defaultIds = DEFAULT_ROLE_PERMISSIONS_MAP[roleCode];
  if (defaultIds && Array.isArray(defaultIds)) {
    return convertMatrixPermIdsToPermissionCodes(defaultIds);
  }

  return [];
}

/**
 * Quyền backend ("projects:view") → quyền màn hình: giữ mã gốc, thêm mã ma trận ("m2.view") và mã phân hệ ("m2_projects:view").
 */
export function expandBackendPermissions(codes: string[]): Permission[] {
  const granted = new Set(codes);
  const matrixIds = MATRIX_PERMISSIONS.filter((p) => granted.has(p.code.replace(/^m\d+_/, ""))).map((p) => p.id);
  return Array.from(new Set<Permission>([...(codes as Permission[]), ...convertMatrixPermIdsToPermissionCodes(matrixIds)]));
}

/**
 * Lấy danh sách quyền hiệu lực của người dùng hiện tại dựa trên Ma trận phân quyền.
 * Tài khoản đăng nhập qua backend dùng quyền backend trả về lúc đăng nhập.
 */
export function getUserEffectivePermissions(user: AuthUser | null): Permission[] {
  if (!user) return [];
  if (user.authSource === "backend") return expandBackendPermissions(user.permissions ?? []);
  const roleId = (user as any).roleId;
  // Chức danh của tài khoản đang tắt → không có quyền nào cho tới khi bật lại
  if (roleId && (getLockedRoleCodes().includes(roleId) || getDeletedRoleCodes().includes(roleId))) return [];
  if (roleId) {
    const roleIdPerms = getRoleEffectivePermissions(roleId);
    if (roleIdPerms && roleIdPerms.length > 0) return roleIdPerms;
  }
  const roleCode = user.role || (user as any).roleCode;
  if (roleCode) {
    return getRoleEffectivePermissions(roleCode);
  }
  return user.permissions ?? [];
}

/**
 * Kiểm tra xem người dùng có quyền cụ thể hay không (dựa trên Ma trận phân quyền).
 */
export function hasEffectivePermission(
  user: AuthUser | null,
  permission: Permission,
): boolean {
  const effective = getUserEffectivePermissions(user);
  return effective.includes(permission);
}

/**
 * Kiểm tra xem người dùng có quyền thực hiện hành vi cụ thể trên phân hệ hay không
 * dựa trên Ma trận phân quyền đã cấu hình.
 * Ví dụ: canUserDo(user, "m6_site_clearance", "input") -> true/false
 */
export function canUserDo(
  user: AuthUser | null,
  moduleKey: string,
  action: ModuleAction,
): boolean {
  if (!user) return false;
  const permissions = getUserEffectivePermissions(user);
  return canDo(permissions, moduleKey, action);
}

/**
 * Kiểm tra xem người dùng có được cấp quyền ma trận cụ thể theo ID (ví dụ: "m5.manage_accounts") hay không.
 */
export function hasMatrixPermission(
  user: AuthUser | null,
  matrixPermId: string,
): boolean {
  if (!user) return false;
  const permissions = getUserEffectivePermissions(user);
  return permissions.includes(matrixPermId as Permission);
}

