import Cookies from "js-cookie";
import type { AuthUser, Permission } from "@/types/auth";
import { getUserEffectivePermissions } from "@/access-control";
import type { AuthResponse, ModulePermissions, User } from "../types/auth.types";

/**
 * Phiên đăng nhập phía client (cookie): lưu / đọc / xóa token và thông tin tài khoản.
 * Dùng chung cho đăng nhập backend thật và tài khoản thử nghiệm.
 */

/** Token do backend cấp (token của tài khoản thử nghiệm bắt đầu bằng "mock_") */
export const isBackendToken = (token?: string | null): token is string => Boolean(token) && !token!.startsWith("mock_");

export const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

export function normalizePermissions(
  permissions?: AuthResponse["permissions"],
): Permission[] {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;

  return Object.entries(permissions as ModulePermissions).flatMap(
    ([module, actions]) =>
      (actions ?? []).map((action) => `${module}:${action}` as Permission),
  );
}

export function toAuthUser(
  user: User,
  permissions: Permission[] = [],
): AuthUser {
  return {
    ...user,
    name: user.displayName,
    role: user.roleCode,
    permissions,
  };
}

export function normalizeAuthResponse(authData: AuthResponse): AuthResponse {
  const permissions = normalizePermissions(authData.user.permissions ?? authData.permissions);

  return {
    ...authData,
    user: {
      ...authData.user,
      permissions,
    },
    permissions,
  };
}

export function persistAuthSession(authData: AuthResponse, rememberMe: boolean = true) {
  const normalizedAuthData = normalizeAuthResponse(authData);
  const expires = rememberMe ? 7 : undefined;

  Cookies.set("access_token", normalizedAuthData.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    expires,
  });

  Cookies.set("refresh_token", normalizedAuthData.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    expires: rememberMe ? 30 : undefined,
  });

  Cookies.set("user_info", JSON.stringify(normalizedAuthData.user), {
    ...COOKIE_OPTIONS,
    expires,
  });
}

export function clearAuthSession() {
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
  Cookies.remove("user_info", { path: "/" });
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userInfoStr = Cookies.get("user_info");
  if (!userInfoStr) return null;

  try {
    const stored = JSON.parse(userInfoStr) as User & { permissions?: Permission[] };
    const authUser = toAuthUser(stored, stored.permissions ?? []);
    const dynamicPerms = getUserEffectivePermissions(authUser);
    return {
      ...authUser,
      permissions: dynamicPerms.length > 0 ? dynamicPerms : authUser.permissions,
    };
  } catch (err) {
    console.error("Loi parse user_info tu Cookie:", err);
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get("access_token") ?? null;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get("refresh_token") ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredAccessToken());
}
