export type LegalViewerTab =
  | "overview"
  | "content"
  | "original"
  | "english"
  | "validity"
  | "related"
  | "diagram"
  | "consolidated"
  | "download";

export type RelatedCategoryKey =
  | "all"
  | "basis"
  | "expired"
  | "guiding"
  | "amended_by"
  | "amending"
  | "referenced"
  | "partial_expired"
  | "stipulating_partial_expired"
  | "consolidated_from"
  | "consolidated";

export interface RelatedCategoryMeta {
  key: RelatedCategoryKey;
  label: string;
  count: number;
  description: string;
  color?: string;
}

export interface RelatedDocumentItem {
  id: string;
  orderNumber: string; // "01", "02", ...
  code: string;
  title: string;
  issuer: string;
  issueDate: string;
  effectiveDate: string;
  statusText: string;
  statusCode: "EFFECTIVE" | "EXPIRING" | "PARTIAL" | "EXPIRED" | "PENDING";
  categoryKey: RelatedCategoryKey;
}

export interface ArticleItem {
  number: string; // "Điều 1", "Điều 2"
  title: string;
  paragraphs: string[];
  amendedNote?: string;
  status?: "EFFECTIVE" | "PARTIAL" | "EXPIRED";
}

export interface ChapterItem {
  number: string; // "Chương I", "Chương II"
  title: string;
  articles: ArticleItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface DetailedLegalDocument {
  id: string;
  code: string; // "45/2019/QH14"
  title: string; // "Bộ luật Lao động 2019, số 45/2019/QH14"
  shortTitle: string; // "Bộ luật Lao động 2019"
  categoryName: string; // "Bộ luật", "Luật", "Nghị định"...
  issuer: string; // "Quốc hội", "Chính phủ"...
  gazetteNumber: string; // "993&994-12/2019"
  gazetteDate: string; // "26/12/2019"
  signer: string; // "Nguyễn Thị Kim Ngân"
  issueDate: string; // "20/11/2019"
  effectiveDate: string; // "01/01/2021"
  expiredDate: string; // "Đang cập nhật"
  statusText: string; // "Hết Hiệu lực một phần", "Còn hiệu lực"...
  statusCode: "EFFECTIVE" | "EXPIRING" | "PARTIAL" | "EXPIRED" | "PENDING";
  field: string; // "Lao động-Tiền lương", "Đầu tư xây dựng"...
  updatedAtText: string; // "Thứ Tư, 11/12/2019 15:46 (GMT+7)"
  totalChapters: number;
  totalArticles: number;
  summaryHighlights: string[];
  chapters: ChapterItem[];
  amendedByCodes: string[]; // ["113/2025/QH15", "124/2025/QH15", "71/2025/QH15"]
  keywords: string[];
  faqs: FaqItem[];
  authors: string[];
  englishTitle: string;
  originalPdfUrl?: string;
  englishContent?: string;
  consolidatedNote?: string;
}
