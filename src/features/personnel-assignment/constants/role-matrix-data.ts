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
  /** Ngày tạo (ISO). Chức danh hệ thống dùng ngày giả lập cố định (dữ liệu mẫu) */
  createdAt?: string;
}

export interface MatrixModule {
  id: string;
  code: string;
  name: string;
  shortName: string;
  iconName: string;
}

export const MATRIX_MODULES: MatrixModule[] = [
  { id: "DASHBOARD", code: "DASHBOARD", name: "Bảng điều khiển", shortName: "Bảng điều khiển", iconName: "DashboardOutlined" },
  { id: "MY_TASK", code: "MY_TASK", name: "Việc cần xử lý", shortName: "Việc cần xử lý", iconName: "CheckSquareOutlined" },
  { id: "PROJECT", code: "PROJECT", name: "Dự án & Công trình", shortName: "Dự án & Công trình", iconName: "ProjectOutlined" },
  { id: "PROCEDURE", code: "PROCEDURE", name: "Quy trình dự án", shortName: "Quy trình dự án", iconName: "ApartmentOutlined" },
  { id: "STAFF", code: "STAFF", name: "Nhân sự & Phân công", shortName: "Nhân sự & Phân công", iconName: "TeamOutlined" },
  { id: "REPORT", code: "REPORT", name: "Báo cáo", shortName: "Báo cáo", iconName: "BarChartOutlined" },
  { id: "LEGAL", code: "LEGAL", name: "Thư viện Pháp lý", shortName: "Thư viện Pháp lý", iconName: "ReadOutlined" },
  { id: "CATALOG", code: "CATALOG", name: "Danh mục dùng chung", shortName: "Danh mục dùng chung", iconName: "DatabaseOutlined" },
  { id: "SYSTEM", code: "SYSTEM", name: "Hệ thống", shortName: "Hệ thống", iconName: "SettingOutlined" },
];

