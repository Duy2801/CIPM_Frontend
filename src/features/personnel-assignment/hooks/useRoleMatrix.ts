"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui";
import {
  DEFAULT_ROLE_PERMISSIONS_MAP,
  MATRIX_MODULES,
  MATRIX_PERMISSIONS,
  SYSTEM_MATRIX_ROLES,
  type MatrixRole,
} from "../constants/role-matrix-data";

const STORAGE_KEY_PERMISSIONS = "cipm_role_permissions_matrix_v1";
const STORAGE_KEY_ROLES = "cipm_custom_roles_matrix_v1";

function getInitialRoles(): MatrixRole[] {
  if (typeof window === "undefined") return SYSTEM_MATRIX_ROLES;
  try {
    const storedRoles = window.localStorage.getItem(STORAGE_KEY_ROLES);
    if (storedRoles) {
      const parsedRoles = JSON.parse(storedRoles);
      if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
        return parsedRoles;
      }
    }
  } catch (err) {
    console.error("Lỗi khi đọc roles từ localStorage:", err);
  }
  return SYSTEM_MATRIX_ROLES;
}

function getInitialPermissions(): Record<string, string[]> {
  if (typeof window === "undefined") return DEFAULT_ROLE_PERMISSIONS_MAP;
  try {
    const storedPerms = window.localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    if (storedPerms) {
      const parsedPerms = JSON.parse(storedPerms);
      if (parsedPerms && typeof parsedPerms === "object") {
        return parsedPerms;
      }
    }
  } catch (err) {
    console.error("Lỗi khi đọc ma trận phân quyền từ localStorage:", err);
  }
  return DEFAULT_ROLE_PERMISSIONS_MAP;
}

