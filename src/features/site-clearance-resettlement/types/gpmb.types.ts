import type { WorkspaceRoleProfile, WorkspaceTask } from "../../../components/workspace/workspace.types.ts";

export type LandType = "ONT" | "CLN" | "RSX" | "HNK" | "Hỗn hợp";

/** Trạng thái đặc biệt của hộ dân (BRD 4.6.3) */
export type SpecialStatus = "NORMAL" | "UNCOOPERATIVE" | "COMPLAINT" | "ENFORCEMENT";

export interface GpmbProject {
  id: string;
  code: string;
  name: string;
}

/** Một bước đã hoàn thành của hộ dân: ngày, số văn bản, biểu mẫu kèm theo */
export interface StepRecord {
  step: number;
  completedAt: string;
  documentNo: string;
  fileName?: string;
  note?: string;
  by: string;
  /** Người duyệt với bước quan trọng */
  approvedBy?: string;
}

/** Tổ Bồi thường đề xuất hoàn thành bước quan trọng, chờ GĐ/PGĐ duyệt */
export interface StepProposal {
  step: number;
  proposedBy: string;
  proposedAt: string;
  documentNo: string;
  fileName?: string;
  note?: string;
}

export interface StepRejection {
  step: number;
  reason: string;
  by: string;
  at: string;
}

export interface Household {
  id: string;
  code: string;
  projectId: string;
  ownerName: string;
  /** CCCD đã che bớt số khi hiển thị */
  idNumber: string;
  address: string;
  areaM2: number;
  landType: LandType;
  /** Tiền bồi thường theo phương án, tỷ đồng */
  compensation: number;
  specialStatus: SpecialStatus;
  records: StepRecord[];
  /** Ngày bắt đầu bước hiện tại – dùng để đếm thời hạn pháp lý */
  currentStepStartedAt: string;
  proposal?: StepProposal;
  rejection?: StepRejection;
}

export interface GpmbDataset {
  projects: GpmbProject[];
  households: Household[];
}

export interface StepCompletionInput {
  documentNo: string;
  completedAt: string;
  fileName?: string;
  note?: string;
}

export type StepStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING";

export interface MatrixStepCell {
  step: number;
  status: StepStatus;
  completedAt?: string;
  documentNo?: string;
  fileName?: string;
  note?: string;
}

export interface HouseholdInput {
  code?: string;
  ownerName: string;
  idNumber: string;
  projectId: string;
  address?: string;
  areaM2: number;
  landType: LandType;
  compensation: number;
  currentStep?: number;
  specialStatus?: SpecialStatus;
  matrixSteps?: MatrixStepCell[];
  note?: string;
}

export type LegalState = "NONE" | "OK" | "SOON" | "OVERDUE";

export interface LegalStatus {
  state: LegalState;
  /** Số ngày còn lại (âm khi đã quá hạn); undefined khi bước không có thời hạn */
  daysLeft?: number;
  limitDays?: number;
}

export type GpmbTabKey = "households" | "matrix" | "process";

export type HouseholdFilter =
  | "ALL"
  | "OVERDUE"
  | "SOON"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SPECIAL"
  | "PAYMENT_READY"
  | "DONE";

export interface GpmbRolePermissions extends WorkspaceRoleProfile {
  roleCode: string;
  canExport: boolean;
  /** Nhập/sửa hồ sơ hộ dân và cập nhật bước (chỉ Tổ Bồi thường theo BRD) */
  canEdit: boolean;
  /** Duyệt các bước quan trọng (Giám đốc, Phó Giám đốc) */
  canApprove: boolean;
  defaultTab: GpmbTabKey;
}

export type GpmbTask = WorkspaceTask<GpmbTabKey> & { filter?: HouseholdFilter };