export const MATRIX_PERMISSIONS: MatrixPermission[] = [
  {
    id: "dashboard:view_kpi",
    code: "dashboard:view_kpi",
    name: "Xem bảng điều khiển & KPI",
    description: "Truy cập bảng điều khiển tổng quan và theo dõi các chỉ số KPI điều hành dự án",
    moduleId: "DASHBOARD",
    moduleName: "Bảng điều khiển",
    category: "read",
  },
  {
    id: "my_task:view_all",
    code: "my_task:view_all",
    name: "Xem việc của mọi dự án",
    description: "Xem toàn bộ danh sách việc cần xử lý của mọi dự án trong hệ thống",
    moduleId: "MY_TASK",
    moduleName: "Việc cần xử lý",
    category: "read",
  },
  {
    id: "my_task:act_on_behalf",
    code: "my_task:act_on_behalf",
    name: "Làm hộ việc của cán bộ khác",
    description: "Tiếp nhận việc, ghi chú, đính kèm tài liệu và nộp kết quả thay cho người được giao việc",
    moduleId: "MY_TASK",
    moduleName: "Việc cần xử lý",
    category: "write",
  },
  {
    id: "procedure:approve_step",
    code: "procedure:approve_step",
    name: "Duyệt / trả lại kết quả bước & xử lý sự cố",
    description: "Phê duyệt, trả lại kết quả thực hiện bước quy trình và giải quyết sự cố phát sinh",
    moduleId: "MY_TASK",
    moduleName: "Việc cần xử lý",
    category: "approve",
  },
  {
    id: "project:view",
    code: "project:view",
    name: "Xem danh mục & chi tiết dự án",
    description: "Xem danh sách và thông tin chi tiết hồ sơ các dự án đầu tư công",
    moduleId: "PROJECT",
    moduleName: "Dự án & Công trình",
    category: "read",
  },
  {
    id: "project:create_update",
    code: "project:create_update",
    name: "Thêm mới & cập nhật dự án",
    description: "Tạo mới và cập nhật thông tin dự án, quy trình áp dụng và tệp tài liệu",
    moduleId: "PROJECT",
    moduleName: "Dự án & Công trình",
    category: "write",
  },
  {
    id: "project:archive_rule5",
    code: "project:archive_rule5",
    name: "Đóng / mở lại dự án",
    description: "Đóng dự án khi hoàn thành quyết toán hoặc mở lại khi cần điều chỉnh theo Quy tắc 5",
    moduleId: "PROJECT",
    moduleName: "Dự án & Công trình",
    category: "approve",
  },
  {
    id: "project:disburse",
    code: "project:disburse",
    name: "Ghi nhận giải ngân dự án",
    description: "Ghi nhận các đợt giải ngân, thu hồi vốn và đính kèm chứng từ giải ngân dự án",
    moduleId: "PROJECT",
    moduleName: "Dự án & Công trình",
    category: "write",
  },
  {
    id: "procedure:view",
    code: "procedure:view",
    name: "Xem quy trình",
    description: "Xem danh mục quy trình mẫu, sơ đồ các bước và tiến độ quy trình",
    moduleId: "PROCEDURE",
    moduleName: "Quy trình dự án",
    category: "read",
  },
  {
    id: "procedure:config_template",
    code: "procedure:config_template",
    name: "Tạo & cấu hình quy trình mẫu",
    description: "Thêm mới, cấu hình các bước, lượt thực hiện và gửi duyệt quy trình mẫu",
    moduleId: "PROCEDURE",
    moduleName: "Quy trình dự án",
    category: "admin",
  },
  {
    id: "procedure:approve_template",
    code: "procedure:approve_template",
    name: "Duyệt quy trình mẫu",
    description: "Phê duyệt hoặc từ chối ban hành các quy trình mẫu để đưa vào áp dụng",
    moduleId: "PROCEDURE",
    moduleName: "Quy trình dự án",
    category: "approve",
  },
  {
    id: "procedure:assign_step",
    code: "procedure:assign_step",
    name: "Phân công & lập kế hoạch bước trong dự án",
    description: "Phân công người thực hiện, người giám sát, thời hạn và bật/tắt bước trong dự án",
    moduleId: "PROCEDURE",
    moduleName: "Quy trình dự án",
    category: "write",
  },
  {
    id: "staff:view_organization",
    code: "staff:view_organization",
    name: "Xem cơ cấu tổ chức & nhân sự",
    description: "Xem sơ đồ cơ cấu tổ chức, danh sách phòng ban và cán bộ",
    moduleId: "STAFF",
    moduleName: "Nhân sự & Phân công",
    category: "read",
  },
  {
    id: "staff:manage_users",
    code: "staff:manage_users",
    name: "Quản lý tài khoản cán bộ",
    description: "Tạo mới tài khoản cán bộ, cập nhật thông tin và khóa/mở khóa tài khoản",
    moduleId: "STAFF",
    moduleName: "Nhân sự & Phân công",
    category: "admin",
  },
  {
    id: "staff:manage_organization",
    code: "staff:manage_organization",
    name: "Quản lý phòng ban",
    description: "Thêm mới, cập nhật thông tin và cơ cấu các phòng ban / tổ chuyên môn",
    moduleId: "STAFF",
    moduleName: "Nhân sự & Phân công",
    category: "admin",
  },
  {
    id: "staff:manage_cnda_permission",
    code: "staff:manage_cnda_permission",
    name: "Gán chức danh & quyền cá nhân",
    description: "Gán chức danh, cấp thêm hoặc thu hồi quyền hạn cá nhân của từng cán bộ",
    moduleId: "STAFF",
    moduleName: "Nhân sự & Phân công",
    category: "admin",
  },
  {
    id: "report:view",
    code: "report:view",
    name: "Xem báo cáo",
    description: "Xem danh sách và xem trực tiếp tệp báo cáo trên hệ thống",
    moduleId: "REPORT",
    moduleName: "Báo cáo",
    category: "read",
  },
  {
    id: "report:import",
    code: "report:import",
    name: "Nhập báo cáo Excel",
    description: "Tải lên và nhập dữ liệu báo cáo dạng Excel/CSV vào hệ thống",
    moduleId: "REPORT",
    moduleName: "Báo cáo",
    category: "write",
  },
  {
    id: "report:export",
    code: "report:export",
    name: "Xuất báo cáo Excel",
    description: "Tải về tệp báo cáo Excel từ hệ thống",
    moduleId: "REPORT",
    moduleName: "Báo cáo",
    category: "write",
  },
  {
    id: "report:configure",
    code: "report:configure",
    name: "Quản lý loại báo cáo",
    description: "Thêm mới, chỉnh sửa và cấu hình các loại báo cáo định kỳ",
    moduleId: "REPORT",
    moduleName: "Báo cáo",
    category: "admin",
  },
  {
    id: "legal_library:view",
    code: "legal_library:view",
    name: "Tra cứu thư viện pháp lý",
    description: "Tra cứu văn bản quy phạm pháp luật, xem chi tiết và tải tệp đính kèm",
    moduleId: "LEGAL",
    moduleName: "Thư viện Pháp lý",
    category: "read",
  },
  {
    id: "legal_library:input",
    code: "legal_library:input",
    name: "Đăng tải & quản lý văn bản pháp lý",
    description: "Thêm mới, cập nhật thông tin và đính kèm văn bản pháp lý",
    moduleId: "LEGAL",
    moduleName: "Thư viện Pháp lý",
    category: "write",
  },
  {
    id: "catalog:manage",
    code: "catalog:manage",
    name: "Thêm / sửa / xóa mục danh mục",
    description: "Quản lý các danh mục loại dự án, loại văn bản, cơ quan ban hành...",
    moduleId: "CATALOG",
    moduleName: "Danh mục dùng chung",
    category: "admin",
  },
  {
    id: "system:configure_permissions",
    code: "system:configure_permissions",
    name: "Cấu hình chức danh & ma trận phân quyền",
    description: "Cấu hình chức danh và thiết lập ma trận phân quyền hệ thống",
    moduleId: "SYSTEM",
    moduleName: "Hệ thống",
    category: "admin",
  },
  {
    id: "system:view_audit_logs",
    code: "system:view_audit_logs",
    name: "Xem nhật ký toàn hệ thống & nhật ký cán bộ",
    description: "Xem lịch sử kiểm toán toàn hệ thống và nhật ký hoạt động của cán bộ",
    moduleId: "SYSTEM",
    moduleName: "Hệ thống",
    category: "admin",
  },
];

