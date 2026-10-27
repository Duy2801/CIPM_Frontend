import { todayIso } from "../../../utils/date.ts";
import { DEFAULT_ISSUER_BY_CATEGORY, getCategoryLabel } from "../constants/legal-labels.ts";
import type { AttachedDocumentFile, DocumentCategoryKey, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types.ts";

/** Dữ liệu form "Thêm văn bản pháp luật" */
export interface LegalDocumentFormValues {
  title: string;
  category: DocumentCategoryKey;
  code: string;
  field: string;
  issuer: string;
  gazetteNumber: string;
  gazetteDate: string;
  signer: string;
  issueDate: string;
  effectiveDate: string;
  expiredDate: string;
  status: LegalDocumentStatus;
  /** Từ khóa, cách nhau bằng dấu phẩy / chấm phẩy / xuống dòng */
  tags: string;
}

export function createEmptyLegalForm(): LegalDocumentFormValues {
  return {
    title: "",
    category: "DECREE",
    code: "",
    field: "Lao động-Tiền lương",
    issuer: DEFAULT_ISSUER_BY_CATEGORY.DECREE ?? "",
    gazetteNumber: "",
    gazetteDate: "",
    signer: "",
    issueDate: todayIso(),
    effectiveDate: todayIso(),
    expiredDate: "",
    status: "EFFECTIVE",
    tags: "",
  };
}

/** Lỗi đầu tiên của form (null = hợp lệ) */
export function validateLegalForm(values: LegalDocumentFormValues): string | null {
  if (!values.code.trim()) return "Vui lòng nhập số hiệu văn bản (Ví dụ: 45/2019/QH14).";
  if (!values.issuer.trim()) return "Vui lòng chọn hoặc nhập cơ quan ban hành.";
  if (values.issueDate && values.effectiveDate && values.effectiveDate < values.issueDate) {
    return "Ngày áp dụng (có hiệu lực) không được trước ngày ban hành.";
  }
  if (values.effectiveDate && values.expiredDate && values.expiredDate < values.effectiveDate) {
    return "Ngày hết hiệu lực không được trước ngày bắt đầu có hiệu lực.";
  }
  return null;
}

/** Văn bản mới từ form đã hợp lệ + tệp đính kèm (chưa có mã — mã do kho dữ liệu cấp) */
export function buildLegalDocument(
  values: LegalDocumentFormValues,
  files: AttachedDocumentFile[],
): Omit<LegalDocument, "id"> {
  const code = values.code.trim();
  const field = values.field.trim();
  const tags = values.tags
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    code,
    title: values.title.trim() || `${getCategoryLabel(values.category)} số ${code}`,
    category: values.category,
    issuer: values.issuer.trim(),
    signer: values.signer.trim() || undefined,
    gazetteNumber: values.gazetteNumber.trim() || undefined,
    gazetteDate: values.gazetteDate.trim() || undefined,
    field: field || undefined,
    issueDate: values.issueDate,
    effectiveDate: values.effectiveDate,
    expiredDate: values.expiredDate.trim() || undefined,
    status: values.status,
    scope: field || "Quản lý dự án",
    summary: "",
    fileType: files[0]?.type === "DOCX" ? "DOCX" : "PDF",
    fileSize: files.length === 1 ? files[0].size : files.length > 1 ? `${files.length} tệp` : "2.4 MB",
    downloads: 0,
    tags: tags.length > 0 ? tags : ["Pháp lý", "Quy chuẩn", "Ban QLDA"],
    files,
  };
}
