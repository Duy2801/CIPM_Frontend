import type { ApiAuditLog } from "@/features/personnel-assignment/services/personnel.mapper";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import { LEGAL_LOG_MODULE } from "../constants/legal-labels";
import type { AttachedDocumentFile, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";
import type { LegalDocumentPatch } from "../utils/document-changes";

/**
 * Chuyển dữ liệu backend (cipm-service, module legal-document) ↔ kiểu dữ liệu màn Thư viện pháp lý.
 */

// ── Kiểu dữ liệu backend ──

export interface ApiLegalFile {
  id: string;
  name: string;
  size: string;
  /** Đuôi tệp viết hoa: PDF | DOC | DOCX */
  type: string;
  /** Có khi tệp đã gắn vào văn bản: /api/v1/legal-documents/:id/files/:fileId */
  url?: string;
  updatedAt: string;
}

export interface ApiLegalDocument {
  id: string;
  code: string;
  title: string;
  category: string | null;
  issuer: string;
  signer: string | null;
  gazetteNumber: string | null;
  gazetteDate: string | null;
  field: string | null;
  issueDate: string | null;
  effectiveDate: string | null;
  expiredDate: string | null;
  status: LegalDocumentStatus;
  tags: string[];
  fileType: string | null;
  fileSize: string | null;
  updatedAt: string | null;
  /** Chỉ có ở chi tiết văn bản */
  scope?: string | null;
  summary?: string;
  files?: ApiLegalFile[];
}

export interface ApiLegalDocumentPage {
  items: ApiLegalDocument[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  statusCounts: Record<LegalDocumentStatus, number>;
}

/** Body thêm / sửa văn bản */
export interface ApiLegalDocumentBody {
  code: string;
  title: string | null;
  category: string | null;
  field: string | null;
  issuer: string;
  gazetteNumber: string | null;
  gazetteDate: string | null;
  signer: string | null;
  issueDate: string | null;
  effectiveDate: string | null;
  expiredDate: string | null;
  status: LegalDocumentStatus;
  tags: string[];
  summary: string | null;
  fileIds: string[];
}

// ── Văn bản & tệp ──

const toFileType = (type?: string | null): AttachedDocumentFile["type"] => (type === "PDF" || !type ? "PDF" : "DOCX");

export const toAttachedFile = (file: ApiLegalFile): AttachedDocumentFile => ({
  id: file.id,
  name: file.name,
  size: file.size,
  type: toFileType(file.type),
  url: file.url,
  updatedAt: file.updatedAt,
});

export function toLegalDocument(document: ApiLegalDocument): LegalDocument {
  return {
    id: document.id,
    code: document.code,
    title: document.title,
    category: document.category ?? "",
    issuer: document.issuer,
    signer: document.signer ?? undefined,
    gazetteNumber: document.gazetteNumber ?? undefined,
    gazetteDate: document.gazetteDate ?? undefined,
    field: document.field ?? undefined,
    issueDate: document.issueDate ?? "",
    effectiveDate: document.effectiveDate ?? "",
    expiredDate: document.expiredDate ?? undefined,
    status: document.status,
    scope: document.scope ?? document.field ?? "",
    summary: document.summary ?? "",
    fileType: toFileType(document.fileType),
    fileSize: document.fileSize ?? "",
    downloads: 0,
    tags: document.tags,
    // Danh sách chưa kèm tệp; chi tiết văn bản luôn có mảng tệp (có thể rỗng)
    files: document.files?.map(toAttachedFile),
    updatedAt: document.updatedAt ?? undefined,
  };
}

/** Chỉ nhận ngày "YYYY-MM-DD"; trống hoặc "Đang cập nhật" → null */
const toApiDate = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);
const toApiText = (value?: string) => value?.trim() || null;

type DocumentFields = Omit<LegalDocument, "id" | "files">;

/** Body POST /legal-documents (tệp đã tải lên trước, truyền mã tệp) */
export function toApiCreateBody(input: DocumentFields, fileIds: string[]): ApiLegalDocumentBody {
  return {
    code: input.code.trim(),
    title: toApiText(input.title),
    category: toApiText(input.category),
    field: toApiText(input.field),
    issuer: input.issuer.trim(),
    gazetteNumber: toApiText(input.gazetteNumber),
    gazetteDate: toApiDate(input.gazetteDate),
    signer: toApiText(input.signer),
    issueDate: toApiDate(input.issueDate),
    effectiveDate: toApiDate(input.effectiveDate),
    expiredDate: toApiDate(input.expiredDate),
    status: input.status,
    tags: input.tags,
    summary: toApiText(input.summary),
    fileIds,
  };
}

/** Body PATCH /legal-documents/:id: chỉ các trường backend cho sửa (tên văn bản, phạm vi chưa sửa được) */
export function toApiUpdateBody(patch: LegalDocumentPatch, fileIds?: string[]): Partial<ApiLegalDocumentBody> {
  const body: Partial<ApiLegalDocumentBody> = {};
  if (patch.code !== undefined) body.code = patch.code.trim();
  if (patch.category !== undefined) body.category = toApiText(patch.category);
  if (patch.field !== undefined) body.field = toApiText(patch.field);
  if (patch.issuer !== undefined) body.issuer = patch.issuer.trim();
  if (patch.gazetteNumber !== undefined) body.gazetteNumber = toApiText(patch.gazetteNumber);
  if (patch.gazetteDate !== undefined) body.gazetteDate = toApiDate(patch.gazetteDate);
  if (patch.signer !== undefined) body.signer = toApiText(patch.signer);
  if (patch.issueDate !== undefined) body.issueDate = toApiDate(patch.issueDate);
  if (patch.effectiveDate !== undefined) body.effectiveDate = toApiDate(patch.effectiveDate);
  if (patch.expiredDate !== undefined) body.expiredDate = toApiDate(patch.expiredDate);
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.tags !== undefined) body.tags = patch.tags;
  if (fileIds) body.fileIds = fileIds;
  return body;
}

// ── Lịch sử ──

/** Dòng nhật ký backend (module legal_library) → dòng nhật ký màn hình (module "Thư viện pháp lý") */
export const toLegalActivityEntry = (log: ApiAuditLog): ActivityEntry => ({
  id: log.id,
  at: log.at,
  actorName: log.actorName || "Hệ thống",
  actorRole: log.actorRole ?? undefined,
  module: LEGAL_LOG_MODULE,
  action: log.action,
  targetId: log.targetId ?? undefined,
  targetName: log.targetName ?? undefined,
  changes: log.changes ?? [],
  note: log.note ?? undefined,
});
