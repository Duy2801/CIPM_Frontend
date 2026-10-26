/** 7 vai trò hệ thống theo BRD mục 3.2 */
export const SYSTEM_ROLE_META: Record<string, { label: string; description: string; modules: string }> = {
  ADMIN: {
    label: "Quản trị hệ thống (Giám đốc)",
    description: "Toàn quyền xem, duyệt, cấu hình, xuất báo cáo",
    modules: "Tất cả 9 phân hệ",
  },
  DEPUTY_DIRECTOR: {
    label: "Phó Giám đốc",
    description: "Xem, nhập dữ liệu dự án phụ trách, duyệt GPMB và đấu thầu",
    modules: "M1–M9 (theo phân công)",
  },
  TECHNICAL_OFFICER: {
    label: "Kỹ thuật",
    description: "Nhập tiến độ, hồ sơ kỹ thuật, thủ tục, đấu thầu, bảo hành",
    modules: "M2, M3, M7, M8",
  },
  CHIEF_ACCOUNTANT: {
    label: "Kế toán trưởng",
    description: "Duyệt giải ngân, xem toàn bộ tài chính, bảo lãnh bảo hành",
    modules: "M4, M8",
  },
  ACCOUNTANT: {
    label: "Kế toán viên",
    description: "Nhập giải ngân chờ Kế toán trưởng duyệt",
    modules: "M4",
  },
  COMPENSATION_OFFICER: {
    label: "Bồi thường",
    description: "Toàn quyền phân hệ GPMB – Bồi thường TĐC",
    modules: "M6",
  },
  ADMINISTRATIVE_OFFICER: {
    label: "Hành chính",
    description: "Chỉ xem tài chính, nhập thủ tục, xem dự án",
    modules: "M2, M3, M4 (xem)",
  },
};
