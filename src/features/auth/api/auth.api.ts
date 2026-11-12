import Cookies from "js-cookie";
import { isAxiosError } from "axios";
import type { ApiResponse } from "@/config";
import type { AuthUser } from "@/types/auth";
import { expandBackendPermissions } from "@/access-control";
import type { AuthResponse, AuthTokens, BackendLoginResponse, LoginCredentials, LogoutResponse } from "../types/auth.types";
import {
  clearAuthSession,
  COOKIE_OPTIONS,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  isBackendToken,
  persistAuthSession,
  toAuthUser,
} from "./auth-session";
import { changePasswordApi, getMeApi, loginApi, logoutApi, refreshTokenApi } from "./auth.backend";
import { mockDefaultUser, mockLogin, mockRefreshToken } from "./auth.mock";

/**
 * Xác thực của ứng dụng: gọi backend thật (auth.backend.ts), mất kết nối thì dùng tài khoản thử nghiệm (auth.mock.ts).
 * Kết quả đăng nhập được useAuth lưu vào zustand (useAuthStore); cookie giữ phiên khi tải lại trang.
 */

export {
  clearAuthSession,
  getStoredAccessToken,
  getStoredUser,
  isAuthenticated,
  isBackendToken,
  normalizeAuthResponse,
  persistAuthSession,
  toAuthUser,
} from "./auth-session";

/** Đặt NEXT_PUBLIC_USE_MOCK_AUTH=true để luôn dùng tài khoản thử nghiệm */
export const USE_MOCK_AUTH: boolean = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

/** Dữ liệu backend trả về → thông tin người dùng ứng dụng dùng (backend DIRECTOR = màn hình ADMIN) */
function toAuthData(data: BackendLoginResponse): AuthResponse {
  const { user } = data;
  const backendRole = user.roles[0] ?? "";
  const roleCode = backendRole === "DIRECTOR" ? "ADMIN" : backendRole;
  return {
    user: {
      id: user.id,
      username: user.email,
      email: user.email,
      displayName: user.fullName,
      roleCode,
      roleName: user.positionTitle || roleCode,
      department: user.department?.name ?? "",
      isLead: user.roles.some((role) => role.toUpperCase().endsWith("_LEAD")),
      initials: user.fullName.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? "").join(""),
      authSource: "backend",
      permissions: data.permissions,
    },
    tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken },
    permissions: data.permissions,
  };
}

export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  if (USE_MOCK_AUTH) return mockLogin(credentials);

  let data: BackendLoginResponse;
  try {
    data = await loginApi(credentials.username.trim().toLowerCase(), credentials.password);
  } catch (error) {
    // Không kết nối được server → đăng nhập bằng tài khoản thử nghiệm
    if (isAxiosError(error) && !error.response) return mockLogin(credentials);
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const rawMessage = isAxiosError<{ message?: string | string[] }>(error) ? error.response?.data?.message : undefined;
    const backendMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    // 400: sai định dạng (email không hợp lệ, mật khẩu dưới 8 ký tự...) → hiện đúng câu backend báo
    if (status === 400) throw new Error(backendMessage || "Vui lòng đăng nhập bằng email công vụ (VD: ten@hatien.gov.vn).");
    if (status === 403) throw new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản trị.");
    if (status === 401) throw new Error("Email hoặc mật khẩu không chính xác.");
    throw new Error("Đăng nhập thất bại, vui lòng thử lại.");
  }

  const authData = toAuthData(data);
  // Cookie giữ mã quyền backend để khôi phục phiên khi tải lại trang
  persistAuthSession(authData, credentials.rememberMe ?? true);
  // Phiên đang chạy dùng quyền đã đổi sang mã màn hình
  const permissions = expandBackendPermissions(data.permissions);
  return {
    status: true,
    statusCode: 200,
    data: { ...authData, user: { ...authData.user, permissions }, permissions },
    message: `Chào mừng ${data.user.fullName}!`,
  };
}

/** Đăng xuất: xóa phiên phía client kể cả khi API lỗi (token hết hạn, mất mạng...) */
export async function logout(): Promise<LogoutResponse> {
  let result: LogoutResponse = { status: true, statusCode: 200 };
  if (isBackendToken(getStoredAccessToken())) {
    try {
      await logoutApi();
    } catch (error) {
      console.warn("Lỗi khi gọi API đăng xuất:", error);
      result = { status: false, statusCode: 0 };
    }
  }

  clearAuthSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  return result;
}

/**
 * Lấy lại tài khoản và quyền hiện tại từ backend (GET /auth/me), ghi đè phiên đã lưu.
 * Dùng khi quyền được cấp / thu hồi sau lúc đăng nhập. Tài khoản thử nghiệm trả về null.
 */
export async function refreshSessionUser(): Promise<AuthUser | null> {
  const accessToken = getStoredAccessToken();
  if (!isBackendToken(accessToken)) return null;
  const me = await getMeApi();
  const authData = toAuthData({ ...me, accessToken, refreshToken: getStoredRefreshToken() ?? "" });
  Cookies.set("user_info", JSON.stringify(authData.user), { ...COOKIE_OPTIONS, expires: 7 });
  return toAuthUser(authData.user, expandBackendPermissions(me.permissions));
}

/** Tài khoản đang đăng nhập (đọc từ phiên đã lưu lúc đăng nhập) */
export async function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  const stored = getStoredUser();
  if (stored) return { status: true, statusCode: 200, data: stored };
  if (isBackendToken(getStoredAccessToken())) throw new Error("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.");

  return { status: true, statusCode: 200, data: mockDefaultUser() };
}

export async function refreshToken(): Promise<ApiResponse<AuthTokens>> {
  const storedRefreshToken = getStoredRefreshToken();
  if (!storedRefreshToken) {
    throw new Error("Không tìm thấy refresh token trong cookie");
  }
  if (!isBackendToken(getStoredAccessToken())) return mockRefreshToken();

  const accessToken = await refreshTokenApi(storedRefreshToken);
  Cookies.set("access_token", accessToken, COOKIE_OPTIONS);
  return { status: true, statusCode: 200, data: { accessToken, refreshToken: storedRefreshToken } };
}

/**
 * Đổi mật khẩu tài khoản đang đăng nhập. Tài khoản thử nghiệm (không có phiên backend) trả về false
 * để màn hình tự xử lý theo bản mock.
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  if (!isBackendToken(getStoredAccessToken())) return false;
  try {
    await changePasswordApi(oldPassword, newPassword);
    return true;
  } catch (error) {
    const rawMessage = isAxiosError<{ message?: string | string[] }>(error) ? error.response?.data?.message : undefined;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    throw new Error(message || "Không đổi được mật khẩu, vui lòng thử lại.");
  }
}
