import { MOCK_ROLES } from "@/features/auth/constants/mock-roles";

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
  department?: string;
  isLead?: boolean;
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

export const SYSTEM_MATRIX_ROLES: MatrixRole[] = MOCK_ROLES.map((r) => {
  let group: MatrixRole["group"] = "member";
  if (r.id === "role_admin" || r.roleCode === "ADMIN" || r.id === "role_deputy") {
    group = "director";
  } else if (r.isLead) {
    group = "lead";
  } else if (r.roleCode === "ACTING_DIRECTOR") {
    group = "special";
  }

  return {
    code: r.id,
    name: r.roleName,
    shortName: r.user.roleName || r.roleName.slice(0, 15),
    department: r.department,
    isLead: r.isLead,
    group,
    description: r.description,
    color:
      r.badgeColor === "red"
        ? "#DC2626"
        : r.badgeColor === "blue"
        ? "#2563EB"
        : r.badgeColor === "teal"
        ? "#0D9488"
        : r.badgeColor === "purple"
        ? "#7C3AED"
        : r.badgeColor === "gold"
        ? "#D97706"
        : "#475569",
  };
});

/**
 * Bản đồ cấu hình phân quyền ban đầu (System Default Matrix)
 * Tự động đồng bộ hóa từ dữ liệu chuẩn của MOCK_ROLES
 */
export const DEFAULT_ROLE_PERMISSIONS_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};

  MOCK_ROLES.forEach((r) => {
    if (r.id === "role_admin" || r.roleCode === "ADMIN") {
      const allPerms = MATRIX_PERMISSIONS.map((p) => p.id);
      map[r.id] = allPerms;
      map[r.roleCode] = allPerms;
    } else {
      const granted: string[] = [];
      MATRIX_PERMISSIONS.forEach((p) => {
        const [mod, act] = p.code.split(":");
        if (
          r.permissions &&
          (r.permissions as any)[mod] &&
          (r.permissions as any)[mod].includes(act)
        ) {
          granted.push(p.id);
        }
      });
      map[r.id] = granted;
      if (!map[r.roleCode]) {
        map[r.roleCode] = granted;
      }
    }
  });

  // Fallback bổ sung cho các mã hệ thống kế thừa
  map.ADMIN = MATRIX_PERMISSIONS.map((p) => p.id);
  map.BASE_LEAD = [
    "m1.view", "m1.export", "m2.view", "m3.view", "m3.update_step",
    "m5.view", "m5.assign_tasks", "m5.review_submissions", "m9.view_search",
  ];
  map.BASE_MEMBER = [
    "m1.view", "m2.view", "m3.view", "m5.view", "m9.view_search",
  ];

  return map;
})();
