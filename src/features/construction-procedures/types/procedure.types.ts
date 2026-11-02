export type StepType = "MANDATORY" | "CONDITIONAL";

export type StepStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "DISABLED";

export type AlertLevel = "NORMAL" | "WARNING_YELLOW" | "DANGER_RED";

export interface ProcedureDocument {
  id: string;
  documentCode: string;
  title: string;
  issuer: string;
  issueDate: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  fileType?: "pdf" | "doc" | "docx" | "xlsx" | "zip";
  note?: string;
}

export interface ProcedureHistoryLog {
  id: string;
  stepId: string;
  stepCode: string;
  stepName: string;
  timestamp: string;
  performedBy: string;
  role: string;
  action:
    | "START_STEP"
    | "COMPLETE_STEP"
    | "SKIP_STEP"
    | "TOGGLE_STEP"
    | "ADD_DOCUMENT"
    | "REMOVE_DOCUMENT"
    | "CONFIG_DURATION";
  actionLabel: string;
  previousStatus?: StepStatus;
  newStatus?: StepStatus;
  reason?: string;
  skipDocumentCode?: string;
  documentReference?: string;
  details: string;
  changes?: StepChange[];
}

export interface ProcedureStep {
  id: string;
  order: number;
  code: string;
  groupCode: string;
  groupTitle: string;
  name: string;
  type: StepType;
  responsibleUnit: string;
  durationMargin: string;
  durationDaysMin: number | null;
  durationDaysMax: number | null;
  isContractBased?: boolean;
  isSpecialRequest?: boolean;
  flowStage?: number;

  isEnabled: boolean;
  status: StepStatus;
  plannedDays?: number;
  startDatePlanned?: string;
  endDatePlanned?: string;
  actualStartDate?: string;
  actualEndDate?: string;

  department?: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedBy?: string;
  assignedAt?: string;

  submissionStatus?:
    | "PENDING_SUBMISSION"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED";
  submittedBy?: string;
  submittedAt?: string;
  submissionNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  skipReason?: string;
  skipDocumentCode?: string;
  skipIssuer?: string;

  attachments: ProcedureDocument[];
  notes?: string;
}

export interface DepartmentProcedureStatus {
  department?: string;
  procedureId?: string;
  procedureName?: string;
  isCompletedByLead: boolean;
  completedAt?: string;
  completedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  note?: string;
}

export interface StageApprovalStatus {
  status: "APPROVED" | "REJECTED";
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
  note?: string;
}

export interface DirectorApprovalStatus {
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy?: string;
  decidedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  note?: string;
  rejectionReason?: string;
}

export interface ProjectProcedureData {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  totalInvestment: number;
  managerName: string;
  supervisorName: string;
  startDate: string;
  expectedFinishDate: string;
  departments?: string[];
  departmentStatuses?: Record<string, DepartmentProcedureStatus>;
  directorApproval?: DirectorApprovalStatus;
  stageApprovals?: Record<string, StageApprovalStatus>;
  steps: ProcedureStep[];
  history: ProcedureHistoryLog[];
}

export interface StepChange {
  label: string;
  from?: string;
  to?: string;
}
