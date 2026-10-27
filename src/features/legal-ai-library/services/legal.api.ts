import type { LegalDocument } from "../types/legal-ai.types";
import type { LegalDocumentPatch } from "../utils/document-changes";
import { mockLegalRepository } from "./mock-legal.repository";

/**
 * API phân hệ Thư viện Pháp lý.
 * Mỗi hàm ứng với một endpoint backend (ghi ở chú thích); hiện chạy trên dữ liệu mock.
 * Khi nối backend chỉ cần thay thân hàm bằng lời gọi apiClient, component và hook không phải sửa.
 */

const repo = mockLegalRepository;

// ── Đọc dữ liệu ──

/** GET /legal-documents → danh sách văn bản */
export function getDocuments(): Promise<LegalDocument[]> {
  return repo.getDocuments();
}

/** GET /legal-documents/:id → một văn bản */
export async function getDocument(documentId: string): Promise<LegalDocument> {
  const document = (await repo.getDocuments()).find((doc) => doc.id === documentId);
  if (!document) throw new Error("Không tìm thấy văn bản.");
  return document;
}

// ── Ghi dữ liệu ──

/** POST /legal-documents → thêm văn bản vào thư viện */
export function createDocument(input: Omit<LegalDocument, "id">): Promise<LegalDocument> {
  return repo.createDocument(input);
}

/** PATCH /legal-documents/:id → sửa thông tin / tệp của văn bản */
export function updateDocument(documentId: string, patch: LegalDocumentPatch): Promise<LegalDocument> {
  return repo.updateDocument(documentId, patch);
}
