import type { MyTaskTab } from "../utils/my-tasks.ts";

export const REVIEWER_ONLY_TABS: MyTaskTab[] = ["review", "approved", "rejected"];

export type MyTaskColumn = "accept" | "processing" | "pending" | "done" | "rejected" | "incident";

export const MY_TASK_COLUMN_ORDER: MyTaskColumn[] = ["accept", "processing", "pending", "done", "rejected", "incident"];

export const MY_TASK_COLUMNS: Record<
  MyTaskColumn,
  { label: string; hint: string; kinds: MyTaskTab[]; empty: string; color: string }
> = {
  accept: {
    label: "Chờ tiếp nhận",
    hint: "Việc mới giao cho bạn, bấm Tiếp nhận để bắt đầu",
    kinds: ["accept"],
    empty: "Không có việc mới được giao.",
    color: "#8b5cf6",
  },
  processing: {
    label: "Đang xử lý",
    hint: "Việc bạn đang làm",
    kinds: ["todo"],
    empty: "Chưa có việc nào.",
    color: "#3b82f6",
  },
  pending: {
    label: "Chờ duyệt",
    hint: "Đã nộp kết quả, chờ Tổ trưởng duyệt",
    kinds: ["review", "submitted"],
    empty: "Chưa có việc nào.",
    color: "#f59e0b",
  },
  done: {
    label: "Hoàn thành",
    hint: "Đã được duyệt hoàn thành",
    kinds: ["done", "approved"],
    empty: "Chưa có việc nào.",
    color: "#10b981",
  },
  rejected: {
    label: "Từ chối",
    hint: "Bị trả về làm lại",
    kinds: ["returned", "rejected"],
    empty: "Chưa có việc nào.",
    color: "#f97316",
  },
  incident: {
    label: "Sự cố",
    hint: "Đang vướng sự cố, chờ Tổ trưởng xử lý",
    kinds: ["incident"],
    empty: "Chưa có việc nào.",
    color: "#f43f5e",
  },
};

/** Lý do mẫu khi người thực hiện trả việc về Tổ trưởng */
export const DECLINE_REASON_PRESETS = [
  "Không thuộc chuyên môn / phạm vi phụ trách",
  "Đang quá tải công việc, không kịp tiến độ",
  "Giao nhầm người thực hiện",
];

/** Sự cố mẫu khi người thực hiện báo vướng mắc */
export const INCIDENT_REASON_PRESETS = [
  "Thiếu hồ sơ / tài liệu đầu vào để thực hiện",
  "Chờ ý kiến của cơ quan, đơn vị liên quan",
  "Vướng mắc mặt bằng / hiện trường",
];

/** Lý do mẫu khi Tổ trưởng từ chối kết quả */
export const REJECT_REASON_PRESETS = [
  "Hồ sơ chưa đầy đủ, cần bổ sung tài liệu",
  "Nội dung kết quả chưa đúng yêu cầu của bước",
  "Thiếu chữ ký / đóng dấu trên hồ sơ",
];
