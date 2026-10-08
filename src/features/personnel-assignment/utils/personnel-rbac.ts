import type { PersonnelProject, Staff, Team } from "../types/personnel.types";

export type RbacRoleCode =
  | "DIRECTOR"
  | "DEPUTY_DIRECTOR"
  | "LEAD"
  | "MEMBER"
  | "CHIEF_ACCOUNTANT"
  | "ACCOUNTANT";

export type RbacTeamCode =
  | "TECHNICAL"
  | "COMPENSATION"
  | "ADMIN"
  | "ACCOUNTING";

export interface RbacPermissionItem {
  code: string;
  name: string;
  description: string;
  module?: string;
}

/** 1. Danh mục quyền theo Cấp bậc (Role) */
export const ROLE_PERMISSION_DEFS: Record<RbacRoleCode, {
  label: string;
  description: string;
  permissions: RbacPermissionItem[];
}> = {
  DIRECTOR: {
    label: "Giám đốc",
    description: "Lãnh đạo cao nhất Ban QLDA, toàn quyền điều hành, phê duyệt và phân bổ nguồn lực",
    permissions: [
      { code: "all.full_control", name: "Toàn quyền điều hành", description: "Chỉ đạo toàn diện các hoạt động của Ban QLDA và dự án" },
      { code: "leadership.assign", name: "Phân công lãnh đạo DA", description: "Chỉ định Chủ nhiệm dự án và Giám sát chính cho các công trình" },
      { code: "acting_director.manage", name: "Cấp / Thu hồi quyền CNDA", description: "Ủy quyền Quyền Chủ nhiệm dự án cho cán bộ thực hiện chính" },
      { code: "account.manage", name: "Quản trị tài khoản & hệ thống", description: "Thêm, khóa tài khoản, phân quyền và điều chỉnh chức vụ" },
      { code: "report.export_all", name: "Xuất báo cáo toàn diện", description: "Xuất dữ liệu báo cáo tất cả 9 phân hệ của Ban" },
    ],
  },
  DEPUTY_DIRECTOR: {
    label: "Phó Giám đốc",
    description: "Giúp việc Giám đốc, trực tiếp chỉ đạo và điều hành các dự án được phân công",
    permissions: [
      { code: "deputy.project_control", name: "Điều hành dự án phụ trách", description: "Chỉ đạo thi công, nghiệm thu các dự án thuộc phạm vi phụ trách" },
      { code: "acting_director.grant", name: "Cấp / Thu hồi quyền CNDA", description: "Ủy quyền quyền điều hành cho Chủ nhiệm dự án phụ trách" },
      { code: "review.approve", name: "Phê duyệt hồ sơ & thủ tục", description: "Ký duyệt hồ sơ kỹ thuật, hồ sơ thầu, phương án GPMB được giao" },
      { code: "report.export", name: "Xuất báo cáo dự án", description: "Xuất báo cáo tiến độ và tài chính các công trình phụ trách" },
    ],
  },
  LEAD: {
    label: "Tổ trưởng (Lead)",
    description: "Quản lý và điều phối chuyên môn nội bộ tổ, giao việc và đôn đốc thành viên",
    permissions: [
      { code: "team.view", name: "Xem thành viên & công việc tổ", description: "Theo dõi toàn bộ nhân sự và tiến độ nhiệm vụ trong tổ" },
      { code: "team.manage_members", name: "Quản lý thành viên tổ", description: "Điều phối nhân sự và tham gia đánh giá kết quả công tác" },
      { code: "team.assign_work", name: "Phân công nhiệm vụ nội bộ", description: "Giao việc giai đoạn và phân công phối hợp cho thành viên tổ" },
      { code: "team.review", name: "Kiểm tra & Duyệt kết quả", description: "Nghiệm thu chất lượng công việc và đôn đốc tiến độ thành viên" },
      { code: "report.export", name: "Xuất báo cáo chuyên môn tổ", description: "Xuất báo cáo tổng hợp tiến độ và khối lượng của tổ" },
    ],
  },
  MEMBER: {
    label: "Thành viên (Member)",
    description: "Trực tiếp thực hiện các nhiệm vụ chuyên môn theo sự phân công của Tổ trưởng",
    permissions: [
      { code: "team.view", name: "Xem thông tin & việc được giao", description: "Xem danh sách việc cá nhân và phối hợp trong tổ" },
      { code: "task.update", name: "Cập nhật tiến độ nhiệm vụ", description: "Báo cáo nhật ký, đính kèm biên bản và chuyển trạng thái công việc" },
      { code: "report.export", name: "Xuất báo cáo cá nhân", description: "Xuất phiếu giao việc và báo cáo tiến độ cá nhân phụ trách" },
    ],
  },
  CHIEF_ACCOUNTANT: {
    label: "Kế toán trưởng",
    description: "Phụ trách công tác tài chính kế toán, kiểm soát giải ngân và quyết toán vốn",
    permissions: [
      { code: "finance.approve", name: "Duyệt hồ sơ giải ngân", description: "Thẩm định và ký duyệt đề nghị tạm ứng, thanh toán khối lượng" },
      { code: "finance.audit", name: "Kiểm soát tài chính dự án", description: "Kiểm soát kế hoạch vốn, đối chiếu sổ sách và chứng từ kế toán" },
      { code: "warranty.guarantee", name: "Quản lý bảo lãnh & bảo hành", description: "Theo dõi hạn bảo lãnh, giải tỏa tiền bảo hành công trình" },
      { code: "report.export", name: "Báo cáo tài chính Ban", description: "Xuất báo cáo giải ngân vốn đầu tư công định kỳ" },
    ],
  },
  ACCOUNTANT: {
    label: "Kế toán viên",
    description: "Thực hiện nghiệp vụ kế toán, lập chứng từ và theo dõi giải ngân",
    permissions: [
      { code: "disbursement.create", name: "Lập đề nghị giải ngân", description: "Soạn thảo hồ sơ tạm ứng, thanh toán chuyển Kế toán trưởng duyệt" },
      { code: "finance.view", name: "Theo dõi dòng tiền & kế hoạch vốn", description: "Nhập liệu số liệu thanh toán, đối chiếu số liệu kho bạc" },
      { code: "report.export", name: "Xuất sổ sách kế toán", description: "In phiếu chi, bảng kê thanh toán khối lượng hoàn thành" },
    ],
  },
};

