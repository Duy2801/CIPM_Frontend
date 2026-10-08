/**
 * features/auth/index.ts — Barrel export cho phân hệ Xác thực & Phân quyền
 */

// Types
export * from "./types/auth.types";

// Mock Roles & Data
export {
  MOCK_ROLES,
  findMockUser,
  getMockUserByRole,
} from "./constants/mock-roles";

// API Services
export {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  persistAuthSession,
  clearAuthSession,
  getStoredUser,
  getStoredAccessToken,
  isAuthenticated,
  USE_MOCK_AUTH,
  toAuthUser,
  normalizeAuthResponse,
} from "./api/auth.api";

// Hooks
export { useAuth } from "./hooks/useAuth";

// Components
export { default as LoginForm } from "./components/LoginForm";
export { default as QuickRoleSelector } from "./components/QuickRoleSelector";
export { default as LoginView } from "./components/LoginView";
