import type { MyTaskTab } from "../utils/my-tasks.ts";

/** Hai tab của màn: việc đang chờ mình xử lý / việc đã qua tay */
export type MyTaskView = "mine" | "history";

export interface MyTaskKindMeta {
  /** Tên trong ô lọc "Loại việc" */
  label: string;
  /** Nhãn ngắn trên dòng việc */
  chip: string;
  chipClass: string;
  /** Chỉ người có quyền duyệt mới có */
  reviewerOnly?: boolean;
}

export const MY_TASK_KIND_META: Record<MyTaskTab, MyTaskKindMeta> = {
  returned: {
    label: "Bị từ chối – cần nộp lại",
    chip: "Bị từ chối",
    chipClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
  todo: { label: "Cần làm", chip: "Cần làm", chipClass: "border-blue-200 bg-blue-50 text-blue-700" },
  review: {
    label: "Chờ tôi duyệt",
    chip: "Chờ tôi duyệt",
    chipClass: "border-amber-300 bg-amber-50 text-amber-800",
    reviewerOnly: true,
  },
  submitted: {
    label: "Đã nộp – chờ duyệt",
    chip: "Chờ duyệt",
    chipClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  done: { label: "Đã hoàn thành", chip: "Hoàn thành", chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  approved: {
    label: "Tôi đã duyệt",
    chip: "Tôi đã duyệt",
    chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    reviewerOnly: true,
  },
  rejected: {
    label: "Tôi đã từ chối",
    chip: "Tôi đã từ chối",
    chipClass: "border-slate-200 bg-slate-50 text-slate-600",
    reviewerOnly: true,
  },
};

export const MY_TASK_VIEWS: Record<MyTaskView, { label: string; kinds: MyTaskTab[]; empty: string }> = {
  mine: {
    label: "Việc của tôi",
    kinds: ["returned", "todo", "review"],
    empty: "Không có việc nào đang chờ bạn xử lý.",
  },
  history: {
    label: "Lịch sử",
    kinds: ["submitted", "done", "approved", "rejected"],
    empty: "Chưa có việc nào trong lịch sử.",
  },
};

/** Lý do mẫu khi Tổ trưởng từ chối kết quả */
export const REJECT_REASON_PRESETS = [
  "Hồ sơ chưa đầy đủ, cần bổ sung tài liệu",
  "Nội dung kết quả chưa đúng yêu cầu của bước",
  "Thiếu chữ ký / đóng dấu trên hồ sơ",
];
