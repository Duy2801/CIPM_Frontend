import type { AuthUser } from "@/types/auth";
import type { LegalAiPermissions } from "../types/legal-ai.types";

/**
 * Căn cứ: BRD BQL-BRD-2026-003, Mục 5 Ma trận phân quyền người dùng:
 * | M9 – Thư viện + AI | GĐ: ✓ | PGĐ: ✓ | Tổ KT: Xem | KT trưởng: Xem | KT viên: Xem | Tổ BT: Xem |
 * - Có quyền nhập (legal_library:input): thêm / cập nhật văn bản.
 * - Chỉ xem: tra cứu văn bản, xem chi tiết và tải biểu mẫu.
 * - Không có legal_library:view: bị chặn hoàn toàn khỏi phân hệ.
 */
export function getLegalAiPermissions(user: AuthUser | null): LegalAiPermissions {
  const permissions = user?.permissions ?? [];
  return {
    canAccessModule: permissions.includes("legal_library:view"),
    canCreateDocument: permissions.includes("legal_library:input"),
  };
}
