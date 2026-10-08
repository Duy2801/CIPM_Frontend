import type { AuthUser } from "@/types/auth";
import { resolveRoleProfile } from "../../../utils/role-profile.ts";
import type { GpmbRolePermissions } from "../types/gpmb.types";

type GpmbRoleProfile = Omit<GpmbRolePermissions, "roleCode" | "userName" | "canExport">;

/**
 * Căn cứ BRD mục 4.6.4 và ma trận phân quyền mục 5:
 * chỉ Tổ Bồi thường nhập/sửa M6, Giám đốc và Phó Giám đốc xem toàn bộ và duyệt bước quan trọng.
 */
const ROLE_PROFILES: Record<string, GpmbRoleProfile> = {
  COMPENSATION_OFFICER: {
    roleTitle: "Tổ Bồi thường – GPMB",
    department: "Tổ Bồi thường – GPMB – TĐC",
    isReadOnly: false,
    canEdit: true,
    canApprove: false,
    defaultTab: "households",
    scopeDescription: "Cập nhật tiến độ 16 bước cho từng hộ dân, đính kèm biểu mẫu và đề xuất lãnh đạo duyệt bước quan trọng.",
    allowedDuties: [
      "Cập nhật bước cho từng hộ dân kèm số văn bản",
      "Đính kèm biểu mẫu Mẫu 01 – Mẫu 09",
      "Đánh dấu hộ không hợp tác, khiếu kiện, cưỡng chế",
      "Đề xuất duyệt bước 9, 13, 15",
    ],
    readingGuide: "Xử lý trước các hộ “Quá hạn pháp lý” (màu đỏ). Hộ bị trả lại có ghi lý do ngay trong danh sách.",
  },
  ADMIN: {
    roleTitle: "Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canEdit: false,
    canApprove: true,
    defaultTab: "households",
    scopeDescription: "Theo dõi toàn diện tiến độ GPMB 16 bước, phê duyệt hoặc trả lại các bước quan trọng (bước 9, 13, 15) do Tổ Bồi thường đề xuất.",
    allowedDuties: [
      "Phê duyệt / trả lại đề xuất bước quan trọng (bước 9, 13, 15)",
      "Theo dõi tiến độ bàn giao mặt bằng và các điểm nghẽn",
      "Chỉ đạo giải quyết khiếu nại, cưỡng chế thu hồi đất",
      "Xuất báo cáo ma trận hộ dân × bước",
    ],
    readingGuide: "Mở mục “Đề xuất chờ bạn duyệt”, xem số văn bản và biểu mẫu kèm theo trước khi bấm Duyệt.",
  },
  DEPUTY_DIRECTOR: {
    roleTitle: "Phó Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canEdit: false,
    canApprove: true,
    defaultTab: "matrix",
    scopeDescription: "Chỉ đạo công tác GPMB dự án phụ trách và phê duyệt các bước quan trọng (bước 9, 13, 15).",
    allowedDuties: [
      "Phê duyệt / trả lại đề xuất bước quan trọng (bước 9, 13, 15)",
      "Theo dõi ma trận 16 bước từng hộ dân",
      "Đôn đốc tiến độ bàn giao mặt bằng",
      "Xuất báo cáo GPMB",
    ],
    readingGuide: "Ma trận 16 bước cho thấy nhanh hộ nào đang chậm: ô đỏ là quá hạn, ô tím là đang chờ bạn duyệt.",
  },
};

const VIEWER_PROFILE: GpmbRoleProfile = {
  roleTitle: "Người xem",
  department: "BQL ĐTXD Hà Tiên",
  isReadOnly: true,
  canEdit: false,
  canApprove: false,
  defaultTab: "matrix",
  scopeDescription: "Xem tiến độ giải phóng mặt bằng tổng hợp.",
  allowedDuties: ["Chỉ xem dữ liệu"],
  readingGuide: "Ma trận 16 bước cho biết mỗi hộ dân đang ở bước nào.",
};

export function getGpmbRolePermissions(user: AuthUser | null): GpmbRolePermissions {
  const profile = resolveRoleProfile(user, ROLE_PROFILES, VIEWER_PROFILE, "m6_site_clearance");

  // Quyền động theo Permission: Cấp/thu hồi quyền 'm6_site_clearance:input' hoặc 'approve' có hiệu lực tức thì
  const canEdit = profile.canInput;
  const canApprove = profile.canApprove;
  const isReadOnly = !canEdit && !canApprove;

  return {
    ...profile,
    canEdit,
    canApprove,
    isReadOnly,
  };
}
