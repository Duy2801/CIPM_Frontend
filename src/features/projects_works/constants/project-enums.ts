import type { ProjectHealthStatus, ProjectStage, ProjectStatusFilter } from "../types/project.types";

export const PROJECT_STATUS_TABS: { key: ProjectStatusFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PREPARATION", label: "Chuẩn bị ĐT" },
  { key: "DESIGN", label: "Thiết kế" },
  { key: "BIDDING", label: "Đấu thầu" },
  { key: "CONSTRUCTION", label: "Thi công" },
  { key: "COMPENSATION", label: "Bồi thường" },
  { key: "INSPECTION", label: "Nghiệm thu" },
  { key: "SETTLEMENT", label: "Quyết toán" },
  { key: "COMPLETED", label: "Hoàn thành" },
];

export const STAGE_DISPLAY_NAMES: Record<ProjectStage, string> = {
  PREPARATION: "Chuẩn bị ĐT",
  DESIGN: "Thiết kế",
  BIDDING: "Đấu thầu",
  CONSTRUCTION: "Thi công",
  COMPENSATION: "Bồi thường",
  INSPECTION: "Nghiệm thu",
  SETTLEMENT: "Quyết toán",
  COMPLETED: "Hoàn thành",
};

export const STAGE_BADGE_CLASSES: Record<ProjectStage, string> = {
  PREPARATION: "bg-slate-100 text-slate-800 border-slate-200/80",
  DESIGN: "bg-slate-100 text-slate-800 border-slate-200/80",
  BIDDING: "bg-slate-100 text-slate-800 border-slate-200/80",
  CONSTRUCTION: "bg-slate-100 text-slate-800 border-slate-200/80",
  COMPENSATION: "bg-slate-100 text-slate-800 border-slate-200/80",
  INSPECTION: "bg-slate-100 text-slate-800 border-slate-200/80",
  SETTLEMENT: "bg-slate-100 text-slate-800 border-slate-200/80",
  COMPLETED: "bg-slate-100 text-slate-800 border-slate-200/80",
};

/**
 * Tính trạng thái trễ tiến độ theo quy tắc BRD 4.1.3:
 * - Chênh lệch = Thực tế - Kế hoạch
 * - Nếu Chậm < 15%: Bình thường (normal)
 * - Nếu Chậm 15% - <25%: Cần theo dõi (warning - vàng)
 * - Nếu Chậm 25% - <40%: Chậm tiến độ (danger - đỏ)
 * - Nếu Chậm >= 40%: Khẩn cấp (critical - đỏ đậm)
 */
export function getProjectHealthStatus(actualProgress: number, plannedProgress: number): {
  status: ProjectHealthStatus;
  diff: number;
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  const diff = actualProgress - plannedProgress;

  if (diff >= 0) {
    return {
      status: "normal",
      diff,
      label: diff === 0 ? "Đúng tiến độ" : `Vượt +${diff.toFixed(1)}%`,
      badgeClass: "text-amber-800 bg-amber-50 border-amber-300",
      dotClass: "bg-amber-500",
    };
  }

  const lag = Math.abs(diff);

  if (lag < 15) {
    return {
      status: "normal",
      diff,
      label: `Chậm -${lag.toFixed(1)}%`,
      badgeClass: "text-slate-600 bg-slate-50 border-slate-200",
      dotClass: "bg-slate-400",
    };
  }

  if (lag < 25) {
    return {
      status: "warning",
      diff,
      label: `Theo dõi (-${lag.toFixed(1)}%)`,
      badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
      dotClass: "bg-amber-500",
    };
  }

  if (lag < 40) {
    return {
      status: "danger",
      diff,
      label: `Chậm (-${lag.toFixed(1)}%)`,
      badgeClass: "text-rose-700 bg-rose-50 border-rose-200",
      dotClass: "bg-rose-500",
    };
  }

  return {
    status: "critical",
    diff,
    label: `Khẩn cấp (-${lag.toFixed(1)}%)`,
    badgeClass: "text-red-800 bg-red-100 border-red-300 font-bold",
    dotClass: "bg-red-600 animate-pulse",
  };
}

export const WORK_TYPE_OPTIONS = [
  "Giao thông",
  "Dân dụng",
  "Thủy lợi",
  "Hạ tầng kỹ thuật",
  "Công nghiệp",
] as const;

export const FUNDING_SOURCE_OPTIONS = [
  "Ngân sách thành phố",
  "Ngân sách tỉnh",
  "NS Tỉnh",
  "Ngân sách Trung ương",
  "Nguồn thu tiền sử dụng đất",
  "Vốn ODA",
  "Vốn xã hội hóa",
  "Vốn vay thương mại",
] as const;

export const LOCATION_OPTIONS = [
  "Phường Pháo Đài",
  "Phường Đông Hồ",
  "Phường Tô Châu",
  "Phường Bình San",
  "Phường Mỹ Đức",
  "Xã Thuận Yên",
  "Xã Tiên Hải",
  "Khu vực Mũi Nai",
  "Toàn địa bàn TP. Hà Tiên",
] as const;

export const PERSONNEL_OPTIONS = [
  { name: "Huỳnh Thái Hải", role: "Giám đốc BQL (Mặc định)", dept: "Ban Giám đốc" },
  { name: "Trần Văn Nam", role: "Phó Giám đốc BQL", dept: "Ban Giám đốc" },
  { name: "Nguyễn Thanh Tùng", role: "Phó Giám đốc BQL", dept: "Ban Giám đốc" },
  { name: "Lê Hoàng Minh", role: "Tổ trưởng – Kỹ sư Giám sát KT", dept: "Tổ Giám sát – Kỹ thuật" },
  { name: "Phan Văn Đức", role: "Kỹ sư Giám sát KT", dept: "Tổ Giám sát – Kỹ thuật" },
  { name: "Phạm Quốc Bảo", role: "Tổ trưởng – Chuyên viên Bồi thường", dept: "Tổ Bồi thường – GPMB – TĐC" },
  { name: "Đặng Thị Kim Ngân", role: "Kế toán trưởng", dept: "Tổ Hành chính – Tổng hợp" },
] as const;

export const DEPARTMENT_OPTIONS = [
  { value: "Tổ Giám sát – Kỹ thuật", label: "Tổ Giám sát – Kỹ thuật", short: "GSKT" },
  { value: "Tổ Kế hoạch – Kỹ thuật", label: "Tổ Kế hoạch – Kỹ thuật (Chuẩn bị ĐT & Thiết kế)", short: "KHKT" },
  { value: "Tổ Bồi thường – GPMB – TĐC", label: "Tổ Bồi thường – GPMB – TĐC", short: "BT" },
  { value: "Tổ Quản lý Đấu thầu", label: "Tổ Quản lý Đấu thầu", short: "DT" },
  { value: "Tổ Hành chính – Tổng hợp", label: "Tổ Hành chính – Tổng hợp (Tài chính - Kế toán)", short: "HCTH" },
] as const;

