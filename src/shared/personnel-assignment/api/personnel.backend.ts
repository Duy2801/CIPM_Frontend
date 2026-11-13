import apiClient from "@/config";
import type { ApiAuditLog } from "@/api/audit-log.api";
import type {
  ApiDepartment,
  ApiDepartmentPosition,
  ApiPage,
  ApiUser,
  ApiUserPermissions,
} from "../services/personnel.mapper";

/**
 * Các API Nhân sự của backend thật — chỉ gọi API và trả dữ liệu backend, không xử lý thêm.
 * Chuyển dữ liệu sang dạng màn hình dùng và chạy bản mock khi không có backend: services/personnel.api.ts.
 */

// ── Phòng ban ──

/** GET /departments */
export async function getDepartmentsApi(): Promise<ApiDepartment[]> {
  return (await apiClient.get<ApiDepartment[]>("departments")).data;
}

/** POST /departments */
export async function createDepartmentApi(body: {
  name: string;
  description?: string;
  roles: ApiDepartmentPosition[];
}): Promise<ApiDepartment> {
  return (await apiClient.post<ApiDepartment>("departments", body)).data;
}

/** PATCH /departments/:id */
export async function updateDepartmentApi(departmentId: string, body: Record<string, unknown>): Promise<ApiDepartment> {
  return (await apiClient.patch<ApiDepartment>(`departments/${departmentId}`, body)).data;
}

// ── Cán bộ ──

/** GET /user (phân trang) */
export async function getUsersPageApi(page: number, limit: number): Promise<ApiPage<ApiUser>> {
  return (await apiClient.get<ApiPage<ApiUser>>("user", { params: { page, limit } })).data;
}

/** GET /user/:id */
export async function getUserApi(userId: string): Promise<ApiUser> {
  return (await apiClient.get<ApiUser>(`user/${userId}`)).data;
}

/** POST /auth/register — thêm cán bộ + tạo tài khoản (mật khẩu gửi qua email) */
export async function registerUserApi(
  body: Record<string, unknown>,
): Promise<ApiUser & { mailSent?: boolean; temporaryPassword?: string }> {
  return (await apiClient.post<ApiUser & { mailSent?: boolean; temporaryPassword?: string }>("auth/register", body)).data;
}

/** PUT /user/:id */
export async function updateUserApi(userId: string, body: Record<string, unknown>): Promise<void> {
  await apiClient.put(`user/${userId}`, body);
}

/** PUT /user/:id/roles — gán vai trò khi cán bộ chưa có vai trò */
export async function setUserRolesApi(userId: string, roleCodes: string[]): Promise<void> {
  await apiClient.put(`user/${userId}/roles`, { roleCodes });
}

/** PATCH /user/:id/roles — đổi vai trò */
export async function changeUserRoleApi(userId: string, fromRoleCode: string, toRoleCode: string): Promise<void> {
  await apiClient.patch(`user/${userId}/roles`, { fromRoleCode, toRoleCode });
}

/** POST /user/:id/lock (backend chỉ nhận POST) */
export async function lockUserApi(userId: string, reason?: string): Promise<void> {
  await apiClient.post(`user/${userId}/lock`, { reason });
}

/** POST /user/:id/unlock (backend chỉ nhận POST) */
export async function unlockUserApi(userId: string): Promise<void> {
  await apiClient.post(`user/${userId}/unlock`, {});
}

// ── Quyền & lịch sử ──

/** GET /user/:id/permissions — quyền theo chức danh, quyền riêng và quyền thực tế (mã backend, VD "project:view") */
export async function getUserPermissionsApi(userId: string): Promise<ApiUserPermissions> {
  return (await apiClient.get<ApiUserPermissions>(`user/${userId}/permissions`)).data;
}

/** PUT /user/:id/permissions — ghi đè toàn bộ quyền riêng (cấp thêm / thu hồi so với chức danh) */
export async function updateUserPermissionsApi(userId: string, body: { grant: string[]; revoke: string[] }): Promise<void> {
  await apiClient.put(`user/${userId}/permissions`, body);
}

/** GET /user/:id/activity */
export async function getUserActivityApi(userId: string): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>(`user/${userId}/activity`)).data;
}
