import apiClient from "@/config";
import type {
  ApiAuditLog,
  ApiDepartment,
  ApiDepartmentPosition,
  ApiPage,
  ApiStaffCustomField,
  ApiUser,
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

/** PATCH /user/:id/lock */
export async function lockUserApi(userId: string, reason?: string): Promise<void> {
  await apiClient.patch(`user/${userId}/lock`, { reason });
}

/** PATCH /user/:id/unlock */
export async function unlockUserApi(userId: string): Promise<void> {
  await apiClient.patch(`user/${userId}/unlock`, {});
}

// ── Quyền & lịch sử ──

/** GET /user/:id/permissions — mã quyền backend, VD "projects:view" */
export async function getUserPermissionsApi(userId: string): Promise<string[]> {
  return (await apiClient.get<{ userId: string; permissions: string[] }>(`user/${userId}/permissions`)).data.permissions;
}

/** PUT /user/:id/permissions — cấp / chặn từng quyền */
export async function updateUserPermissionsApi(userId: string, body: { grant: string[]; revoke: string[] }): Promise<void> {
  await apiClient.put(`user/${userId}/permissions`, body);
}

/** GET /user/:id/activity */
export async function getUserActivityApi(userId: string): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>(`user/${userId}/activity`)).data;
}

/** GET /audit-logs?module=... */
export async function getAuditLogsApi(module: string): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>("audit-logs", { params: { module } })).data;
}

// ── Trường tùy biến hồ sơ ──

/** GET /settings/staff-custom-fields */
export async function getStaffCustomFieldsApi(): Promise<ApiStaffCustomField[]> {
  return (await apiClient.get<ApiStaffCustomField[]>("settings/staff-custom-fields")).data;
}

/** PUT /settings/staff-custom-fields */
export async function saveStaffCustomFieldsApi(fields: ApiStaffCustomField[]): Promise<ApiStaffCustomField[]> {
  return (await apiClient.put<ApiStaffCustomField[]>("settings/staff-custom-fields", fields)).data;
}
