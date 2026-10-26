import type { Staff, StaffInput, Team } from "../types/personnel.types";
import { mockPersonnelRepository } from "./mock-personnel.repository";

/**
 * API phân hệ Nhân sự & Phân quyền.
 * Mỗi hàm ứng với một endpoint backend (ghi ở chú thích); hiện chạy trên dữ liệu mock.
 * Khi nối backend chỉ cần thay thân hàm bằng lời gọi apiClient, component và hook không phải sửa.
 */

const repo = mockPersonnelRepository;

export type TeamInput = Partial<Pick<Team, "name" | "description" | "leaderId" | "roles" | "inactiveRoles" | "customFields">>;

// ── Đọc dữ liệu ──

/** GET /departments → danh sách phòng ban */
export async function getTeams(): Promise<Team[]> {
  return (await repo.getDataset()).teams;
}

/** GET /user → danh sách cán bộ */
export async function getStaffList(): Promise<Staff[]> {
  return (await repo.getDataset()).staff;
}

/** GET /user/:id → hồ sơ một cán bộ */
export async function getStaff(staffId: string): Promise<Staff> {
  const staff = (await repo.getDataset()).staff.find((s) => s.id === staffId);
  if (!staff) throw new Error("Không tìm thấy cán bộ.");
  return staff;
}

// ── Ghi dữ liệu ──

/** POST /auth/register → thêm cán bộ + tạo tài khoản */
export function createStaff(input: StaffInput): Promise<Staff> {
  return repo.createStaff(input);
}

/** PUT /user/:id → sửa hồ sơ cán bộ */
export function updateStaff(staffId: string, input: Partial<StaffInput>): Promise<Staff> {
  return repo.updateStaff(staffId, input);
}

/** PATCH /user/:id/lock | /unlock → khóa / mở lại tài khoản */
export function setAccountActive(staffId: string, active: boolean, reason?: string): Promise<Staff> {
  return repo.setAccountActive(staffId, active, reason);
}

/** POST /departments → thêm phòng ban */
export function createTeam(input: TeamInput & { name: string }): Promise<Team> {
  return repo.createTeam(input);
}

/** PATCH /departments/:id → sửa phòng ban (tên, vị trí, trường tùy biến) */
export function updateTeam(teamId: string, input: TeamInput): Promise<Team> {
  return repo.updateTeam(teamId, input);
}

