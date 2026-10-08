/**
 * procedure.types.ts — Type definitions cho Module M3: Hồ sơ thủ tục XDCB (Quy trình động v2.0)
 *
 * Tuân thủ đặc tả BRD 4.3.1, 4.3.2, 4.3.3
 */

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
  documentCode: string; // Số hiệu văn bản, ví dụ: 45/QĐ-UBND
  title: string;        // Tên văn bản, trích yếu nội dung
  issuer: string;       // Cơ quan ban hành
  issueDate: string;    // Ngày ban hành (YYYY-MM-DD)
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
  timestamp: string;      // Thời gian ghi nhận (ISO string)
  performedBy: string;    // Người thực hiện
  role: string;           // Vai trò/Chức vụ
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
  reason?: string;             // Bắt buộc nếu là SKIP_STEP (Quy tắc 7)
  skipDocumentCode?: string;   // Số hiệu văn bản cho phép bỏ qua
  documentReference?: string;  // Số hiệu văn bản đính kèm
  details: string;             // Mô tả chi tiết biến động
}

export interface ProcedureStep {
  id: string;
  order: number;               // 1 đến 16
  code: string;                // I, II, II.1, III, IV, IV.1, ...
  groupCode: string;           // I, II, III, IV, V, VI, VII
  groupTitle: string;          // Tiêu đề nhóm
  name: string;                // Tên bước / bước con
  type: StepType;              // Bắt buộc | Điều kiện
  responsibleUnit: string;     // Đơn vị thực hiện
  durationMargin: string;      // Biên độ thời gian (5–10 ngày, Theo HĐ...)
  durationDaysMin: number | null;
  durationDaysMax: number | null;
  isContractBased?: boolean;   // Theo HĐ (VI.1, VI.2, VI.3, VII)
  isSpecialRequest?: boolean;  // Theo yêu cầu (IV.3)

  // Trạng thái vận hành động của dự án
  isEnabled: boolean;          // Bật/tắt đối với bước điều kiện
  status: StepStatus;
  plannedDays?: number;        // Số ngày kế hoạch đã cấu hình
  startDatePlanned?: string;   // YYYY-MM-DD
  endDatePlanned?: string;     // YYYY-MM-DD
  actualStartDate?: string;    // YYYY-MM-DD
  actualEndDate?: string;      // YYYY-MM-DD

  // Dữ liệu giải trình nếu bỏ qua (Quy tắc 7)
  skipReason?: string;
  skipDocumentCode?: string;
  skipIssuer?: string;

  // Danh mục hồ sơ đính kèm (Quy tắc 10 - bắt buộc >= 1 để hoàn thành)
  attachments: ProcedureDocument[];
  notes?: string;
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
  steps: ProcedureStep[];
  history: ProcedureHistoryLog[];
}

export type ProcedureFilterStatus =
  | "ALL"
  | "IN_PROGRESS"
  | "WARNING_YELLOW"
  | "DANGER_RED"
  | "COMPLETED"
  | "SKIPPED"
  | "DISABLED";

export type ProcedureViewMode = "tree";
