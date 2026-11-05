import type { MyTaskTab } from "../utils/my-tasks.ts";

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
  accept: { label: "Chờ tiếp nhận", chip: "Mới giao", chipClass: "border-violet-200 bg-violet-50 text-violet-700" },
  incident: { label: "Sự cố", chip: "Sự cố", chipClass: "border-orange-200 bg-orange-50 text-orange-700" },
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

/** Cột của bảng việc (cột Lịch sử lấy từ nhật ký, không theo loại việc) */
export type MyTaskColumn = "accept" | "processing" | "pending" | "done" | "rejected" | "incident";

export const MY_TASK_COLUMN_ORDER: MyTaskColumn[] = ["accept", "processing", "pending", "done", "rejected", "incident"];

export const MY_TASK_COLUMNS: Record<
  MyTaskColumn,
  { label: string; hint: string; kinds: MyTaskTab[]; empty: string }
> = {
  accept: {
    label: "Chờ tiếp nhận",
    hint: "Việc mới giao cho bạn, bấm Tiếp nhận để bắt đầu",
    kinds: ["accept"],
    empty: "Không có việc mới được giao.",
  },
  processing: {
    label: "Đang xử lý",
    hint: "Việc bạn đang làm",
    kinds: ["todo"],
    empty: "Kéo việc chờ tiếp nhận vào đây để nhận việc.",
  },
  pending: {
    label: "Chờ duyệt",
    hint: "Đã nộp kết quả, chờ Tổ trưởng duyệt",
    kinds: ["review", "submitted"],
    empty: "Kéo việc đã làm xong vào đây để nộp kết quả.",
  },
  done: {
    label: "Hoàn thành",
    hint: "Đã được duyệt hoàn thành",
    kinds: ["done", "approved"],
    empty: "Kéo việc chờ duyệt vào đây để duyệt.",
  },
  rejected: {
    label: "Từ chối",
    hint: "Bị trả về làm lại",
    kinds: ["returned", "rejected"],
    empty: "Kéo việc chờ duyệt vào đây để từ chối.",
  },
  incident: {
    label: "Sự cố",
    hint: "Đang vướng sự cố, chờ Tổ trưởng xử lý",
    kinds: ["incident"],
    empty: "Kéo việc đang làm vào đây để báo sự cố.",
  },
};

export type MyTaskDropAction = "accept" | "submit" | "approve" | "reject" | "incident" | "resolve";

/** Thả việc loại `kind` vào cột `column` thì làm gì (không có = không cho thả) */
export function dropActionOf(kind: MyTaskTab, column: MyTaskColumn): MyTaskDropAction | null {
  if (column === "processing" && kind === "accept") return "accept";
  if (column === "processing" && kind === "incident") return "resolve";
  if (column === "pending" && (kind === "todo" || kind === "returned")) return "submit";
  if (column === "done" && kind === "review") return "approve";
  if (column === "rejected" && kind === "review") return "reject";
  if (column === "incident" && (kind === "todo" || kind === "returned")) return "incident";
  return null;
}

export const DROP_HINT: Record<MyTaskDropAction, string> = {
  accept: "Thả để tiếp nhận việc",
  submit: "Thả để nộp kết quả",
  approve: "Thả để duyệt",
  reject: "Thả để từ chối",
  incident: "Thả để báo sự cố",
  resolve: "Thả để đánh dấu đã xử lý sự cố",
};

/** Lý do mẫu khi người thực hiện trả việc về Tổ trưởng */
export const HANDBACK_REASON_PRESETS = {
  decline: [
    "Không thuộc chuyên môn / phạm vi phụ trách",
    "Đang quá tải công việc, không kịp tiến độ",
    "Giao nhầm người thực hiện",
  ],
  return: [
    "Nộp nhầm, cần bổ sung hồ sơ",
    "Cần chỉnh sửa lại nội dung kết quả",
    "Có thông tin mới cần cập nhật trước khi duyệt",
  ],
};

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
