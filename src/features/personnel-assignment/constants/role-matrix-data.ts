export interface MatrixPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  moduleId: string;
  moduleName: string;
  category: "read" | "write" | "approve" | "admin";
}

export interface MatrixRole {
  code: string;
  name: string;
  shortName: string;
  group: "director" | "base" | "lead" | "member" | "special";
  inheritsFrom?: "BASE_LEAD" | "BASE_MEMBER";
  description: string;
  color: string;
  isCustom?: boolean;
}

export interface MatrixModule {
  id: string;
  code: string;
  name: string;
  shortName: string;
  iconName: string;
}

export const MATRIX_MODULES: MatrixModule[] = [
  { id: "M1", code: "M1", name: "Bàn làm việc & Báo cáo điều hành", shortName: "Bàn làm việc", iconName: "DashboardOutlined" },
  { id: "M2", code: "M2", name: "Quản lý Dự án & Công trình", shortName: "Dự án & Công trình", iconName: "ProjectOutlined" },
  { id: "M3", code: "M3", name: "Hồ sơ Thủ tục XDCB (7 GĐ & 46 bước)", shortName: "Thủ tục XDCB", iconName: "FileTextOutlined" },
  { id: "M4", code: "M4", name: "Tài chính, Giải ngân & Quyết toán", shortName: "Tài chính & Giải ngân", iconName: "DollarOutlined" },
  { id: "M5", code: "M5", name: "Nhân sự & Phân công nhiệm vụ", shortName: "Nhân sự & Phân công", iconName: "TeamOutlined" },
  { id: "M6", code: "M6", name: "Bồi thường, GPMB & Tái định cư", shortName: "Bồi thường & GPMB", iconName: "EnvironmentOutlined" },
  { id: "M7", code: "M7", name: "Quản lý Đấu thầu xây lắp", shortName: "Đấu thầu", iconName: "AuditOutlined" },
  { id: "M8", code: "M8", name: "Bảo hành & Bảo trì công trình", shortName: "Bảo hành & Bảo trì", iconName: "SafetyOutlined" },
  { id: "M9", code: "M9", name: "Thư viện Pháp lý & AI Trợ lý", shortName: "Thư viện Pháp lý", iconName: "ReadOutlined" },
  { id: "SYS", code: "SYS", name: "Quản trị Hệ thống & Phân quyền", shortName: "Hệ thống", iconName: "SettingOutlined" },
];

