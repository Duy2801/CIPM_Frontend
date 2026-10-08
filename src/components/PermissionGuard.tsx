"use client";

import type React from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
  canDo,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/access-control";
import type { ModuleAction } from "@/access-control";
import type { Permission } from "@/types/auth";

type PermissionGuardMode = "one" | "any" | "all";

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: PermissionGuardMode;
  permission?: Permission;
  permissions?: Permission[];
  /** Phân hệ kiểm tra, ví dụ: "m7_bidding", "m4_finance_settlement" */
  module?: string;
  /** Hành vi kiểm tra, ví dụ: "approve", "input", "export", "configure" */
  action?: ModuleAction;
}

const EMPTY_PERMISSIONS: Permission[] = [];

export function PermissionGuard({
  children,
  fallback = null,
  mode = "one",
  permission,
  permissions = permission ? [permission] : [],
  module,
  action,
}: PermissionGuardProps) {
  const user = useAuthStore((state) => state.user);
  const userPermissions = user?.permissions ?? EMPTY_PERMISSIONS;

  // Nếu truyền cặp module + action, kiểm tra canDo trực tiếp
  if (module && action) {
    return canDo(userPermissions, module, action) ? <>{children}</> : <>{fallback}</>;
  }

  const allowed =
    mode === "all"
      ? hasAllPermissions(userPermissions, permissions)
      : mode === "any"
        ? hasAnyPermission(userPermissions, permissions)
        : Boolean(permission && hasPermission(userPermissions, permission));

  return allowed ? <>{children}</> : <>{fallback}</>;
}
