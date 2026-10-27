import type { LegalDocument } from "../types/legal-ai.types";
import type { LegalDocumentPatch } from "../utils/document-changes";

/** Ranh giới dữ liệu M9 – backend chỉ cần cung cấp implementation cùng interface */
export interface LegalRepository {
  getDocuments(): Promise<LegalDocument[]>;
  createDocument(input: Omit<LegalDocument, "id">): Promise<LegalDocument>;
  updateDocument(id: string, patch: LegalDocumentPatch): Promise<LegalDocument>;
}
