import { isAxiosError } from "axios";
import { getStoredAccessToken, isBackendToken } from "@/features/auth/api/auth.api";

/**
 * Chọn nguồn dữ liệu cho phân hệ Nhân sự: backend khi đăng nhập bằng tài khoản thật và server phản hồi,
 * ngược lại chạy trên dữ liệu mock (tài khoản thử nghiệm dùng token "mock_...", server tắt / mất mạng).
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

/** Gọi backend; không có phiên thật hoặc không kết nối được server thì chạy bản mock */
export async function withBackend<T>(remote: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!hasBackendSession()) return fallback();
  try {
    return await remote();
  } catch (error) {
    if (isAxiosError(error) && !error.response) {
      console.warn("Không kết nối được backend, dùng dữ liệu mock:", error.message);
      return fallback();
    }
    throw new Error(apiErrorMessage(error));
  }
}
