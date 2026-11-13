import type { StepFlowKey } from "../utils/project-procedure-flow.ts";

export const STEP_FLOW_META: Record<StepFlowKey, { label: string; className: string }> = {
  UNASSIGNED: { label: "Chưa giao", className: "bg-white text-slate-500 border-dashed border-slate-300" },
  IN_PROGRESS: { label: "Đang xử lý", className: "bg-blue-50 text-blue-700 border-blue-200" },
  AWAITING_APPROVAL: { label: "Chờ Tổ trưởng duyệt", className: "bg-amber-50 text-amber-800 border-amber-300" },
  RETURNED: { label: "Bị từ chối", className: "bg-rose-50 text-rose-700 border-rose-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SKIPPED: { label: "Bỏ qua", className: "bg-slate-50 text-slate-500 border-slate-200" },
  DISABLED: { label: "Không áp dụng", className: "bg-slate-50 text-slate-400 border-slate-200" },
};

export const STEP_FLOW_TONE: Record<StepFlowKey, { card: string; dot: string; text: string }> = {
  UNASSIGNED: { card: "border-dashed border-slate-300 bg-slate-100", dot: "bg-slate-300", text: "text-slate-400" },
  IN_PROGRESS: { card: "border-blue-300 bg-blue-100", dot: "bg-blue-500", text: "text-blue-700" },
  AWAITING_APPROVAL: { card: "border-amber-300 bg-amber-100", dot: "bg-amber-500", text: "text-amber-700" },
  RETURNED: { card: "border-rose-300 bg-rose-100", dot: "bg-rose-500", text: "text-rose-700" },
  COMPLETED: { card: "border-emerald-300 bg-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700" },
  SKIPPED: { card: "border-slate-200 bg-slate-100 opacity-60", dot: "bg-slate-300", text: "text-slate-400" },
  DISABLED: { card: "border-slate-200 bg-slate-100 opacity-50", dot: "bg-slate-200", text: "text-slate-400" },
};
