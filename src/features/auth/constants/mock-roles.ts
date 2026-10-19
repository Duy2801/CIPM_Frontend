import type { MockRoleAccount } from "../types/auth.types";

/**
 * DANH SÁCH TÀI KHOẢN MẪU BQL ĐTXD HÀ TIÊN
 * - Chuẩn hóa chính xác theo danh sách nhân sự BQL ĐTXD:
 *   I. Ban Giám đốc: Giám đốc (Huỳnh Thái Hải)
 *   II. Ban Phó Giám đốc: Phó Giám đốc (Trần Trung Tín, Nguyễn Thanh Tuyền)
 *   III. Tổ Giám sát - Kỹ thuật:
 *        - Tổ trưởng (Phan Thanh Cường)
 *        - Tổ Phó (KT) (Trần Minh Ơn)
 *        - Tổ Phó (GS) (Trần Phong Tiền)
 *        - Thành viên Giám sát - Kỹ thuật (Chau Thị Thi, Huỳnh Phú Lợi,...)
 *   IV. Tổ Bồi thường, giải tỏa, GPMB - TĐC:
 *        - Tổ trưởng (Nguyễn Đức Thuận)
 *        - Tổ phó (Lê Hoàng Sơn)
 *        - Thành viên Bồi thường (Trần Lê Huynh, Huỳnh Công Lý)
 *   V. Tổ Hành chính - Tổng hợp:
 *        - Kế toán trưởng (Đặng Thị Kim Ngân)
 *        - Kế toán Công trình - Thủ quỹ (Trang Thị Kim Yến)
 *        - Kế toán viên (Nguyễn Thị Thúy Hà, Trần Kim Ngân)
 *        - Hành chính tổng hợp (Trần Trung Hiếu)
 *        - Văn thư, hỗ trợ Hành chính TH (Lê Dạ Tiên)
 * - Mật khẩu mặc định: 123456
 */
