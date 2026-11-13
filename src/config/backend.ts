import { isAxiosError } from "axios";
import { getStoredAccessToken, isBackendToken } from "@/shared/auth/api/auth.api";

export function hasBackendSession(): boolean {
  return isBackendToken(getStoredAccessToken());
}

export function apiErrorMessage(error: unknown, fallback = "Không thể hoàn tất thao tác, vui lòng thử lại."): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

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