export const MATRIX_PERMISSIONS: MatrixPermission[] = [
  // M1
  {
    id: "m1.view",
    code: "dashboard:view",
    name: "Xem Bàn làm việc & KPI",
    description: "Xem các chỉ số KPI điều hành, tiến độ và giải ngân toàn Ban",
    moduleId: "M1",
    moduleName: "Bàn làm việc & Báo cáo",
    category: "read",
  },
  {
    id: "m1.export",
    code: "dashboard:export",
    name: "Xuất báo cáo tổng hợp",
    description: "Xuất file báo cáo định kỳ tuần, tháng, quý cho Lãnh đạo Ban",
    moduleId: "M1",
    moduleName: "Bàn làm việc & Báo cáo",
    category: "admin",
  },

  // M2
  {
    id: "m2.view",
    code: "m2_projects:view",
    name: "Xem danh mục dự án",
    description: "Tra cứu danh sách công trình, thông tin tổng mức đầu tư, tiến độ",
    moduleId: "M2",
    moduleName: "Quản lý Dự án & Công trình",
    category: "read",
  },
  {
    id: "m2.create_edit",
    code: "m2_projects:input",
    name: "Thêm mới & Cập nhật dự án",
    description: "Khởi tạo hồ sơ công trình mới, chỉnh sửa thông tin kỹ thuật dự án",
    moduleId: "M2",
    moduleName: "Quản lý Dự án & Công trình",
    category: "write",
  },
  {
    id: "m2.update_progress",
    code: "m2_projects:progress",
    name: "Cập nhật tiến độ dự án (Quy tắc 4)",
    description: "Báo cáo % tiến độ thực tế, nhật ký hiện trường hàng tuần",
    moduleId: "M2",
    moduleName: "Quản lý Dự án & Công trình",
    category: "write",
  },
  {
    id: "m2.close_open",
    code: "m2_projects:configure",
    name: "Đóng / Mở lại dự án (Quy tắc 5)",
    description: "Quyền đóng dự án khi hoàn thành hoặc mở lại khi cần điều chỉnh",
    moduleId: "M2",
    moduleName: "Quản lý Dự án & Công trình",
    category: "approve",
  },
  {
    id: "m2.export",
    code: "m2_projects:export",
    name: "Xuất báo cáo danh mục dự án",
    description: "Xuất Excel / PDF tiến độ các dự án trên địa bàn TP. Hà Tiên",
    moduleId: "M2",
    moduleName: "Quản lý Dự án & Công trình",
    category: "admin",
  },

  // M3
  {
    id: "m3.view",
    code: "m3_construction_procedures:view",
    name: "Xem thủ tục 7 GĐ & 46 bước",
    description: "Theo dõi luồng 46 bước thủ tục XDCB từ chuẩn bị đến hoàn thành",
    moduleId: "M3",
    moduleName: "Hồ sơ Thủ tục XDCB",
    category: "read",
  },
  {
    id: "m3.update_step",
    code: "m3_construction_procedures:input",
    name: "Cập nhật bước thủ tục & biên bản",
    description: "Nhập hồ sơ, đính kèm tờ trình, biên bản nghiệm thu bước",
    moduleId: "M3",
    moduleName: "Hồ sơ Thủ tục XDCB",
    category: "write",
  },
  {
    id: "m3.approve_step",
    code: "m3_construction_procedures:approve",
    name: "Phê duyệt hoàn thành bước",
    description: "Ký duyệt chuyển giai đoạn và xác nhận hoàn tất bước thủ tục",
    moduleId: "M3",
    moduleName: "Hồ sơ Thủ tục XDCB",
    category: "approve",
  },
  {
    id: "m3.config_template",
    code: "m3_construction_procedures:configure",
    name: "Cấu hình quy trình mẫu XDCB",
    description: "Thêm bớt, điều chỉnh danh mục bước thủ tục chuẩn của Ban",
    moduleId: "M3",
    moduleName: "Hồ sơ Thủ tục XDCB",
    category: "admin",
  },

  // M4
  {
    id: "m4.view",
    code: "m4_finance_settlement:view",
    name: "Xem tài chính & kế hoạch vốn",
    description: "Theo dõi dòng tiền, hạn mức giải ngân, số liệu Kho bạc Nhà nước",
    moduleId: "M4",
    moduleName: "Tài chính & Quyết toán",
    category: "read",
  },
  {
    id: "m4.create_disbursement",
    code: "m4_finance_settlement:input",
    name: "Lập đề nghị giải ngân & thanh toán",
    description: "Soạn hồ sơ tạm ứng, thanh toán khối lượng A-B",
    moduleId: "M4",
    moduleName: "Tài chính & Quyết toán",
    category: "write",
  },
  {
    id: "m4.approve_disbursement",
    code: "m4_finance_settlement:approve",
    name: "Phê duyệt giải ngân & quyết toán",
    description: "Ký duyệt chứng từ thanh toán, phê duyệt tất toán vốn dự án",
    moduleId: "M4",
    moduleName: "Tài chính & Quyết toán",
    category: "approve",
  },
  {
    id: "m4.export",
    code: "m4_finance_settlement:export",
    name: "Xuất báo cáo tài chính KBNN",
    description: "In bảng kê thanh toán, phụ lục giải ngân vốn đầu tư công",
    moduleId: "M4",
    moduleName: "Tài chính & Quyết toán",
    category: "admin",
  },

  // M5
  {
    id: "m5.view",
    code: "m5_personnel_assignment:view",
    name: "Xem cơ cấu tổ chức & phân công",
    description: "Xem sơ đồ nhân sự, danh sách cán bộ và nhiệm vụ các tổ",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "read",
  },
  {
    id: "m5.assign_project_leaders",
    code: "m5_personnel_assignment:configure",
    name: "Phân công lãnh đạo dự án",
    description: "Chỉ định Chủ nhiệm dự án và Giám sát chính cho công trình",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "approve",
  },
  {
    id: "m5.grant_cnda",
    code: "m5_personnel_assignment:grant_cnda",
    name: "Cấp / Thu hồi quyền CNDA",
    description: "Ủy quyền Quyền Chủ nhiệm dự án cho cán bộ thực hiện chính",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "approve",
  },
  {
    id: "m5.assign_tasks",
    code: "m5_personnel_assignment:input",
    name: "Giao việc nhân viên theo giai đoạn",
    description: "Phân công nhiệm vụ cụ thể cho từng thành viên trong tổ/dự án",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "write",
  },
  {
    id: "m5.review_submissions",
    code: "m5_personnel_assignment:approve",
    name: "Nghiệm thu kết quả & đôn đốc việc",
    description: "Kiểm tra sản phẩm nhiệm vụ, duyệt hoàn thành hoặc yêu cầu sửa",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "approve",
  },
  {
    id: "m5.manage_accounts",
    code: "m5_personnel_assignment:accounts",
    name: "Quản lý nhân sự & tài khoản",
    description: "Thêm cán bộ mới, sửa chức danh, khóa hoặc mở tài khoản",
    moduleId: "M5",
    moduleName: "Nhân sự & Phân công",
    category: "admin",
  },

  // M6
  {
    id: "m6.view",
    code: "m6_site_clearance:view",
    name: "Xem tiến độ GPMB 16 bước",
    description: "Xem ma trận 16 bước hộ dân, tiến độ bàn giao mặt bằng",
    moduleId: "M6",
    moduleName: "Bồi thường, GPMB & TĐC",
    category: "read",
  },
  {
    id: "m6.input_survey",
    code: "m6_site_clearance:input",
    name: "Nhập hồ sơ kiểm đếm & hộ dân",
    description: "Lập hồ sơ kỹ thuật thửa đất, kiểm đếm tài sản, nhân khẩu",
    moduleId: "M6",
    moduleName: "Bồi thường, GPMB & TĐC",
    category: "write",
  },
  {
    id: "m6.approve_compensation",
    code: "m6_site_clearance:approve",
    name: "Duyệt phương án bồi thường & TĐC",
    description: "Phê duyệt dự thảo bồi thường, phân lô nền tái định cư và chi trả",
    moduleId: "M6",
    moduleName: "Bồi thường, GPMB & TĐC",
    category: "approve",
  },
  {
    id: "m6.export",
    code: "m6_site_clearance:export",
    name: "Xuất báo cáo GPMB",
    description: "Xuất dữ liệu chi trả bồi thường, danh sách bàn giao mặt bằng",
    moduleId: "M6",
    moduleName: "Bồi thường, GPMB & TĐC",
    category: "admin",
  },

  // M7
  {
    id: "m7.view",
    code: "m7_bidding:view",
    name: "Xem danh mục gói thầu",
    description: "Xem kế hoạch lựa chọn nhà thầu, trạng thái các gói thầu",
    moduleId: "M7",
    moduleName: "Quản lý Đấu thầu",
    category: "read",
  },
  {
    id: "m7.manage_tender",
    code: "m7_bidding:input",
    name: "Lập HSMT & Đánh giá hồ sơ",
    description: "Soạn thảo hồ sơ mời thầu, mở thầu, lập báo cáo đánh giá E-HSDT",
    moduleId: "M7",
    moduleName: "Quản lý Đấu thầu",
    category: "write",
  },
  {
    id: "m7.approve_bid",
    code: "m7_bidding:approve",
    name: "Phê duyệt kết quả đấu thầu",
    description: "Ký quyết định phê duyệt kết quả lựa chọn nhà thầu",
    moduleId: "M7",
    moduleName: "Quản lý Đấu thầu",
    category: "approve",
  },

  // M8
  {
    id: "m8.view",
    code: "m8_warranty:view",
    name: "Xem thời hạn bảo hành công trình",
    description: "Theo dõi số ngày còn lại của bảo hành, bảo lãnh bảo hành",
    moduleId: "M8",
    moduleName: "Bảo hành & Bảo trì",
    category: "read",
  },
  {
    id: "m8.manage_incidents",
    code: "m8_warranty:input",
    name: "Ghi nhận sự cố & nghiệm thu sửa",
    description: "Lập biên bản sự cố hiện trường, theo dõi nhà thầu khắc phục",
    moduleId: "M8",
    moduleName: "Bảo hành & Bảo trì",
    category: "write",
  },
  {
    id: "m8.release_bond",
    code: "m8_warranty:approve",
    name: "Nghiệm thu hết BH & Giải tỏa bảo lãnh",
    description: "Ký biên bản kết thúc bảo hành, giải tỏa tiền giữ bảo hành",
    moduleId: "M8",
    moduleName: "Bảo hành & Bảo trì",
    category: "approve",
  },

  // M9
  {
    id: "m9.view_search",
    code: "legal_library:view",
    name: "Tra cứu thư viện pháp lý & AI",
    description: "Tra cứu văn bản pháp luật, tiêu chuẩn xây dựng, hỏi đáp AI",
    moduleId: "M9",
    moduleName: "Thư viện Pháp lý & AI",
    category: "read",
  },
  {
    id: "m9.manage_docs",
    code: "legal_library:input",
    name: "Đăng tải & Quản lý văn bản pháp lý",
    description: "Bổ sung văn bản quy phạm pháp luật vào kho dữ liệu Ban",
    moduleId: "M9",
    moduleName: "Thư viện Pháp lý & AI",
    category: "write",
  },

  // SYS
  {
    id: "sys.config_permissions",
    code: "system:permissions",
    name: "Cấu hình phân quyền hệ thống",
    description: "Toàn quyền điều chỉnh ma trận quyền cho các vai trò và chức danh",
    moduleId: "SYS",
    moduleName: "Quản trị Hệ thống",
    category: "admin",
  },
  {
    id: "sys.audit_log",
    code: "system:audit",
    name: "Xem vết kiểm toán & nhật ký",
    description: "Theo dõi lịch sử truy cập, thay đổi dữ liệu của toàn bộ cán bộ",
    moduleId: "SYS",
    moduleName: "Quản trị Hệ thống",
    category: "admin",
  },
];

