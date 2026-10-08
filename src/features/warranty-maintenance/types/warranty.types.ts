import type { WorkspaceRoleProfile, WorkspaceTask } from "../../../components/workspace/workspace.types.ts";

/** Trạng thái bảo lãnh bảo hành (BRD 4.8.1) */
export type BondStatus = "HOLDING" | "RETURNED" | "FORFEITED";

export type IncidentStatus = "OPEN" | "FIXING" | "FIXED";
export type IncidentSeverity = "HIGH" | "NORMAL";

/** Mức cảnh báo đếm ngược: xanh > 90 ngày, vàng ≤ 90, đỏ ≤ 30 */
export type CountdownLevel = "SAFE" | "WATCH" | "URGENT" | "EXPIRED";

export interface WarrantyProject {
  id: string;
  code: string;
  name: string;
}

export interface WarrantyRecord {
  id: string;
  projectId: string;
  workName: string;
  contractCode: string;
  contractor: string;
  /** Ngày nghiệm thu hoàn thành – bắt đầu tính bảo hành */
  acceptanceDate: string;
  /** Thời hạn bảo hành (tháng) */
  months: number;
  /** Giá trị bảo lãnh bảo hành, tỷ đồng */
  bondValue: number;
  bank: string;
  bondStatus: BondStatus;
  bondClosedAt?: string;
  bondNote?: string;
}

export interface Incident {
  id: string;
  code: string;
  warrantyId: string;
  foundDate: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  /** Hạn nhà thầu phải khắc phục */
  requiredFixDate: string;
  status: IncidentStatus;
  reportedBy: string;
  fixedDate?: string;
  acceptanceDocument?: string;
  attachments: string[];
}

export interface WarrantyDataset {
  projects: WarrantyProject[];
  warranties: WarrantyRecord[];
  incidents: Incident[];
}

export interface WarrantyCreateInput {
  projectId: string;
  workName: string;
  contractCode: string;
  contractor: string;
  acceptanceDate: string;
  months: number;
  bondValue: number;
  bank: string;
  bondStatus: BondStatus;
}

export interface IncidentInput {
  warrantyId: string;
  foundDate: string;
  description: string;
  location: string;
  severity: IncidentSeverity;
  requiredFixDate: string;
  attachment?: string;
}

export interface FixInput {
  fixedDate: string;
  acceptanceDocument: string;
  attachment?: string;
}

export interface CountdownStatus {
  level: CountdownLevel;
  expiryDate: string;
  daysLeft: number;
  /** Phần trăm thời gian bảo hành đã trôi qua */
  elapsedPercent: number;
}

export type WarrantyTabKey = "warranties" | "incidents";

export type WarrantyFilter = "ALL" | "URGENT" | "WATCH" | "EXPIRED" | "BOND_READY";
export type IncidentFilter = "ALL" | "OVERDUE" | "OPEN" | "FIXING" | "FIXED";

export interface WarrantyRolePermissions extends WorkspaceRoleProfile {
  roleCode: string;
  /** Quyền truy cập vào phân hệ M8: Chỉ GĐ, PGĐ, Tổ KT và Kế toán trưởng được truy cập */
  canAccessModule: boolean;
  canExport: boolean;
  /** Phạm vi xuất báo cáo theo BRD mục 5: ALL (GĐ, PGĐ), OWN_PROJECTS (Tổ KT - DA mình), BOND_ONLY (KTT - TC mình), NONE (Khác) */
  exportScope: "ALL" | "OWN_PROJECTS" | "BOND_ONLY" | "NONE";
  /** Ghi nhận sự cố và cập nhật tiến độ khắc phục (Tổ Giám sát – KT) */
  canManageIncidents: boolean;
  /** Hoàn trả / thu hồi bảo lãnh bảo hành (Kế toán trưởng) */
  canManageBond: boolean;
  defaultTab: WarrantyTabKey;
}

export type WarrantyTask = WorkspaceTask<WarrantyTabKey> & { filter?: WarrantyFilter | IncidentFilter };
