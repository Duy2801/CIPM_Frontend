"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser, Permission } from "@/types/auth";
import {
  DEFAULT_ROLE_PERMISSIONS_MAP,
  MATRIX_MODULES,
  MATRIX_PERMISSIONS,
  SYSTEM_MATRIX_ROLES,
  type MatrixRole,
} from "../constants/role-matrix-data";

import {
  convertMatrixPermIdsToPermissionCodes,
  STORAGE_KEY_PERMISSIONS,
} from "@/access-control";

const STORAGE_KEY_ROLES = "cipm_custom_roles_matrix_v3";

function syncCurrentUserPermissions(permissionsMap: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try {
    const currentUser = useAuthStore.getState().user;
    const roleId = (currentUser as any)?.roleId;
    const roleCode = currentUser?.role || (currentUser as any)?.roleCode;
    const targetKey = (roleId && permissionsMap[roleId]) ? roleId : roleCode;

    if (targetKey && permissionsMap[targetKey]) {
      const rolePermIds = permissionsMap[targetKey];
      const updatedPerms = convertMatrixPermIdsToPermissionCodes(rolePermIds);
      useAuthStore.getState().updateUser({ permissions: updatedPerms });
    }

    const userInfoStr = Cookies.get("user_info");
    if (userInfoStr) {
      const userObj = JSON.parse(userInfoStr) as AuthUser;
      const uRoleId = (userObj as any)?.roleId;
      const rCode = userObj.role || (userObj as any).roleCode;
      const uKey = (uRoleId && permissionsMap[uRoleId]) ? uRoleId : rCode;
      if (uKey && permissionsMap[uKey]) {
        const rPermIds = permissionsMap[uKey];
        userObj.permissions = convertMatrixPermIdsToPermissionCodes(rPermIds);
        Cookies.set("user_info", JSON.stringify(userObj), { path: "/", sameSite: "lax" });
      }
    }
    window.dispatchEvent(new CustomEvent("cipm-permissions-updated"));
  } catch (err) {
    console.error("Lỗi đồng bộ permissions vào session:", err);
  }
}

export function deduplicateRoles(roleList: MatrixRole[]): MatrixRole[] {
  const seenCodes = new Set<string>();
  const seenNames = new Set<string>();
  const result: MatrixRole[] = [];

  for (const r of roleList) {
    if (!r || !r.code) continue;
    const codeKey = r.code.trim().toLowerCase();
    const nameKey = (r.name || "").trim().toLowerCase();

    // Đối với vai trò tùy chỉnh: không cho phép trùng code hoặc trùng tên
    if (r.isCustom) {
      if (seenCodes.has(codeKey) || (nameKey && seenNames.has(nameKey))) {
        continue;
      }
      seenCodes.add(codeKey);
      if (nameKey) seenNames.add(nameKey);
      result.push(r);
    } else {
      if (!seenCodes.has(codeKey)) {
        seenCodes.add(codeKey);
        result.push(r);
      }
    }
  }

  return result;
}

