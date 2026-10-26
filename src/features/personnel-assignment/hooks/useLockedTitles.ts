"use client";

import { useMemo } from "react";
import { SYSTEM_MATRIX_ROLES } from "../constants/role-matrix-data";
import { getLockedTitles } from "../utils/assignable-roles";
import { applyRoleNameOverrides } from "../services/role-matrix.storage";
import { useRoleMatrix } from "./useRoleMatrix";

/** Tên (viết thường) các chức danh đang tắt hoặc đã xóa; tự cập nhật khi thay đổi ở màn phân quyền */
export function useLockedTitles(): Set<string> {
  const { roles, lockedRoleCodes, deletedRoleCodes } = useRoleMatrix();
  return useMemo(() => {
    // Chức danh mặc định đã xóa không còn trong `roles` nên lấy lại tên từ danh mục gốc
    const deletedSystemRoles = applyRoleNameOverrides(
      SYSTEM_MATRIX_ROLES.filter((r) => deletedRoleCodes.includes(r.code))
    );
    return getLockedTitles([...roles, ...deletedSystemRoles], [...lockedRoleCodes, ...deletedRoleCodes]);
  }, [roles, lockedRoleCodes, deletedRoleCodes]);
}

/** Chức danh của cán bộ đang tắt → tài khoản tạm không có quyền (cán bộ vẫn giữ chức danh) */
export function isStaffTitleLocked(title: string | undefined, lockedTitles: Set<string>): boolean {
  const parts = (title || "")
    .split(/\s*·\s*|\s*;\s*/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 && parts.every((p) => lockedTitles.has(p));
}
