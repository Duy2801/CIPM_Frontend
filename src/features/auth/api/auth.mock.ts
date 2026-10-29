import Cookies from "js-cookie";
import type { ApiResponse } from "@/config";
import type { AuthUser } from "@/types/auth";
import { getRoleEffectivePermissions } from "@/access-control";
import { findMockUser, MOCK_ROLES } from "../constants/mock-roles";
import type { AuthResponse, AuthTokens, LoginCredentials } from "../types/auth.types";
import { COOKIE_OPTIONS, normalizeAuthResponse, normalizePermissions, persistAuthSession, toAuthUser } from "./auth-session";

/**
 * Tài khoản thử nghiệm (mật khẩu mẫu 123456): dùng khi đặt NEXT_PUBLIC_USE_MOCK_AUTH=true
 * hoặc không kết nối được backend.
 */

export async function mockLogin(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const mockAccount = findMockUser(credentials.username, credentials.password);
  if (!mockAccount) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác. Mật khẩu mẫu là '123456'.");
  }

  const dynamicPerms = getRoleEffectivePermissions(mockAccount.id).length > 0
    ? getRoleEffectivePermissions(mockAccount.id)
    : getRoleEffectivePermissions(mockAccount.roleCode);
  const resolvedPerms = dynamicPerms.length > 0 ? dynamicPerms : mockAccount.permissions;

  const authData = normalizeAuthResponse({
    user: {
      ...mockAccount.user,
      roleId: mockAccount.id,
      authSource: "mock",
      permissions: Array.isArray(resolvedPerms) ? resolvedPerms : undefined,
    } as AuthResponse["user"],
    tokens: {
      accessToken: `mock_access_token_${mockAccount.roleCode.toLowerCase()}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${mockAccount.roleCode.toLowerCase()}_${Date.now()}`,
    },
    permissions: resolvedPerms,
  });

  persistAuthSession(authData, credentials.rememberMe ?? true);

  return {
    status: true,
    statusCode: 200,
    data: authData,
    message: `Đăng nhập thử nghiệm thành công với chức danh ${mockAccount.roleName}`,
  };
}

/** Cấp lại token giả cho phiên thử nghiệm */
export function mockRefreshToken(): ApiResponse<AuthTokens> {
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

/** Tài khoản mặc định khi chưa có phiên (tài khoản thử nghiệm đầu tiên) */
export function mockDefaultUser(): AuthUser {
  return toAuthUser(MOCK_ROLES[0].user, normalizePermissions(MOCK_ROLES[0].permissions));
}
