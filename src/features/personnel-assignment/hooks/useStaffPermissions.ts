"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MATRIX_PERMISSIONS } from "../constants/role-matrix-data";
import { hasBackendSession } from "../services/backend";
import * as personnelApi from "../services/personnel.api";
import { toApiPermissionCode } from "../services/personnel.mapper";
import { getAllRbacPermissions, getStaffEffectivePermissions, type RbacPermissionItem } from "../utils/personnel-rbac";
import { useStaffDetail } from "./usePersonnelAccess";
import { personnelKeys } from "./usePersonnelQueries";
import { useRoleMatrix } from "./useRoleMatrix";

/** Danh mục quyền backend, tên lấy theo ma trận phân quyền */
const BACKEND_PERMISSION_CATALOG: RbacPermissionItem[] = MATRIX_PERMISSIONS.map((p) => ({
  code: toApiPermissionCode(p.code),
  name: p.name,
  description: p.description,
  module: p.moduleName,
}));

export interface StaffPermissionData {
  staffName: string;
  /** Toàn bộ quyền chọn được */
  catalog: RbacPermissionItem[];
  /** Quyền mặc định theo chức danh */
  basePermissions: RbacPermissionItem[];
  /** Quyền thực tế của cán bộ */
  effective: RbacPermissionItem[];
}

/**
 * Quyền của một cán bộ. Đăng nhập tài khoản thật: quyền thực tế từ GET /user/:id/permissions,
 * quyền theo chức danh từ GET /role; bản mock: danh mục quyền nghiệp vụ theo chức danh & tổ.
 */
export function useStaffPermissions(staffId: string): StaffPermissionData | null {
  const detail = useStaffDetail(staffId);
  const { permissionsMap } = useRoleMatrix();
  const isBackend = hasBackendSession();
  const { data: backendCodes } = useQuery({
    queryKey: [...personnelKeys.staff(staffId), "permissions"],
    queryFn: () => personnelApi.getStaffPermissionCodes(staffId),
    enabled: isBackend,
  });

  return useMemo(() => {
    if (!detail) return null;
    const { staff } = detail;
    if (!isBackend) {
      return {
        staffName: staff.name,
        catalog: getAllRbacPermissions(),
        basePermissions: detail.basePermissions,
        effective: getStaffEffectivePermissions(staff, detail.basePermissions),
      };
    }
    if (!backendCodes) return null;
    const roleIds = new Set(permissionsMap[staff.roleCode] ?? []);
    const baseCodes = new Set(MATRIX_PERMISSIONS.filter((p) => roleIds.has(p.id)).map((p) => toApiPermissionCode(p.code)));
    const granted = new Set(backendCodes);
    return {
      staffName: staff.name,
      catalog: BACKEND_PERMISSION_CATALOG,
      basePermissions: BACKEND_PERMISSION_CATALOG.filter((p) => baseCodes.has(p.code)),
      effective: BACKEND_PERMISSION_CATALOG.filter((p) => granted.has(p.code)),
    };
  }, [detail, isBackend, backendCodes, permissionsMap]);
}
