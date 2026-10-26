"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { MATRIX_MODULES, MATRIX_PERMISSIONS, type MatrixRole } from "../constants/role-matrix-data";
import {
  deduplicateRoles,
  loadActiveRoles,
  loadDeletedRoleCodes,
  loadLockedRoleCodes,
  loadRolePermissions,
  notifyRolesUpdated,
  saveLockedRoleCodes,
  subscribeRoleMatrixChanges,
  syncCurrentUserPermissions,
  writeRoleNameOverride,
  writeRolePermissions,
  writeRoles,
} from "../services/role-matrix.storage";

interface RoleMatrixState {
  roles: MatrixRole[];
  /** Mã chức danh → danh sách mã quyền */
  permissionsMap: Record<string, string[]>;
  /** Chức danh đang tắt */
  lockedRoleCodes: string[];
  /** Chức danh mặc định đã xóa */
  deletedRoleCodes: string[];
}

export const roleMatrixKey = ["role-matrix"] as const;

const loadRoleMatrix = (): RoleMatrixState => ({
  roles: loadActiveRoles(),
  permissionsMap: loadRolePermissions(),
  lockedRoleCodes: loadLockedRoleCodes(),
  deletedRoleCodes: loadDeletedRoleCodes(),
});

const isDirector = (roleCode: string) => roleCode === "role_admin" || roleCode === "ADMIN";

/** Ma trận phân quyền đang lưu; mọi component dùng chung một bản, lưu ở đâu thì nơi khác tự cập nhật */
export function useRoleMatrix() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: roleMatrixKey,
    queryFn: loadRoleMatrix,
    initialData: loadRoleMatrix,
    staleTime: Infinity,
  });

  // Ma trận đổi ở tab khác (hoặc nơi khác ghi thẳng vào bộ nhớ) → đọc lại
  useEffect(() => {
    const reload = () => queryClient.invalidateQueries({ queryKey: roleMatrixKey });
    return subscribeRoleMatrixChanges(reload, reload);
  }, [queryClient]);

  // Chức danh có quyền permId không (Giám đốc chưa thiết lập riêng thì có mọi quyền)
  const hasPermission = useCallback(
    (roleCode: string, permId: string): boolean => {
      const currentPerms = data.permissionsMap[roleCode];
      if (currentPerms !== undefined) return currentPerms.includes(permId);
      return isDirector(roleCode);
    },
    [data.permissionsMap],
  );

  return { ...data, modules: MATRIX_MODULES, permissions: MATRIX_PERMISSIONS, hasPermission };
}

/**
 * Chức danh thực tế (ẩn base roles dùng để kế thừa), sắp theo Ban Giám đốc → Phó Giám đốc → các tổ → chức danh tự thêm,
 * kèm hàm lấy danh sách quyền của một chức danh.
 */
export function useSortedMatrixRoles() {
  const { roles, permissions, hasPermission } = useRoleMatrix();

  const sortedRoles = useMemo(() => {
    const departmentOrder: ((d: string) => boolean)[] = [
      (d) => /Ban Giám đốc/i.test(d),
      (d) => /Phó Giám đốc/i.test(d),
      (d) => /Giám sát/i.test(d) || /Kỹ thuật/i.test(d),
      (d) => /Bồi thường/i.test(d) || /GPMB/i.test(d),
      (d) => /Hành chính/i.test(d) || /Tài chính/i.test(d) || /Kế toán/i.test(d),
    ];
    const orderOf = (role: MatrixRole) => {
      if (role.isCustom) return departmentOrder.length + 1;
      const idx = departmentOrder.findIndex((match) => match(role.department || ""));
      return idx === -1 ? departmentOrder.length : idx;
    };
    return roles
      .filter((r) => r.group !== "base")
      .map((role, idx) => ({ role, idx }))
      .sort((a, b) => orderOf(a.role) - orderOf(b.role) || a.idx - b.idx)
      .map(({ role }) => role);
  }, [roles]);

  const getRolePermIds = useCallback(
    (roleCode: string) => permissions.filter((p) => hasPermission(roleCode, p.id)).map((p) => p.id),
    [permissions, hasPermission],
  );

  return { sortedRoles, getRolePermIds };
}

