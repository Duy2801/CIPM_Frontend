"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { MATRIX_MODULES, MATRIX_PERMISSIONS, type MatrixRole } from "../constants/role-matrix-data";
import { hasBackendSession, withBackend } from "../services/backend";
import * as roleMatrixApi from "../services/role-matrix.api";
import { loadLocalRoleMatrix, type RoleMatrixState } from "../services/role-matrix.api";
import {
  deduplicateRoles,
  loadRolePermissions,
  notifyRolesUpdated,
  saveLockedRoleCodes,
  subscribeRoleMatrixChanges,
  syncCurrentUserPermissions,
  writeRoleNameOverride,
  writeRolePermissions,
  writeRoles,
} from "../services/role-matrix.storage";

export const roleMatrixKey = ["role-matrix"] as const;

const EMPTY_ROLE_MATRIX: RoleMatrixState = { roles: [], permissionsMap: {}, lockedRoleCodes: [], deletedRoleCodes: [] };

const isDirector = (roleCode: string) => roleCode === "role_admin" || roleCode === "ADMIN";

/** Ma trận phân quyền đang lưu; mọi component dùng chung một bản, lưu ở đâu thì nơi khác tự cập nhật */
export function useRoleMatrix() {
  const queryClient = useQueryClient();
  // Dữ liệu backend thì chờ tải; bản lưu trình duyệt thì đọc ngay
  const { data = EMPTY_ROLE_MATRIX } = useQuery({
    queryKey: roleMatrixKey,
    queryFn: roleMatrixApi.getRoleMatrix,
    initialData: hasBackendSession() ? undefined : loadLocalRoleMatrix,
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

/** Thao tác lưu ma trận phân quyền: lưu backend (hoặc trình duyệt khi chạy mock), xong làm mới bản dùng chung */
export function useRoleMatrixActions() {
  const queryClient = useQueryClient();
  const current = () => queryClient.getQueryData<RoleMatrixState>(roleMatrixKey) ?? loadLocalRoleMatrix();
  const refresh = () => queryClient.invalidateQueries({ queryKey: roleMatrixKey });
  /** Lỗi từ backend: báo lỗi, trả về giá trị thất bại */
  const failWith = <T,>(failed: T) => (error: unknown) => {
    toast.error(error instanceof Error ? error.message : "Không thể lưu chức danh, vui lòng thử lại.");
    return failed;
  };

  /** Tạo chức danh mới với bộ quyền ban đầu; trùng tên thì trả về chức danh sẵn có, lỗi thì trả về null */
  const createRole = async (name: string, permIds: string[]): Promise<MatrixRole | null> => {
    const { roles, permissionsMap } = current();
    const trimmedName = name.trim();

    // Tránh tạo 2 lần khi bấm nhanh
    const existing = roles.find((r) => (r.name || "").trim().toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      toast.warning(`Chức danh "${trimmedName}" đã tồn tại trong hệ thống.`);
      return existing;
    }

    const role = await withBackend(
      () => roleMatrixApi.createRole(trimmedName, permIds),
      () => {
        const localRole: MatrixRole = {
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
          writeRoles(deduplicateRoles([localRole, ...roles]));
          notifyRolesUpdated();
        } catch (err) {
          console.error("Lỗi khi lưu vai trò mới vào localStorage:", err);
        }
        try {
          writeRolePermissions({ ...permissionsMap, [localRole.code]: permIds });
        } catch (err) {
          console.error("Lỗi khi lưu quyền mới vào localStorage:", err);
        }
        return localRole;
      },
    ).catch(failWith(null));
    if (!role) return null;
    await refresh();
    toast.success(`Đã thêm chức danh "${role.name}" vào ma trận với ${permIds.length} quyền.`);
    return role;
  };

  /** Bật / tắt chức danh: chức danh tắt không chọn được khi thêm nhân sự; cán bộ đang giữ tạm không có quyền */
  const setRoleLocked = async (roleCode: string, locked: boolean): Promise<boolean> => {
    const { roles, lockedRoleCodes } = current();
    const saved = await withBackend(
      async () => {
        await roleMatrixApi.setRoleActive(roleCode, !locked);
        return true;
      },
      () => {
        const next = locked
          ? Array.from(new Set([...lockedRoleCodes, roleCode]))
          : lockedRoleCodes.filter((code) => code !== roleCode);
        saveLockedRoleCodes(next);
        return true;
      },
    ).catch(failWith(false));
    if (!saved) return false;
    await refresh();
    const roleName = roles.find((r) => r.code === roleCode)?.name ?? "";
    toast.success(locked ? `Đã tắt chức danh "${roleName}".` : `Đã bật lại chức danh "${roleName}".`);
    return true;
  };

  /** Đổi tên chức danh; trả về false nếu tên trống, trùng chức danh khác hoặc lưu lỗi */
  const renameRole = async (roleCode: string, newName: string): Promise<boolean> => {
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

    const saved = await withBackend(
      async () => {
        await roleMatrixApi.renameRole(roleCode, trimmed);
        return true;
      },
      () => {
        try {
          writeRoleNameOverride(roleCode, trimmed);
          writeRoles(roles.map((r) => (r.code === roleCode ? { ...r, name: trimmed, shortName: trimmed } : r)));
          notifyRolesUpdated();
        } catch (err) {
          console.error("Lỗi khi lưu tên chức danh:", err);
        }
        return true;
      },
    ).catch(failWith(false));
    if (saved) await refresh();
    return saved;
  };

  /** Ghi đè toàn bộ quyền của một chức danh và cập nhật quyền của tài khoản đang đăng nhập nếu bị ảnh hưởng */
  const updateRolePermissions = async (roleCode: string, permIds: string[]): Promise<boolean> => {
    const saved = await withBackend(
      async () => {
        await roleMatrixApi.saveRolePermissions(roleCode, permIds);
        return true;
      },
      () => {
        try {
          const storedPerms = { ...loadRolePermissions(), [roleCode]: permIds };
          writeRolePermissions(storedPerms);
          syncCurrentUserPermissions(storedPerms);
        } catch (err) {
          console.error("Lỗi khi lưu quyền chức danh:", err);
        }
        return true;
      },
    ).catch(failWith(false));
    if (saved) await refresh();
    return saved;
  };

  return { createRole, setRoleLocked, renameRole, updateRolePermissions };
}
