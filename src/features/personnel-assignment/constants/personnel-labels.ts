import type { AssignmentFilter, AssignmentPriority, AssignmentStatus, PersonnelTabKey } from "../types/personnel.types";

/** Số việc đang mở từ mức này trở lên được coi là quá tải */
export const OVERLOAD_THRESHOLD = 4;
export const DUE_SOON_DAYS = 3;

export const ASSIGNMENT_STATUS_META: Record<AssignmentStatus, { label: string; intent: "muted" | "info" | "warning" | "success" }> = {
  TODO: { label: "Chưa bắt đầu", intent: "muted" },
  IN_PROGRESS: { label: "Đang thực hiện", intent: "info" },
  PENDING_APPROVAL: { label: "Chờ nghiệm thu", intent: "warning" },
  DONE: { label: "Hoàn thành", intent: "success" },
};

export const PRIORITY_META: Record<AssignmentPriority, { label: string; intent: "danger" | "subtle" }> = {
  HIGH: { label: "Ưu tiên cao", intent: "danger" },
  NORMAL: { label: "Bình thường", intent: "subtle" },
};

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

export const PROCEDURE_STAGE_GROUPS = [
  { value: "I", label: "Giai đoạn I", fullName: "Chuẩn bị Dự án & Chủ trương", color: "blue", tagColor: "#0284c7" },
  { value: "II", label: "Giai đoạn II", fullName: "Nhiệm vụ & Khảo sát BCNCKT / BCKTKT", color: "blue", tagColor: "#0284c7" },
  { value: "III", label: "Giai đoạn III", fullName: "Đấu thầu Tư vấn Lập dự án", color: "blue", tagColor: "#0284c7" },
  { value: "IV", label: "Giai đoạn IV", fullName: "Lập & Thẩm tra Hồ sơ BCNCKT / BCKTKT", color: "blue", tagColor: "#0284c7" },
  { value: "V", label: "Giai đoạn V", fullName: "Thẩm định & Phê duyệt Dự án", color: "blue", tagColor: "#0284c7" },
  { value: "VI", label: "Giai đoạn VI", fullName: "Lựa chọn Nhà thầu & Thi công Xây lắp", color: "blue", tagColor: "#0284c7" },
  { value: "VII", label: "Giai đoạn VII", fullName: "Quyết toán & Bảo hành Công trình", color: "blue", tagColor: "#0284c7" },
] as const;

export const PROJECT_STAGES = PROCEDURE_STAGE_GROUPS;

export const PROJECT_STAGE_META: Record<string, { label: string; fullName: string; tagColor: string; color: string }> = {
  // 7 nhóm thủ tục XDCB chuẩn (I - VII)
  I: { label: "Giai đoạn I", fullName: "Chuẩn bị Dự án & Chủ trương", tagColor: "#0284c7", color: "blue" },
  II: { label: "Giai đoạn II", fullName: "Nhiệm vụ & Khảo sát BCNCKT / BCKTKT", tagColor: "#0284c7", color: "blue" },
  III: { label: "Giai đoạn III", fullName: "Đấu thầu Tư vấn Lập dự án", tagColor: "#0284c7", color: "blue" },
  IV: { label: "Giai đoạn IV", fullName: "Lập & Thẩm tra Hồ sơ BCNCKT / BCKTKT", tagColor: "#0284c7", color: "blue" },
  V: { label: "Giai đoạn V", fullName: "Thẩm định & Phê duyệt Dự án", tagColor: "#0284c7", color: "blue" },
  VI: { label: "Giai đoạn VI", fullName: "Lựa chọn Nhà thầu & Thi công Xây lắp", tagColor: "#0284c7", color: "blue" },
  VII: { label: "Giai đoạn VII", fullName: "Quyết toán & Bảo hành Công trình", tagColor: "#0284c7", color: "blue" },

  // Giữ lại các key cũ để tương thích với mock data
  PREPARATION: { label: "Giai đoạn I", fullName: "Chuẩn bị đầu tư / Lập dự án", tagColor: "#0284c7", color: "blue" },
  DESIGN: { label: "Giai đoạn II", fullName: "Khảo sát & Thiết kế BVTC", tagColor: "#0284c7", color: "blue" },
  COMPENSATION: { label: "Bồi thường GPMB", fullName: "Bồi thường, hỗ trợ & TĐC", tagColor: "#0284c7", color: "blue" },
  BIDDING: { label: "Giai đoạn III", fullName: "Lựa chọn nhà thầu (Đấu thầu)", tagColor: "#0284c7", color: "blue" },
  CONSTRUCTION: { label: "Giai đoạn VI", fullName: "Thi công xây lắp công trình", tagColor: "#0284c7", color: "blue" },
  INSPECTION: { label: "Giai đoạn VI", fullName: "Nghiệm thu & Bàn giao", tagColor: "#0284c7", color: "blue" },
  SETTLEMENT: { label: "Giai đoạn VII", fullName: "Quyết toán vốn & Bảo hành", tagColor: "#0284c7", color: "blue" },
};

export function normalizeStageGroup(stage?: string, stepCode?: string): string {
  const cleanStage = (stage || "").trim().toUpperCase();
  if (["I", "II", "III", "IV", "V", "VI", "VII"].includes(cleanStage)) {
    return cleanStage;
  }

  // Nếu stage rỗng hoặc chưa khớp chuẩn, trích xuất từ mã bước thủ tục stepCode (ví dụ: "IV.3" -> "IV", "VI.1" -> "VI")
  if (stepCode) {
    const prefix = stepCode.trim().split(/[.\s-_]/)[0].toUpperCase();
    if (["I", "II", "III", "IV", "V", "VI", "VII"].includes(prefix)) {
      return prefix;
    }
  }

  switch (cleanStage) {
    case "PREPARATION":
      return "I";
    case "DESIGN":
      return "II";
    case "BIDDING":
      return "III";
    case "COMPENSATION":
      return "IV";
    case "CONSTRUCTION":
    case "INSPECTION":
      return "VI";
    case "SETTLEMENT":
      return "VII";
    default:
      return "VI";
  }
}

export const ASSIGNMENT_FILTER_LABELS: Record<AssignmentFilter, string> = {
  ALL: "Tất cả",
  OVERDUE: "Quá hạn",
  DUE_SOON: "Sắp đến hạn",
  PENDING_APPROVAL: "Chờ duyệt",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Đã hoàn thành",
  UNASSIGNED: "Chưa giao người",
};

export const PERSONNEL_TAB_LABELS: Record<PersonnelTabKey, string> = {
  assignments: "Nhiệm vụ của tôi",
  "project-tasks": "Giao việc dự án (CNDA)",
  "team-tasks": "Giao việc tổ & Phê duyệt",
  "project-team": "Nhân sự dự án",
  organization: "Cơ cấu tổ chức",
  accounts: "Tài khoản & quyền",
};
