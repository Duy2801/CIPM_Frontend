import { withBackend } from "@/features/personnel-assignment/services/backend";
import { getPersonnelActivities, type ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import * as backend from "../api/legal.backend";
import { LEGAL_LOG_MODULE } from "../constants/legal-labels";
import type { AttachedDocumentFile, LegalDocument } from "../types/legal-ai.types";
import type { LegalDocumentPatch } from "../utils/document-changes";
import { downloadLegalFile, saveBlob } from "../utils/legal-files";
import { toApiCreateBody, toApiUpdateBody, toLegalActivityEntry, toLegalDocument, type ApiLegalDocument } from "./legal.mapper";
import { mockLegalRepository } from "./mock-legal.repository";

/**
 * Phân hệ Thư viện Pháp lý.
 * Đăng nhập bằng tài khoản thật thì gọi backend (api/legal.backend.ts) rồi chuyển dữ liệu sang dạng màn hình dùng;
 * tài khoản thử nghiệm hoặc server không phản hồi thì chạy trên kho mock trong bộ nhớ.
 */

const repo = mockLegalRepository;

/** Tệp đã nằm trên backend (mã uuid); tệp vừa chọn hoặc tệp gốc ảo của văn bản mẫu thì không */
const isStoredFile = (file: AttachedDocumentFile) => !file.rawFile && /^[0-9a-f-]{36}$/i.test(file.id);

/** Tải lên các tệp vừa chọn, trả về mã của toàn bộ tệp theo thứ tự (bỏ tệp gốc ảo) */
async function uploadFiles(files: AttachedDocumentFile[] = []): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    if (file.rawFile) ids.push((await backend.uploadFileApi(file.rawFile)).id);
    else if (isStoredFile(file)) ids.push(file.id);
  }
  return ids;
}

// ── Đọc dữ liệu ──

/** Danh sách văn bản (đọc hết các trang; màn hình tự lọc / sắp xếp / phân trang) */
export function getDocuments(): Promise<LegalDocument[]> {
  return withBackend(
    async () => {
      const documents: ApiLegalDocument[] = [];
      for (let page = 1, totalPages = 1; page <= totalPages; page++) {
        const data = await backend.getDocumentsPageApi(page, 100);
        documents.push(...data.items);
        totalPages = data.meta.totalPages;
      }
      return documents.map(toLegalDocument);
    },
    () => repo.getDocuments(),
  );
}

/** Một văn bản (kèm tệp đính kèm) */
export function getDocument(documentId: string): Promise<LegalDocument> {
  return withBackend(
    async () => toLegalDocument(await backend.getDocumentApi(documentId)),
    async () => {
      const document = (await repo.getDocuments()).find((doc) => doc.id === documentId);
      if (!document) throw new Error("Không tìm thấy văn bản.");
      return document;
    },
  );
}

/** Lịch sử thay đổi của thư viện, hoặc của một văn bản khi có `documentId` */
export function getLegalHistory(documentId?: string): Promise<ActivityEntry[]> {
  return withBackend(
    async () => (await backend.getLegalAuditLogsApi(documentId)).map(toLegalActivityEntry),
    () => getPersonnelActivities().filter((e) => e.module === LEGAL_LOG_MODULE),
  );
}

// ── Ghi dữ liệu ──

/** Thêm văn bản: tải tệp lên trước, rồi tạo văn bản kèm mã tệp */
export function createDocument(input: Omit<LegalDocument, "id">): Promise<LegalDocument> {
  return withBackend(
    async () => toLegalDocument(await backend.createDocumentApi(toApiCreateBody(input, await uploadFiles(input.files)))),
    () => repo.createDocument(input),
  );
}

/** Sửa thông tin / tệp của văn bản (gửi toàn bộ danh sách tệp sau khi sửa) */
export function updateDocument(documentId: string, patch: LegalDocumentPatch): Promise<LegalDocument> {
  return withBackend(
    async () => {
      const fileIds = patch.files ? await uploadFiles(patch.files) : undefined;
      return toLegalDocument(await backend.updateDocumentApi(documentId, toApiUpdateBody(patch, fileIds)));
    },
    () => repo.updateDocument(documentId, patch),
  );
}

// ── Tệp đính kèm ──

/** Nội dung tệp để xem trước: tệp vừa chọn đọc ngay; tệp trên backend tải về (cần token); không có thì null */
export async function getFileBlob(document: LegalDocument, file: AttachedDocumentFile): Promise<Blob | null> {
  if (file.rawFile) return file.rawFile;
  if (!isStoredFile(file) || !file.url) return null;
  return withBackend(
    () => backend.downloadFileApi(document.id, file.id, true),
    () => null,
  );
}

/** Tải tệp về máy */
export async function downloadFile(document: LegalDocument, file: AttachedDocumentFile): Promise<void> {
  if (!isStoredFile(file) || !file.url) {
    downloadLegalFile(document, file);
    return;
  }
  const blob = await withBackend(
    () => backend.downloadFileApi(document.id, file.id, false),
    () => null,
  );
  if (!blob) {
    downloadLegalFile(document, file);
    return;
  }
  const href = URL.createObjectURL(blob);
  saveBlob(href, file.name);
  URL.revokeObjectURL(href);
}
