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
