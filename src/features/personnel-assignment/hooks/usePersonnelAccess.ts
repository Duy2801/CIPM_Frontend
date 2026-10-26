"use client";

import { useMemo } from "react";
import { getStoredUser, useAuth } from "@/features/auth";
import type { AuthUser } from "@/types/auth";
import { getPersonnelPermissions } from "../utils/personnel-permissions";
import { resolveStaffBasePermissions } from "../utils/personnel-rbac";
import { isStaffTitleLocked, useLockedTitles } from "./useLockedTitles";
import { useStaff, useStaffList, useTeams } from "./usePersonnelQueries";

/** Quyền của người đang đăng nhập trong phân hệ Nhân sự (theo ma trận phân quyền) */
export function usePersonnelPermissions() {
  const { user } = useAuth();
  const currentUser: AuthUser | null = user ?? getStoredUser();
  const permissions = useMemo(() => getPersonnelPermissions(currentUser), [currentUser]);
  // Chờ danh bạ tải xong lần đầu rồi mới hiện màn hình
  const isLoading = useStaffList().isLoading;
  return { permissions, isLoading, currentUser };
}

/** Những việc người đang đăng nhập được làm với hồ sơ / tài khoản cán bộ */
export function useStaffAccess() {
  const { permissions } = usePersonnelPermissions();
  const canManageAccounts = permissions.canManageAccounts;
  return {
    /** Thêm tài khoản, sửa hồ sơ, khóa / mở tài khoản, ma trận phân quyền */
    canManageAccounts,
    /** Đổi tên phòng ban */
    canManageTeams: canManageAccounts || permissions.canManageOrganization,
    /** Đổi chức danh, chỉnh quyền riêng */
    canManageRole: canManageAccounts && (permissions.canGrantRole ?? true),
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
