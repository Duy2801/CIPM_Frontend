import type { AuthUser, Role } from "@/types/auth";
import type { FinanceRolePermissions } from "../types/finance.types";

const EXPORT_PERMISSION = "m4_finance_settlement:export";

type RoleProfile = Omit<FinanceRolePermissions, "userName" | "canExport">;

const READ_ONLY_FLAGS = {
  canCreateDisbursement: false,
  canApproveChief: false,
  canApproveDirector: false,
  canReject: false,
  canManageCapitalPlan: false,
  canCreateCapitalPlan: false,
  canAdjustCapitalPlan: false,
  canSettleProject: false,
  isReadOnly: true,
} as const;

/**
 * Xác định thẩm quyền, nhiệm vụ và giới hạn thao tác của người dùng trên phân hệ M4 - Tài chính & Quyết toán
 * Căn cứ: BRD BQL-BRD-2026-003 (Mục 3.2, 4.4 và Mục 5 - Ma trận phân quyền)
 */
const ROLE_PROFILES: Record<string, RoleProfile> = {
  ADMIN: {
    roleCode: "ADMIN",
    roleTitle: "Giám đốc",
    department: "Ban Giám đốc",
    canCreateDisbursement: false,
    canApproveChief: false,
    canApproveDirector: true,
    canReject: true,
    canManageCapitalPlan: true,
    canCreateCapitalPlan: false,
    canAdjustCapitalPlan: true,
    canSettleProject: true,
    isReadOnly: false,
    actionStatus: "PENDING_DIRECTOR",
    settlementSteps: [1, 2, 3, 4, 5],
    defaultTab: "disbursement",
    readingGuide: "Xem các hồ sơ “Chờ GĐ duyệt”: xem xét thẩm tra của Kế toán trưởng và chứng từ trước khi ký tờ trình KBNN.",
    badgeColor: "teal",
    scopeDescription: "Phê duyệt thanh toán cấp 2 (ký tờ trình KBNN), trả lại hồ sơ và quyết định đóng mã dự án tất toán.",
    allowedDuties: [
      "Phê duyệt thanh toán cấp 2 (ký tờ trình KBNN)",
      "Trả lại hồ sơ giải ngân cho Tổ HC-TH kèm lý do",
      "Thẩm quyền duy nhất phê duyệt đóng mã dự án tất toán (bước 5)",
      "Quyết định điều chỉnh kế hoạch vốn và giám sát toàn diện",
    ],
  },
  CHIEF_ACCOUNTANT: {
    roleCode: "CHIEF_ACCOUNTANT",
    roleTitle: "Kế toán trưởng",
    department: "Tổ HC-TH (Tài chính)",
    canCreateDisbursement: false,
    canApproveChief: true,
    canApproveDirector: false,
    canReject: true,
    canManageCapitalPlan: true,
    canCreateCapitalPlan: true,
    canAdjustCapitalPlan: true,
    canSettleProject: false,
    isReadOnly: false,
    actionStatus: "PENDING_CHIEF",
    settlementSteps: [1, 2, 3, 4],
    defaultTab: "disbursement",
    readingGuide: "Thẩm tra hồ sơ “Chờ KTT duyệt”, kiểm tra chứng từ, trần 95% hợp đồng trước khi duyệt cấp 1 chuyển Giám đốc.",
    badgeColor: "gold",
    scopeDescription: "Thẩm tra tài chính, kiểm soát trần 95% hợp đồng, phê duyệt giải ngân cấp 1 và chủ trì tất toán KBNN (bước 1-4).",
    allowedDuties: [
      "Thẩm tra và phê duyệt giải ngân cấp 1 chuyển Giám đốc",
      "Trả lại hồ sơ yêu cầu Kế toán viên bổ sung chứng từ",
      "Kiểm soát hạn mức giải ngân hợp đồng (cảnh báo 95%)",
      "Điều chỉnh kế hoạch vốn giữa năm kèm văn bản phê duyệt",
      "Chủ trì thực hiện quy trình tất toán KBNN (bước 1 đến bước 4)",
    ],
  },
  ACCOUNTANT: {
    roleCode: "ACCOUNTANT",
    roleTitle: "Kế toán viên",
    department: "Tổ HC-TH (Tài chính)",
    canCreateDisbursement: true,
    canApproveChief: false,
    canApproveDirector: false,
    canReject: false,
    canManageCapitalPlan: true,
    canCreateCapitalPlan: true,
    canAdjustCapitalPlan: true,
    canSettleProject: false,
    isReadOnly: false,
    actionStatus: "REJECTED",
    settlementSteps: [1, 3],
    defaultTab: "disbursement",
    readingGuide: "Lập đề nghị thanh toán mới; ưu tiên xử lý các hồ sơ “Bị trả lại” để bổ sung chứng từ và trình lại.",
    badgeColor: "gold",
    scopeDescription: "Nhập liệu đợt giải ngân, lập đề nghị thanh toán đính kèm chứng từ KBNN và sửa hồ sơ bị trả lại.",
    allowedDuties: [
      "Nhập liệu và lập đề nghị thanh toán giải ngân mới",
      "Đính kèm tờ trình, ủy nhiệm chi, biên bản nghiệm thu KBNN",
      "Sửa và trình lại các hồ sơ bị KTT hoặc Giám đốc trả lại",
      "Đề xuất kế hoạch vốn năm theo từng dự án và nguồn vốn",
      "Chuẩn bị hồ sơ tất toán tài khoản KBNN (bước 1 và bước 3)",
    ],
  },
  DEPUTY_DIRECTOR: {
    ...READ_ONLY_FLAGS,
    settlementSteps: [],
    roleCode: "DEPUTY_DIRECTOR",
    roleTitle: "Phó Giám đốc",
    department: "Ban Giám đốc",
    defaultTab: "disbursement",
    readingGuide: "Xem thẻ “Tỷ lệ giải ngân” và các hồ sơ quá hạn để đôn đốc dự án phụ trách.",
    badgeColor: "blue",
    scopeDescription: "Theo dõi tiến độ giải ngân và cân đối kế hoạch vốn của các dự án được phân công phụ trách.",
    allowedDuties: [
      "Theo dõi tỷ lệ giải ngân so với kế hoạch vốn",
      "Xem chứng từ và luồng duyệt từng hồ sơ",
      "Xuất báo cáo tài chính dự án phụ trách",
    ],
  },
  TECHNICAL_OFFICER: {
    ...READ_ONLY_FLAGS,
    settlementSteps: [],
    roleCode: "TECHNICAL_OFFICER",
    roleTitle: "Kỹ sư Giám sát – Kỹ thuật",
    department: "Tổ Giám sát – Kỹ thuật",
    defaultTab: "disbursement",
    readingGuide: "Đối chiếu cột “Đã giải ngân” với khối lượng nghiệm thu hiện trường; hợp đồng gắn nhãn 95% cần kiểm tra trước.",
    badgeColor: "teal",
    scopeDescription: "Đối chiếu khối lượng nghiệm thu kỹ thuật với tỷ lệ giải ngân và giá trị hợp đồng.",
    allowedDuties: [
      "Đối chiếu khối lượng nghiệm thu với giải ngân",
      "Theo dõi giá trị giải ngân các gói thầu",
      "Kiểm tra hạn mức 95% hợp đồng",
    ],
  },
  ACTING_DIRECTOR: {
    ...READ_ONLY_FLAGS,
    settlementSteps: [],
    roleCode: "ACTING_DIRECTOR",
    roleTitle: "Kỹ sư Giám sát / Quyền CNDA",
    department: "Tổ Giám sát – Kỹ thuật",
    defaultTab: "disbursement",
    readingGuide: "Đối chiếu cột “Đã giải ngân” với khối lượng nghiệm thu hiện trường; hợp đồng gắn nhãn 95% cần kiểm tra trước.",
    badgeColor: "teal",
    scopeDescription: "Đối chiếu khối lượng nghiệm thu kỹ thuật với tỷ lệ giải ngân và giá trị hợp đồng.",
    allowedDuties: [
      "Đối chiếu khối lượng nghiệm thu với giải ngân",
      "Theo dõi giá trị giải ngân các gói thầu",
      "Kiểm tra hạn mức 95% hợp đồng",
    ],
  },
  ADMINISTRATIVE_OFFICER: {
    ...READ_ONLY_FLAGS,
    settlementSteps: [],
    roleCode: "ADMINISTRATIVE_OFFICER",
    roleTitle: "Chuyên viên HC-TH",
    department: "Tổ Hành chính – Tổng hợp",
    defaultTab: "capital",
    readingGuide: "Cột “Văn bản phê duyệt” trong tab Kế hoạch vốn liệt kê các quyết định cần lưu trữ, đối chiếu.",
    badgeColor: "purple",
    scopeDescription: "Tra cứu quyết định giao vốn, lưu trữ văn bản và hồ sơ tất toán tài khoản KBNN.",
    allowedDuties: [
      "Tra cứu quyết định phê duyệt, điều chỉnh vốn",
      "Theo dõi hồ sơ tất toán tài khoản KBNN",
      "Lưu trữ, đối chiếu văn thư chứng từ kế toán",
    ],
  },
  COMPENSATION_OFFICER: {
    ...READ_ONLY_FLAGS,
    settlementSteps: [],
    roleCode: "COMPENSATION_OFFICER",
    roleTitle: "Chuyên viên Bồi thường – GPMB",
    department: "Tổ Bồi thường – GPMB – TĐC",
    defaultTab: "disbursement",
    readingGuide: "Tìm theo “bồi thường” hoặc tên dự án để xem các khoản chi trả GPMB đã được phê duyệt.",
    badgeColor: "red",
    scopeDescription: "Theo dõi dòng tiền chi trả bồi thường, hỗ trợ tái định cư liên kết phân hệ M6.",
    allowedDuties: [
      "Theo dõi nguồn vốn chi trả bồi thường GPMB",
      "Đối chiếu với phương án bồi thường đã phê duyệt",
    ],
  },
};