function getInitialRoles(): MatrixRole[] {
  if (typeof window === "undefined") return SYSTEM_MATRIX_ROLES;
  try {
    const storedRoles = window.localStorage.getItem(STORAGE_KEY_ROLES);
    if (storedRoles) {
      const parsedRoles = JSON.parse(storedRoles);
      if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
        const customOnly = parsedRoles.filter((r: MatrixRole) => r.isCustom);
        const combined = [...SYSTEM_MATRIX_ROLES, ...customOnly];
        const deduplicated = deduplicateRoles(combined);
        // Tự động dọn dẹp localStorage nếu trước đó có vai trò bị trùng lặp
        if (deduplicated.length !== combined.length) {
          window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(deduplicated));
        }
        return deduplicated;
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
        return {
          ...DEFAULT_ROLE_PERMISSIONS_MAP,
          ...parsedPerms,
        };
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

  // Lắng nghe sự kiện đồng bộ khi có vai trò tùy chỉnh mới được thêm/sửa/xóa ở modal khác
  useEffect(() => {
    const handleSync = () => {
      setRoles(getInitialRoles());
      setPermissionsMap(getInitialPermissions());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("cipm-roles-updated", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        window.removeEventListener("cipm-roles-updated", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, []);


  // Kiểm tra vai trò có quyền permId không
  const hasPermission = useCallback(
    (roleCode: string, permId: string): boolean => {
      const currentPerms = permissionsMap[roleCode];
      if (currentPerms !== undefined) {
        return currentPerms.includes(permId);
      }
      // Giám đốc mặc định có mọi quyền nếu chưa thiết lập riêng
      if (roleCode === "role_admin" || roleCode === "ADMIN") return true;

      return false;
    },
    [permissionsMap]
  );

  // Bật/tắt 1 quyền của 1 role
  const togglePermission = useCallback((roleCode: string, permId: string) => {
    setPermissionsMap((prev) => {
      const current = prev[roleCode] || ((roleCode === "role_admin" || roleCode === "ADMIN") ? MATRIX_PERMISSIONS.map((p) => p.id) : []);
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
    (roleCode: string, moduleId: string, specificPermIds?: string[]) => {
      const modulePermIds =
        specificPermIds && specificPermIds.length > 0
          ? specificPermIds
          : MATRIX_PERMISSIONS.filter((p) => p.moduleId === moduleId).map((p) => p.id);
      const current = permissionsMap[roleCode] || ((roleCode === "role_admin" || roleCode === "ADMIN") ? MATRIX_PERMISSIONS.map((p) => p.id) : []);
      const allActive = modulePermIds.every((id) => current.includes(id));

      setPermissionsMap((prev) => {
        const cur = prev[roleCode] || ((roleCode === "role_admin" || roleCode === "ADMIN") ? MATRIX_PERMISSIONS.map((p) => p.id) : []);
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
    const allPermIds = MATRIX_PERMISSIONS.map((p) => p.id);
    const current = permissionsMap[roleCode] || ((roleCode === "role_admin" || roleCode === "ADMIN") ? allPermIds : []);
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
      const trimmedName = newRole.name.trim();

      // Kiểm tra xem vai trò cùng tên đã tồn tại chưa (tránh tạo 2 lần khi click nhanh)
      const existing = roles.find(
        (r) => (r.name || "").trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) {
        toast.warning(`Vai trò "${trimmedName}" đã tồn tại trong hệ thống.`);
        return existing;
      }

      const code = `CUSTOM_${Date.now()}`;
      const roleObj: MatrixRole = {
        code,
        name: trimmedName,
        shortName: newRole.shortName.trim() || trimmedName.slice(0, 10),
        group: newRole.group,
        inheritsFrom: newRole.inheritsFrom,
        description: newRole.description.trim(),
        color: newRole.color || "#0F4C81",
        isCustom: true,
      };

      const nextRoles = deduplicateRoles([roleObj, ...roles]);
      setRoles(nextRoles);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(nextRoles));
          window.dispatchEvent(new CustomEvent("cipm-roles-updated"));
        } catch (err) {
          console.error("Lỗi khi lưu vai trò mới vào localStorage:", err);
        }
      }

      // Khởi tạo quyền mặc định: ưu tiên danh sách chỉ định, nếu không thì kế thừa
      const initialPerms =
        newRole.initialPermissions !== undefined
          ? newRole.initialPermissions
          : newRole.inheritsFrom
          ? [...(permissionsMap[newRole.inheritsFrom] || [])]
          : [];

      const nextPerms = {
        ...permissionsMap,
        [code]: initialPerms,
      };
      setPermissionsMap(nextPerms);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(nextPerms));
        } catch (err) {
          console.error("Lỗi khi lưu quyền mới vào localStorage:", err);
        }
      }

      setIsDirty(true);
      toast.success(`Đã thêm vai trò "${roleObj.name}" vào ma trận với ${initialPerms.length} quyền.`);
      return roleObj;
    },
    [roles, permissionsMap]
  );

  // Xóa vai trò tùy chỉnh
  const deleteCustomRole = useCallback((roleCode: string) => {
    const nextRoles = roles.filter((r) => r.code !== roleCode);
    setRoles(nextRoles);

    const nextPerms = { ...permissionsMap };
    delete nextPerms[roleCode];
    setPermissionsMap(nextPerms);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(nextRoles));
        window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(nextPerms));
        window.dispatchEvent(new CustomEvent("cipm-roles-updated"));
      } catch (err) {
        console.error("Lỗi khi xóa vai trò khỏi localStorage:", err);
      }
    }
    setIsDirty(true);
    toast.success("Đã xóa vai trò tùy chỉnh.");
  }, [roles, permissionsMap]);

  // Khôi phục mặc định
  const resetToDefault = useCallback(() => {
    setRoles(SYSTEM_MATRIX_ROLES);
    setPermissionsMap(DEFAULT_ROLE_PERMISSIONS_MAP);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(SYSTEM_MATRIX_ROLES));
        window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(DEFAULT_ROLE_PERMISSIONS_MAP));
        window.dispatchEvent(new CustomEvent("cipm-roles-updated"));
      } catch (err) {
        console.error("Lỗi khi khôi phục mặc định vào localStorage:", err);
      }
    }
    setIsDirty(true);
    toast.info("Đã khôi phục về mặc định ban đầu. Bấm \"Lưu cấu hình\" để áp dụng vào hệ thống.");
  }, []);

  // Lưu phân quyền
  const saveMatrix = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(permissionsMap));
      window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
      window.dispatchEvent(new CustomEvent("cipm-roles-updated"));
      syncCurrentUserPermissions(permissionsMap);
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
