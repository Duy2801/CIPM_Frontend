import { isAxiosError } from "axios";
import { getStoredAccessToken, isBackendToken } from "@/features/auth/api/auth.api";

/**
 * Chọn nguồn dữ liệu: đăng nhập bằng tài khoản thật thì chỉ dùng backend (server lỗi / mất mạng thì báo lỗi),
 * chỉ tài khoản thử nghiệm (token "mock_...") mới chạy trên dữ liệu mock.
 */

/** Đang đăng nhập bằng token do backend cấp */
export function hasBackendSession(): boolean {
  return isBackendToken(getStoredAccessToken());
}

/** Câu báo lỗi từ backend: { message: string | string[] } */
export function apiErrorMessage(error: unknown, fallback = "Không thể hoàn tất thao tác, vui lòng thử lại."): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Backend chưa có API này (404) */
export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/** Gọi backend; không có phiên thật hoặc không kết nối được server thì chạy bản mock */
export async function withBackend<T>(remote: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!hasBackendSession()) return fallback();
  try {
    return await remote();
  } catch (error) {
    if (isAxiosError(error) && !error.response) {
      throw new Error("Không kết nối được máy chủ, vui lòng kiểm tra mạng và thử lại.");
    }
    throw new Error(apiErrorMessage(error));
  }
}
