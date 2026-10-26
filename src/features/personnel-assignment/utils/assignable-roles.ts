import type { MatrixRole } from "../constants/role-matrix-data";

/** Tên (viết thường) các chức danh đã khóa trong ma trận phân quyền */
export function getLockedTitles(matrixRoles: MatrixRole[], lockedRoleCodes: string[]): Set<string> {
  const locked = new Set(lockedRoleCodes);
  return new Set(matrixRoles.filter((r) => locked.has(r.code)).map((r) => r.name.trim().toLowerCase()));
}
