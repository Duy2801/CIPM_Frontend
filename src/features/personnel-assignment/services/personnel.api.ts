import { toast } from "@/components/ui";
import type { CustomFieldDefinition } from "../types/custom-fields.types";
import type { Staff, StaffInput, Team, TeamId } from "../types/personnel.types";
import { getPermissionChangeHistory, getStaffProfileHistory, type ActivityEntry } from "../utils/activity-log";
import { getCustomFields, saveCustomFields } from "../utils/custom-fields-storage";
import { inferRoleCode, isLeaderTitle } from "../utils/role-code-inference";
import { withBackend } from "./backend";
import { mockPersonnelRepository } from "./mock-personnel.repository";
import * as backend from "../api/personnel.backend";
import {
  toActivityEntry,
  toApiDate,
  toApiGender,
  toApiRoleCode,
  toApiStaffCustomField,
  toApiUserUpdate,
  toCustomFieldDefinition,
  toStaff,
  toTeam,
  type ApiDepartment,
  type ApiDepartmentPosition,
  type ApiUser,
} from "./personnel.mapper";

/**
 * Phân hệ Nhân sự & Phân quyền.
 * Đăng nhập bằng tài khoản thật thì gọi backend (api/personnel.backend.ts) rồi chuyển dữ liệu sang dạng màn hình dùng;
 * tài khoản thử nghiệm hoặc server không phản hồi thì chạy trên dữ liệu mock (xem services/backend.ts).
 */

const repo = mockPersonnelRepository;

export type TeamInput = Partial<Pick<Team, "name" | "description" | "leaderId" | "roles" | "inactiveRoles" | "customFields">>;

// ── Phòng ban backend: màn hình dùng mã ngắn (BGD...), gọi API cần id (uuid) và mã vai trò của từng vị trí ──

let departmentsByTeamId = new Map<TeamId, ApiDepartment>();

async function fetchDepartments(): Promise<ApiDepartment[]> {
  const data = await backend.getDepartmentsApi();
  departmentsByTeamId = new Map(data.map((department) => [toTeam(department).id, department]));
  return data;
}

async function departmentOf(teamId: TeamId): Promise<ApiDepartment> {
  if (!departmentsByTeamId.has(teamId)) await fetchDepartments();
  const department = departmentsByTeamId.get(teamId);
  if (!department) throw new Error("Không tìm thấy phòng ban / tổ chuyên môn.");
  return department;
}

/** Danh sách vị trí gửi backend: vị trí sẵn có giữ vai trò cũ, vị trí mới suy vai trò theo tên */
function toPositions(teamId: TeamId, titles: string[], current: ApiDepartmentPosition[] = []): ApiDepartmentPosition[] {
  const roleOf = new Map(current.map((position) => [position.title.trim().toLowerCase(), position.roleCode]));
  return titles
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => ({
      title,
      roleCode: roleOf.get(title.toLowerCase()) ?? toApiRoleCode(inferRoleCode(teamId, title, isLeaderTitle(title))),
    }));
}

// ── Đọc dữ liệu ──

/** Danh sách phòng ban */
export function getTeams(): Promise<Team[]> {
  return withBackend(
    async () => (await fetchDepartments()).map(toTeam),
    async () => (await repo.getDataset()).teams,
  );
}

/** Danh sách cán bộ (đọc hết các trang) */
export function getStaffList(): Promise<Staff[]> {
  return withBackend(
    async () => {
      const users: ApiUser[] = [];
      for (let page = 1, totalPages = 1; page <= totalPages; page++) {
        const data = await backend.getUsersPageApi(page, 100);
        users.push(...data.items);
        totalPages = data.meta.totalPages;
      }
      return users.map((user) => toStaff(user));
    },
    async () => (await repo.getDataset()).staff,
  );
}

/** Hồ sơ một cán bộ */
export function getStaff(staffId: string): Promise<Staff> {
  return withBackend(
    async () => toStaff(await backend.getUserApi(staffId)),
    async () => {
      const staff = (await repo.getDataset()).staff.find((s) => s.id === staffId);
      if (!staff) throw new Error("Không tìm thấy cán bộ.");
      return staff;
    },
  );
}

/** Quyền thực tế của cán bộ (mã quyền backend, VD "projects:view") */
export function getStaffPermissionCodes(staffId: string): Promise<string[]> {
  return backend.getUserPermissionsApi(staffId);
}

/** Lịch sử thay đổi hồ sơ cán bộ */
export function getStaffActivity(staffId: string): Promise<ActivityEntry[]> {
  return withBackend(
    async () => (await backend.getUserActivityApi(staffId)).map(toActivityEntry),
    () => getStaffProfileHistory(staffId),
  );
}

/** Lịch sử thay đổi quyền */
export function getPermissionHistory(): Promise<ActivityEntry[]> {
  return withBackend(
    async () => (await backend.getAuditLogsApi("permissions")).map(toActivityEntry),
    () => getPermissionChangeHistory(),
  );
}