/** Ngày tạo giả lập cho chức danh hệ thống (dữ liệu mẫu): bắt đầu 06/01/2025, mỗi chức danh cách nhau 3 ngày */
const mockSystemRoleCreatedAt = (index: number) => new Date(Date.UTC(2025, 0, 6 + index * 3)).toISOString();

export const SYSTEM_MATRIX_ROLES: MatrixRole[] = MOCK_ROLES.map((r, index) => {
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
    createdAt: mockSystemRoleCreatedAt(index),
  };
});

const ALL_PERMISSION_CODES = MATRIX_PERMISSIONS.map((p) => p.code);

export const API_ROLE_PERMISSIONS: Record<string, string[]> = {
  DIRECTOR: ALL_PERMISSION_CODES,
  DEPUTY_DIRECTOR: [
    "dashboard:view_kpi",
    "my_task:view_all",
    "my_task:act_on_behalf",
    "procedure:approve_step",
    "project:view",
    "project:create_update",
    "project:archive_rule5",
    "project:disburse",
    "procedure:view",
    "procedure:config_template",
    "procedure:approve_template",
    "procedure:assign_step",
    "staff:view_organization",
    "staff:manage_organization",
    "report:view",
    "report:import",
    "report:export",
    "report:configure",
    "legal_library:view",
    "legal_library:input",
    "catalog:manage",
  ],
  TECH_LEAD: [
    "dashboard:view_kpi",
    "procedure:approve_step",
    "project:view",
    "project:create_update",
    "procedure:view",
    "procedure:config_template",
    "procedure:approve_template",
    "procedure:assign_step",
    "staff:view_organization",
    "report:view",
    "report:import",
    "report:export",
    "legal_library:view",
    "legal_library:input",
    "catalog:manage",
  ],
  DEPUTY_TECH_LEAD: [
    "dashboard:view_kpi",
    "procedure:approve_step",
    "project:view",
    "project:create_update",
    "procedure:view",
    "procedure:config_template",
    "procedure:assign_step",
    "staff:view_organization",
    "report:view",
    "report:import",
    "report:export",
    "legal_library:view",
    "catalog:manage",
  ],
  TECH_MEMBER: [
    "dashboard:view_kpi",
    "project:view",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "legal_library:view",
  ],
  COMPENSATION_LEAD: [
    "dashboard:view_kpi",
    "procedure:approve_step",
    "project:view",
    "project:create_update",
    "procedure:view",
    "procedure:config_template",
    "procedure:assign_step",
    "staff:view_organization",
    "report:view",
    "report:import",
    "report:export",
    "legal_library:view",
    "catalog:manage",
  ],
  DEPUTY_COMPENSATION_LEAD: [
    "dashboard:view_kpi",
    "procedure:approve_step",
    "project:view",
    "project:create_update",
    "procedure:view",
    "procedure:assign_step",
    "staff:view_organization",
    "report:view",
    "legal_library:view",
  ],
  COMPENSATION_MEMBER: [
    "dashboard:view_kpi",
    "project:view",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "legal_library:view",
  ],
  KTT: [
    "dashboard:view_kpi",
    "procedure:approve_step",
    "project:view",
    "project:disburse",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "report:import",
    "report:export",
    "legal_library:view",
    "catalog:manage",
  ],
  KTV: [
    "dashboard:view_kpi",
    "project:view",
    "project:disburse",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "report:export",
    "legal_library:view",
  ],
  ACCOUNTANT_STAFF: [
    "dashboard:view_kpi",
    "project:view",
    "project:disburse",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "legal_library:view",
  ],
  ADMIN_GENERAL: [
    "dashboard:view_kpi",
    "project:view",
    "procedure:view",
    "procedure:config_template",
    "staff:view_organization",
    "staff:manage_users",
    "staff:manage_organization",
    "staff:manage_cnda_permission",
    "report:view",
    "report:import",
    "report:export",
    "report:configure",
    "legal_library:view",
    "legal_library:input",
    "catalog:manage",
    "system:configure_permissions",
    "system:view_audit_logs",
  ],
  ADMIN_OFFICE: [
    "dashboard:view_kpi",
    "project:view",
    "procedure:view",
    "staff:view_organization",
    "report:view",
    "report:export",
    "legal_library:view",
    "legal_library:input",
    "catalog:manage",
  ],
};