export function useRoleMatrix() {
  const [roles, setRoles] = useState<MatrixRole[]>(getInitialRoles);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>(getInitialPermissions);
  const [isDirty, setIsDirty] = useState(false);

  // Tự động lưu cấu hình vào localStorage khi có thay đổi (Auto-save)
  useEffect(() => {
    if (!isDirty || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(permissionsMap));
      window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
    } catch (err) {
      console.error("Lỗi tự động lưu ma trận phân quyền:", err);
    }
  }, [permissionsMap, roles, isDirty]);

  // Kiểm tra vai trò có quyền permId không
  const hasPermission = useCallback(
    (roleCode: string, permId: string): boolean => {
      // Giám đốc luôn có mọi quyền
      if (roleCode === "ADMIN") return true;

      const currentPerms = permissionsMap[roleCode] || [];
      return currentPerms.includes(permId);
    },
    [permissionsMap]
  );

  // Bật/tắt 1 quyền của 1 role
  const togglePermission = useCallback((roleCode: string, permId: string) => {
    // Không cho phép bỏ quyền của ADMIN vì là tài khoản cao nhất
    if (roleCode === "ADMIN") {
      toast.warning("Tài khoản Giám đốc mặc định có toàn quyền hệ thống.");
      return;
    }

    setPermissionsMap((prev) => {
      const current = prev[roleCode] || [];
      const has = current.includes(permId);
      const updated = has ? current.filter((id) => id !== permId) : [...current, permId];

      // Nếu đang sửa Base Lead, tự động gợi ý hoặc cập nhật các role kế thừa
      const nextState = { ...prev, [roleCode]: updated };

      if (roleCode === "BASE_LEAD" && !has) {
        // Khi thêm quyền cho Base Lead, tự động bật cho các Lead chưa có
        Object.keys(prev).forEach((rc) => {
          const role = roles.find((r) => r.code === rc);
          if (role?.inheritsFrom === "BASE_LEAD") {
            const rolePerms = nextState[rc] || [];
            if (!rolePerms.includes(permId)) {
              nextState[rc] = [...rolePerms, permId];
            }
          }
        });
      }

      if (roleCode === "BASE_MEMBER" && !has) {
        // Khi thêm quyền cho Base Member, tự động bật cho các Member chưa có
        Object.keys(prev).forEach((rc) => {
          const role = roles.find((r) => r.code === rc);
          if (role?.inheritsFrom === "BASE_MEMBER") {
            const rolePerms = nextState[rc] || [];
            if (!rolePerms.includes(permId)) {
              nextState[rc] = [...rolePerms, permId];
            }
          }
        });
      }

      return nextState;
    });

    setIsDirty(true);
  }, [roles]);

  // Bật/tắt toàn bộ quyền trong 1 Module cho 1 Role
  const toggleModuleForRole = useCallback(
    (roleCode: string, moduleId: string) => {
      if (roleCode === "ADMIN") {
        toast.warning("Tài khoản Giám đốc mặc định có toàn quyền hệ thống.");
        return;
      }

      const modulePermIds = MATRIX_PERMISSIONS.filter((p) => p.moduleId === moduleId).map((p) => p.id);
      const current = permissionsMap[roleCode] || [];
      const allActive = modulePermIds.every((id) => current.includes(id));

      setPermissionsMap((prev) => {
        const cur = prev[roleCode] || [];
        const next = allActive
          ? cur.filter((id) => !modulePermIds.includes(id))
          : Array.from(new Set([...cur, ...modulePermIds]));
        return { ...prev, [roleCode]: next };
      });

      setIsDirty(true);
    },
    [permissionsMap]
  );

  // Bật/tắt toàn bộ quyền cho 1 Role
  const toggleAllForRole = useCallback((roleCode: string) => {
    if (roleCode === "ADMIN") {
      toast.warning("Tài khoản Giám đốc mặc định có toàn quyền hệ thống.");
      return;
    }

    const allPermIds = MATRIX_PERMISSIONS.map((p) => p.id);
    const current = permissionsMap[roleCode] || [];
    const isFull = allPermIds.every((id) => current.includes(id));

    setPermissionsMap((prev) => ({
      ...prev,
      [roleCode]: isFull ? [] : allPermIds,
    }));

    setIsDirty(true);
  }, [permissionsMap]);

  // Áp dụng quyền Base Lead vào tất cả các Lead
  const applyBaseLeadToAllLeads = useCallback(() => {
    const baseLeadPerms = permissionsMap["BASE_LEAD"] || [];
    setPermissionsMap((prev) => {
      const next = { ...prev };
      roles.forEach((r) => {
        if (r.inheritsFrom === "BASE_LEAD") {
          const current = next[r.code] || [];
          next[r.code] = Array.from(new Set([...current, ...baseLeadPerms]));
        }
      });
      return next;
    });
    setIsDirty(true);
    toast.success("Đã đồng bộ và áp dụng quyền chung của Tổ trưởng vào toàn bộ các chức danh Lead.");
  }, [permissionsMap, roles]);

  // Áp dụng quyền Base Member vào tất cả các Member
  const applyBaseMemberToAllMembers = useCallback(() => {
    const baseMemberPerms = permissionsMap["BASE_MEMBER"] || [];
    setPermissionsMap((prev) => {
      const next = { ...prev };
      roles.forEach((r) => {
        if (r.inheritsFrom === "BASE_MEMBER") {
          const current = next[r.code] || [];
          next[r.code] = Array.from(new Set([...current, ...baseMemberPerms]));
        }
      });
      return next;
    });
    setIsDirty(true);
    toast.success("Đã đồng bộ và áp dụng quyền chung của Thành viên vào toàn bộ các chức danh Member.");
  }, [permissionsMap, roles]);

  // Thêm vai trò mới (Tăng tính linh động khi cơ quan muốn tạo role mới)
  const addCustomRole = useCallback(
    (newRole: {
      name: string;
      shortName: string;
      group: "lead" | "member" | "special";
      inheritsFrom?: "BASE_LEAD" | "BASE_MEMBER";
      description: string;
      color?: string;
      initialPermissions?: string[];
    }) => {
      const code = `CUSTOM_${Date.now()}`;
      const roleObj: MatrixRole = {
        code,
        name: newRole.name.trim(),
        shortName: newRole.shortName.trim() || newRole.name.trim().slice(0, 10),
        group: newRole.group,
        inheritsFrom: newRole.inheritsFrom,
        description: newRole.description.trim(),
        color: newRole.color || "#059669",
        isCustom: true,
      };

      setRoles((prev) => [...prev, roleObj]);

      // Khởi tạo quyền mặc định: ưu tiên danh sách chỉ định, nếu không thì kế thừa
      const initialPerms =
        newRole.initialPermissions !== undefined
          ? newRole.initialPermissions
          : newRole.inheritsFrom
          ? [...(permissionsMap[newRole.inheritsFrom] || [])]
          : [];

      setPermissionsMap((prev) => ({
        ...prev,
        [code]: initialPerms,
      }));

      setIsDirty(true);
      toast.success(`Đã thêm vai trò "${roleObj.name}" vào ma trận với ${initialPerms.length} quyền.`);
      return roleObj;
    },
    [permissionsMap]
  );

  // Xóa vai trò tùy chỉnh
  const deleteCustomRole = useCallback((roleCode: string) => {
    setRoles((prev) => prev.filter((r) => r.code !== roleCode));
    setPermissionsMap((prev) => {
      const next = { ...prev };
      delete next[roleCode];
      return next;
    });
    setIsDirty(true);
    toast.success("Đã xóa vai trò tùy chỉnh.");
  }, []);

  // Khôi phục mặc định
  const resetToDefault = useCallback(() => {
    setRoles(SYSTEM_MATRIX_ROLES);
    setPermissionsMap(DEFAULT_ROLE_PERMISSIONS_MAP);
    setIsDirty(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY_PERMISSIONS);
      window.localStorage.removeItem(STORAGE_KEY_ROLES);
    }
    toast.info("Đã khôi phục ma trận phân quyền về mặc định ban đầu của Ban QLDA.");
  }, []);

  // Lưu phân quyền
  const saveMatrix = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(permissionsMap));
      window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
    }
    setIsDirty(false);
    toast.success("Đã lưu thành công phân quyền hệ thống!");
  }, [permissionsMap, roles]);

  return {
    roles,
    modules: MATRIX_MODULES,
    permissions: MATRIX_PERMISSIONS,
    permissionsMap,
    isDirty,
    hasPermission,
    togglePermission,
    toggleModuleForRole,
    toggleAllForRole,
    applyBaseLeadToAllLeads,
    applyBaseMemberToAllMembers,
    addCustomRole,
    deleteCustomRole,
    resetToDefault,
    saveMatrix,
  };
}
