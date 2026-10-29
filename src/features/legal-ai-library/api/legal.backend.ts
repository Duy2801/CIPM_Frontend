import apiClient from "@/config";
import type { ApiAuditLog } from "@/features/personnel-assignment/services/personnel.mapper";
import type { ApiLegalDocument, ApiLegalDocumentBody, ApiLegalDocumentPage, ApiLegalFile } from "../services/legal.mapper";

/**
 * Các API Thư viện pháp lý của backend thật — chỉ gọi API và trả dữ liệu backend, không xử lý thêm.
 * Chuyển dữ liệu sang dạng màn hình dùng và chạy bản mock khi không có backend: services/legal.api.ts.
 */

// ── Văn bản ──

/** GET /legal-documents (phân trang, kèm số văn bản theo tình trạng) */
export async function getDocumentsPageApi(page: number, limit: number): Promise<ApiLegalDocumentPage> {
  return (await apiClient.get<ApiLegalDocumentPage>("legal-documents", { params: { page, limit } })).data;
}

/** GET /legal-documents/:id */
export async function getDocumentApi(documentId: string): Promise<ApiLegalDocument> {
  return (await apiClient.get<ApiLegalDocument>(`legal-documents/${documentId}`)).data;
}

/** POST /legal-documents */
export async function createDocumentApi(body: ApiLegalDocumentBody): Promise<ApiLegalDocument> {
  return (await apiClient.post<ApiLegalDocument>("legal-documents", body)).data;
}

/** PATCH /legal-documents/:id — chỉ gửi trường thay đổi, null để xóa giá trị */
export async function updateDocumentApi(documentId: string, body: Partial<ApiLegalDocumentBody>): Promise<ApiLegalDocument> {
  return (await apiClient.patch<ApiLegalDocument>(`legal-documents/${documentId}`, body)).data;
}

// ── Tệp đính kèm ──

/** POST /legal-documents/files — tải một tệp PDF / Word lên, gắn vào văn bản qua `fileIds` */
export async function uploadFileApi(file: File): Promise<ApiLegalFile> {
  const form = new FormData();
  form.append("file", file);
  return (
    await apiClient.post<ApiLegalFile>("legal-documents/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    })
  ).data;
}

/** GET /legal-documents/:id/files/:fileId — nội dung tệp (inline = xem trước) */
export async function downloadFileApi(documentId: string, fileId: string, inline: boolean): Promise<Blob> {
  // Interceptor của apiClient trả thẳng body, ở đây body là Blob
  return apiClient.get<never, Blob>(`legal-documents/${documentId}/files/${fileId}`, {
    params: { inline },
    responseType: "blob",
    timeout: 120_000,
  });
}

// ── Lịch sử ──

/** GET /audit-logs?module=legal_library — cả thư viện, hoặc một văn bản khi có `targetId` */
export async function getLegalAuditLogsApi(targetId?: string): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>("audit-logs", { params: { module: "legal_library", targetId } })).data;
}
