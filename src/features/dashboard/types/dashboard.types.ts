/**
 * dashboard.types.ts — Data Contracts cho Bảng điều khiển (Module M1) theo BRD 4.1
 */

export interface DashboardKPIDTO {
  /** 1. Tổng dự án đang quản lý (Module M2) - Xanh teal */
  totalProjects: number;
  activeConstructionCount: number;

  /** 2. Giải ngân 2026 (Module M4) - Vàng gold */
  disbursedAmount: number; // Tỷ đồng đã giải ngân
  plannedAmount: number;   // Kế hoạch vốn năm 2026 (Tỷ đồng)
  disbursementRate: number; // % hoàn thành

  /** 3. Chậm tiến độ (Module M2, chậm ≥ 25% so KH) - Đỏ cảnh báo cao */
  delayedProjectsCount: number;
  criticalDelayCount: number; // Chậm ≥ 40%

  /** 4. Hoàn thành (Module M2, số công trình đã nghiệm thu) - Xanh lá */
  completedProjectsCount: number;
  warrantyCount: number; // Công trình đang trong hạn bảo hành

  /** 5. Hộ dân GPMB (Module M6, đã chi trả / tổng hộ dân) - Xanh dương */
  gpmbPaidHouseholds: number;
  gpmbTotalHouseholds: number;
  gpmbRate: number; // % đã chi trả
}

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface AlertItemDTO {
  id: string;
  /** Mức độ: Đỏ (Khẩn cấp) | Cam (Quan trọng) | Vàng (Chú ý) | Xanh (Thông tin) */
  severity: AlertSeverity;
  title: string;
  description: string;
  moduleCode: "M2" | "M4" | "M6" | "M7" | "M8" | "M9";
  moduleName: string;
  projectCode?: string;
  projectName?: string;
  targetUrl: string;
  actionText: string;
  timestamp: string;
  dueDays?: number; // Số ngày quá hạn hoặc số ngày còn lại
}

export interface QuarterlyDisbursementDTO {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  quarterLabel: string;
  planAmount: number; // Tỷ đồng
  actualAmount: number; // Tỷ đồng
  rate: number; // %
  status: "completed" | "in_progress" | "upcoming";
}

export interface ActivityLogDTO {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userInitials: string;
  action: string;
  targetName: string;
  moduleName: string;
  timestamp: string;
  formattedTime: string;
  details?: {
    docNumber?: string;
    projectCode?: string;
    value?: string;
    note?: string;
  };
}

export interface DashboardDataDTO {
  kpis: DashboardKPIDTO;
  alerts: AlertItemDTO[];
  quarterlyDisbursements: QuarterlyDisbursementDTO[];
  recentActivities: ActivityLogDTO[];
  fiscalYear: number;
  lastUpdated: string;
}
