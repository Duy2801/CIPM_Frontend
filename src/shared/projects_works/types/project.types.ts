export type ProjectStage =
  | "PREPARATION"
  | "DESIGN"
  | "BIDDING"
  | "CONSTRUCTION"
  | "COMPENSATION"
  | "INSPECTION"
  | "SETTLEMENT"
  | "COMPLETED";

export type ProjectStatusFilter = "ALL" | ProjectStage;

export type ProjectHealthStatus = "normal" | "warning" | "danger" | "critical";

export type ProjectWorkType =
  | "Giao thông"
  | "Dân dụng"
  | "Thủy lợi"
  | "Hạ tầng kỹ thuật"
  | "Công nghiệp";

export type ProjectNature = "new" | "transitional";

export type FundingSourceType =
  | "Ngân sách thành phố"
  | "Ngân sách tỉnh"
  | "NS Tỉnh"
  | "Ngân sách Trung ương"
  | "Nguồn thu tiền sử dụng đất"
  | "Vốn ODA"
  | "Vốn xã hội hóa"
  | "Vốn vay thương mại";

export interface ProgressHistoryRecord {
  id: string;
  updatedAt: string;
  updatedBy: string;
  oldProgress: number;
  newProgress: number;
  note: string;
  actualEndDateRecorded?: string;
  stageRecorded?: ProjectStage;
}

export interface ProjectFundingSource {
  source: FundingSourceType;
  amount: number;
}

export interface ProjectItem {
  id: string;
  code: string;
  name: string;
  type: ProjectWorkType;
  location?: string;
  scale?: string;
  
  fundingSource: FundingSourceType;
  fundingSources?: ProjectFundingSource[];
  totalInvestment: number;
  plan2026: number;
  disbursedAmount: number;
  
  managerName: string;
  supervisorName: string;
  managerId?: string;
  supervisorId?: string;
  departments?: string[];
  
  startDate: string;
  endDatePlanned: string;
  actualEndDate?: string;
  
  currentStage: ProjectStage;
  actualProgress: number;
  plannedProgress: number;
  
  progressHistory: ProgressHistoryRecord[];
  
  note?: string;
  
  status: "active" | "closed";
  nature?: ProjectNature;

  documents?: ProjectDocument[];
}

export interface ProjectDocument {
  id: string;
  name: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  type?: string;
  url?: string;
}

export interface ProjectFormData {
  name: string;
  type: ProjectWorkType;
  location?: string;
  scale?: string;
  fundingSource?: FundingSourceType;
  fundingSources?: ProjectFundingSource[];
  totalInvestment?: number;
  plan2026?: number;
  managerName?: string;
  supervisorName?: string;
  managerId?: string;
  supervisorId?: string;
  departments?: string[];
  startDate: string;
  endDatePlanned: string;
  nature?: ProjectNature;
  currentStage?: ProjectStage;
  actualProgress?: number;
  plannedProgress?: number;
  note?: string;
  progressNote?: string;
  documents?: ProjectDocument[];
  procedures?: Record<string, string>;
  procedureTabLabels?: Record<string, string>;
}

export type ProjectActionType =
  | "rule5_warning"
  | "close_confirm"
  | "delete_confirm"
  | "reopen_confirm";
