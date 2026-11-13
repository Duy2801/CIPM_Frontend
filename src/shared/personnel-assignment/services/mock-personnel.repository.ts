import { PERSONNEL_MOCK_DATA } from "../constants/personnel-mock-data";
import type { PersonnelDataset, Staff, Team, TeamId } from "../types/personnel.types";
import type { PersonnelRepository } from "./personnel.repository";

const clone = <T,>(value: T): T => structuredClone(value);
const STORAGE_KEY = "cipm_personnel_test_flow_v10";

/** Trường tùy biến rác còn sót từ dữ liệu thử cũ */
const removeJunkCustomFields = (fields?: Record<string, unknown>) => {
  if (!fields) return;
  for (const k of Object.keys(fields)) {
    if (/fdsaf/i.test(k)) delete fields[k];
  }
};

function loadDataset(): PersonnelDataset {
  if (typeof window === "undefined") return clone(PERSONNEL_MOCK_DATA);
  try {
    window.localStorage.removeItem("cipm_personnel_test_flow_v2");
    window.localStorage.removeItem("cipm_personnel_test_flow_v3");
    window.localStorage.removeItem("cipm_personnel_test_flow_v4");
    window.localStorage.removeItem("cipm_personnel_test_flow_v5");
    window.localStorage.removeItem("cipm_personnel_test_flow_v6");
    window.localStorage.removeItem("cipm_personnel_test_flow_v7");
    window.localStorage.removeItem("cipm_personnel_test_flow_v8");
    window.localStorage.removeItem("cipm_personnel_test_flow_v9");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PersonnelDataset>;
      if (Array.isArray(parsed.teams) && Array.isArray(parsed.staff)) {
        const dataset: PersonnelDataset = { teams: parsed.teams, staff: parsed.staff };
        dataset.teams.forEach((team) => {
          // Phòng ban chưa có vị trí → lấy lại vị trí mặc định
          if (!team.roles || team.roles.length === 0) {
            const baseline = PERSONNEL_MOCK_DATA.teams.find((t) => t.id === team.id);
            if (baseline?.roles) team.roles = clone(baseline.roles);
          }
          removeJunkCustomFields(team.customFields);
        });
        dataset.staff.forEach((person) => removeJunkCustomFields(person.customFields));
        return dataset;
      }
    }
  } catch {
    // Dữ liệu thử cũ không hợp lệ: bắt đầu từ bộ dữ liệu mẫu.
  }
  return clone(PERSONNEL_MOCK_DATA);
}