/** Thao tác lưu ma trận phân quyền: lưu ngay, xong làm mới bản dùng chung */
export function useRoleMatrixActions() {
  const queryClient = useQueryClient();
  const current = () => queryClient.getQueryData<RoleMatrixState>(roleMatrixKey) ?? loadRoleMatrix();
  const refresh = () => queryClient.invalidateQueries({ queryKey: roleMatrixKey });

  /** Tạo chức danh mới với bộ quyền ban đầu; trùng tên thì trả về chức danh sẵn có */
  const createRole = (name: string, permIds: string[]): MatrixRole => {
    const { roles, permissionsMap } = current();
    const trimmedName = name.trim();

    // Tránh tạo 2 lần khi bấm nhanh
    const existing = roles.find((r) => (r.name || "").trim().toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      toast.warning(`Chức danh "${trimmedName}" đã tồn tại trong hệ thống.`);
      return existing;
    }

    const role: MatrixRole = {
      code: `CUSTOM_${Date.now()}`,
      name: trimmedName,
      shortName: trimmedName,
      group: "member",
      description: `Chức danh ${trimmedName} trong hệ thống`,
      color: "#0F4C81",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      writeRoles(deduplicateRoles([role, ...roles]));
      notifyRolesUpdated();
    } catch (err) {
      console.error("Lỗi khi lưu vai trò mới vào localStorage:", err);
    }
    try {
      writeRolePermissions({ ...permissionsMap, [role.code]: permIds });
    } catch (err) {
      console.error("Lỗi khi lưu quyền mới vào localStorage:", err);
    }
    refresh();
    toast.success(`Đã thêm chức danh "${role.name}" vào ma trận với ${permIds.length} quyền.`);
    return role;
  };

  /** Bật / tắt chức danh: chức danh tắt không chọn được khi thêm nhân sự; cán bộ đang giữ tạm không có quyền */
  const setRoleLocked = (roleCode: string, locked: boolean) => {
    const { roles, lockedRoleCodes } = current();
    const next = locked
      ? Array.from(new Set([...lockedRoleCodes, roleCode]))
      : lockedRoleCodes.filter((code) => code !== roleCode);
    saveLockedRoleCodes(next);
    refresh();
    const roleName = roles.find((r) => r.code === roleCode)?.name ?? "";
    toast.success(locked ? `Đã tắt chức danh "${roleName}".` : `Đã bật lại chức danh "${roleName}".`);
  };

  /** Đổi tên chức danh; trả về false nếu tên trống hoặc trùng chức danh khác */
  const renameRole = (roleCode: string, newName: string): boolean => {
    const { roles } = current();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.warning("Vui lòng nhập tên chức danh.");
      return false;
    }
    const duplicated = roles.some(
      (r) => r.code !== roleCode && (r.name || "").trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicated) {
      toast.warning(`Chức danh "${trimmed}" đã tồn tại trong hệ thống.`);
      return false;
    }
    const target = roles.find((r) => r.code === roleCode);
    if (!target || target.name === trimmed) return true;

    try {
      writeRoleNameOverride(roleCode, trimmed);
      writeRoles(roles.map((r) => (r.code === roleCode ? { ...r, name: trimmed, shortName: trimmed } : r)));
      notifyRolesUpdated();
    } catch (err) {
      console.error("Lỗi khi lưu tên chức danh:", err);
    }
    refresh();
    return true;
  };

  /** Ghi đè toàn bộ quyền của một chức danh và cập nhật quyền của tài khoản đang đăng nhập nếu bị ảnh hưởng */
  const updateRolePermissions = (roleCode: string, permIds: string[]) => {
    try {
      const storedPerms = { ...loadRolePermissions(), [roleCode]: permIds };
      writeRolePermissions(storedPerms);
      syncCurrentUserPermissions(storedPerms);
    } catch (err) {
      console.error("Lỗi khi lưu quyền chức danh:", err);
    }
    refresh();
  };

  return { createRole, setRoleLocked, renameRole, updateRolePermissions };
}