/** 2. Danh mục quyền nghiệp vụ theo Chuyên môn (Team) */
export const TEAM_PERMISSION_DEFS: Record<RbacTeamCode, {
  label: string;
  description: string;
  modules: string;
  permissions: RbacPermissionItem[];
}> = {
  TECHNICAL: {
    label: "Kỹ thuật / Giám sát",
    description: "Quản lý kỹ thuật thi công, hồ sơ pháp lý công trình, đấu thầu và bảo hành",
    modules: "M2 (Dự án), M3 (Thủ tục), M7 (Đấu thầu), M8 (Bảo hành)",
    permissions: [
      { code: "project.*", name: "Quản lý dự án & công trình", description: "Xem và cập nhật thông tin dự án, gói thầu, nhật ký hiện trường", module: "M2" },
      { code: "procedure.*", name: "Hồ sơ thủ tục kỹ thuật", description: "Lập và theo dõi các bước chuẩn bị đầu tư, thẩm định BVTC", module: "M3" },
      { code: "tender.*", name: "Nghiệp vụ đấu thầu xây lắp", description: "Chuẩn bị HSMT, tổ chức mở thầu, lập báo cáo đánh giá E-HSDT", module: "M7" },
      { code: "warranty.*", name: "Theo dõi bảo hành công trình", description: "Giám sát thời hạn bảo hành, nghiệm thu kết thúc bảo hành", module: "M8" },
    ],
  },
  COMPENSATION: {
    label: "Bồi thường & GPMB",
    description: "Thu hồi đất, đo đạc kiểm đếm, phương án bồi thường, hỗ trợ và tái định cư",
    modules: "M6 (GPMB & Tái định cư)",
    permissions: [
      { code: "land_clearance.*", name: "Hồ sơ kiểm đếm & thu hồi đất", description: "Lập biên bản kiểm đếm, xác minh nguồn gốc đất và pháp lý thửa đất", module: "M6" },
      { code: "household.*", name: "Quản lý hộ dân bị ảnh hưởng", description: "Quản lý danh sách hộ dân, nhân khẩu và hiện trạng tài sản", module: "M6" },
      { code: "compensation.*", name: "Phương án bồi thường & chi trả", description: "Lập dự thảo phương án bồi thường, niêm yết công khai và chi trả tiền", module: "M6" },
    ],
  },
  ADMIN: {
    label: "Hành chính – Tổng hợp",
    description: "Văn thư lưu trữ, thủ tục hành chính, quy chế và tổng hợp báo cáo",
    modules: "M1 (Bàn làm việc), M3 (Thủ tục), Văn thư",
    permissions: [
      { code: "procedure.*", name: "Theo dõi thủ tục hành chính", description: "Soạn thảo tờ trình, theo dõi luân chuyển văn bản sở ban ngành", module: "M3" },
      { code: "document.*", name: "Quản lý văn thư lưu trữ", description: "Tiếp nhận văn bản đến, phát hành văn bản đi và số hóa hồ sơ pháp lý", module: "Văn thư" },
      { code: "administrative.*", name: "Tổng hợp báo cáo định kỳ", description: "Tổng hợp số liệu tiến độ tuần/tháng, điều phối lịch họp Ban", module: "M1" },
    ],
  },
  ACCOUNTING: {
    label: "Tài chính – Kế toán",
    description: "Kế hoạch vốn, theo dõi giải ngân, tạm ứng, thanh toán và quyết toán dự án",
    modules: "M4 (Tài chính - Giải ngân)",
    permissions: [
      { code: "finance.*", name: "Kế hoạch vốn đầu tư công", description: "Phân bổ và điều hòa kế hoạch vốn trung hạn và hàng năm", module: "M4" },
      { code: "disbursement.*", name: "Quản lý giải ngân & thanh toán", description: "Theo dõi tỷ lệ giải ngân, quản lý tạm ứng và thanh toán đợt", module: "M4" },
      { code: "settlement.*", name: "Quyết toán vốn dự án hoàn thành", description: "Lập hồ sơ quyết toán A-B và quyết toán vốn nhà nước hoàn thành", module: "M4" },
    ],
  },
};

