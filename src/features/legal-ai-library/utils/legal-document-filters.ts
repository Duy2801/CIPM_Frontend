import { normalizeSearchText as normalize } from "../../../utils/search-text.ts";
import { CATEGORY_DISPLAY_ORDER } from "../constants/legal-labels.ts";
import type { DocumentCategoryKey, LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types.ts";

export interface LegalDocumentFilters {
  search: string;
  /** "ALL" = tất cả loại văn bản */
  category: DocumentCategoryKey | "ALL";
  /** "ALL" = tất cả tình trạng */
  status: LegalDocumentStatus | "ALL";
}

export const DEFAULT_LEGAL_FILTERS: LegalDocumentFilters = { search: "", category: "ALL", status: "ALL" };

export const isLegalFiltering = (filters: LegalDocumentFilters) =>
  filters.search.trim() !== "" || filters.category !== "ALL" || filters.status !== "ALL";

const BUILT_IN_ORDER = CATEGORY_DISPLAY_ORDER as string[];

/** Loại văn bản người dùng tự thêm (đã có văn bản trong thư viện), giữ thứ tự xuất hiện */
export function getCustomCategories(documents: LegalDocument[]): string[] {
  return [...new Set(documents.map((doc) => doc.category))].filter((cat) => !BUILT_IN_ORDER.includes(cat));
}

/** Tất cả loại văn bản để chọn: loại có sẵn trước, loại tự thêm sau */
export function getCategoryKeys(documents: LegalDocument[]): DocumentCategoryKey[] {
  return [...CATEGORY_DISPLAY_ORDER, ...getCustomCategories(documents)];
}

/**
 * Lọc theo từ khóa (số hiệu, tên, cơ quan ban hành, tóm tắt, từ khóa) + loại + tình trạng.
 * Văn bản vừa thêm trong phiên (`recentlyAddedIds`, mới nhất đầu) đứng trên cùng;
 * còn lại xếp theo thứ bậc loại văn bản rồi ngày cập nhật mới nhất.
 */
export function filterLegalDocuments(
  documents: LegalDocument[],
  filters: LegalDocumentFilters,
  recentlyAddedIds: string[] = [],
): LegalDocument[] {
  const query = normalize(filters.search);
  const rankOf = (category: string) => {
    const rank = BUILT_IN_ORDER.indexOf(category);
    return rank === -1 ? 999 : rank;
  };

  return documents
    .filter(
      (doc) =>
        (filters.category === "ALL" || doc.category === filters.category) &&
        (filters.status === "ALL" || doc.status === filters.status) &&
        (!query ||
          [doc.code, doc.title, doc.issuer, doc.summary, ...doc.tags].some((text) => normalize(text).includes(query))),
    )
    .sort((a, b) => {
      const addedA = recentlyAddedIds.indexOf(a.id);
      const addedB = recentlyAddedIds.indexOf(b.id);
      if (addedA !== -1 || addedB !== -1) {
        if (addedA === -1) return 1;
        if (addedB === -1) return -1;
        return addedA - addedB;
      }
      const rankDiff = rankOf(a.category) - rankOf(b.category);
      if (rankDiff !== 0) return rankDiff;
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
}
