import type { AuthUser } from "@/types/auth";
import { resolveRoleProfile } from "../../../utils/role-profile.ts";
import type { BiddingRolePermissions } from "../types/bidding.types";

type BiddingRoleProfile = Omit<BiddingRolePermissions, "roleCode" | "userName" | "canExport">;

/**
 * BRD mục 4.7 và ma trận mục 5: Tổ Giám sát – KT lập và cập nhật gói thầu,
 * Giám đốc / Phó Giám đốc phê duyệt KHLCNT (bước 2) và kết quả LCNT (bước 8).
 */
const ROLE_PROFILES: Record<string, BiddingRoleProfile> = {
  TECHNICAL_OFFICER: {
    roleTitle: "Kỹ sư Giám sát – Kỹ thuật",
    department: "Tổ Giám sát – Kỹ thuật",
    isReadOnly: false,
    canEdit: true,
    canApprove: false,
    defaultTab: "packages",
    scopeDescription: "Lập gói thầu, cập nhật tiến độ 9 bước lựa chọn nhà thầu và trình lãnh đạo phê duyệt.",
    allowedDuties: [
      "Tạo gói thầu mới theo KHLCNT",
      "Cập nhật từng bước kèm số văn bản",
      "Trình phê duyệt KHLCNT (bước 2) và kết quả (bước 8)",
      "Theo dõi hạn nộp hồ sơ dự thầu",
    ],
    readingGuide: "Gói thầu có hạn nộp hồ sơ còn ≤ 3 ngày được tô đỏ – kiểm tra trước để kịp chuẩn bị mở thầu.",
  },
  ACTING_DIRECTOR: {
    roleTitle: "Kỹ sư Giám sát / Quyền CNDA",
    department: "Tổ Giám sát – Kỹ thuật",
    isReadOnly: false,
    canEdit: true,
    canApprove: false,
    defaultTab: "packages",
    scopeDescription: "Lập gói thầu, cập nhật tiến độ 9 bước lựa chọn nhà thầu và trình lãnh đạo phê duyệt.",
    allowedDuties: [
      "Tạo gói thầu mới theo KHLCNT",
      "Cập nhật từng bước kèm số văn bản",
      "Trình phê duyệt KHLCNT (bước 2) và kết quả (bước 8)",
      "Theo dõi hạn nộp hồ sơ dự thầu",
    ],
    readingGuide: "Gói thầu có hạn nộp hồ sơ còn ≤ 3 ngày được tô đỏ – kiểm tra trước để kịp chuẩn bị mở thầu.",
  },
  ADMIN: {
    roleTitle: "Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canEdit: false,
    canApprove: true,
    defaultTab: "packages",
    scopeDescription: "Phê duyệt kế hoạch lựa chọn nhà thầu và kết quả lựa chọn nhà thầu của các gói thầu.",
    allowedDuties: [
      "Phê duyệt / trả lại KHLCNT (bước 2)",
      "Phê duyệt / trả lại kết quả LCNT (bước 8)",
      "Theo dõi thời hạn ký hợp đồng 30 ngày",
    ],
    readingGuide: "Xem mục “Gói thầu chờ bạn phê duyệt”. Với bước 8, so sánh giá trúng thầu với giá gói thầu trước khi duyệt.",
  },
  DEPUTY_DIRECTOR: {
    roleTitle: "Phó Giám đốc",
    department: "Ban Giám đốc",
    isReadOnly: false,
    canEdit: false,
    canApprove: true,
    defaultTab: "packages",
    scopeDescription: "Chỉ đạo công tác lựa chọn nhà thầu dự án phụ trách và phê duyệt kết quả.",
    allowedDuties: [
      "Phê duyệt / trả lại KHLCNT và kết quả LCNT",
      "Theo dõi tiến độ đấu thầu các gói",
      "Xuất báo cáo đấu thầu",
    ],
    readingGuide: "Cột “Mốc thời gian” cho biết gói nào sắp hết hạn nộp hồ sơ hoặc sắp hết hạn ký hợp đồng.",
  },
};

const VIEWER_PROFILE: BiddingRoleProfile = {
  roleTitle: "Người xem",
  department: "BQL ĐTXD Hà Tiên",
  isReadOnly: true,
  canEdit: false,
  canApprove: false,
  defaultTab: "packages",
  scopeDescription: "Xem tiến độ lựa chọn nhà thầu các gói thầu.",
  allowedDuties: ["Chỉ xem dữ liệu"],
  readingGuide: "Mỗi gói thầu có thanh 9 bước cho biết đang ở giai đoạn nào.",
};

export function getBiddingRolePermissions(user: AuthUser | null): BiddingRolePermissions {
  const profile = resolveRoleProfile(user, ROLE_PROFILES, VIEWER_PROFILE, "m7_bidding");

  // Quyền động theo Permission: Cấp/thu hồi quyền 'm7_bidding:input' hoặc 'approve' có hiệu lực tức thì
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
