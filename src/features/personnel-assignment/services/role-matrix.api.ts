import { MATRIX_PERMISSIONS, type MatrixRole } from "../constants/role-matrix-data";
import { withBackend } from "./backend";
import { toApiPermissionCode, toApiRoleCode, toRoleCode, type ApiRole } from "./personnel.mapper";
import * as backend from "../api/role-matrix.backend";
import { loadActiveRoles, loadDeletedRoleCodes, loadLockedRoleCodes, loadRolePermissions } from "./role-matrix.storage";

/**
 * Quản lý chức danh & quyền (ma trận phân quyền).
 * Đăng nhập bằng tài khoản thật thì đọc / ghi backend (api/role-matrix.backend.ts);
 * ngược lại dùng bản lưu tại trình duyệt (role-matrix.storage.ts).
 */

export interface RoleMatrixState {
  roles: MatrixRole[];
  /** Mã chức danh → danh sách mã quyền ma trận */
  permissionsMap: Record<string, string[]>;
  /** Chức danh đang tắt */
  lockedRoleCodes: string[];
  /** Chức danh mặc định đã xóa */
  deletedRoleCodes: string[];
}

export const loadLocalRoleMatrix = (): RoleMatrixState => ({
  roles: loadActiveRoles(),
  permissionsMap: loadRolePermissions(),
  lockedRoleCodes: loadLockedRoleCodes(),
  deletedRoleCodes: loadDeletedRoleCodes(),
});

/** Mã quyền ma trận (m1.view...) ↔ mã quyền backend (dashboard:view...) */
const toMatrixPermIds = (apiCodes: string[]) => {
  const granted = new Set(apiCodes);
  return MATRIX_PERMISSIONS.filter((p) => granted.has(toApiPermissionCode(p.code))).map((p) => p.id);
};

const toApiPermissionCodes = (permIds: string[]) => {
  const selected = new Set(permIds);
  return MATRIX_PERMISSIONS.filter((p) => selected.has(p.id)).map((p) => toApiPermissionCode(p.code));
};

const toMatrixRole = (role: ApiRole): MatrixRole => ({
  code: toRoleCode(role.code),
  name: role.name,
  shortName: role.name,
  group: role.code === "DIRECTOR" ? "director" : "member",
  description: role.description || `Chức danh ${role.name} trong hệ thống`,
  color: role.code === "DIRECTOR" ? "#DC2626" : "#0F4C81",
  isCustom: role.isCustom,
  createdAt: role.createdAt,
});

/** Chức danh, quyền của từng chức danh, chức danh đang tắt */
export function getRoleMatrix(): Promise<RoleMatrixState> {
  return withBackend(async () => {
    const data = await backend.getRolesApi();
    return {
      roles: data.map(toMatrixRole),
      permissionsMap: Object.fromEntries(data.map((role) => [toRoleCode(role.code), toMatrixPermIds(role.permissionCodes)])),
      lockedRoleCodes: data.filter((role) => !role.isActive).map((role) => toRoleCode(role.code)),
      deletedRoleCodes: [],
    };
  }, loadLocalRoleMatrix);
}

/** Tạo chức danh và cấp quyền ban đầu */
export async function createRole(name: string, permIds: string[]): Promise<MatrixRole> {
  const role = await backend.createRoleApi(name);
  await backend.saveRolePermissionsApi(role.code, toApiPermissionCodes(permIds));
  return toMatrixRole({
    id: role.code,
    code: role.code,
    name: role.name,
    isCustom: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    permissionCodes: [],
  });
}

/** Đổi tên chức danh */
export function renameRole(roleCode: string, name: string): Promise<void> {
  return backend.updateRoleApi(toApiRoleCode(roleCode), { name });
}

/** Bật / tắt chức danh */
export function setRoleActive(roleCode: string, active: boolean): Promise<void> {
  return backend.updateRoleApi(toApiRoleCode(roleCode), { isActive: active });
}

/** Thay toàn bộ quyền của chức danh */
export function saveRolePermissions(roleCode: string, permIds: string[]): Promise<void> {
  return backend.saveRolePermissionsApi(toApiRoleCode(roleCode), toApiPermissionCodes(permIds));
}
