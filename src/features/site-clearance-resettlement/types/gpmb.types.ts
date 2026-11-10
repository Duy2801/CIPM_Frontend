import type { WorkspaceRoleProfile, WorkspaceTask } from "../../../components/workspace/workspace.types.ts";

/** Loại đất theo danh mục, hoặc mã / tên tự nhập (vd: "ODT – Đất ở đô thị") */
export type LandType = "ONT" | "CLN" | "RSX" | "HNK" | "Hỗn hợp" | (string & {});

/** Trạng thái đặc biệt của hộ dân (BRD 4.6.3) */
/** OTHER: trạng thái tự nhập, tên ghi ở `specialStatusLabel` */
export type SpecialStatus = "NORMAL" | "UNCOOPERATIVE" | "COMPLAINT" | "ENFORCEMENT" | "OTHER";

/** Nhóm khoản tiền trong phương án bồi thường (theo cột bảng tổng hợp chi trả) */
export type CompensationGroup = "LAND" | "SUPPORT" | "CROPS" | "STRUCTURES" | "POLICY";

/**
 * Một dòng bảng kê (theo mẫu phương án bồi thường):
 * - Đất (LAND): một thửa — TBĐ, thửa, loại đất, diện tích × đơn giá bồi thường;
 *   kèm hỗ trợ chuyển đổi nghề & tìm kiếm việc làm = diện tích × đơn giá hỗ trợ (cột "Thành tiền hỗ trợ").
 * - Cây trồng / Vật kiến trúc / Chính sách hỗ trợ: tên theo bảng giá, số lượng × đơn giá.
 */
export interface CompensationItem {
  group: CompensationGroup;
  /** Loại đất / loại cây / hạng mục công trình / loại hỗ trợ */
  name: string;
  /** Diện tích (đất) hoặc số lượng, khối lượng */
  quantity: number;
  unit: string;
  /** Đơn giá bồi thường (VNĐ) */
  unitPrice: number;
  /** Đất: số tờ bản đồ (TBĐ) */
  mapSheet?: string;
  /** Đất: số thửa */
  parcel?: string;
  /** Đất: đơn giá hỗ trợ chuyển đổi nghề và tìm kiếm việc làm (đ/m²) */
  supportPrice?: number;
  /** Dữ liệu bản cũ: tỷ lệ còn lại (%) */
  ratePercent?: number;
  /** Dữ liệu bản cũ: hệ số (lần giá đất) */
  factor?: number;
  /** Dữ liệu bản cũ: mã loại đất */
  landCode?: string;
}

export type CompensationBreakdown = Record<CompensationGroup, number> & {
  total: number;
  /** Có bảng kê chi tiết hay chỉ có tổng tiền nhập tay */
  itemized: boolean;
};

/** Tệp đính kèm hồ sơ hộ (bản mock: tệp nhỏ lưu kèm nội dung để xem lại) */
export interface HouseholdFile {
  id: string;
  name: string;
  size: string;
  dataUrl?: string;
}

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
  /** Số CCCD (12 số) */
  idNumber: string;
  address: string;
  areaM2: number;
  landType: LandType;
  /** Tổng tiền bồi thường, hỗ trợ theo phương án (VNĐ) — có bảng kê thì bằng tổng bảng kê */
  compensation: number;
  /** Bảng kê bồi thường, hỗ trợ chi tiết theo phương án */
  compensationItems?: CompensationItem[];
  specialStatus: SpecialStatus;
  /** Tên trạng thái tự nhập khi `specialStatus` = OTHER */
  specialStatusLabel?: string;
  /** Ghi chú hồ sơ */
  note?: string;
  /** Số nhân khẩu */
  persons?: number;
  birthDate?: string;
  /** Ngày cấp CCCD */
  idIssuedDate?: string;
  phone?: string;
  /** Nguồn gốc sử dụng đất (bản cũ: mô tả bằng chữ) */
  landOrigin?: string;
  /** Hồ sơ nguồn gốc sử dụng đất: GCN.QSD đất, giấy tay sang nhượng, biên bản xác minh… */
  landOriginFiles?: HouseholdFile[];
  records: StepRecord[];
  /** Ngày bắt đầu bước hiện tại – dùng để đếm thời hạn pháp lý */
  currentStepStartedAt: string;
  proposal?: StepProposal;
  rejection?: StepRejection;
  createdAt?: number;
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
  /** Bảng kê bồi thường, hỗ trợ (có thì tổng tiền tính từ bảng kê) */
  compensationItems?: CompensationItem[];
  currentStep?: number;
  specialStatus?: SpecialStatus;
  specialStatusLabel?: string;
  persons?: number;
  birthDate?: string;
  idIssuedDate?: string;
  phone?: string;
  landOrigin?: string;
  landOriginFiles?: HouseholdFile[];
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
