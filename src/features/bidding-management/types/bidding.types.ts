import type { WorkspaceRoleProfile, WorkspaceTask } from "../../../components/workspace/workspace.types.ts";

export type SelectionMethod = "Đấu thầu rộng rãi" | "Đấu thầu hạn chế" | "Chỉ định thầu" | "Mua sắm trực tiếp";

export type PackageType = "Xây lắp" | "Tư vấn thiết kế" | "Tư vấn thẩm tra" | "Tư vấn giám sát" | "Mua sắm thiết bị";

export interface BidProject {
  id: string;
  code: string;
  name: string;
}

export interface BidStepRecord {
  step: number;
  completedAt: string;
  documentNo: string;
  by: string;
  approvedBy?: string;
  fileName?: string;
  fileSize?: string;
}

/** Tổ Kỹ thuật trình phê duyệt bước 2 (KHLCNT) hoặc bước 8 (kết quả LCNT) */
export interface BidSubmission {
  step: number;
  submittedBy: string;
  submittedAt: string;
  documentNo: string;
  winner?: string;
  winningPrice?: number;
  fileName?: string;
  fileSize?: string;
}

export interface BidRejection {
  step: number;
  reason: string;
  by: string;
  at: string;
}

export interface BidPackage {
  id: string;
  code: string;
  name: string;
  projectId: string;
  type: PackageType;
  method: SelectionMethod;
  /** Giá gói thầu theo KHLCNT, tỷ đồng */
  estimatedPrice: number;
  /** Hạn nộp hồ sơ dự thầu */
  bidDeadline?: string;
  winner?: string;
  winningPrice?: number;
  records: BidStepRecord[];
  currentStepStartedAt: string;
  submission?: BidSubmission;
  rejection?: BidRejection;
}

export interface BiddingDataset {
  projects: BidProject[];
  packages: BidPackage[];
}

export interface BidStepInput {
  documentNo: string;
  completedAt: string;
  /** Bắt buộc khi hoàn thành bước 4 (đăng thông báo mời thầu) */
  bidDeadline?: string;
  /** Bắt buộc khi trình bước 8 (kết quả LCNT) */
  winner?: string;
  winningPrice?: number;
  fileName?: string;
  fileSize?: string;
}

export interface CreatePackageInput {
  name: string;
  projectId: string;
  type: PackageType;
  method: SelectionMethod;
  estimatedPrice: number;
  currentStep?: number;
  winner?: string;
  winningPrice?: number;
  bidDeadline?: string;
  note?: string;
}

export type DeadlineState = "NONE" | "OK" | "WARNING" | "DANGER" | "PASSED";

export interface DeadlineStatus {
  state: DeadlineState;
  daysLeft?: number;
  date?: string;
}

export type BiddingTabKey = "packages" | "process";

export type PackageFilter =
  | "ALL"
  | "DEADLINE"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "CONTRACT_DUE"
  | "IN_PROGRESS"
  | "DONE";

export interface BiddingRolePermissions extends WorkspaceRoleProfile {
  roleCode: string;
  canExport: boolean;
  /** Tạo gói thầu, cập nhật và trình các bước */
  canEdit: boolean;
  /** Phê duyệt KHLCNT (bước 2) và kết quả LCNT (bước 8) */
  canApprove: boolean;
  defaultTab: BiddingTabKey;
}

export type BiddingTask = WorkspaceTask<BiddingTabKey> & { filter?: PackageFilter };