export const MOCK_ROLE_TO_API_ROLE: Record<string, string> = {
  role_admin: "DIRECTOR",
  role_deputy: "DEPUTY_DIRECTOR",
  role_lead_gskt: "TECH_LEAD",
  role_deputy_gskt_kt: "DEPUTY_TECH_LEAD",
  role_deputy_gskt_gs: "DEPUTY_TECH_LEAD",
  role_member_gskt: "TECH_MEMBER",
  role_lead_bt: "COMPENSATION_LEAD",
  role_deputy_bt: "DEPUTY_COMPENSATION_LEAD",
  role_member_bt: "COMPENSATION_MEMBER",
  role_chief_accountant: "KTT",
  role_accountant_treasurer: "ACCOUNTANT_STAFF",
  role_accountant: "KTV",
  role_admin_officer: "ADMIN_GENERAL",
  role_clerk: "ADMIN_OFFICE",
};

export const DEFAULT_ROLE_PERMISSIONS_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = { ...API_ROLE_PERMISSIONS };
  for (const role of MOCK_ROLES) {
    const granted = API_ROLE_PERMISSIONS[MOCK_ROLE_TO_API_ROLE[role.id]] ?? [];
    map[role.id] = granted;
    if (!map[role.roleCode]) map[role.roleCode] = granted;
  }
  map.ADMIN = ALL_PERMISSION_CODES;
  map.BASE_LEAD = API_ROLE_PERMISSIONS.DEPUTY_COMPENSATION_LEAD;
  map.BASE_MEMBER = API_ROLE_PERMISSIONS.TECH_MEMBER;
  return map;
})();
