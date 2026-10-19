export type LegalDocumentCategory =
  | "ALL"
  | "LAW"
  | "DECREE"
  | "CIRCULAR"
  | "RESOLUTION"
  | "DECISION"
  | "LOCAL"
  | "TEMPLATE";

/** Tình trạng hiệu lực: Còn hiệu lực · Sắp hết hiệu lực · Hết hiệu lực một phần · Hết hiệu lực */
export type LegalDocumentStatus = "EFFECTIVE" | "EXPIRING" | "PARTIAL" | "EXPIRED";

export interface AttachedDocumentFile {
  id: string;
  name: string;
  size: string;
  type: "PDF" | "DOCX";
  url?: string;
  /** Tệp vừa tải lên (chưa có đường dẫn trên máy chủ) */
  rawFile?: File;
}

/** Một chương của toàn văn: các điều, mỗi điều gồm các khoản */
export interface LegalDocumentSection {
  heading: string;
  articles: { title: string; paragraphs: string[] }[];
}

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
  files?: AttachedDocumentFile[];
  /** Ngày cập nhật vào thư viện (YYYY-MM-DD) */
  updatedAt?: string;
  /** Toàn văn (khi chưa có tệp gốc) để hiển thị trong bản xem trước */
  content?: LegalDocumentSection[];
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
