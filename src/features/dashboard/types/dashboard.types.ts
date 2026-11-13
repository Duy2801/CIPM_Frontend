export interface QuarterlyData {
  quarter: string;
  plan: number;
  actual: number;
  isCurrent?: boolean;
}

export interface UrgentTask {
  id: string;
  title: string;
  badge: string;
  badgeColor: "danger" | "warning" | "info" | "success";
  description: string;
  actionText: string;
  targetUrl: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  actor: string;
  actorTitle?: string;
  actorDepartment?: string;
  actorRoleInProject?: string;
  actorPhone?: string;
  actorEmail?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  projectStage?: string;
  projectLocation?: string;
  packageItem?: string;
  actionType?: string;
  status?: string;
  content: string;
  detailUrl?: string;
  detailData?: {
    docNumber?: string;
    docDate?: string;
    value?: string;
    note?: string;
    nextStep?: string;
  };
}

export interface DashboardSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  totalInvestment: number;
  totalDisbursed: number;
  projectsByType: { type: string; count: number; investment: number }[];
}

export interface DisbursementTotals {
  disbursed: number;
  remaining: number;
  monthlySpeed: number;
}

export type UrgentFilter = "all" | UrgentTask["badgeColor"];

export type ActivityFilterMethod = "ALL" | "PROJECT" | "ACTOR";

export type DisbursementTimeFilter = "week" | "month" | "quarter";

export interface ChartBarItem {
  label: string;
  plan: number;
  actual: number;
  isCurrent?: boolean;
}

export interface ChartMetric {
  label: string;
  value: string;
  sub: string;
}

export interface ChartDataset {
  title: string;
  unit: string;
  maxScale: number;
  items: ChartBarItem[];
  metrics: [ChartMetric, ChartMetric, ChartMetric];
}
