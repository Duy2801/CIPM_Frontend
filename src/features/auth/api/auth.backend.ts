import apiClient from "@/config";
import type { BackendLoginResponse } from "../types/auth.types";

/**
 * Các API xác thực của backend thật — chỉ gọi API và trả dữ liệu backend, không xử lý thêm.
 * Lưu phiên / lưu vào store do auth.api.ts và useAuth đảm nhận.
 */

/** POST /auth/login */
export async function loginApi(email: string, password: string): Promise<BackendLoginResponse> {
  const response = await apiClient.post<BackendLoginResponse>("auth/login", { email, password });
  return response.data;
}

/** POST /auth/logout — backend xóa refresh token */
export async function logoutApi(): Promise<void> {
  await apiClient.post("auth/logout", {});
}

/** POST /auth/refresh — trả accessToken mới (refreshToken giữ nguyên) */
export async function refreshTokenApi(refreshToken: string): Promise<string> {
  const response = await apiClient.post<{ accessToken: string }>("auth/refresh", {}, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  return response.data.accessToken;
}