export interface StaffRbacProfile {
  roleCode: RbacRoleCode;
  roleLabel: string;
  roleDescription: string;
  teamCode: RbacTeamCode | null;
  teamLabel: string;
  displayBadge: string;
  isLeader: boolean;
  rolePermissions: RbacPermissionItem[];
  teamPermissions: RbacPermissionItem[];
  actingDirectorProjects: Array<{
    id: string;
    code: string;
    name: string;
    assignedAt?: string;
    assignedBy?: string;
    note?: string;
  }>;
}

/**
 * Phân tích và trích xuất hồ sơ RBAC (Role + Team) cho cán bộ
 */
export function resolveStaffRbac(
  staff: Staff,
  team?: Team,
  projects: PersonnelProject[] = []
): StaffRbacProfile {
  // 1. Xác định RoleCode theo cấp bậc
  let roleCode: RbacRoleCode = "MEMBER";

  if (staff.roleCode === "ADMIN" || staff.title.toLowerCase().includes("giám đốc") && !staff.title.toLowerCase().includes("phó")) {
    roleCode = "DIRECTOR";
  } else if (staff.roleCode === "DEPUTY_DIRECTOR" || staff.title.toLowerCase().includes("phó giám đốc")) {
    roleCode = "DEPUTY_DIRECTOR";
  } else if (staff.roleCode === "CHIEF_ACCOUNTANT" || staff.title.toLowerCase().includes("kế toán trưởng")) {
    roleCode = "CHIEF_ACCOUNTANT";
  } else if (staff.roleCode === "ACCOUNTANT") {
    roleCode = "ACCOUNTANT";
  } else if (team?.leaderId === staff.id || staff.title.toLowerCase().includes("tổ trưởng")) {
    roleCode = "LEAD";
  } else {
    roleCode = "MEMBER";
  }

  // 2. Xác định TeamCode theo chuyên môn
  let teamCode: RbacTeamCode | null = null;
  const teamId = team?.id || staff.teamId;

  if (teamId === "GSKT") {
    teamCode = "TECHNICAL";
  } else if (teamId === "BT") {
    teamCode = "COMPENSATION";
  } else if (teamId === "HCTH") {
    if (roleCode === "CHIEF_ACCOUNTANT" || roleCode === "ACCOUNTANT" || staff.title.toLowerCase().includes("kế toán")) {
      teamCode = "ACCOUNTING";
    } else {
      teamCode = "ADMIN";
    }
  } else if (teamId === "BGD") {
    teamCode = null;
  }

  const roleMeta = ROLE_PERMISSION_DEFS[roleCode];
  const teamMeta = teamCode ? TEAM_PERMISSION_DEFS[teamCode] : null;

  // 3. Tạo nhãn hiển thị trực quan (Display Badge)
  let displayBadge = roleMeta.label;
  if (roleCode === "LEAD" && teamMeta) {
    displayBadge = `Trưởng tổ ${teamMeta.label.split("/")[0].trim()}`;
  } else if (roleCode === "MEMBER" && teamMeta) {
    displayBadge = `Thành viên ${teamMeta.label.split("/")[0].trim()}`;
  } else if (roleCode === "DIRECTOR") {
    displayBadge = "Giám đốc (Toàn quyền)";
  }

  // 4. Tìm các dự án được ủy quyền Quyền Chủ nhiệm dự án (CNDA)
  const actingProjects = projects
    .filter(
      (p) =>
        p.actingDirectorId === staff.id ||
        (p.mainExecutorId === staff.id && !p.cndaRevoked),
    )
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      assignedAt: p.actingDirectorAssignedAt || p.assignedAt,
      assignedBy: p.actingDirectorAssignedBy || "Ban Giám đốc",
      note: p.actingDirectorNote || p.note,
    }));

  return {
    roleCode,
    roleLabel: roleMeta.label,
    roleDescription: roleMeta.description,
    teamCode,
    teamLabel: teamMeta?.label ?? "Ban Giám đốc",
    displayBadge,
    isLeader: roleCode === "LEAD",
    rolePermissions: roleMeta.permissions,
    teamPermissions: teamMeta?.permissions ?? [],
    actingDirectorProjects: actingProjects,
  };
}
