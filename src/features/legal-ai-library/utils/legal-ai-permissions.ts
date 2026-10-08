import type { AuthUser } from "@/types/auth";
import type { LegalAiPermissions } from "../types/legal-ai.types";

/**
 * Căn cứ: BRD BQL-BRD-2026-003, Mục 5 Ma trận phân quyền người dùng:
 * | M9 – Thư viện + AI | GĐ: ✓ | PGĐ: ✓ | Tổ KT: Xem | KT trưởng: Xem | KT viên: Xem | Tổ BT: Xem |
 * - GĐ & PGĐ (✓): Toàn quyền quản trị văn bản, cấu hình và kết xuất báo cáo AI, ban hành và xuất DOCX/PDF.
 * - Các vai trò khác (Xem): Chỉ tra cứu văn bản pháp luật, xem chi tiết và tải biểu mẫu chuẩn. Không tạo/sửa văn bản, không ban hành báo cáo AI.
 * - Vai trò không có quyền: Bị chặn hoàn toàn khỏi phân hệ.
 */
const ROLE_PERMISSIONS_MAP: Record<string, Omit<LegalAiPermissions, "canAccessModule">> = {
  ADMIN: {
    isReadOnly: false,
    canCreateDocument: true,
    canEditDocument: true,
    canDeleteDocument: true,
    canGenerateReport: true,
    canExportReport: true,
    roleTitle: "Giám đốc / Quản trị hệ thống",
    roleNotice: "Toàn quyền quản trị văn bản QPPL, kết xuất báo cáo AI và ban hành tài liệu.",
  },
  DEPUTY_DIRECTOR: {
    isReadOnly: false,
    canCreateDocument: true,
    canEditDocument: true,
    canDeleteDocument: true,
    canGenerateReport: true,
    canExportReport: true,
    roleTitle: "Phó Giám đốc",
    roleNotice: "Toàn quyền quản trị văn bản QPPL, kết xuất báo cáo AI và ban hành tài liệu.",
  },
  TECHNICAL_OFFICER: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Kỹ sư Giám sát – Kỹ thuật",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản quy phạm pháp luật và tải biểu mẫu kỹ thuật/GPMB.",
  },
  ACTING_DIRECTOR: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Kỹ sư Giám sát / Quyền CNDA",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản quy phạm pháp luật và tải biểu mẫu kỹ thuật/GPMB.",
  },
  CHIEF_ACCOUNTANT: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Kế toán trưởng",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản quy phạm pháp luật và biểu mẫu tài chính.",
  },
  ACCOUNTANT: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Kế toán viên",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản quy phạm pháp luật và biểu mẫu tài chính.",
  },
  COMPENSATION_OFFICER: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Tổ Bồi thường – GPMB",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản đất đai và tải biểu mẫu chuẩn GPMB (Mẫu 01–09).",
  },
  ADMINISTRATIVE_OFFICER: {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: "Tổ Hành chính – Tổng hợp",
    roleNotice: "Quyền: Chỉ xem. Tra cứu văn bản QPPL và quản lý biểu mẫu lưu trữ.",
  },
};

const BLOCKED_PERMISSIONS: LegalAiPermissions = {
  canAccessModule: false,
  isReadOnly: true,
  canCreateDocument: false,
  canEditDocument: false,
  canDeleteDocument: false,
  canGenerateReport: false,
  canExportReport: false,
  roleTitle: "Không có quyền truy cập",
  roleNotice: "Bạn không có quyền truy cập phân hệ Thư viện Pháp lý + AI theo phân quyền BRD Mục 5.",
};

export function getLegalAiPermissions(user: AuthUser | null): LegalAiPermissions {
  if (!user) return BLOCKED_PERMISSIONS;

  const permissions = user.permissions ?? [];
  const hasModulePermission = permissions.includes("legal_library:view");

  if (!hasModulePermission) {
    return BLOCKED_PERMISSIONS;
  }

  const roleConfig = ROLE_PERMISSIONS_MAP[user.role] || {
    isReadOnly: true,
    canCreateDocument: false,
    canEditDocument: false,
    canDeleteDocument: false,
    canGenerateReport: false,
    canExportReport: false,
    roleTitle: user.roleName || user.role || "Cán bộ",
    roleNotice: "Quyền hạn theo phân quyền hệ thống.",
  };

  // Quyền động theo Permission
  const canCreateDocument = permissions.includes("legal_library:input");
  const canEditDocument = permissions.includes("legal_library:input");
  const canDeleteDocument = permissions.includes("legal_library:configure");
  const canGenerateReport = permissions.includes("legal_library:approve") || permissions.includes("legal_library:configure");
  const canExportReport = permissions.includes("legal_library:export");
  const isReadOnly = !canCreateDocument && !canEditDocument && !canDeleteDocument;

  return {
    ...roleConfig,
    canAccessModule: true,
    canCreateDocument,
    canEditDocument,
    canDeleteDocument,
    canGenerateReport,
    canExportReport,
    isReadOnly,
  };
}
