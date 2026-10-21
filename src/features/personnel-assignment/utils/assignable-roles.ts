import type { MatrixRole } from "../constants/role-matrix-data";
import type { Team, TeamId } from "../types/personnel.types";

/** Một chức danh có thể gán cho cán bộ (theo phòng ban hoặc chức danh tùy chỉnh / độc lập) */
export interface AvailableRoleOption {
  id: string;
  title: string;
  roleCode: string;
  label: string;
  isLeader?: boolean;
  teamId?: TeamId | "INDEPENDENT";
  teamName?: string;
  isCustom?: boolean;
}

export function getLocalStorageCustomRoles(): AvailableRoleOption[] {
  if (typeof window === "undefined") return [];
  const results: AvailableRoleOption[] = [];
  const seen = new Set<string>();

  const storageKeys = [
    "cipm_custom_roles_matrix_v3",
    "cipm_custom_roles_matrix_v2",
    "cipm_custom_roles_matrix",
    "cipm_custom_roles",
  ];

  for (const k of storageKeys) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && item.isCustom) {
              const name = item.name || item.title || item.label;
              if (name && typeof name === "string") {
                const trimmed = name.trim();
                if (trimmed && !seen.has(trimmed.toLowerCase())) {
                  seen.add(trimmed.toLowerCase());
                  results.push({
                    id: item.code || item.id || `ROLE_STORED_${trimmed}`,
                    roleCode: item.code || "TECHNICAL_OFFICER",
                    title: trimmed,
                    label: trimmed,
                    teamId: item.department ? (item.department as any) : "INDEPENDENT",
                    teamName: item.department || "Chức danh tùy chỉnh / Toàn đơn vị",
                    isLeader: item.group === "lead" || Boolean(item.isLeader),
                    isCustom: true,
                  });
                }
              }
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

export function getDepartmentRoles(team: Team): AvailableRoleOption[] {
  if (team.id === "BGD") {
    const rolesList =
      team.roles && team.roles.length > 0
        ? team.roles
        : ["Giám đốc", "Thư ký Ban Giám đốc"];
    return rolesList.map((r, idx) => {
      const isAdmin = /giám đốc/i.test(r) && !/phó|thư ký/i.test(r);
      return {
        id: `ROLE_BGD_${idx}`,
        roleCode: isAdmin ? "ADMIN" : "ADMINISTRATIVE_OFFICER",
        title: r,
        isLeader: isAdmin,
        label: r + (isAdmin ? " (Trưởng ban)" : ""),
        teamId: team.id,
        teamName: team.name,
      };
    });
  }

  if (team.id === "PGD") {
    const rolesList =
      team.roles && team.roles.length > 0
        ? team.roles
        : ["Phó Giám đốc", "Thư ký Phó Giám đốc"];
    return rolesList.map((r, idx) => ({
      id: `ROLE_PGD_${idx}`,
      roleCode: "DEPUTY_DIRECTOR",
      title: r,
      isLeader: false,
      label: `${r} BQL`,
      teamId: team.id,
      teamName: team.name,
    }));
  }

  if (team.roles && team.roles.length > 0) {
    const inactiveSet = new Set(
      (team.inactiveRoles || []).map((r) => r.trim().toLowerCase())
    );
    return team.roles
      .filter((r) => {
        const trimmed = r.trim();
        return trimmed && !inactiveSet.has(trimmed.toLowerCase());
      })
      .map((r, idx) => {
        const isLead = idx === 0 || /trưởng|lead|chủ nhiệm|phụ trách/i.test(r);
        let roleCode = "TECHNICAL_OFFICER";
        if (isLead) {
          roleCode =
            team.id === "HCTH"
              ? "CHIEF_ACCOUNTANT"
              : team.id === "BT"
              ? "COMPENSATION_OFFICER"
              : "TECHNICAL_OFFICER";
        } else if (/kế toán|tài chính/i.test(r)) {
          roleCode = /trưởng/i.test(r) ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
        } else if (/bồi thường|gpmb|giải tỏa|tái định cư/i.test(r)) {
          roleCode = "COMPENSATION_OFFICER";
        } else if (/hành chính|văn thư|tổng hợp/i.test(r)) {
          roleCode = "ADMINISTRATIVE_OFFICER";
        }

        return {
          id: `ROLE_${team.id}_${idx}`,
          roleCode,
          title: r,
          isLeader: isLead,
          label:
            r +
            (isLead &&
            !r.toLowerCase().includes("lead") &&
            !r.toLowerCase().includes("trưởng")
              ? " (Lead)"
              : ""),
          teamId: team.id,
          teamName: team.name,
        };
      });
  }

  if (team.id === "BT") {
    return [
      {
        id: "ROLE_BT_LEAD",
        roleCode: "COMPENSATION_OFFICER",
        title: "Tổ trưởng Bồi thường – GPMB",
        isLeader: true,
        label: "Tổ trưởng Bồi thường – GPMB (Lead)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_DEPUTY",
        roleCode: "COMPENSATION_OFFICER",
        title: "Tổ phó Bồi thường – GPMB",
        isLeader: false,
        label: "Tổ phó Bồi thường – GPMB",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_MEMBER",
        roleCode: "COMPENSATION_OFFICER",
        title: "Chuyên viên Bồi thường – GPMB",
        isLeader: false,
        label: "Chuyên viên Bồi thường – GPMB",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_BT_COUNT",
        roleCode: "COMPENSATION_OFFICER",
        title: "Chuyên viên kiểm đếm GPMB",
        isLeader: false,
        label: "Chuyên viên kiểm đếm GPMB",
        teamId: team.id,
        teamName: team.name,
      },
    ];
  }

  if (team.id === "HCTH") {
    return [
      {
        id: "ROLE_HCTH_LEAD",
        roleCode: "CHIEF_ACCOUNTANT",
        title: "Tổ trưởng Hành chính – Tổng hợp",
        isLeader: true,
        label: "Tổ trưởng Hành chính – Tổng hợp (Lead)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_CHIEF_ACC",
        roleCode: "CHIEF_ACCOUNTANT",
        title: "Kế toán trưởng",
        isLeader: false,
        label: "Kế toán trưởng",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_ACC",
        roleCode: "ACCOUNTANT",
        title: "Kế toán viên (Tài chính)",
        isLeader: false,
        label: "Kế toán viên (Tài chính)",
        teamId: team.id,
        teamName: team.name,
      },
      {
        id: "ROLE_HCTH_ADMIN",
        roleCode: "ADMINISTRATIVE_OFFICER",
        title: "Chuyên viên Hành chính – Tổng hợp",
        isLeader: false,
        label: "Chuyên viên Hành chính – Tổng hợp",
        teamId: team.id,
        teamName: team.name,
      },
    ];
  }

  return [
    {
      id: "ROLE_GSKT_LEAD",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ trưởng Giám sát",
      isLeader: true,
      label: "Tổ trưởng Giám sát (Lead)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_DEP_KT",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ phó (Kỹ thuật)",
      isLeader: false,
      label: "Tổ phó (Kỹ thuật)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_DEP_GS",
      roleCode: "TECHNICAL_OFFICER",
      title: "Tổ phó (Giám sát)",
      isLeader: false,
      label: "Tổ phó (Giám sát)",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_ENG",
      roleCode: "TECHNICAL_OFFICER",
      title: "Kỹ sư Giám sát – Kỹ thuật",
      isLeader: false,
      label: "Kỹ sư Giám sát – Kỹ thuật",
      teamId: team.id,
      teamName: team.name,
    },
    {
      id: "ROLE_GSKT_QLDA",
      roleCode: "TECHNICAL_OFFICER",
      title: "Chuyên viên Quản lý dự án",
      isLeader: false,
      label: "Chuyên viên Quản lý dự án",
      teamId: team.id,
      teamName: team.name,
    },
  ];
}

/** Chức danh mặc định của các phòng ban (dùng để nhận biết chức danh tùy chỉnh nào là "độc lập") */
const KNOWN_DEPARTMENT_TITLES = [
  "giám đốc",
  "giám đốc ban quản lý",
  "phó giám đốc",
  "phó giám đốc ban quản lý",
  "thư ký ban giám đốc",
  "thư ký phó giám đốc",
  "tổ trưởng giám sát – kỹ thuật",
  "tổ phó (kỹ thuật)",
  "tổ phó (kt)",
  "tổ phó (giám sát)",
  "tổ phó (gs)",
  "kỹ sư giám sát – kỹ thuật",
  "kỹ sư kỹ thuật – giám sát",
  "chuyên viên quản lý dự án",
  "chuyên viên qlda",
  "tổ trưởng bồi thường – gpmb",
  "tổ phó bồi thường – gpmb",
  "chuyên viên bồi thường",
  "chuyên viên bồi thường – gpmb",
  "chuyên viên kiểm đếm",
  "chuyên viên kiểm đếm gpmb",
  "kế toán trưởng",
  "kế toán trưởng / tổ trưởng hcth",
  "tổ trưởng hành chính – tổng hợp",
  "kế toán viên (tài chính)",
  "chuyên viên hành chính – tổng hợp",
  "văn thư lưu trữ",
];

/** Toàn bộ chức danh có thể gán: chức danh của mọi phòng ban (kể cả tùy chỉnh theo phòng ban) + chức danh độc lập */
export function buildAssignableRoles(teams: Team[], matrixRoles: MatrixRole[]): AvailableRoleOption[] {
  const departmentTitles = new Set(KNOWN_DEPARTMENT_TITLES);
  teams.forEach((t) => {
    (t.roles || []).forEach((r) => r && departmentTitles.add(r.trim().toLowerCase()));
    getDepartmentRoles(t).forEach((r) => {
      departmentTitles.add(r.title.trim().toLowerCase());
      departmentTitles.add(r.label.trim().toLowerCase());
    });
  });

  const belongsToTeam = (department?: string) =>
    Boolean(department) &&
    teams.some(
      (t) => t.name.toLowerCase() === department?.toLowerCase() || t.id.toLowerCase() === department?.toLowerCase()
    );

  const independent = new Map<string, AvailableRoleOption>();
  getLocalStorageCustomRoles()
    .filter((r) => !departmentTitles.has(r.title.toLowerCase().trim()))
    .forEach((r) => independent.set(r.title.toLowerCase().trim(), r));
  matrixRoles
    .filter((r) => r.isCustom || r.code === "FIMI")
    .filter((r) => !departmentTitles.has(r.name.toLowerCase().trim()) && !belongsToTeam(r.department))
    .forEach((r) =>
      independent.set(r.name.toLowerCase().trim(), {
        id: r.code,
        roleCode: r.code,
        title: r.name,
        label: r.name,
        teamId: "INDEPENDENT",
        teamName: "Chức danh độc lập",
        isLeader: r.group === "lead",
        isCustom: true,
      })
    );

  const list: AvailableRoleOption[] = [];
  const seenIds = new Set<string>();
  const push = (role: AvailableRoleOption) => {
    if (seenIds.has(role.id)) return;
    seenIds.add(role.id);
    list.push(role);
  };

  teams.forEach((team) => {
    const baseRoles = getDepartmentRoles(team);
    baseRoles.forEach(push);
    const seenTitles = new Set(baseRoles.map((r) => r.title.toLowerCase().trim()));
    matrixRoles
      .filter(
        (r) =>
          r.isCustom &&
          (r.department?.toLowerCase() === team.name.toLowerCase() ||
            r.department?.toLowerCase() === team.id.toLowerCase())
      )
      .forEach((r) => {
        const titleLower = r.name.toLowerCase().trim();
        if (seenTitles.has(titleLower)) return;
        seenTitles.add(titleLower);
        push({
          id: r.code,
          roleCode: r.code,
          title: r.name,
          label: r.name,
          teamId: team.id,
          teamName: team.name,
          isLeader: r.group === "lead",
          isCustom: true,
        });
      });
  });
  independent.forEach(push);
  return list;
}

/** Mã vai trò hệ thống suy ra từ tên chức danh (ưu tiên hơn mã mặc định của mục được chọn) */
export function resolveRoleCodeFromTitle(title: string, fallback: string): string {
  const t = title.toLowerCase();
  if (/giám đốc/.test(t) && !/phó|thư ký/.test(t)) return "ADMIN";
  if (/phó giám đốc/.test(t)) return "DEPUTY_DIRECTOR";
  if (/kế toán trưởng/.test(t)) return "CHIEF_ACCOUNTANT";
  if (/kế toán viên/.test(t)) return "ACCOUNTANT";
  if (/bồi thường|gpmb/.test(t)) return "COMPENSATION_OFFICER";
  if (/hành chính|văn thư/.test(t)) return "ADMINISTRATIVE_OFFICER";
  return fallback || "TECHNICAL_OFFICER";
}

/** Tên (viết thường) các chức danh đã khóa trong ma trận phân quyền */
export function getLockedTitles(matrixRoles: MatrixRole[], lockedRoleCodes: string[]): Set<string> {
  const locked = new Set(lockedRoleCodes);
  return new Set(matrixRoles.filter((r) => locked.has(r.code)).map((r) => r.name.trim().toLowerCase()));
}
