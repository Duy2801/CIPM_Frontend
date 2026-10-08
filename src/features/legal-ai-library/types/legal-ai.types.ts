export type LegalDocumentCategory =
  | "ALL"
  | "LAW"
  | "DECREE"
  | "CIRCULAR"
  | "LOCAL"
  | "TEMPLATE";

export type LegalDocumentStatus = "EFFECTIVE" | "EXPIRED" | "PARTIAL";

export interface LegalDocument {
  id: string;
  code: string; // Số hiệu (vd: 31/2024/QH15)
  title: string; // Tên trích yếu
  category: Exclude<LegalDocumentCategory, "ALL">;
  issuer: string; // Cơ quan ban hành
  issueDate: string; // Ngày ban hành (YYYY-MM-DD)
  effectiveDate: string; // Ngày hiệu lực
  status: LegalDocumentStatus;
  scope: string; // Phạm vi / Module liên quan (M2, M4, M6, M7, M8...)
  summary: string; // Tóm tắt nội dung áp dụng cho Ban
  fileType: "PDF" | "DOCX";
  fileSize: string;
  downloads: number;
  tags: string[];
}

export type ReportType =
  | "WEEKLY"
  | "MONTHLY"
  | "GPMB_TOPIC"
  | "DISBURSEMENT_TOPIC"
  | "ANNUAL";

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  period: string; // vd: "Tuần 39 - Tháng 09/2026"
  createdAt: string;
  author: string;
  status: "DRAFT" | "FINALIZED";
  content: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  citations?: { title: string; code: string; article?: string }[];
}

export interface LegalAiPermissions {
  canAccessModule: boolean;
  isReadOnly: boolean;
  canCreateDocument: boolean;
  canEditDocument: boolean;
  canDeleteDocument: boolean;
  canGenerateReport: boolean;
  canExportReport: boolean;
  roleTitle: string;
  roleNotice?: string;
}
