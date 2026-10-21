"use client";

import { useMemo } from "react";
import { getLockedTitles } from "../utils/assignable-roles";
import { useRoleMatrix } from "./useRoleMatrix";

/** Tên (viết thường) các chức danh đang tắt; tự cập nhật khi bật / tắt ở màn phân quyền */
export function useLockedTitles(): Set<string> {
  const { roles, lockedRoleCodes } = useRoleMatrix();
  return useMemo(() => getLockedTitles(roles, lockedRoleCodes), [roles, lockedRoleCodes]);
}

/** Chức danh của cán bộ đang tắt → coi như cán bộ tạm thời không có chức danh */
export function isStaffTitleLocked(title: string | undefined, lockedTitles: Set<string>): boolean {
  const parts = (title || "")
    .split(/\s*·\s*|\s*;\s*/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 && parts.every((p) => lockedTitles.has(p));
}
