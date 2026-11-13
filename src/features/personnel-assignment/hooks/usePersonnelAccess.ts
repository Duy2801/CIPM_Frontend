"use client";

import { useMemo } from "react";
import { getStoredUser, useAuth } from "@/shared/auth";
import type { AuthUser } from "@/types/auth";
import { getPersonnelPermissions } from "../utils/personnel-permissions";
import { resolveStaffBasePermissions } from "../utils/personnel-rbac";
import { isStaffTitleLocked, useLockedTitles } from "./useLockedTitles";
import { useStaff, useStaffList, useTeams } from "@/shared/personnel-assignment/hooks/usePersonnelQueries";

/** Quyền của người đang đăng nhập trong phân hệ Nhân sự (theo ma trận phân quyền) */
export function usePersonnelPermissions() {
  const { user } = useAuth();
  const currentUser: AuthUser | null = user ?? getStoredUser();
  const permissions = useMemo(() => getPersonnelPermissions(currentUser), [currentUser]);
  // Chờ danh bạ tải xong lần đầu rồi mới hiện màn hình
  const isLoading = useStaffList().isLoading;
  return { permissions, isLoading, currentUser };
}

export function useStaffAccess() {
  const { permissions } = usePersonnelPermissions();
  return {
    canManageAccounts: permissions.canManageAccounts,
    canManageTeams: permissions.canManageOrganization,
    canManageRole: permissions.canGrantRole,
    canConfigurePermissions: permissions.canConfigurePermissions,
    canViewAuditLogs: permissions.canViewAuditLogs,
  };
}

/**
 * Hồ sơ cán bộ kèm phòng ban, chức danh có đang tắt không và quyền mặc định theo chức danh & tổ.
 * Trả về null khi chưa tải xong.
 */
export function useStaffDetail(staffId: string) {
  const { data: staff } = useStaff(staffId);
  const { data: teams } = useTeams();
  const lockedTitles = useLockedTitles();

  return useMemo(() => {
    if (!staff) return null;
    const team = teams?.find((t) => t.id === staff.teamId);
    // Chức danh đang tắt → tài khoản tạm không có quyền (cán bộ vẫn giữ chức danh; bật lại thì có lại quyền)
    const titleLocked = isStaffTitleLocked(staff.title, lockedTitles);
    const basePermissions = resolveStaffBasePermissions(staff, team, titleLocked);
    return { staff, team, titleLocked, basePermissions };
  }, [staff, teams, lockedTitles]);
}
