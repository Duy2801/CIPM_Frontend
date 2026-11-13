import type { PersonnelDataset, Staff, StaffInput, Team } from "../types/personnel.types";

/** Ranh giới dữ liệu M5 – backend chỉ cần cung cấp implementation cùng interface */
export interface PersonnelRepository {
  createTeam(input: { id?: string; name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }): Promise<Team>;
  updateTeam(id: string, input: Partial<{ name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }>): Promise<Team>;
  getDataset(): Promise<PersonnelDataset>;
  setAccountActive(staffId: string, active: boolean, reason?: string): Promise<Staff>;
  createStaff(input: StaffInput): Promise<Staff>;
  updateStaff(staffId: string, input: Partial<StaffInput>): Promise<Staff>;
}