export const SYSTEM_MATRIX_ROLES: MatrixRole[] = [
  // 1. Cấp Ban Giám đốc
  {
    code: "ADMIN",
    name: "Giám đốc (Toàn quyền)",
    shortName: "Giám đốc",
    group: "director",
    description: "Lãnh đạo cao nhất Ban QLDA, toàn quyền điều hành, phê duyệt và phân bổ nguồn lực",
    color: "#DC2626",
  },
  {
    code: "DEPUTY_DIRECTOR",
    name: "Phó Giám đốc",
    shortName: "Phó GĐ",
    group: "director",
    description: "Giúp việc Giám đốc, trực tiếp chỉ đạo và điều hành các dự án được phân công",
    color: "#2563EB",
  },

  // 2. NHÓM QUYỀN CHUNG (Base Roles) - Cốt lõi cho tính kế thừa
  {
    code: "BASE_LEAD",
    name: "Tổ trưởng (Quyền chung Lead)",
    shortName: "Lead (Chung)",
    group: "base",
    description: "Bộ quyền cơ sở dành cho tất cả vị trí Tổ trưởng / Trưởng bộ phận. Các role Lead sẽ tự động kế thừa bộ quyền này.",
    color: "#D97706",
  },
  {
    code: "BASE_MEMBER",
    name: "Thành viên (Quyền chung Member)",
    shortName: "Member (Chung)",
    group: "base",
    description: "Bộ quyền cơ sở dành cho tất cả nhân viên / chuyên viên chuyên môn. Các role Thành viên sẽ tự động kế thừa bộ quyền này.",
    color: "#059669",
  },

  // 3. Các Role Lead cụ thể
  {
    code: "TECHNICAL_OFFICER",
    name: "Tổ trưởng Giám sát – Kỹ thuật",
    shortName: "Tổ trưởng GSKT",
    group: "lead",
    inheritsFrom: "BASE_LEAD",
    description: "Quản lý tổ Kỹ thuật, nhận giai đoạn dự án, giao việc thành viên, cập nhật tiến độ và hồ sơ XDCB",
    color: "#0891B2",
  },
  {
    code: "CHIEF_ACCOUNTANT",
    name: "Kế toán trưởng",
    shortName: "Kế toán trưởng",
    group: "lead",
    inheritsFrom: "BASE_LEAD",
    description: "Kiểm soát tài chính dự án, phê duyệt giải ngân cấp 1, kế hoạch vốn, tất toán KBNN",
    color: "#7C3AED",
  },

  // 4. Các Role Member cụ thể
  {
    code: "TECHNICAL_MEMBER",
    name: "Chuyên viên Giám sát Kỹ thuật",
    shortName: "Chuyên viên KT",
    group: "member",
    inheritsFrom: "BASE_MEMBER",
    description: "Thực hiện giám sát hiện trường, kiểm tra khối lượng, đính kèm biên bản nghiệm thu",
    color: "#0284C7",
  },
  {
    code: "ACCOUNTANT",
    name: "Kế toán viên",
    shortName: "Kế toán viên",
    group: "member",
    inheritsFrom: "BASE_MEMBER",
    description: "Lập chứng từ tạm ứng, thanh toán khối lượng A-B, đối chiếu số liệu Kho bạc",
    color: "#9333EA",
  },
  {
    code: "COMPENSATION_OFFICER",
    name: "Chuyên viên Bồi thường – GPMB",
    shortName: "Cán bộ GPMB",
    group: "member",
    inheritsFrom: "BASE_MEMBER",
    description: "Quản lý 16 bước GPMB, kiểm đếm hiện trạng, lập phương án bồi thường và chi trả",
    color: "#E11D48",
  },
  {
    code: "ADMINISTRATIVE_OFFICER",
    name: "Chuyên viên Hành chính – Tổng hợp",
    shortName: "Cán bộ HC-TH",
    group: "member",
    inheritsFrom: "BASE_MEMBER",
    description: "Văn thư lưu trữ, thủ tục hành chính, tổng hợp báo cáo định kỳ",
    color: "#4B5563",
  },

  // 5. Role đặc thù theo dự án
  {
    code: "ACTING_DIRECTOR",
    name: "Quyền Chủ nhiệm dự án (CNDA)",
    shortName: "Quyền CNDA",
    group: "special",
    description: "Được Ban Giám đốc ủy quyền: giao việc các giai đoạn dự án, quản lý tổ công tác công trình",
    color: "#EA580C",
  },
];

