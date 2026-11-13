import { LEGACY_BACKEND_PERMISSION_CODES } from "@/access-control";
import type { Employment, Staff, StaffInput, Team, TeamId } from "../types/personnel.types";
import { isLeaderTitle } from "../utils/role-code-inference";

/**
 * Chuyển dữ liệu backend (cipm-service) ↔ kiểu dữ liệu màn Nhân sự.
 * Màn hình dùng mã phòng ban ngắn (BGD, PGD...) và mã vai trò ADMIN cho Giám đốc, nên đổi mã ở đây
 * để các quy tắc sẵn có (suy vai trò, sắp xếp ban) chạy giống dữ liệu mock.
 */

// ── Kiểu dữ liệu backend ──

/** "Nam" | "Nữ" (dữ liệu cũ có thể là "MALE" | "FEMALE") */
export type ApiGender = string;

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
  phone?: string | null;
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

/** GET /user/:id/permissions */
export interface ApiUserPermissions {
  userId: string;
  /** Quyền mặc định theo chức danh */
  rolePermissions?: string[];
  /** Quyền riêng cấp thêm / thu hồi so với chức danh */
  grant?: string[];
  revoke?: string[];
  /** Quyền thực tế = chức danh + cấp thêm − thu hồi */
  effectivePermissions?: string[];
  /** Kiểu cũ (cipm-service): chỉ có quyền thực tế */
  permissions?: string[];
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

// ── Mã phòng ban / vai trò ──

const TEAM_ID_BY_DEPARTMENT_CODE: Record<string, TeamId> = {
  // cipm-service
  DIRECTORATE: "BGD",
  DEPUTY_DIRECTORATE: "PGD",
  TECHNICAL: "GSKT",
  COMPENSATION: "BT",
  ADMIN: "HCTH",
  // BQL-HaTien (BGD giữ nguyên; TTC_KT, TKH_TH chưa có tổ tương ứng trên màn hình nên giữ mã gốc)
  TGS_KT: "GSKT",
  TBT_GPMB: "BT",
};

export const toTeamId = (departmentCode: string): TeamId => TEAM_ID_BY_DEPARTMENT_CODE[departmentCode] ?? departmentCode;

/** Giám đốc: backend DIRECTOR, màn hình ADMIN */
export const toRoleCode = (apiRoleCode: string) => (apiRoleCode === "DIRECTOR" ? "ADMIN" : apiRoleCode);
export const toApiRoleCode = (roleCode: string) => (roleCode === "ADMIN" ? "DIRECTOR" : roleCode);

/** Vai trò màn hình suy từ tên chức danh → vai trò backend BQL-HaTien (khi phòng ban chưa có vị trí cùng cấp để lấy theo) */
const API_ROLE_BY_INFERRED: Record<string, { lead: string; member: string }> = {
  ADMIN: { lead: "DIRECTOR", member: "DIRECTOR" },
  DEPUTY_DIRECTOR: { lead: "DEPUTY_DIRECTOR", member: "DEPUTY_DIRECTOR" },
  TECHNICAL_OFFICER: { lead: "TECH_LEAD", member: "TECH_MEMBER" },
  COMPENSATION_OFFICER: { lead: "COMPENSATION_LEAD", member: "COMPENSATION_MEMBER" },
  CHIEF_ACCOUNTANT: { lead: "KTT", member: "KTT" },
  ACCOUNTANT: { lead: "KTV", member: "KTV" },
  ADMINISTRATIVE_OFFICER: { lead: "ADMIN_GENERAL", member: "ADMIN_OFFICE" },
};

/**
 * Vai trò backend cho một vị trí mới của phòng ban: lấy vai trò của vị trí cùng cấp đang có
 * (phó → DEPUTY_*, trưởng → *_LEAD / DIRECTOR / KTT, còn lại → thành viên); không có thì đổi từ vai trò suy theo tên.
 */
export function toApiPositionRole(
  inferredRoleCode: string,
  title: string,
  isLeader: boolean,
  current: ApiDepartmentPosition[],
): string {
  const codes = current.map((position) => position.roleCode);
  const isDeputy = /phó/i.test(title);
  const sameLevel = isDeputy
    ? codes.find((code) => code.startsWith("DEPUTY"))
    : isLeader
      ? codes.find((code) => !code.startsWith("DEPUTY") && /LEAD|DIRECTOR|KTT/.test(code))
      : codes.find((code) => /MEMBER|STAFF|OFFICE|KTV/.test(code));
  if (sameLevel) return sameLevel;
  const mapped = API_ROLE_BY_INFERRED[inferredRoleCode];
  return mapped ? (isLeader ? mapped.lead : mapped.member) : toApiRoleCode(inferredRoleCode);
}

export const toApiPermissionCode = (matrixCode: string) => LEGACY_BACKEND_PERMISSION_CODES[matrixCode] ?? matrixCode;

// ── Ngày sinh, giới tính, hình thức tuyển dụng ──

const pad2 = (value: string | number) => String(value).padStart(2, "0");

/**
 * Ngày sinh backend (chuỗi tự do) → "DD/MM/YYYY" màn hình dùng.
 * Backend lưu chủ yếu dạng "MM/DD/YYYY" ("10/23/1977", "3/12/1989"); số đầu lớn hơn 12 thì là "DD/MM/YYYY" ("19/4/1979").
 * Nhận cả ISO "1977-10-23..." và chỉ có năm ("1996").
 */
export function toDob(value?: string | null): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const parts = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) {
    const [first, second] = [Number(parts[1]), Number(parts[2])];
    const [day, month] = first > 12 ? [first, second] : [second, first];
    return `${pad2(day)}/${pad2(month)}/${parts[3]}`;
  }
  return text;
}

/** Ngày sinh màn hình "DD/MM/YYYY" → "YYYY-MM-DD" (định dạng ghi trong Swagger); chỉ có năm thì giữ nguyên; rỗng → null */
export function toApiDate(dob?: string): string | null {
  const text = dob?.trim();
  if (!text) return null;
  const vn = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vn) return `${vn[3]}-${pad2(vn[2])}-${pad2(vn[1])}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}$/.test(text)) return text;
  return null;
}

/** Backend lưu "Nam" / "Nữ" (vẫn đọc được "MALE" / "FEMALE" của dữ liệu cũ) */
const toGender = (gender?: ApiGender | null): Staff["gender"] =>
  gender === "Nam" || gender === "MALE" ? "Nam" : gender === "Nữ" || gender === "FEMALE" ? "Nữ" : undefined;

export const toApiGender = (gender?: Staff["gender"]): ApiGender | null => gender ?? null;

/** Hình thức tuyển dụng: backend trả gì hiện nấy */
const toEmployment = (value?: string | null): Employment => value ?? "";

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
    phone: user.phone ?? "",
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

/**
 * Phần hồ sơ gửi lên PUT /user/:id (chỉ các trường có trong input).
 * Backend từ chối trường lạ (400), nên chỉ gửi đúng các trường của UpdateUserDto — chưa có CCCD.
 */
export function toApiUserUpdate(input: Partial<StaffInput>, departmentId?: string) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.fullName = input.name.trim();
  if (input.email !== undefined) body.email = input.email.trim();
  if (input.phone !== undefined) body.phone = input.phone.trim();
  if (input.title !== undefined) body.positionTitle = input.title.trim();
  if (departmentId) body.departmentId = departmentId;
  if (input.employment !== undefined) body.employmentType = input.employment;
  if (input.dob !== undefined) body.dateOfBirth = toApiDate(input.dob);
  if (input.gender !== undefined) body.gender = toApiGender(input.gender);
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
