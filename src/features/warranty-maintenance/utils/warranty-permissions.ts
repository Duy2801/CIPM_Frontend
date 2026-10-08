import type { AuthUser } from "@/types/auth";
import { resolveRoleProfile } from "../../../utils/role-profile.ts";
import type { WarrantyRolePermissions } from "../types/warranty.types";

type WarrantyRoleProfile = Omit<WarrantyRolePermissions, "roleCode" | "userName" | "canExport">;

/**
 * Ma trận BRD mục 5 cho M8: Tổ KT và Kế toán trưởng toàn quyền, Giám đốc / Phó Giám đốc chỉ xem.
 * Tổ KT quản lý sự cố (BRD 4.8.2); Kế toán trưởng xử lý bảo lãnh (liên kết bước 4 tất toán M4).
 */
const ROLE_PROFILES: Record<string, WarrantyRoleProfile> = {
  TECHNICAL_OFFICER: {
    canAccessModule: true,
    roleTitle: "Kỹ sư Giám sát – Kỹ thuật",
    department: "Tổ Giám sát – Kỹ thuật",
    isReadOnly: false,
    canManageIncidents: true,
    canManageBond: false,
    exportScope: "OWN_PROJECTS",
    defaultTab: "warranties",
    scopeDescription: "Toàn quyền quản lý kỹ thuật & sự cố bảo hành công trình phụ trách. Xuất báo cáo DA mình.",
    allowedDuties: [
      "Thêm/sửa hồ sơ công trình bảo hành",
      "Ghi nhận sự cố kèm ảnh hiện trường",
      "Theo dõi nhà thầu khắc phục đúng hạn",
      "Nghiệm thu khắc phục, đính kèm biên bản",
      "Xuất báo cáo công trình bảo hành thuộc DA mình",
    ],
    readingGuide: "Sự cố quá hạn khắc phục được tô đỏ ở đầu danh sách – liên hệ nhà thầu trước tiên.",
  },
  ACTING_DIRECTOR: {
    canAccessModule: true,
    roleTitle: "Kỹ sư Giám sát / Quyền CNDA",
    department: "Tổ Giám sát – Kỹ thuật",
    isReadOnly: false,
    canManageIncidents: true,
    canManageBond: false,
    exportScope: "OWN_PROJECTS",
    defaultTab: "warranties",
    scopeDescription: "Toàn quyền quản lý kỹ thuật & sự cố bảo hành công trình phụ trách. Xuất báo cáo DA mình.",
    allowedDuties: [
      "Thêm/sửa hồ sơ công trình bảo hành",
      "Ghi nhận sự cố kèm ảnh hiện trường",
      "Theo dõi nhà thầu khắc phục đúng hạn",
      "Nghiệm thu khắc phục, đính kèm biên bản",
      "Xuất báo cáo công trình bảo hành thuộc DA mình",
    ],
    readingGuide: "Sự cố quá hạn khắc phục được tô đỏ ở đầu danh sách – liên hệ nhà thầu trước tiên.",
  },
  CHIEF_ACCOUNTANT: {
    canAccessModule: true,
    roleTitle: "Kế toán trưởng",
    department: "Tổ HC-TH (Tài chính)",
    isReadOnly: false,
    canManageIncidents: false,
    canManageBond: true,
    exportScope: "BOND_ONLY",
    defaultTab: "warranties",
    scopeDescription: "Toàn quyền quản lý bảo lãnh bảo hành tài chính: hoàn trả khi hết hạn, thu hồi khi nhà thầu vi phạm nghĩa vụ. Xuất báo cáo TC mình.",
    allowedDuties: [
      "Thêm/sửa hồ sơ công trình bảo hành & bảo lãnh",
      "Hoàn trả bảo lãnh khi hết hạn và không còn sự cố",
      "Thu hồi bảo lãnh khi nhà thầu vi phạm",
      "Đối chiếu với bước 4 quy trình tất toán KBNN",
      "Xuất báo cáo bảo lãnh bảo hành (TC mình)",
    ],
    readingGuide: "Bấm bộ lọc “Đủ điều kiện hoàn trả bảo lãnh” để thấy ngay công trình có thể hoàn trả.",
  },
  ADMIN: {
    canAccessModule: true,
    roleTitle: "Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: true,
    canManageIncidents: false,
    canManageBond: false,
    exportScope: "ALL",
    defaultTab: "warranties",
    scopeDescription: "Theo dõi thời hạn bảo hành, sự cố và tình hình bảo lãnh của toàn bộ các công trình đã bàn giao. Toàn quyền xuất báo cáo.",
    allowedDuties: [
      "Xem thời hạn bảo hành và bảo lãnh toàn hệ thống",
      "Xem tiến độ khắc phục sự cố",
      "Toàn quyền xuất báo cáo PDF/Excel bảo hành",
    ],
    readingGuide: "Thẻ đỏ là công trình còn ≤ 30 ngày bảo hành; kiểm tra xem còn sự cố nào chưa khắc phục.",
  },
  DEPUTY_DIRECTOR: {
    canAccessModule: true,
    roleTitle: "Phó Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: true,
    canManageIncidents: false,
    canManageBond: false,
    exportScope: "ALL",
    defaultTab: "warranties",
    scopeDescription: "Theo dõi bảo hành, sự cố các công trình thuộc dự án phụ trách. Toàn quyền xuất báo cáo.",
    allowedDuties: [
      "Xem thời hạn bảo hành toàn hệ thống",
      "Xem tiến độ khắc phục sự cố",
      "Toàn quyền xuất báo cáo PDF/Excel bảo hành",
    ],
    readingGuide: "Mục “Sự cố quá hạn khắc phục” cho biết nhà thầu nào cần được nhắc nhở.",
  },
};

const BLOCKED_PROFILE: WarrantyRoleProfile = {
  canAccessModule: false,
  roleTitle: "Không có quyền truy cập",
  department: "BQL ĐTXD Hà Tiên",
  isReadOnly: true,
  canManageIncidents: false,
  canManageBond: false,
  exportScope: "NONE",
  defaultTab: "warranties",
  scopeDescription: "Theo Ma trận phân quyền BRD Mục 5, vai trò của bạn không có quyền truy cập phân hệ M8 – Bảo hành & Bảo trì.",
  allowedDuties: ["Không có quyền thao tác hoặc xem dữ liệu"],
  readingGuide: "Vui lòng liên hệ Quản trị hệ thống nếu cần phân công nhiệm vụ.",
};

export function getWarrantyRolePermissions(user: AuthUser | null): WarrantyRolePermissions {
  const profile = resolveRoleProfile(user, ROLE_PROFILES, BLOCKED_PROFILE, "m8_warranty");
  const hasModulePermission =
    user?.permissions && user.permissions.length > 0
      ? user.permissions.includes("m8_warranty:view")
      : profile.canAccessModule;

  if (!hasModulePermission) {
    return {
      ...BLOCKED_PROFILE,
      roleCode: profile.roleCode,
      userName: profile.userName,
      canExport: false,
    };
  }

  // Quyền động theo Permission
  const canManageIncidents = profile.canInput;
  const canManageBond = profile.canConfigure || (user?.role === "CHIEF_ACCOUNTANT" && profile.canInput);
  const isReadOnly = !canManageIncidents && !canManageBond;

  return {
    ...profile,
    canAccessModule: true,
    canManageIncidents,
    canManageBond,
    isReadOnly,
  };
}