/**
 * Bản đồ cấu hình phân quyền ban đầu (System Default Matrix)
 */
export const DEFAULT_ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  // Giám đốc: Toàn bộ tất cả quyền của hệ thống
  ADMIN: MATRIX_PERMISSIONS.map((p) => p.id),

  // Phó Giám đốc: Toàn bộ quyền điều hành, phê duyệt dự án, GPMB, đấu thầu, thủ tục
  DEPUTY_DIRECTOR: [
    "m1.view", "m1.export",
    "m2.view", "m2.create_edit", "m2.update_progress", "m2.close_open", "m2.export",
    "m3.view", "m3.update_step", "m3.approve_step", "m3.config_template",
    "m4.view", "m4.export",
    "m5.view", "m5.assign_project_leaders", "m5.grant_cnda", "m5.review_submissions",
    "m6.view", "m6.approve_compensation", "m6.export",
    "m7.view", "m7.manage_tender", "m7.approve_bid", "m7.export",
    "m8.view", "m8.release_bond", "m8.export",
    "m9.view_search", "m9.use_ai", "m9.manage_docs",
    "sys.audit_log",
  ],

  // Quyền CHUNG CỦA TỔ TRƯỞNG (Lead)
  BASE_LEAD: [
    "m1.view", "m1.export",
    "m2.view",
    "m3.view", "m3.update_step",
    "m5.view", "m5.assign_tasks", "m5.review_submissions",
    "m9.view_search", "m9.use_ai",
  ],

  // Quyền CHUNG CỦA THÀNH VIÊN (Member)
  BASE_MEMBER: [
    "m1.view",
    "m2.view",
    "m3.view",
    "m5.view",
    "m9.view_search", "m9.use_ai",
  ],

  // Tổ trưởng GSKT: Kế thừa Base Lead + quyền chuyên môn M2, M3, M7, M8
  TECHNICAL_OFFICER: [
    // Base Lead
    "m1.view", "m1.export",
    "m2.view",
    "m3.view", "m3.update_step",
    "m5.view", "m5.assign_tasks", "m5.review_submissions",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m2.create_edit", "m2.update_progress", "m2.export",
    "m3.config_template",
    "m4.view",
    "m7.view", "m7.manage_tender",
    "m8.view", "m8.manage_incidents",
  ],

  // Kế toán trưởng: Kế thừa Base Lead + quyền tài chính M4, M8
  CHIEF_ACCOUNTANT: [
    // Base Lead
    "m1.view", "m1.export",
    "m2.view",
    "m3.view", "m3.update_step",
    "m5.view", "m5.assign_tasks", "m5.review_submissions",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m4.view", "m4.create_disbursement", "m4.approve_disbursement", "m4.export",
    "m8.view", "m8.release_bond",
  ],

  // Chuyên viên Kỹ thuật: Kế thừa Base Member + M2, M3, M8
  TECHNICAL_MEMBER: [
    // Base Member
    "m1.view",
    "m2.view",
    "m3.view",
    "m5.view",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m2.update_progress",
    "m3.update_step",
    "m8.view", "m8.manage_incidents",
  ],

  // Kế toán viên: Kế thừa Base Member + M4
  ACCOUNTANT: [
    // Base Member
    "m1.view",
    "m2.view",
    "m3.view",
    "m5.view",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m4.view", "m4.create_disbursement", "m4.export",
  ],

  // Cán bộ GPMB: Kế thừa Base Member + M6
  COMPENSATION_OFFICER: [
    // Base Member
    "m1.view",
    "m2.view",
    "m3.view",
    "m5.view",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m3.update_step",
    "m6.view", "m6.input_survey", "m6.export",
  ],

  // Cán bộ Hành chính: Kế thừa Base Member + M1, M3, M9
  ADMINISTRATIVE_OFFICER: [
    // Base Member
    "m1.view",
    "m2.view",
    "m3.view",
    "m5.view",
    "m9.view_search", "m9.use_ai",
    // Chuyên môn
    "m1.export",
    "m3.update_step",
    "m9.manage_docs",
  ],

  // Quyền CNDA: Có quyền điều hành giao việc trong dự án phụ trách
  ACTING_DIRECTOR: [
    "m1.view",
    "m2.view", "m2.update_progress",
    "m3.view", "m3.update_step",
    "m5.view", "m5.assign_tasks", "m5.review_submissions",
    "m7.view", "m7.manage_tender",
    "m8.view", "m8.manage_incidents",
    "m9.view_search", "m9.use_ai",
  ],
};
