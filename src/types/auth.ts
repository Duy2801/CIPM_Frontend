export type Role =
  | "ADMIN"
  | "DEPUTY_DIRECTOR"
  | "TECHNICAL_OFFICER"
  | "CHIEF_ACCOUNTANT"
  | "ACCOUNTANT"
  | "COMPENSATION_OFFICER"
  | "ADMINISTRATIVE_OFFICER"
  | (string & {});

export type Permission = `${string}:${string}`;

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  permissions: Permission[];
  username?: string;
  displayName?: string;
  roleName?: string;
  department?: string;
  initials?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  branchId?: string;
}
