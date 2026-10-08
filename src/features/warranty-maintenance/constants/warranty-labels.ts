import type {
  BondStatus,
  CountdownLevel,
  IncidentFilter,
  IncidentSeverity,
  IncidentStatus,
  WarrantyFilter,
  WarrantyTabKey,
} from "../types/warranty.types";

export const COUNTDOWN_META: Record<
  CountdownLevel,
  { label: string; box: string; text: string; bar: string }
> = {
  SAFE: { label: "Còn trên 90 ngày", box: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", bar: "#059669" },
  WATCH: { label: "Còn 90 ngày trở xuống", box: "border-amber-200 bg-amber-50", text: "text-amber-700", bar: "#D97706" },
  URGENT: { label: "Còn 30 ngày trở xuống", box: "border-rose-200 bg-rose-50", text: "text-rose-700", bar: "#E11D48" },
  EXPIRED: { label: "Đã hết hạn bảo hành", box: "border-slate-200 bg-slate-50", text: "text-slate-500", bar: "#94A3B8" },
};

export const BOND_STATUS_META: Record<BondStatus, { label: string; intent: "info" | "success" | "danger" }> = {
  HOLDING: { label: "Đang giữ bảo lãnh", intent: "info" },
  RETURNED: { label: "Đã hoàn trả", intent: "success" },
  FORFEITED: { label: "Đã thu hồi (vi phạm)", intent: "danger" },
};

export const INCIDENT_STATUS_META: Record<IncidentStatus, { label: string; intent: "danger" | "warning" | "success" }> = {
  OPEN: { label: "Mới ghi nhận", intent: "danger" },
  FIXING: { label: "Đang khắc phục", intent: "warning" },
  FIXED: { label: "Đã khắc phục", intent: "success" },
};

export const SEVERITY_META: Record<IncidentSeverity, { label: string; intent: "danger" | "subtle" }> = {
  HIGH: { label: "Nghiêm trọng", intent: "danger" },
  NORMAL: { label: "Thông thường", intent: "subtle" },
};

export const WARRANTY_FILTER_LABELS: Record<WarrantyFilter, string> = {
  ALL: "Tất cả",
  URGENT: "Còn ≤ 30 ngày",
  WATCH: "Còn ≤ 90 ngày",
  EXPIRED: "Đã hết hạn",
  BOND_READY: "Đủ điều kiện hoàn trả bảo lãnh",
};

export const INCIDENT_FILTER_LABELS: Record<IncidentFilter, string> = {
  ALL: "Tất cả",
  OVERDUE: "Quá hạn khắc phục",
  OPEN: "Mới ghi nhận",
  FIXING: "Đang khắc phục",
  FIXED: "Đã khắc phục",
};

export const WARRANTY_TAB_LABELS: Record<WarrantyTabKey, string> = {
  warranties: "Thời hạn bảo hành",
  incidents: "Sự cố & khắc phục",
};
