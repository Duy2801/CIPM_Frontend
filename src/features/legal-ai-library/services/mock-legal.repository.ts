import { todayIso } from "@/utils/date";
import { LEGAL_MOCK_DOCUMENTS } from "../constants/legal-mock-data";
import type { LegalDocument } from "../types/legal-ai.types";
import type { LegalRepository } from "./legal.repository";

/**
 * Kho văn bản mock trong bộ nhớ (giữ trong phiên làm việc).
 * Không lưu localStorage vì tệp vừa tải lên là đối tượng File, không ghi ra chuỗi được.
 */
export function createMockLegalRepository(): LegalRepository {
  let documents: LegalDocument[] = LEGAL_MOCK_DOCUMENTS.map((doc) => ({ ...doc }));

  return {
    async getDocuments() {
      return [...documents];
    },

    async createDocument(input) {
      const created: LegalDocument = { ...input, id: `DOC-${Date.now()}`, updatedAt: todayIso() };
      documents = [created, ...documents];
      return created;
    },

    async updateDocument(id, patch) {
      const current = documents.find((doc) => doc.id === id);
      if (!current) throw new Error("Không tìm thấy văn bản.");
      const updated: LegalDocument = { ...current, ...patch, updatedAt: todayIso() };
      documents = documents.map((doc) => (doc.id === id ? updated : doc));
      return updated;
    },
  };
}

export const mockLegalRepository = createMockLegalRepository();
