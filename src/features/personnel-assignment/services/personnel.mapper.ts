import type { CustomFieldDefinition } from "../types/custom-fields.types";
import type { Employment, Staff, StaffInput, Team, TeamId } from "../types/personnel.types";
import { isLeaderTitle } from "../utils/role-code-inference";

/**
 * Chuyển dữ liệu backend (cipm-service) ↔ kiểu dữ liệu màn Nhân sự.
 * Màn hình dùng mã phòng ban ngắn (BGD, PGD...) và mã vai trò ADMIN cho Giám đốc, nên đổi mã ở đây
 * để các quy tắc sẵn có (suy vai trò, sắp xếp ban) chạy giống dữ liệu mock.
 */

// ── Kiểu dữ liệu backend ──

export type ApiGender = "MALE" | "FEMALE" | "OTHER";

export interface ApiRoleRef {
  code: string;
  name: string;
  assignedAt: string;
  isActive: boolean;
}

export interface ApiDepartmentRef {
  id: string;
  code: string;
  name: string;
}

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  citizenId?: string | null;
  gender?: ApiGender | null;
  dateOfBirth?: string | null;
  employmentType?: string | null;
  positionTitle?: string | null;
  status: "ACTIVE" | "LOCKED" | "HIDDEN";
  lockReason?: string | null;
  customFields?: Record<string, unknown> | null;
  department?: ApiDepartmentRef | null;
  departmentId?: string | null;
  roles?: ApiRoleRef[];
}

export interface ApiDepartmentPosition {
  title: string;
  roleCode: string;
}

export interface ApiDepartment {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  roles?: ApiDepartmentPosition[] | null;
  count?: number;
  users?: ApiUser[];
}

export interface ApiPage<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiRole {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
  permissionCodes: string[];
}

export interface ApiAuditLog {
  id: string;
  at: string;
  actorName?: string | null;
  actorRole?: string | null;
  module: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  changes?: { label: string; from?: string; to?: string }[];
  note?: string | null;
}

export interface ApiStaffCustomField {
  key: string;
  label: string;
  type: CustomFieldDefinition["type"];
  options?: string[];
  required?: boolean;
  active?: boolean;
}

// ── Mã phòng ban / vai trò ──

const TEAM_ID_BY_DEPARTMENT_CODE: Record<string, TeamId> = {
  DIRECTORATE: "BGD",
  DEPUTY_DIRECTORATE: "PGD",
  TECHNICAL: "GSKT",
  COMPENSATION: "BT",
  ADMIN: "HCTH",
};

export const toTeamId = (departmentCode: string): TeamId => TEAM_ID_BY_DEPARTMENT_CODE[departmentCode] ?? departmentCode;

/** Giám đốc: backend DIRECTOR, màn hình ADMIN */
export const toRoleCode = (apiRoleCode: string) => (apiRoleCode === "DIRECTOR" ? "ADMIN" : apiRoleCode);
export const toApiRoleCode = (roleCode: string) => (roleCode === "ADMIN" ? "DIRECTOR" : roleCode);

/** Mã quyền ma trận "m2_projects:view" ↔ mã quyền backend "projects:view" */
export const toApiPermissionCode = (matrixCode: string) => matrixCode.replace(/^m\d+_/, "");

// ── Ngày sinh, giới tính, hình thức tuyển dụng ──

/** "1989-12-03T00:00:00.000Z" → "03/12/1989" */
export function toDob(iso?: string | null): string | undefined {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : undefined;
}

/** "03/12/1989" → "1989-12-03"; chuỗi rỗng → null (xóa ngày sinh) */
export function toApiDate(dob?: string): string | null {
  const match = dob?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(dob ?? "") ? dob! : null;
}

const toGender = (gender?: ApiGender | null): Staff["gender"] =>
  gender === "MALE" ? "Nam" : gender === "FEMALE" ? "Nữ" : undefined;

export const toApiGender = (gender?: Staff["gender"]): ApiGender =>
  gender === "Nam" ? "MALE" : gender === "Nữ" ? "FEMALE" : "OTHER";

const toEmployment = (value?: string | null): Employment => (value === "Hợp đồng" ? "Hợp đồng" : "Viên chức");

// ── Bản ghi ──

export function toStaff(user: ApiUser, teamId?: TeamId): Staff {
  const activeRole = user.roles?.find((role) => role.isActive) ?? user.roles?.[0];
  return {
    id: user.id,
    name: user.fullName,
    title: user.positionTitle ?? "",
    citizenId: user.citizenId ?? undefined,
    teamId: teamId ?? (user.department ? toTeamId(user.department.code) : ""),
    roleCode: activeRole ? toRoleCode(activeRole.code) : "",
    employment: toEmployment(user.employmentType),
    phone: "",
    email: user.email,
    accountActive: user.status === "ACTIVE",
    lockReason: user.lockReason ?? undefined,
    dob: toDob(user.dateOfBirth),
    gender: toGender(user.gender),
    customFields: user.customFields ?? undefined,
  };
}

export function toTeam(department: ApiDepartment): Team {
  const leader = department.users?.find((user) => isLeaderTitle(user.positionTitle ?? ""));
  return {
    id: toTeamId(department.code),
    name: department.name,
    description: department.description ?? "",
    leaderId: leader?.id ?? "",
    roles: (department.roles ?? []).map((position) => position.title),
    inactiveRoles: [],
  };
}

/** Phần hồ sơ gửi lên PUT /user/:id (chỉ các trường có trong input) */
export function toApiUserUpdate(input: Partial<StaffInput>, departmentId?: string) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.fullName = input.name.trim();
  if (input.email !== undefined) body.email = input.email.trim();
  if (input.title !== undefined) body.positionTitle = input.title.trim() || null;
  if (departmentId) body.departmentId = departmentId;
  if (input.employment !== undefined) body.employmentType = input.employment;
  if (input.dob !== undefined) body.dateOfBirth = toApiDate(input.dob);
  if (input.gender !== undefined) body.gender = input.gender ? toApiGender(input.gender) : null;
  if (input.citizenId !== undefined) body.citizenId = input.citizenId.trim() || null;
  if (input.customFields !== undefined) body.customFields = input.customFields ?? null;
  return body;
}

export function toActivityEntry(log: ApiAuditLog) {
  return {
    id: log.id,
    at: log.at,
    actorName: log.actorName || "Hệ thống",
    actorRole: log.actorRole ?? undefined,
    module: log.module,
    action: log.action,
    targetType: (log.targetType === "user" ? "staff" : log.targetType === "department" ? "team" : log.targetType) as
      | "staff"
      | "team"
      | "role"
      | undefined,
    targetId: log.targetId ?? undefined,
    targetName: log.targetName ?? undefined,
    changes: log.changes ?? [],
    note: log.note ?? undefined,
  };
}

export const toCustomFieldDefinition = (field: ApiStaffCustomField): CustomFieldDefinition => ({
  id: field.key,
  name: field.key,
  label: field.label,
  type: field.type,
  options: field.options,
  required: field.required,
  active: field.active,
});

export const toApiStaffCustomField = (field: CustomFieldDefinition): ApiStaffCustomField => ({
  key: field.name,
  label: field.label,
  type: field.type,
  ...(field.options?.length ? { options: field.options } : {}),
  required: field.required ?? false,
  active: field.active ?? true,
});
