import Cookies from "js-cookie";
import apiClient, { type ApiResponse } from "@/config";
import type { AuthUser, Permission } from "@/types/auth";
import { findMockUser, MOCK_ROLES } from "../constants/mock-roles";
import type {
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  ModulePermissions,
  User,
} from "../types/auth.types";

export const USE_MOCK_AUTH: boolean =
  process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

function normalizePermissions(
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
    return toAuthUser(stored, stored.permissions ?? []);
  } catch (err) {
    console.error("Loi parse user_info tu Cookie:", err);
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get("access_token") ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredAccessToken());
}

export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  if (USE_MOCK_AUTH) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const mockAccount = findMockUser(credentials.username, credentials.password);

    if (!mockAccount) {
      throw {
        status: false,
        statusCode: 401,
        message: "Ten dang nhap hoac mat khau khong chinh xac. Mat khau mau la '123456'.",
      };
    }

    const authData = normalizeAuthResponse({
      user: mockAccount.user,
      tokens: {
        accessToken: `mock_access_token_${mockAccount.roleCode.toLowerCase()}_${Date.now()}`,
        refreshToken: `mock_refresh_token_${mockAccount.roleCode.toLowerCase()}_${Date.now()}`,
      },
      permissions: mockAccount.permissions,
    });

    persistAuthSession(authData, credentials.rememberMe ?? true);

    return {
      status: true,
      statusCode: 200,
      data: authData,
      message: `Dang nhap thanh cong voi vai tro ${mockAccount.roleName}`,
    };
  }

  try {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (response?.data) {
      response.data = normalizeAuthResponse(response.data);
      persistAuthSession(response.data, credentials.rememberMe ?? true);
    }
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Backend API khong phan hoi";
    console.warn("Tu dong chuyen sang mock auth:", message);

    const mockAccount = findMockUser(credentials.username, credentials.password);
    if (mockAccount) {
      const authData = normalizeAuthResponse({
        user: mockAccount.user,
        tokens: {
          accessToken: `mock_token_${Date.now()}`,
          refreshToken: `mock_refresh_${Date.now()}`,
        },
        permissions: mockAccount.permissions,
      });

      persistAuthSession(authData, credentials.rememberMe ?? true);

      return {
        status: true,
        statusCode: 200,
        data: authData,
        message: `Dang nhap thu nghiem thanh cong: ${mockAccount.roleName}`,
      };
    }

    throw error;
  }
}

export async function logout(): Promise<void> {
  if (!USE_MOCK_AUTH) {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.warn("Loi khi goi API logout:", error);
    }
  }

  clearAuthSession();

  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

export async function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  if (USE_MOCK_AUTH) {
    const stored = getStoredUser();
    if (stored) {
      return {
        status: true,
        statusCode: 200,
        data: stored,
      };
    }

    const defaultUser = MOCK_ROLES[0].user;
    return {
      status: true,
      statusCode: 200,
      data: toAuthUser(defaultUser, normalizePermissions(MOCK_ROLES[0].permissions)),
    };
  }

  const response = await apiClient.get<User & { permissions?: Permission[] }>("/auth/me");
  return {
    ...response,
    data: toAuthUser(response.data, response.data.permissions ?? []),
  };
}

export async function refreshToken(): Promise<ApiResponse<AuthTokens>> {
  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken) {
    throw new Error("Khong tim thay refresh token trong cookie");
  }

  if (USE_MOCK_AUTH) {
    const newTokens: AuthTokens = {
      accessToken: `mock_refreshed_access_${Date.now()}`,
      refreshToken: `mock_refreshed_refresh_${Date.now()}`,
    };
    Cookies.set("access_token", newTokens.accessToken, COOKIE_OPTIONS);
    return {
      status: true,
      statusCode: 200,
      data: newTokens,
    };
  }

  return apiClient.post<AuthTokens>("/auth/refresh", { refreshToken });
}
