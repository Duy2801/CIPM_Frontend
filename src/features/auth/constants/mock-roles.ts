import type { MockRoleAccount } from "../types/auth.types";

/**
 * 7 VAI TRÒ MẪU HỆ THỐNG QUẢN LÝ DỰ ÁN BQL ĐTXD HÀ TIÊN
 *
 * Căn cứ: Tài liệu BRD BQL-BRD-2026-003, Mục 3.2 Đối tượng người dùng
 * Mật khẩu mặc định để test đăng nhập: 123456
 */
export const MOCK_ROLES: MockRoleAccount[] = [
  {
    id: "role_admin",
    roleCode: "ADMIN",
    roleName: "Quản trị hệ thống (Giám đốc)",
    department: "Ban Giám đốc",
    user: {
      id: "usr_001",
      username: "giamdoc",
      displayName: "Huỳnh Thái Hải",
      roleCode: "ADMIN",
      roleName: "Giám đốc / QL Hệ thống",
      department: "Ban Giám đốc",
      initials: "TH",
      email: "hai.ht@hatien.gov.vn",
      phone: "0918.xxx.xxx",
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
      m4_finance_settlement: ["view", "approve", "configure", "export"],
      m5_personnel_assignment: ["view", "input", "approve", "configure", "export"],
      m6_site_clearance: ["view", "approve", "configure", "export"],
      m7_bidding: ["view", "approve", "configure", "export"],
      m8_warranty: ["view", "export"],
      legal_library: ["view", "input", "approve", "configure", "export"],
    },
    description: "Toàn quyền xem, phê duyệt cấp cao nhất, cấu hình hệ thống, ký số và xuất báo cáo tổng hợp",
    accessibleSummary: ["Tất cả 9 Phân hệ", "Duyệt cấp cao nhất", "Cấu hình phân quyền", "Xuất báo cáo AI"],
    badgeColor: "teal",
  },
  {
    id: "role_deputy",
    roleCode: "DEPUTY_DIRECTOR",
    roleName: "Phó Giám đốc (Phó quản lý)",
    department: "Ban Giám đốc",
    user: {
      id: "usr_002",
      username: "phogiamdoc",
      displayName: "Trần Văn Nam",
      roleCode: "DEPUTY_DIRECTOR",
      roleName: "Phó Giám đốc",
      department: "Ban Giám đốc",
      initials: "VN",
      email: "nam.tv@hatien.gov.vn",
      phone: "0913.xxx.xxx",
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
  {
    id: "role_technical",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Tổ trưởng GSKT",
    department: "Tổ Giám sát – Kỹ thuật",
    user: {
      id: "usr_003",
      username: "kythuat",
      displayName: "Lê Hoàng Minh",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Tổ trưởng GSKT",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "HM",
      email: "minh.lh@hatien.gov.vn",
      phone: "0982.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "kythuat",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view", "input", "export"],
      m3_construction_procedures: ["view", "input", "configure", "export"],
      m4_finance_settlement: ["view"],
      m5_personnel_assignment: ["view", "input", "export"],
      m7_bidding: ["view", "input", "export"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Tổ trưởng Tổ Giám sát – Kỹ thuật; có thể nhận giai đoạn và giao việc cho thành viên sau khi được phân công.",
    accessibleSummary: ["Tổ trưởng GSKT", "Nhiệm vụ & Giao việc (M5)", "Tiến độ dự án (M2)", "Hồ sơ XDCB (M3)"],
    badgeColor: "teal",
  },
  {
    id: "role_chief_accountant",
    roleCode: "CHIEF_ACCOUNTANT",
    roleName: "Kế toán trưởng",
    department: "Tổ Hành chính – Tổng hợp",
    user: {
      id: "usr_004",
      username: "ketoantruong",
      displayName: "Đặng Thị Kim Ngân",
      roleCode: "CHIEF_ACCOUNTANT",
      roleName: "Kế toán trưởng",
      department: "Tổ HC-TH (Tài chính)",
      initials: "KN",
      email: "ngan.dtk@hatien.gov.vn",
      phone: "0908.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "ketoantruong",
      password: "123456",
    },
    permissions: {
      dashboard: ["view", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view", "approve", "export"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Kiểm soát tài chính dự án, phê duyệt giải ngân cấp 1, kế hoạch vốn, thủ tục tất toán KBNN, đính kèm hồ sơ M3",
    accessibleSummary: ["Duyệt giải ngân M4", "Kế hoạch vốn 2026", "Tất toán KBNN", "Bảo lãnh BH (M8)", "Hồ sơ XDCB (M3)"],
    badgeColor: "gold",
  },
  {
    id: "role_accountant",
    roleCode: "ACCOUNTANT",
    roleName: "Kế toán viên",
    department: "Tổ Hành chính – Tổng hợp",
    user: {
      id: "usr_005",
      username: "ketoanvien",
      displayName: "Nguyễn Thị Thúy Hà",
      roleCode: "ACCOUNTANT",
      roleName: "Kế toán viên",
      department: "Tổ HC-TH (Tài chính)",
      initials: "TH",
      email: "ha.ntt@hatien.gov.vn",
      phone: "0977.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "ketoanvien",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Lập đề nghị thanh toán giải ngân, nhập hợp đồng, chứng từ KBNN, đính kèm hồ sơ thủ tục M3",
    accessibleSummary: ["Nhập giải ngân (M4)", "Hồ sơ hợp đồng & KBNN", "Hồ sơ XDCB (M3)", "Dự toán vốn"],
    badgeColor: "gold",
  },
  {
    id: "role_compensation",
    roleCode: "COMPENSATION_OFFICER",
    roleName: "Tổ Bồi thường – GPMB – TĐC",
    department: "Tổ Bồi thường – GPMB – TĐC",
    user: {
      id: "usr_006",
      username: "boithuong",
      displayName: "Phạm Quốc Bảo",
      roleCode: "COMPENSATION_OFFICER",
      roleName: "Chuyên viên Bồi thường - GPMB",
      department: "Tổ Bồi thường – GPMB – TĐC",
      initials: "QB",
      email: "bao.pq@hatien.gov.vn",
      phone: "0945.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "boithuong",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      m6_site_clearance: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Toàn quyền quản lý Module M6: 16 bước GPMB, ma trận 89 hộ dân, chi trả tiền và quỹ nền TĐC, đính kèm hồ sơ M3",
    accessibleSummary: ["Chuyên trách Module M6", "16 bước GPMB & 89 hộ", "Chi trả & TĐC", "Hồ sơ XDCB (M3)"],
    badgeColor: "red",
  },
  {
    id: "role_admin_officer",
    roleCode: "ADMINISTRATIVE_OFFICER",
    roleName: "Tổ Hành chính – Tổng hợp",
    department: "Tổ Hành chính – Tổng hợp",
    user: {
      id: "usr_007",
      username: "hanhchinh",
      displayName: "Võ Thị Mai Phương",
      roleCode: "ADMINISTRATIVE_OFFICER",
      roleName: "Chuyên viên HC-TH",
      department: "Tổ Hành chính – Tổng hợp",
      initials: "MP",
      email: "phuong.vtm@hatien.gov.vn",
      phone: "0932.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "hanhchinh",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m3_construction_procedures: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Quản lý văn thư lưu trữ, đính kèm hồ sơ thủ tục M3, tra cứu thư viện pháp lý",
    accessibleSummary: ["Đính kèm hồ sơ XDCB (M3)", "Thư viện pháp lý", "Dashboard"],
    badgeColor: "purple",
  },
  {
    id: "role_acting_director",
    roleCode: "ACTING_DIRECTOR",
    roleName: "Quyền Chủ nhiệm dự án (Chủ dự án)",
    department: "Tổ Giám sát – Kỹ thuật",
    user: {
      id: "usr_008",
      username: "chuduan",
      displayName: "Phan Văn Đức",
      roleCode: "ACTING_DIRECTOR",
      roleName: "Kỹ sư Giám sát / Quyền CNDA",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "VĐ",
      email: "duc.pv@hatien.gov.vn",
      phone: "0907.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "chuduan",
      password: "123456",
    },
    permissions: {
      dashboard: ["view"],
      m2_projects: ["view", "input", "export"],
      m3_construction_procedures: ["view", "input", "export"],
      m4_finance_settlement: ["view"],
      m5_personnel_assignment: ["view", "input", "export"],
      m7_bidding: ["view", "input", "export"],
      m8_warranty: ["view", "input", "export"],
      legal_library: ["view"],
    },
    description: "Tài khoản thử vai trò Quyền Chủ nhiệm dự án: sau khi được giao dự án có thể phân công nhiệm vụ, quản lý tổ công tác và đôn đốc tiến độ.",
    accessibleSummary: ["Phân công NV nhân viên (M5)", "Tổ công tác dự án", "Tiến độ hiện trường (M2)", "Đôn đốc tiến độ"],
    badgeColor: "teal",
  },
  {
    id: "role_member_viet",
    roleCode: "TECHNICAL_OFFICER",
    roleName: "Thành viên dự án (Kỹ sư Giám sát)",
    department: "Tổ Giám sát – Kỹ thuật",
    user: {
      id: "ST-006",
      username: "tranviet",
      displayName: "Trần Quốc Việt",
      roleCode: "TECHNICAL_OFFICER",
      roleName: "Kỹ sư Giám sát (Thành viên)",
      department: "Tổ Giám sát – Kỹ thuật",
      initials: "QV",
      email: "viet.tq@hatien.gov.vn",
      phone: "0976.xxx.xxx",
      branchId: "BQL-HT",
    },
    credentials: {
      username: "tranviet",
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
    description: "Cán bộ chuyên môn tham gia tổ công tác: Xem nhiệm vụ và giai đoạn thực hiện, theo dõi thành viên và lãnh đạo tổ công tác (CNDA, Tổ trưởng), tải lên hồ sơ và xác nhận hoàn thành công việc.",
    accessibleSummary: ["Nhiệm vụ & Giai đoạn (M5)", "Tổ công tác dự án", "Nộp hồ sơ & Xác nhận", "Tiến độ hiện trường (M2)"],
    badgeColor: "blue",
  },
];

/**
 * Tìm mock user khớp username & password
 */
export function findMockUser(username: string, password?: string): MockRoleAccount | undefined {
  const normalizedUser = username.trim().toLowerCase();
  return MOCK_ROLES.find(
    (item) =>
      (item.credentials.username.toLowerCase() === normalizedUser ||
       item.user.username.toLowerCase() === normalizedUser ||
       item.user.email?.toLowerCase() === normalizedUser) &&
      (!password || item.credentials.password === password)
  );
}

/**
 * Tìm mock user theo role code
 */
export function getMockUserByRole(roleCode: string): MockRoleAccount | undefined {
  return MOCK_ROLES.find((item) => item.roleCode === roleCode);
}
