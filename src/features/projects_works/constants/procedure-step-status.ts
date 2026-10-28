import type { StageState, StepFlowKey } from "../utils/project-procedure-flow.ts";

/** Nhãn + màu vị trí của bước trong luồng xử lý (trang chi tiết dự án) */
export const STEP_FLOW_META: Record<StepFlowKey, { label: string; className: string }> = {
  UNASSIGNED: { label: "Chưa giao", className: "bg-white text-slate-500 border-dashed border-slate-300" },
  IN_PROGRESS: { label: "Đang xử lý", className: "bg-blue-50 text-blue-700 border-blue-200" },
  AWAITING_APPROVAL: { label: "Chờ Tổ trưởng duyệt", className: "bg-amber-50 text-amber-800 border-amber-300" },
  RETURNED: { label: "Bị từ chối", className: "bg-rose-50 text-rose-700 border-rose-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SKIPPED: { label: "Bỏ qua", className: "bg-slate-50 text-slate-500 border-slate-200" },
  DISABLED: { label: "Không áp dụng", className: "bg-slate-50 text-slate-400 border-slate-200" },
};

/** Nhãn + màu trạng thái nghiệm thu giai đoạn của Ban Giám đốc */
export const STAGE_STATE_META: Record<StageState, { label: string; className: string }> = {
  IN_PROGRESS: { label: "Đang xử lý", className: "bg-slate-50 text-slate-600 border-slate-200" },
  AWAITING_DIRECTOR: { label: "Chờ BGĐ nghiệm thu", className: "bg-amber-50 text-amber-800 border-amber-300" },
  APPROVED: { label: "BGĐ đã nghiệm thu", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RETURNED: { label: "BGĐ yêu cầu rà soát", className: "bg-rose-50 text-rose-700 border-rose-200" },
};