/** Danh mục trường tùy biến của hồ sơ cán bộ */
export function getStaffCustomFields(): Promise<CustomFieldDefinition[]> {
  return withBackend(
    async () => (await backend.getStaffCustomFieldsApi()).map(toCustomFieldDefinition),
    () => getCustomFields("staff"),
  );
}

// ── Ghi dữ liệu ──

/** Thêm cán bộ + tạo tài khoản (mật khẩu gửi qua email) */
export function createStaff(input: StaffInput): Promise<Staff> {
  return withBackend(
    async () => {
      const department = await departmentOf(input.teamId);
      const data = await backend.registerUserApi({
        fullName: input.name.trim(),
        email: input.email.trim(),
        dateOfBirth: toApiDate(input.dob),
        gender: toApiGender(input.gender),
        departmentId: department.id,
        positionTitle: input.title.trim(),
        employmentType: input.employment,
        customFields: input.customFields,
      });
      if (data.mailSent === false && data.temporaryPassword) {
        toast.warning(`Chưa gửi được email. Mật khẩu tạm của ${data.fullName}: ${data.temporaryPassword}`);
      }
      return toStaff(data, input.teamId);
    },
    () => repo.createStaff(input),
  );
}

/** Sửa hồ sơ cán bộ; có đổi vai trò thì gán / đổi vai trò */
export function updateStaff(staffId: string, input: Partial<StaffInput>): Promise<Staff> {
  return withBackend(
    async () => {
      const departmentId = input.teamId ? (await departmentOf(input.teamId)).id : undefined;
      const body = toApiUserUpdate(input, departmentId);
      if (Object.keys(body).length > 0) await backend.updateUserApi(staffId, body);

      if (input.roleCode) {
        const current = await getStaff(staffId);
        const toRoleCode = toApiRoleCode(input.roleCode);
        if (!current.roleCode) {
          await backend.setUserRolesApi(staffId, [toRoleCode]);
        } else if (current.roleCode !== input.roleCode) {
          await backend.changeUserRoleApi(staffId, toApiRoleCode(current.roleCode), toRoleCode);
        }
      }
      return getStaff(staffId);
    },
    () => repo.updateStaff(staffId, input),
  );
}

/**
 * Lưu quyền riêng của cán bộ để quyền thực tế đúng bằng `selected`.
 * Backend chỉ ghi đè từng quyền (cấp / chặn), nên gửi phần chênh lệch so với quyền hiện có.
 * Bản mock lưu phần khác biệt so với quyền theo chức danh (Staff.permissions / revokedPermissions).
 */
export function saveStaffPermissions(
  staffId: string,
  { selected, current, base }: { selected: string[]; current: string[]; base: string[] },
): Promise<void> {
  const not = (list: string[]) => (code: string) => !list.includes(code);
  return withBackend(
    () =>
      backend.updateUserPermissionsApi(staffId, {
        grant: selected.filter(not(current)),
        revoke: current.filter(not(selected)),
      }),
    async () => {
      await repo.updateStaff(staffId, { permissions: selected.filter(not(base)), revokedPermissions: base.filter(not(selected)) });
    },
  );
}

/** Khóa / mở lại tài khoản */
export function setAccountActive(staffId: string, active: boolean, reason?: string): Promise<Staff> {
  return withBackend(
    async () => {
      if (active) await backend.unlockUserApi(staffId);
      else await backend.lockUserApi(staffId, reason?.trim());
      return getStaff(staffId);
    },
    () => repo.setAccountActive(staffId, active, reason),
  );
}

/** Thêm phòng ban */
export function createTeam(input: TeamInput & { name: string }): Promise<Team> {
  return withBackend(
    async () => {
      const data = await backend.createDepartmentApi({
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        roles: toPositions("", input.roles ?? []),
      });
      await fetchDepartments();
      return toTeam(data);
    },
    () => repo.createTeam(input),
  );
}

/** Sửa phòng ban (tên, mô tả, vị trí) */
export function updateTeam(teamId: string, input: TeamInput): Promise<Team> {
  return withBackend(
    async () => {
      const department = await departmentOf(teamId);
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name.trim();
      if (input.description !== undefined) body.description = input.description.trim() || null;
      if (input.roles !== undefined) body.roles = toPositions(teamId, input.roles, department.roles ?? []);
      const data = await backend.updateDepartmentApi(department.id, body);
      await fetchDepartments();
      return toTeam(data);
    },
    () => repo.updateTeam(teamId, input),
  );
}

/** Lưu danh mục trường tùy biến của hồ sơ cán bộ */
export function saveStaffCustomFields(fields: CustomFieldDefinition[]): Promise<CustomFieldDefinition[]> {
  return withBackend(
    async () => (await backend.saveStaffCustomFieldsApi(fields.map(toApiStaffCustomField))).map(toCustomFieldDefinition),
    () => {
      saveCustomFields("staff", fields);
      return fields;
    },
  );
}
