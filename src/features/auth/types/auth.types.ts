import type { AuthUser, Permission, Role } from "@/types/auth";

export type RoleCode = Role;

export type PermissionAction =
  | "view"
  | "input"
  | "approve"
  | "configure"
  | "export";

export type AppModule =
  | "dashboard"
  | "m2_projects"
  | "m3_construction_procedures"
  | "m4_finance_settlement"
  | "m5_personnel_assignment"
  | "m6_site_clearance"
  | "m7_bidding"
  | "m8_warranty"
  | "legal_library";

export type ModulePermissions = Partial<Record<AppModule, PermissionAction[]>>;

export interface User extends Omit<AuthUser, "name" | "role" | "permissions"> {
  username: string;
  displayName: string;
  roleCode: RoleCode;
  roleName: string;
  department: string;
  initials: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Lỗi mặc định của NestJS (không đi qua interceptor nên không có `status`) */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * POST /auth/logout
 * Không có body; accessToken gửi qua header `Authorization: Bearer <accessToken>`
 * (apiClient tự gắn từ cookie).
 */
export type LogoutRequest = Record<string, never>;

/** Thành công: `{ "status": true, "statusCode": 201 }` — backend không trả `data` */
export interface LogoutResponse {
  status: boolean;
  statusCode: number;
  message?: string;
}

/** POST /auth/login (backend cipm-service): body `{ email, password }` */
export interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    positionTitle?: string | null;
    department?: { id: string; code: string; name: string } | null;
    roles: string[];
  };
  /** Quyền thực tế của tài khoản, VD "projects:view" */
  userPermissions: string[];
}

export interface AuthResponse {
  user: User & { permissions?: Permission[] };
  tokens: AuthTokens;
  permissions?: Permission[] | ModulePermissions;
}

export interface MockRoleAccount {
  id: string;
  roleCode: RoleCode;
  roleName: string;
  department: string;
  isLead?: boolean;
  aliases?: string[];
  user: User;
  credentials: {
    username: string;
    password: string;
  };
  permissions: ModulePermissions;
  description: string;
  accessibleSummary: string[];
  badgeColor: "teal" | "gold" | "blue" | "red" | "purple" | "green";
}
