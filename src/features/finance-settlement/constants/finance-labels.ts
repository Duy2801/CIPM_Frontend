import type { ApprovalStatus, CapitalSource, FinanceTabKey } from "../types/finance.types";

export type StatusIntent = "muted" | "warning" | "info" | "success" | "danger";

export const APPROVAL_STATUS_META: Record<
  ApprovalStatus,
  { label: string; shortLabel: string; intent: StatusIntent; hint: string }
> = {
  DRAFT: {
    label: "Bản nháp",
    shortLabel: "Nháp",
    intent: "muted",
    hint: "Kế toán viên chưa gửi hồ sơ",
  },
  PENDING_CHIEF: {
    label: "Chờ KT trưởng duyệt",
    shortLabel: "Chờ KTT",
    intent: "warning",
    hint: "Đang ở cấp 1 – Kế toán trưởng kiểm tra chứng từ",
  },
  PENDING_DIRECTOR: {
    label: "Chờ Giám đốc duyệt",
    shortLabel: "Chờ GĐ",
    intent: "info",
    hint: "Đã qua cấp 1 – chờ Giám đốc ký tờ trình KBNN",
  },
  APPROVED: {
    label: "Đã phê duyệt",
    shortLabel: "Đã duyệt",
    intent: "success",
    hint: "Hoàn tất 2 cấp, đủ điều kiện chuyển KBNN",
  },
  REJECTED: {
    label: "Bị trả lại",
    shortLabel: "Trả lại",
    intent: "danger",
    hint: "Cần Kế toán viên bổ sung và trình lại",
  },
};

/** Thứ tự hiển thị chip lọc trạng thái trong tab giải ngân */
export const STATUS_FILTER_ORDER: ApprovalStatus[] = [
  "PENDING_CHIEF",
  "PENDING_DIRECTOR",
  "REJECTED",
  "APPROVED",
];

export const CAPITAL_SOURCES: CapitalSource[] = [
  "Ngân sách Trung ương",
  "Ngân sách tỉnh",
  "Vốn đầu tư công",
  "Nguồn thu hợp pháp",
];

export const SOURCE_TAG_INTENTS: Record<CapitalSource, "brand" | "info" | "warning" | "subtle"> = {
  "Ngân sách Trung ương": "brand",
  "Ngân sách tỉnh": "info",
  "Vốn đầu tư công": "subtle",
  "Nguồn thu hợp pháp": "warning",
};

export const APPROVAL_STAGES = [
  { role: "Kế toán viên", title: "Kế toán viên lập hồ sơ", defaultActor: "Nguyễn Thị Thúy Hà" },
  { role: "Kế toán trưởng", title: "Kế toán trưởng kiểm tra (cấp 1)", defaultActor: "Đặng Thị Kim Ngân" },
  { role: "Giám đốc", title: "Giám đốc phê duyệt (cấp 2)", defaultActor: "Huỳnh Thái Hải" },
] as const;

export const SETTLEMENT_STEPS = [
  {
    number: 1,
    title: "Lập hồ sơ đề nghị tất toán",
    shortTitle: "Lập hồ sơ",
    description: "Đính kèm Quyết định phê duyệt quyết toán dự án hoàn thành từ cấp có thẩm quyền.",
    roleRequired: "Kế toán viên / Kế toán trưởng",
  },
  {
    number: 2,
    title: "Đối chiếu số liệu lần cuối",
    shortTitle: "Đối chiếu",
    description: "Tổng giải ngân phải bằng giá trị quyết toán được duyệt và toàn bộ tạm ứng đã thu hồi.",
    roleRequired: "Kế toán trưởng",
  },
  {
    number: 3,
    title: "Gửi lệnh tất toán tại KBNN",
    shortTitle: "Lệnh KBNN",
    description: "Gửi hồ sơ tất toán tài khoản dự án tại KBNN Hà Tiên và ghi nhận ngày đóng tài khoản.",
    roleRequired: "Kế toán viên / Kế toán trưởng",
  },
  {
    number: 4,
    title: "Hoàn trả bảo lãnh bảo hành",
    shortTitle: "Bảo hành",
    description: "Xác nhận hết thời hạn bảo hành và hoàn trả bảo lãnh ngân hàng (dữ liệu liên kết M8).",
    roleRequired: "Kế toán trưởng",
  },
  {
    number: 5,
    title: "Đóng mã dự án",
    shortTitle: "Đóng mã",
    description: "Phê duyệt đóng mã, chuyển trạng thái dự án sang “Đã tất toán”.",
    roleRequired: "Giám đốc (thẩm quyền phê duyệt)",
  },
] as const;

export const FINANCE_TAB_LABELS: Record<FinanceTabKey, string> = {
  disbursement: "Giải ngân",
  capital: "Kế hoạch vốn",
  settlement: "Tất toán KBNN",
};
