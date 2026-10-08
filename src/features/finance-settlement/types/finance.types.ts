import type { WorkspaceTaskTone } from "../../../components/workspace/workspace.types.ts";

export type ApprovalStatus =
  | "DRAFT"
  | "PENDING_CHIEF"
  | "PENDING_DIRECTOR"
  | "APPROVED"
  | "REJECTED";

export type CapitalSource =
  | "Ngân sách Trung ương"
  | "Ngân sách tỉnh"
  | "Vốn đầu tư công"
  | "Nguồn thu hợp pháp";

export interface FinanceProject {
  id: string;
  code: string;
  name: string;
  totalInvestment: number;
  status: "Đang thực hiện" | "Chờ quyết toán" | "Đã tất toán";
}

export interface Contract {
  id: string;
  code: string;
  projectId: string;
  contractor: string;
  value: number;
  disbursed: number;
}

export interface TreasuryAccount {
  id: string;
  number: string;
  bankName: string;
  label: string;
}

export interface CapitalPlan {
  id: string;
  projectId: string;
  year: number;
  source: CapitalSource;
  initialAmount: number;
  adjustmentAmount: number;
  approvalDocument?: string;
  approvalFileName?: string;
  updatedAt: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  size: string;
}

export interface ApprovalEvent {
  role: "Kế toán viên" | "Kế toán trưởng" | "Giám đốc" | (string & {});
  actor: string;
  at: string;
  action: "Khởi tạo" | "Đã duyệt" | "Phê duyệt" | "Từ chối" | "Yêu cầu chỉnh sửa";
  note?: string;
}

export interface Disbursement {
  id: string;
  code: string;
  projectId: string;
  payee: string;
  content: string;
  amount: number;
  contractId?: string;
  approvalDate: string;
  dueDate: string;
  treasuryAccountId: string;
  evidence: EvidenceFile[];
  status: ApprovalStatus;
  approvals: ApprovalEvent[];
  rejectionReason?: string;
  createdAt: string;
}

export interface SettlementRecord {
  id: string;
  projectId: string;
  approvedSettlementAmount: number;
  disbursedAmount: number;
  advanceRecovered: boolean;
  approvedDecisionFile?: string;
  treasuryClosedDate?: string;
  warrantyReturned: boolean;
  completedSteps: number[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "SETTLED";
}

export interface FinanceDataset {
  projects: FinanceProject[];
  contracts: Contract[];
  treasuryAccounts: TreasuryAccount[];
  capitalPlans: CapitalPlan[];
  disbursements: Disbursement[];
  settlements: SettlementRecord[];
}

export interface CapitalPlanInput {
  projectId: string;
  year: number;
  source: CapitalSource;
  amount: number;
  approvalDocument?: string;
  approvalFileName?: string;
}

export interface CapitalPlanAdjustmentInput {
  planId: string;
  amount: number;
  approvalDocument: string;
  approvalFileName: string;
}

export interface DisbursementInput {
  projectId: string;
  payee: string;
  content: string;
  amount: number;
  contractId?: string;
  approvalDate: string;
  dueDate: string;
  treasuryAccountId: string;
  evidence: EvidenceFile[];
}

export interface DisbursementValidationInput {
  amount: number;
  contractRemaining?: number;
  projectDisbursed: number;
  projectInvestment: number;
  evidenceCount: number;
}

export interface DisbursementValidationErrors {
  amount?: string;
  amountPrecision?: string;
  projectLimit?: string;
  evidence?: string;
}

export interface SettlementStepContext {
  completedSteps: number[];
  approvedDecisionFile?: boolean;
  disbursedAmount: number;
  approvedSettlementAmount: number;
  advanceRecovered: boolean;
  treasuryClosedDate?: string;
  warrantyReturned: boolean;
}

export interface SettlementStepResult {
  allowed: boolean;
  reason?: string;
}

export interface FinanceFilters {
  year: number;
  projectId: string;
}

export type FinanceTabKey = "disbursement" | "capital" | "settlement";

export type DisbursementStatusFilter = ApprovalStatus | "ALL";

export interface FinanceRolePermissions {
  roleCode: string;
  roleTitle: string;
  userName: string;
  department: string;
  canCreateDisbursement: boolean;
  canApproveChief: boolean;
  canApproveDirector: boolean;
  canReject: boolean;
  canManageCapitalPlan: boolean;
  canCreateCapitalPlan: boolean;
  canAdjustCapitalPlan: boolean;
  canSettleProject: boolean;
  canExport: boolean;
  isReadOnly: boolean;
  /** Trạng thái hồ sơ giải ngân đang chờ chính vai trò này xử lý */
  actionStatus?: ApprovalStatus;
  /** Các bước tất toán KBNN vai trò này được xác nhận */
  settlementSteps: number[];
  /** Tab mở sẵn khi vào màn hình, theo trọng tâm công việc của vai trò */
  defaultTab: FinanceTabKey;
  /** Gợi ý ngắn: vai trò này nên đọc gì trước trên màn hình */
  readingGuide: string;
  badgeColor: "teal" | "gold" | "blue" | "purple" | "red" | "green";
  scopeDescription: string;
  allowedDuties: string[];
}

export type FinanceTaskTone = WorkspaceTaskTone;

export interface FinanceTask {
  key: string;
  tone: FinanceTaskTone;
  title: string;
  description: string;
  count: number;
  tab: FinanceTabKey;
  statusFilter?: DisbursementStatusFilter;
}

export interface DisbursementPrefill {
  projectId: string;
  contractId?: string;
}


