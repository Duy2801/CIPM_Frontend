import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types/auth";
import {
  convertMatrixPermIdsToPermissionCodes,
  getDeletedRoleCodes,
  getLockedRoleCodes,
  STORAGE_KEY_LOCKED_ROLES,
  STORAGE_KEY_PERMISSIONS,
} from "@/access-control";
import { DEFAULT_ROLE_PERMISSIONS_MAP, SYSTEM_MATRIX_ROLES, type MatrixRole } from "../constants/role-matrix-data";

/**
 * Lưu trữ ma trận phân quyền (chức danh, quyền theo chức danh, chức danh tắt / đã xóa).
 * Hiện lưu ở localStorage; khi nối backend chỉ cần thay phần đọc / ghi trong file này.
 */

const STORAGE_KEY_ROLES = "cipm_custom_roles_matrix_v3";
/** Tên chức danh đã sửa, theo mã (lưu riêng vì chức danh hệ thống luôn được nạp lại từ danh mục gốc) */
const STORAGE_KEY_ROLE_NAMES = "cipm_role_name_overrides_v1";

const ROLES_UPDATED_EVENT = "cipm-roles-updated";
const ROLE_LOCKS_UPDATED_EVENT = "cipm-role-locks-updated";
const PERMISSIONS_UPDATED_EVENT = "cipm-permissions-updated";

const isBrowser = () => typeof window !== "undefined";
const emit = (eventName: string) => window.dispatchEvent(new CustomEvent(eventName));

function getRoleNameOverrides(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY_ROLE_NAMES) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function applyRoleNameOverrides(roleList: MatrixRole[]): MatrixRole[] {
  const overrides = getRoleNameOverrides();
  return roleList.map((r) => (overrides[r.code] ? { ...r, name: overrides[r.code], shortName: overrides[r.code] } : r));
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

function loadRoles(): MatrixRole[] {
  if (!isBrowser()) return SYSTEM_MATRIX_ROLES;
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
        return applyRoleNameOverrides(deduplicated);
      }
    }
  } catch (err) {
    console.error("Lỗi khi đọc roles từ localStorage:", err);
  }
  return applyRoleNameOverrides(SYSTEM_MATRIX_ROLES);
}

/** Danh sách chức danh đang dùng: bỏ các chức danh đã xóa */
export function loadActiveRoles(): MatrixRole[] {
  const deleted = new Set(getDeletedRoleCodes());
  return loadRoles().filter((r) => !deleted.has(r.code));
}

export function loadRolePermissions(): Record<string, string[]> {
  if (!isBrowser()) return DEFAULT_ROLE_PERMISSIONS_MAP;
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

export const loadLockedRoleCodes = getLockedRoleCodes;
export const loadDeletedRoleCodes = getDeletedRoleCodes;

// ── Ghi dữ liệu (chưa phát sự kiện; gọi notify* sau khi ghi xong để màn khác đọc đủ dữ liệu mới) ──

export function writeRoles(roles: MatrixRole[]) {
  window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
}

export function writeRolePermissions(permissionsMap: Record<string, string[]>) {
  window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(permissionsMap));
}

export function writeRoleNameOverride(roleCode: string, name: string) {
  window.localStorage.setItem(STORAGE_KEY_ROLE_NAMES, JSON.stringify({ ...getRoleNameOverrides(), [roleCode]: name }));
}

export function notifyRolesUpdated() {
  emit(ROLES_UPDATED_EVENT);
}

export function saveLockedRoleCodes(codes: string[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_LOCKED_ROLES, JSON.stringify(codes));
    emit(ROLE_LOCKS_UPDATED_EVENT);
    // Làm mới quyền của tài khoản đang đăng nhập (menu, trang được bảo vệ)
    emit(PERMISSIONS_UPDATED_EVENT);
  } catch (err) {
    console.error("Lỗi khi lưu danh sách chức danh bị khóa:", err);
  }
}

/** Cập nhật quyền của tài khoản đang đăng nhập theo ma trận vừa lưu (store + cookie user_info) */
export function syncCurrentUserPermissions(permissionsMap: Record<string, string[]>) {
  if (!isBrowser()) return;
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
    emit(PERMISSIONS_UPDATED_EVENT);
  } catch (err) {
    console.error("Lỗi đồng bộ permissions vào session:", err);
  }
}

/** Nghe thay đổi ma trận từ modal / tab khác; trả về hàm hủy đăng ký */
export function subscribeRoleMatrixChanges(onRolesChange: () => void, onLocksChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(ROLES_UPDATED_EVENT, onRolesChange);
  window.addEventListener(ROLE_LOCKS_UPDATED_EVENT, onLocksChange);
  window.addEventListener("storage", onRolesChange);
  return () => {
    window.removeEventListener(ROLES_UPDATED_EVENT, onRolesChange);
    window.removeEventListener(ROLE_LOCKS_UPDATED_EVENT, onLocksChange);
    window.removeEventListener("storage", onRolesChange);
  };
}

/** Nghe khi danh sách chức danh thay đổi (thêm / sửa / xóa) */
export function subscribeRolesUpdated(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(ROLES_UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ROLES_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