const GUEST_PROFILE: RoleProfile = {
  ...READ_ONLY_FLAGS,
  settlementSteps: [],
  roleCode: "GUEST",
  roleTitle: "Khách",
  department: "BQL ĐTXD Hà Tiên",
  defaultTab: "disbursement",
  readingGuide: "Bạn đang xem dữ liệu tài chính tổng hợp.",
  badgeColor: "blue",
  scopeDescription: "Chế độ xem thông tin tài chính chung hệ thống.",
  allowedDuties: ["Chỉ xem dữ liệu"],
};

export function getFinanceRolePermissions(user: AuthUser | null): FinanceRolePermissions {
  const role = user?.role as Role | undefined;
  const profile = (role && ROLE_PROFILES[role]) || GUEST_PROFILE;
  const permissions = user?.permissions ?? [];

  // Quyền động theo Permission: Cấp/thu hồi quyền 'm4_finance_settlement:*' có hiệu lực tức thì
  const hasInput = permissions.includes("m4_finance_settlement:input");
  const hasApprove = permissions.includes("m4_finance_settlement:approve");
  const hasConfigure = permissions.includes("m4_finance_settlement:configure");

  const canCreateDisbursement = hasInput;
  const canCreateCapitalPlan = hasInput || hasConfigure;
  const canApproveChief = hasApprove && role !== "ADMIN";
  const canApproveDirector = hasApprove && (hasConfigure || role === "ADMIN" || role === "DEPUTY_DIRECTOR");
  const canReject = hasApprove;
  const canManageCapitalPlan = hasApprove || hasConfigure;
  const canAdjustCapitalPlan = hasConfigure || (hasApprove && role === "ADMIN");
  const canSettleProject = hasConfigure || (hasApprove && role === "ADMIN");
  const isReadOnly = !canCreateDisbursement && !canApproveChief && !canApproveDirector && !canManageCapitalPlan;

  return {
    ...profile,
    canCreateDisbursement,
    canCreateCapitalPlan,
    canApproveChief,
    canApproveDirector,
    canReject,
    canManageCapitalPlan,
    canAdjustCapitalPlan,
    canSettleProject,
    isReadOnly,
    userName: user?.displayName || user?.name || "Khách truy cập",
    canExport: Boolean(user?.permissions.includes(EXPORT_PERMISSION)),
  };
}

export function canActOnSettlementStep(
  step: number,
  permissions: FinanceRolePermissions,
): boolean {
  return permissions.settlementSteps.includes(step);
}