export function createMockPersonnelRepository(): PersonnelRepository {
  const dataset = loadDataset();

  const persistDataset = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    }
  };

  const repository: PersonnelRepository = {
    async createTeam(input: { id?: string; name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }): Promise<Team> {
      if (!input.name?.trim()) {
        throw new Error("Tên phòng ban / tổ chuyên môn không được để trống.");
      }

      const generatedCode = (
        input.id?.trim() ||
        input.name
          .trim()
          .split(/[\s–-]+/)
          .filter(Boolean)
          .map((w) => w[0]?.toUpperCase() || "")
          .join("") ||
        `PB_${Date.now()}`
      ).toUpperCase();

      const existingId = dataset.teams.find((t) => t.id.toLowerCase() === generatedCode.toLowerCase());
      const finalId = existingId ? `${generatedCode}_${Date.now().toString().slice(-4)}` : generatedCode;

      const newTeam: Team = {
        id: finalId as TeamId,
        name: input.name.trim(),
        description: input.description?.trim() || "",
        leaderId: input.leaderId || "",
        roles: input.roles ? input.roles.map((r) => r.trim()).filter(Boolean) : [],
        inactiveRoles: input.inactiveRoles ? input.inactiveRoles.map((r) => r.trim()).filter(Boolean) : [],
        customFields: input.customFields,
      };

      dataset.teams.push(newTeam);

      if (input.leaderId) {
        const staffIndex = dataset.staff.findIndex((s) => s.id === input.leaderId);
        if (staffIndex >= 0) {
          dataset.staff[staffIndex] = {
            ...dataset.staff[staffIndex],
            teamId: finalId as TeamId,
            title: `Tổ trưởng ${input.name.trim()}`,
          };
        }
      }

      persistDataset();
      return clone(newTeam);
    },

    async updateTeam(id: string, input: Partial<{ name: string; description?: string; leaderId?: string; roles?: string[]; inactiveRoles?: string[]; customFields?: Record<string, any> }>): Promise<Team> {
      const team = dataset.teams.find((t) => t.id === id);
      if (!team) {
        throw new Error("Không tìm thấy phòng ban / tổ chuyên môn.");
      }

      if (input.name !== undefined) {
        if (!input.name.trim()) throw new Error("Tên phòng ban không được để trống.");
        team.name = input.name.trim();
      }
      if (input.description !== undefined) {
        team.description = input.description.trim();
      }
      if (input.roles !== undefined) {
        team.roles = input.roles.map((r) => r.trim()).filter(Boolean);
      }
      if (input.inactiveRoles !== undefined) {
        team.inactiveRoles = input.inactiveRoles.map((r) => r.trim()).filter(Boolean);
      }
      if (input.leaderId !== undefined) {
        team.leaderId = input.leaderId;
      }
      if (input.customFields !== undefined) {
        team.customFields = input.customFields;
      }

      persistDataset();
      return clone(team);
    },

    async getDataset() {
      return clone(dataset);
    },

    async setAccountActive(staffId, active, reason) {
      const person = dataset.staff.find((item) => item.id === staffId);
      if (!person) throw new Error("Không tìm thấy cán bộ.");
      if (person.roleCode === "ADMIN" && !active) throw new Error("Không thể khóa tài khoản quản trị hệ thống.");
      if (!active && !reason?.trim()) throw new Error("Vui lòng nhập lý do khóa tài khoản.");
      Object.assign(person, { accountActive: active, lockReason: active ? undefined : reason?.trim() });
      return clone(person);
    },

    async createStaff(input) {
      if (!input.name?.trim()) throw new Error("Vui lòng nhập họ và tên cán bộ.");
      if (!input.teamId) throw new Error("Vui lòng chọn tổ / bộ phận.");
      if (!input.roleCode) throw new Error("Vui lòng chọn chức danh.");

      const nextNum = dataset.staff.length + 1;
      const staffId = `ST-${String(nextNum).padStart(3, "0")}`;
      const newStaff: Staff = {
        id: staffId,
        name: input.name.trim(),
        citizenId: input.citizenId?.trim(),
        dob: input.dob?.trim() || undefined,
        gender: input.gender,
        title: input.title.trim() || "Chuyên viên",
        teamId: input.teamId,
        roleCode: input.roleCode,
        employment: input.employment || "Viên chức",
        phone: input.phone?.trim() || "",
        email: input.email.trim() || `${staffId.toLowerCase()}@hatien.gov.vn`,
        accountActive: input.accountActive !== false,
        customFields: input.customFields,
      };

      dataset.staff = [newStaff, ...dataset.staff];

      if (input.isLeader) {
        const team = dataset.teams.find((t) => t.id === input.teamId);
        if (team) {
          // Riêng Ban Phó Giám đốc (PGD) có nhiều Phó Giám đốc cùng phụ trách, không thay thế leaderId hiện có
          if (input.teamId !== "PGD" || !team.leaderId) {
            team.leaderId = newStaff.id;
          }
        }
      }

      return clone(newStaff);
    },

    async updateStaff(staffId, input) {
      const person = dataset.staff.find((s) => s.id === staffId);
      if (!person) throw new Error("Không tìm thấy cán bộ.");

      if (input.name !== undefined && !input.name.trim()) {
        throw new Error("Họ và tên cán bộ không được để trống.");
      }

      if (input.name !== undefined) person.name = input.name.trim();
      if (input.citizenId !== undefined) person.citizenId = input.citizenId.trim();
      if (input.title !== undefined) person.title = input.title.trim();
      if (input.teamId !== undefined) person.teamId = input.teamId;
      if (input.roleCode !== undefined) person.roleCode = input.roleCode;
      if (input.employment !== undefined) person.employment = input.employment;
      if (input.phone !== undefined) person.phone = input.phone?.trim() || "";
      if (input.email !== undefined) person.email = input.email.trim();
      if (input.accountActive !== undefined) person.accountActive = input.accountActive;
      if (input.dob !== undefined) person.dob = input.dob.trim() || undefined;
      if (input.gender !== undefined) person.gender = input.gender;
      if (input.customFields !== undefined) person.customFields = input.customFields;
      if (input.permissions !== undefined) person.permissions = input.permissions;
      if (input.revokedPermissions !== undefined) person.revokedPermissions = input.revokedPermissions;
      if (input.revokedRoles !== undefined) person.revokedRoles = input.revokedRoles;
      // Vai trò đang giữ (có trong chức danh) thì không còn ở danh sách "đã tắt" (VD: vừa được cấp lại)
      if (person.revokedRoles?.length) {
        const activeTitles = new Set(
          (person.title || "")
            .split(/\s*·\s*|\s*;\s*/)
            .map((part) => part.trim().toLowerCase())
            .filter(Boolean)
        );
        person.revokedRoles = person.revokedRoles.filter((role) => !activeTitles.has(role.trim().toLowerCase()));
      }

      if (input.isLeader !== undefined) {
        const targetTeamId = input.teamId || person.teamId;
        const team = dataset.teams.find((t) => t.id === targetTeamId);
        if (team) {
          if (targetTeamId === "PGD") {
            // Không xóa hoặc ghi đè leaderId của Ban Phó Giám đốc nếu đã có
            if (input.isLeader && !team.leaderId) {
              team.leaderId = person.id;
            }
          } else {
            if (input.isLeader) {
              team.leaderId = person.id;
            } else if (team.leaderId === person.id) {
              team.leaderId = "";
            }
          }
        }
      }

      return clone(person);
    },

  };

  return new Proxy(repository, {
    get(target, property, receiver) {
      const method = Reflect.get(target, property, receiver);
      if (property === "getDataset" || typeof method !== "function") return method;
      return async (...args: unknown[]) => {
        const result = await method(...args);
        persistDataset();
        return result;
      };
    },
  });
}

export const mockPersonnelRepository = createMockPersonnelRepository();
