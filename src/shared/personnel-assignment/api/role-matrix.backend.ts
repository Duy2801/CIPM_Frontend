import apiClient from "@/config";
import type { ApiRole } from "../services/personnel.mapper";

/**
 * Các API chức danh & quyền của backend thật — chỉ gọi API và trả dữ liệu backend, không xử lý thêm.
 * Chuyển dữ liệu sang ma trận phân quyền: services/role-matrix.api.ts.
 */

/** GET /role */
export async function getRolesApi(): Promise<ApiRole[]> {
  return (await apiClient.get<ApiRole[]>("role")).data;
}

/** POST /role */
export async function createRoleApi(name: string): Promise<{ code: string; name: string }> {
  return (await apiClient.post<{ role: { code: string; name: string } }>("role", { name })).data.role;
}

/** PATCH /role/:code — đổi tên / bật tắt chức danh */
export async function updateRoleApi(apiRoleCode: string, body: { name?: string; isActive?: boolean }): Promise<void> {
  await apiClient.patch(`role/${apiRoleCode}`, body);
}

/** PUT /role/:code/permissions — thay toàn bộ quyền của chức danh */
export async function saveRolePermissionsApi(apiRoleCode: string, permissionCodes: string[]): Promise<void> {
  await apiClient.put(`role/${apiRoleCode}/permissions`, { permissionCodes });
}
