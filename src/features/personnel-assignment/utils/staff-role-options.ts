import type { StoredRoleItem } from "../services/custom-roles.storage";
import type { Staff, Team } from "../types/personnel.types";
import { inferRoleCode, isDirectorTitle, isLeaderTitle } from "./role-code-inference.ts";

interface PositionSeed {
  title: string;
  roleCode: string;
  isLeader?: boolean;
}

/** Vị trí mặc định của các phòng ban chuẩn (luôn có trong danh sách chọn chức danh) */
export const BASE_TEAM_POSITIONS: Record<string, PositionSeed[]> = {
  BGD: [
    { title: "Giám đốc", roleCode: "ADMIN", isLeader: true },
  ],
  PGD: [
    { title: "Phó Giám đốc", roleCode: "DEPUTY_DIRECTOR", isLeader: true },
  ],
  GSKT: [
    { title: "Tổ trưởng", roleCode: "TECHNICAL_OFFICER", isLeader: true },
    { title: "Tổ phó (KT)", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    { title: "Tổ phó (GS)", roleCode: "TECHNICAL_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "TECHNICAL_OFFICER", isLeader: false },
  ],
  BT: [
    { title: "Tổ trưởng", roleCode: "COMPENSATION_OFFICER", isLeader: true },
    { title: "Tổ phó", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Thành viên bồi thường", roleCode: "COMPENSATION_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "COMPENSATION_OFFICER", isLeader: false },
  ],
  HCTH: [
    { title: "Kế toán trưởng", roleCode: "CHIEF_ACCOUNTANT", isLeader: true },
    { title: "Kế toán Công trình - Thủ quỹ", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Kế toán viên", roleCode: "ACCOUNTANT", isLeader: false },
    { title: "Hành chính tổng hợp", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Văn thư, hỗ trợ Hành chính TH", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
    { title: "Thành viên", roleCode: "ADMINISTRATIVE_OFFICER", isLeader: false },
  ],
};

/** Một vị trí để chọn ở form thêm nhân sự */
export interface StaffRoleOption {
  value: string;
  roleCode: string;
  isLeader: boolean;
  title: string;
  /** Tên hiển thị: vị trí trùng tên ở nhiều phòng ban được ghi kèm mã phòng ban */
  displayTitle: string;
  teamId?: string;
  teamName?: string;
  searchText: string;
}

/** Giá trị chọn của một vị trí thuộc phòng ban */
export const toTeamRoleValue = (teamId: string, title: string) => `ROLE_${teamId}_${title}`;

/** Chức danh tùy chỉnh đã lưu → vị trí chọn được (bỏ trùng tên) */
export function toCustomPositions(items: StoredRoleItem[]): PositionSeed[] {
  const results: PositionSeed[] = [];
  const seen = new Set<string>();
  items.forEach((item) => {
    const name = item.name || item.title || item.label || item.shortName;
    if (!name || typeof name !== "string") return;
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) return;
    seen.add(trimmed.toLowerCase());
    results.push({
      title: trimmed,
      roleCode: item.code || "TECHNICAL_OFFICER",
      isLeader: item.group === "lead" || Boolean(item.isLeader),
    });
  });
  return results;
}

/**
 * Toàn bộ vị trí trong hệ thống, một danh sách phẳng (không chia nhóm theo phòng ban).
 * Vị trí trùng tên ở nhiều phòng ban (VD: "Thành viên") được ghi kèm mã phòng ban để phân biệt,
 * vì cùng tên nhưng mỗi phòng ban có quyền khác nhau: "Thành viên (GSKT)", "Thành viên (HCTH)".
 * Chức danh đã khóa trong ma trận phân quyền bị loại khỏi danh sách.
 */
export function buildStaffRoleOptions(
  teams: Team[],
  staff: Staff[],
  customPositions: PositionSeed[],
  lockedTitles: Set<string>,
): StaffRoleOption[] {
  const options: Omit<StaffRoleOption, "displayTitle">[] = [];

  teams.forEach((team) => {
    const seenInTeam = new Set<string>();

    const addRole = (title: string, defaultRoleCode?: string, defaultIsLeader?: boolean) => {
      const cleanTitle = title.trim();
      if (!cleanTitle || seenInTeam.has(cleanTitle.toLowerCase())) return;
      seenInTeam.add(cleanTitle.toLowerCase());

      const isLeader =
        defaultIsLeader !== undefined
          ? defaultIsLeader
          : team.id === "BGD"
          ? isDirectorTitle(cleanTitle)
          : team.id === "PGD"
          ? true
          : isLeaderTitle(cleanTitle);

      options.push({
        value: toTeamRoleValue(team.id, cleanTitle),
        title: cleanTitle,
        roleCode: defaultRoleCode || inferRoleCode(team.id, cleanTitle, isLeader),
        isLeader,
        teamId: team.id,
        teamName: team.name,
        searchText: `${cleanTitle} ${team.name} ${team.id}`,
      });
    };

    // 1. Vị trí cấu hình trên phòng ban (bỏ vị trí đang tắt)
    const inactiveSet = new Set((team.inactiveRoles || []).map((r) => r.trim().toLowerCase()));
    (team.roles || []).forEach((r) => {
      if (!inactiveSet.has(r.trim().toLowerCase())) addRole(r);
    });

    // 2. Vị trí mặc định của phòng ban chuẩn
    (BASE_TEAM_POSITIONS[team.id] || []).forEach((bp) => addRole(bp.title, bp.roleCode, bp.isLeader));

    // 3. Chức danh cán bộ trong phòng ban đang giữ
    staff
      .filter((s) => s.teamId === team.id)
      .forEach((s) => {
        if (s.title) addRole(s.title, s.roleCode);
      });
  });

  // 4. Chức danh tùy chỉnh / độc lập
  customPositions.forEach((cr) => {
    if (options.some((o) => o.title.toLowerCase() === cr.title.toLowerCase())) return;
    options.push({
      value: `ROLE_CUSTOM_${cr.title}`,
      title: cr.title,
      roleCode: cr.roleCode,
      isLeader: Boolean(cr.isLeader),
      searchText: `${cr.title} Chức danh tùy chỉnh`,
    });
  });

  // Đếm tên vị trí xuất hiện ở bao nhiêu phòng ban → trùng thì ghi kèm mã phòng ban
  const teamCountByTitle = new Map<string, Set<string>>();
  options.forEach((o) => {
    if (!o.teamId) return;
    const key = o.title.toLowerCase();
    teamCountByTitle.set(key, (teamCountByTitle.get(key) ?? new Set()).add(o.teamId));
  });

  return options
    .map((o) => {
      const isShared = o.teamId && (teamCountByTitle.get(o.title.toLowerCase())?.size ?? 0) > 1;
      const displayTitle = isShared ? `${o.title} (${o.teamId})` : o.title;
      return { ...o, displayTitle, searchText: `${displayTitle} ${o.searchText}` };
    })
    .filter((o) => !lockedTitles.has(o.title.toLowerCase()));
}
