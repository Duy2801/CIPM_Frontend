import type {
  BuiltInDocumentCategory,
  LegalDocumentCategory,
  LegalDocumentStatus,
} from "../types/legal-ai.types.ts";

/** Tên nhóm văn bản (cơ quan ban hành nhập riêng ở ô "Cơ quan ban hành", không ghi kèm ở đây) */
const CATEGORY_LABELS: Record<LegalDocumentCategory, string> = {
  ALL: "Tất cả văn bản & biểu mẫu",
  LAW: "Luật",
  DECREE: "Nghị định",
  CIRCULAR: "Thông tư",
  RESOLUTION: "Nghị quyết",
  DECISION: "Quyết định",
  LOCAL: "Văn bản địa phương",
  TEMPLATE: "Biểu mẫu chuẩn",
};

/** Tên hiển thị của loại văn bản — loại tự thêm dùng luôn khóa làm tên */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as LegalDocumentCategory] ?? category;
}

/** Thứ tự loại văn bản trong bộ lọc và danh sách (theo thứ bậc hiệu lực pháp lý) */
export const CATEGORY_DISPLAY_ORDER: BuiltInDocumentCategory[] = [
  "LAW",
  "RESOLUTION",
  "DECREE",
  "CIRCULAR",
  "DECISION",
  "LOCAL",
  "TEMPLATE",
];

/** Phân hệ ghi trong nhật ký thao tác dùng chung (tab Lịch sử của Thư viện pháp lý) */
export const LEGAL_LOG_MODULE = "Thư viện pháp lý";

/** Danh mục lĩnh vực văn bản pháp lý & biểu mẫu */
export const COMMON_FIELDS = [
  "Lao động-Tiền lương",
  "Đầu tư xây dựng",
  "Quản lý đấu thầu",
  "Đất đai - GPMB & TĐC",
  "Tài chính - Quyết toán KBNN",
  "Bảo hành & Bảo trì công trình",
  "Thủ tục XDCB",
];

/** Cơ quan ban hành thường gặp (gợi ý trong ô chọn; văn bản trong thư viện bổ sung thêm) */
export const COMMON_ISSUERS: string[] = [
  "Quốc hội",
  "Ủy ban Thường vụ Quốc hội",
  "Chính phủ",
  "Thủ tướng Chính phủ",
  "Bộ Xây dựng",
  "Bộ Tài chính",
  "Bộ Kế hoạch và Đầu tư",
  "Bộ Tài nguyên và Môi trường",
  "Bộ Giao thông vận tải",
  "HĐND tỉnh Kiên Giang",
  "UBND tỉnh Kiên Giang",
  "Sở Xây dựng tỉnh Kiên Giang",
  "UBND TP Hà Tiên",
];

/** Cơ quan ban hành gợi ý sẵn theo nhóm văn bản */
export const DEFAULT_ISSUER_BY_CATEGORY: Partial<Record<LegalDocumentCategory, string>> = {
  LAW: "Quốc hội",
  DECREE: "Chính phủ",
  CIRCULAR: "Bộ Xây dựng",
  RESOLUTION: "Quốc hội",
  DECISION: "UBND tỉnh Kiên Giang",
  LOCAL: "UBND tỉnh Kiên Giang",
};

/** Thứ tự hiển thị tình trạng hiệu lực (dùng chung cho form, bộ lọc, danh sách) */
export const STATUS_ORDER: LegalDocumentStatus[] = ["EFFECTIVE", "EXPIRING", "PARTIAL", "EXPIRED"];

export const STATUS_META: Record<
  LegalDocumentStatus,
  { label: string; textClass: string; dotClass: string }
> = {
  EFFECTIVE: {
    label: "Còn hiệu lực",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  EXPIRING: {
    label: "Sắp hết hiệu lực",
    textClass: "text-rose-700",
    dotClass: "bg-rose-500",
  },
  PARTIAL: {
    label: "Hết hiệu lực một phần",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  EXPIRED: {
    label: "Hết hiệu lực",
    textClass: "text-slate-500",
    dotClass: "bg-slate-400",
  },
};
