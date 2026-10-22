import { STATUS_META, getCategoryLabel } from "../constants/legal-mock-data";
import type { LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";

/** Các trường sửa được trong drawer chi tiết văn bản */
export type LegalDocumentPatch = Partial<
  Pick<
    LegalDocument,
    "code" | "title" | "category" | "issuer" | "issueDate" | "effectiveDate" | "status" | "tags" | "files"
  >
>;

export type LegalDocumentField = keyof LegalDocumentPatch;

export const LEGAL_FIELD_LABELS: Record<LegalDocumentField, string> = {
  code: "Số hiệu",
  title: "Tên văn bản",
  category: "Phân loại văn bản",
  issuer: "Cơ quan ban hành",
  issueDate: "Ngày ban hành",
  effectiveDate: "Ngày bắt đầu hiệu lực",
  status: "Tình trạng hiệu lực",
  tags: "Từ khóa tra cứu",
  files: "Tệp đính kèm",
};

/** "2024-06-01" → "01/06/2024" */
const formatIsoDate = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
};

/** Giá trị dễ đọc của một trường (dùng cho hộp xác nhận và lịch sử "cũ → mới") */
export function formatLegalFieldValue(field: LegalDocumentField, value: unknown): string {
  if (field === "category") return getCategoryLabel(String(value));
  if (field === "status") return STATUS_META[value as LegalDocumentStatus]?.label ?? String(value);
  if (field === "issueDate" || field === "effectiveDate") return value ? formatIsoDate(String(value)) : "";
  if (field === "tags") return ((value as string[] | undefined) ?? []).join(", ");
  if (field === "files") {
    // Văn bản mẫu chưa khai báo tệp: chỉ có tệp gốc mang số hiệu văn bản
    const files = value as LegalDocument["files"];
    return files ? files.map((file) => file.name).join(", ") : "Tệp gốc của văn bản";
  }
  return String(value ?? "");
}

/** Danh sách thay đổi "cũ → mới" giữa văn bản gốc và các trường đang sửa */
export function describeLegalChanges(original: LegalDocument, patch: LegalDocumentPatch) {
  return (Object.keys(patch) as LegalDocumentField[]).map((field) => ({
    field,
    label: LEGAL_FIELD_LABELS[field],
    from: formatLegalFieldValue(field, original[field]),
    to: formatLegalFieldValue(field, patch[field]),
  }));
}

/** Hai giá trị của cùng một trường có giống nhau không */
export const isSameFieldValue = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
