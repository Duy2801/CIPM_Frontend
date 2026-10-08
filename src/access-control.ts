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
    label: "M3 - Ho so thu tuc XDCB",
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

/** 5 hành vi chuẩn của hệ thống: xem, nhập/sửa, duyệt, cấu hình/quản trị, xuất báo cáo */
export type ModuleAction = "view" | "input" | "approve" | "configure" | "export";

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