export const MOCK_ROLES: MockRoleAccount[] = [
  // =========================================================================
  // 1. BAN GIÁM ĐỐC
  // =========================================================================
  {
    id: "role_admin",
    roleCode: "ADMIN",
    roleName: "Giám đốc",
    department: "Ban Giám đốc",
    isLead: true,
    aliases: ["lead_bgd", "hai.ht"],
    user: {
      id: "usr_001",
      username: "giamdoc",
      displayName: "Huỳnh Thái Hải",
      roleCode: "ADMIN",
      roleName: "Giám đốc",
      department: "Ban Giám đốc",
      initials: "TH",
      email: "hai.ht@hatien.gov.vn",
      phone: "0918.765.432",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "giamdoc",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "input", "approve", "configure", "export"],
      m2_projects: ["view", "input", "approve", "configure", "export"],
      m3_construction_procedures: ["view", "input", "approve", "configure", "export"],
      m4_finance_settlement: ["view", "input", "approve", "configure", "export"],
      m5_personnel_assignment: ["view", "input", "approve", "configure", "export"],
      m6_site_clearance: ["view", "input", "approve", "configure", "export"],
      m7_bidding: ["view", "input", "approve", "configure", "export"],
      m8_warranty: ["view", "input", "approve", "configure", "export"],
      legal_library: ["view", "input", "approve", "configure", "export"],
    },
    description: "Toàn quyền xem, phê duyệt cấp cao nhất, cấu hình hệ thống, ký số và xuất báo cáo tổng hợp",
    accessibleSummary: ["Tất cả 9 Phân hệ", "Duyệt cấp cao nhất", "Cấu hình phân quyền", "Xuất báo cáo AI"],
    badgeColor: "teal",
  },
  {
    id: "role_deputy",
    roleCode: "DEPUTY_DIRECTOR",
    roleName: "Phó Giám đốc",
    department: "Ban Phó Giám đốc",
    isLead: true,
    aliases: ["lead_pgd", "tin.tt"],
    user: {
      id: "usr_002",
      username: "phogiamdoc",
      displayName: "Trần Trung Tín",
      roleCode: "DEPUTY_DIRECTOR",
      roleName: "Phó Giám đốc",
      department: "Ban Phó Giám đốc",
      initials: "TT",
      email: "tin.tt@hatien.gov.vn",
      phone: "0913.882.345",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "phogiamdoc",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "export"],
      m2_projects: ["view", "input", "approve", "export"],
      m3_construction_procedures: ["view", "input", "approve", "configure", "export"],
      m4_finance_settlement: ["view", "export"],
      m5_personnel_assignment: ["view", "input", "approve", "export"],
      m6_site_clearance: ["view", "approve", "export"],
      m7_bidding: ["view", "input", "approve", "export"],
      m8_warranty: ["view", "export"],
      legal_library: ["view", "input", "approve", "export"],
    },
    description: "Chỉ đạo các dự án phụ trách, phê duyệt hồ sơ GPMB M6, theo dõi tiến độ tổng thể",
    accessibleSummary: ["Dự án phụ trách (M2)", "Duyệt GPMB (M6)", "Duyệt thủ tục (M3)", "Duyệt đấu thầu (M7)"],
    badgeColor: "blue",
  },

  // =========================================================================
  // 2. TỔ GIÁM SÁT – KỸ THUẬT
  // =========================================================================
  {
    id: "role_lead_gskt",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Tổ trưởng Giám sát",
    department: "Tổ Giám sát – Kỹ thuật",
    isLead: true,
    aliases: ["kythuat", "lead_gskt", "cuong.pt"],
    user: {
      id: "usr_003",
      username: "lead_kythuat",
      displayName: "Phan Thanh Cường",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Tổ trưởng GSKT",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "TC",
      email: "cuong.pt@hatien.gov.vn",
      phone: "0982.112.233",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "lead_kythuat",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "export"],
      m2_projects: ["view", "input", "export"],
      m3_construction_procedures: ["view", "input", "configure", "export"],
      m4_finance_settlement: ["view"],
      m5_personnel_assignment: ["view", "input", "export"],
      m7_bidding: ["view", "input", "export"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view", "export"],
    },
    description: "Tổ trưởng Tổ Giám sát – Kỹ thuật: Phân công nhiệm vụ nội bộ tổ (M5), điều phối tiến độ công trình (M2), quản lý & cấu hình quy trình thủ tục XDCB (M3).",
    accessibleSummary: ["Lead GSKT", "Phân việc tổ (M5)", "Tiến độ công trình (M2)", "Quy trình thủ tục (M3)"],
    badgeColor: "teal",
  },
  {
    id: "role_deputy_gskt_kt",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Tổ Phó (KT)",
    department: "Tổ Giám sát – Kỹ thuật",
    isLead: false,
    aliases: ["tranminhon", "on.tm"],
    user: {
      id: "ST-005",
      username: "topho_kt",
      displayName: "Trần Minh Ơn",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Tổ Phó (KT)",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "MO",
      email: "on.tm@hatien.gov.vn",
      phone: "0907.334.455",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "topho_kt",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view", "input", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view"],
      m5_personnel_assignment: ["view"],
      m7_bidding: ["view"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Tổ phó phụ trách Kỹ thuật: Kiểm tra hồ sơ kỹ thuật, hiện trường thi công và xác nhận bước thủ tục.",
    accessibleSummary: ["Tổ phó (KT)", "Kiểm tra kỹ thuật (M2)", "Hồ sơ thủ tục (M3)", "Bảo hành (M8)"],
    badgeColor: "teal",
  },
  {
    id: "role_deputy_gskt_gs",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Tổ Phó (GS)",
    department: "Tổ Giám sát – Kỹ thuật",
    isLead: false,
    aliases: ["tranphongtien", "tien.tp"],
    user: {
      id: "ST-006",
      username: "topho_gs",
      displayName: "Trần Phong Tiền",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Tổ Phó (GS)",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "PT",
      email: "tien.tp@hatien.gov.vn",
      phone: "0976.556.677",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "topho_gs",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view", "input", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view"],
      m5_personnel_assignment: ["view"],
      m7_bidding: ["view"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Tổ phó phụ trách Giám sát: Giám sát trực tiếp thi công hiện trường, nghiệm thu công việc và báo cáo tiến độ.",
    accessibleSummary: ["Tổ phó (GS)", "Giám sát hiện trường (M2)", "Nghiệm thu (M3)", "Bảo hành (M8)"],
    badgeColor: "teal",
  },
  {
    id: "role_member_gskt",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Thành viên Giám sát – Kỹ thuật",
    department: "Tổ Giám sát – Kỹ thuật",
    isLead: false,
    aliases: ["member_gskt", "thi.ct"],
    user: {
      id: "ST-007",
      username: "member_gskt",
      displayName: "Chau Thị Thi",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Tổ viên GSKT",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "TT",
      email: "thi.ct@hatien.gov.vn",
      phone: "0944.778.899",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "member_gskt",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view", "input"],
      m3_construction_procedures: ["view", "input"],
      legal_library: ["view"],
    },
    description: "Thành viên Tổ Giám sát – Kỹ thuật: Thực hiện các công việc kiểm tra hiện trường, nộp hồ sơ công việc theo phân công.",
    accessibleSummary: ["Thành viên GSKT", "Kiểm tra hiện trường (M2)", "Nộp hồ sơ (M3)"],
    badgeColor: "teal",
  },

  // =========================================================================
  // 3. TỔ BỒI THƯỜNG, GIẢI TỎA, GIẢI PHÓNG MẶT BẰNG – TÁI ĐỊNH CƯ
  // =========================================================================
  {
    id: "role_lead_bt",
    roleCode: "COMPENSATION_OFFICER",
    roleName: "Tổ trưởng Bồi thường – GPMB – TĐC",
    department: "Tổ Bồi thường – GPMB – TĐC",
    isLead: true,
    aliases: ["boithuong", "lead_bt", "thuan.nd"],
    user: {
      id: "usr_006",
      username: "lead_gpmb",
      displayName: "Nguyễn Đức Thuận",
      roleCode: "COMPENSATION_OFFICER",
      roleName: "Tổ trưởng GPMB",
      department: "Tổ Bồi thường, giải tỏa, GPMB – TĐC",
      initials: "DT",
      email: "thuan.nd@hatien.gov.vn",
      phone: "0945.334.455",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "lead_gpmb",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "export"],
      m2_projects: ["view", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m5_personnel_assignment: ["view", "input", "export"],
      m6_site_clearance: ["view", "input", "approve", "export"],
      legal_library: ["view", "export"],
    },
    description: "Tổ trưởng Tổ Bồi thường – GPMB: Toàn quyền chỉ đạo 16 bước giải phóng mặt bằng, quản lý hộ dân, chi trả bồi thường và quỹ nền TĐC.",
    accessibleSummary: ["Lead GPMB", "16 bước GPMB (M6)", "Hộ dân & TĐC", "Phân việc tổ (M5)"],
    badgeColor: "red",
  },
  {
    id: "role_deputy_bt",
    roleCode: "COMPENSATION_OFFICER",
    roleName: "Tổ phó Bồi thường – GPMB – TĐC",
    department: "Tổ Bồi thường – GPMB – TĐC",
    isLead: false,
    aliases: ["son.lh", "deputy_bt"],
    user: {
      id: "ST-015",
      username: "topho_gpmb",
      displayName: "Lê Hoàng Sơn",
      roleCode: "COMPENSATION_OFFICER",
      roleName: "Tổ phó GPMB",
      department: "Tổ Bồi thường, giải tỏa, GPMB – TĐC",
      initials: "HS",
      email: "son.lh@hatien.gov.vn",
      phone: "0919.556.677",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "topho_gpmb",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      m5_personnel_assignment: ["view"],
      m6_site_clearance: ["view", "input", "approve", "export"],
      legal_library: ["view"],
    },
    description: "Tổ phó Bồi thường – GPMB: Phụ trách kiểm đếm, xác minh nguồn gốc đất và trực tiếp chỉ đạo hiện trường bồi thường.",
    accessibleSummary: ["Tổ phó GPMB", "Kiểm đếm hộ dân (M6)", "Phương án bồi thường", "Thủ tục GPMB (M3)"],
    badgeColor: "red",
  },
  {
    id: "role_member_bt",
    roleCode: "COMPENSATION_OFFICER",
    roleName: "Thành viên Bồi thường",
    department: "Tổ Bồi thường – GPMB – TĐC",
    isLead: false,
    aliases: ["member_bt", "huynh.tl"],
    user: {
      id: "ST-016",
      username: "member_gpmb",
      displayName: "Trần Lê Huynh",
      roleCode: "COMPENSATION_OFFICER",
      roleName: "Tổ viên GPMB",
      department: "Tổ Bồi thường, giải tỏa, GPMB – TĐC",
      initials: "LH",
      email: "huynh.tl@hatien.gov.vn",
      phone: "0962.778.899",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "member_gpmb",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input"],
      m6_site_clearance: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Thành viên Bồi thường: Đo đạc kiểm đếm thực địa, lập danh sách hộ dân, xác minh hồ sơ đất và hỗ trợ chi trả bồi thường.",
    accessibleSummary: ["Thành viên GPMB", "Kiểm đếm hộ dân (M6)", "Hồ sơ thu hồi đất"],
    badgeColor: "red",
  },

  // =========================================================================
  // 4. TỔ HÀNH CHÍNH – TỔNG HỢP
  // =========================================================================
  {
    id: "role_chief_accountant",
    roleCode: "CHIEF_ACCOUNTANT",
    roleName: "Kế toán trưởng",
    department: "Tổ Hành chính – Tổng hợp",
    isLead: true,
    aliases: ["lead_taichinh", "ketoantruong", "ngan.dtk"],
    user: {
      id: "usr_004",
      username: "lead_taichinh",
      displayName: "Đặng Thị Kim Ngân",
      roleCode: "CHIEF_ACCOUNTANT",
      roleName: "Kế toán trưởng",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "KN",
      email: "ngan.dtk@hatien.gov.vn",
      phone: "0908.123.456",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "lead_taichinh",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view", "input", "approve", "export"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view", "export"],
    },
    description: "Kiểm soát tài chính dự án, phê duyệt giải ngân cấp 1, kế hoạch vốn, thủ tục tất toán KBNN, quản lý bảo lãnh bảo hành.",
    accessibleSummary: ["Kế toán trưởng", "Duyệt giải ngân (M4)", "Kế hoạch vốn 2026", "Tất toán KBNN"],
    badgeColor: "gold",
  },
  {
    id: "role_accountant_treasurer",
    roleCode: "ACCOUNTANT",
    roleName: "Kế toán Công trình - Thủ quỹ",
    department: "Tổ Hành chính – Tổng hợp",
    isLead: false,
    aliases: ["yen.ttk", "ketoan_congtrinh"],
    user: {
      id: "ST-019",
      username: "ketoan_congtrinh",
      displayName: "Trang Thị Kim Yến",
      roleCode: "ACCOUNTANT",
      roleName: "Kế toán Công trình - Thủ quỹ",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "KY",
      email: "yen.ttk@hatien.gov.vn",
      phone: "0912.345.678",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "ketoan_congtrinh",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input"],
      m4_finance_settlement: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Kế toán công trình và thủ quỹ: Theo dõi tạm ứng, thanh toán khối lượng công trình và quỹ tiền mặt BQL.",
    accessibleSummary: ["Kế toán công trình", "Theo dõi tạm ứng", "Hồ sơ thanh toán (M4)"],
    badgeColor: "gold",
  },
  {
    id: "role_accountant",
    roleCode: "ACCOUNTANT",
    roleName: "Kế toán viên",
    department: "Tổ Hành chính – Tổng hợp",
    isLead: false,
    aliases: ["ha.ntt", "member_taichinh", "ketoanvien"],
    user: {
      id: "usr_005",
      username: "member_taichinh",
      displayName: "Nguyễn Thị Thúy Hà",
      roleCode: "ACCOUNTANT",
      roleName: "Kế toán viên",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "TH",
      email: "ha.ntt@hatien.gov.vn",
      phone: "0977.234.567",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "member_taichinh",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Lập đề nghị thanh toán giải ngân, nhập hợp đồng, chứng từ KBNN, đính kèm hồ sơ thủ tục M3.",
    accessibleSummary: ["Kế toán viên", "Nhập giải ngân (M4)", "Hồ sơ hợp đồng & KBNN"],
    badgeColor: "gold",
  },
  {
    id: "role_admin_officer",
    roleCode: "ADMINISTRATIVE_OFFICER",
    roleName: "Hành chính tổng hợp",
    department: "Tổ Hành chính – Tổng hợp",
    isLead: false,
    aliases: ["hieu.tt", "hanhchinh_th"],
    user: {
      id: "ST-022",
      username: "hanhchinh_th",
      displayName: "Trần Trung Hiếu",
      roleCode: "ADMINISTRATIVE_OFFICER",
      roleName: "Hành chính tổng hợp",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "TH",
      email: "hieu.tt@hatien.gov.vn",
      phone: "0948.567.890",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "hanhchinh_th",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      m5_personnel_assignment: ["view"],
      legal_library: ["view", "input", "export"],
    },
    description: "Công tác hành chính tổng hợp: Báo cáo định kỳ, cơ sở vật chất, tổng hợp nhiệm vụ toàn Ban.",
    accessibleSummary: ["Hành chính tổng hợp", "Báo cáo tổng hợp", "Hành chính Ban"],
    badgeColor: "purple",
  },
  {
    id: "role_clerk",
    roleCode: "ADMINISTRATIVE_OFFICER",
    roleName: "Văn thư, hỗ trợ Hành chính TH",
    department: "Tổ Hành chính – Tổng hợp",
    isLead: false,
    aliases: ["tien.ld", "vanthu"],
    user: {
      id: "ST-023",
      username: "member_hanhchinh",
      displayName: "Lê Dạ Tiên",
      roleCode: "ADMINISTRATIVE_OFFICER",
      roleName: "Văn thư, hỗ trợ Hành chính TH",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "DT",
      email: "tien.ld@hatien.gov.vn",
      phone: "0969.678.901",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "member_hanhchinh",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      legal_library: ["view", "input", "export"],
    },
    description: "Thực hiện công tác văn thư, số hóa văn bản, lưu trữ hồ sơ công trình và quản lý thiết bị văn phòng.",
    accessibleSummary: ["Văn thư lưu trữ", "Số hóa hồ sơ (M3)", "Văn thư Ban"],
    badgeColor: "purple",
  },
];

/**
 * Tìm mock user khớp username & password (hỗ trợ cả username chính và aliases)
 */
export function findMockUser(username: string, password?: string): MockRoleAccount | undefined {
  const normalizedUser = username.trim().toLowerCase();
  return MOCK_ROLES.find(
    (item) =>
      (item.credentials.username.toLowerCase() === normalizedUser ||
        item.user.username.toLowerCase() === normalizedUser ||
        item.user.email?.toLowerCase() === normalizedUser ||
        (item.aliases && item.aliases.some((a) => a.toLowerCase() === normalizedUser))) &&
      (!password || item.credentials.password === password)
  );
}

/**
 * Tìm mock user theo role code
 */
export function getMockUserByRole(roleCode: string): MockRoleAccount | undefined {
  return MOCK_ROLES.find((item) => item.roleCode === roleCode);
}
