import type { GpmbTabKey, HouseholdFilter, LandType, SpecialStatus } from "../types/gpmb.types";

export interface GpmbStepDefinition {
  number: number;
  title: string;
  /** Tên ngắn hiển thị trên ma trận và thanh tiến độ */
  label: string;
  /** Thời hạn pháp lý tính theo ngày lịch, undefined = không quy định */
  legalDays?: number;
  /** Thời hạn BẮT BUỘC theo BRD – vượt là cảnh báo đỏ */
  mandatory?: boolean;
  /** Biểu mẫu bắt buộc đính kèm trước khi hoàn thành bước */
  forms?: string;
  output: string;
  /** Bước quan trọng: Tổ Bồi thường chỉ đề xuất, GĐ/PGĐ duyệt */
  requiresApproval?: boolean;
}

/** Quy trình 16 bước GPMB – Phụ lục I kèm CV Sở NN&MT Kiên Giang (BRD 4.6.2) */
export const GPMB_STEPS: GpmbStepDefinition[] = [
  { number: 1, title: "Xây dựng kế hoạch thu hồi đất", label: "Kế hoạch", output: "Kế hoạch thu hồi đất" },
  { number: 2, title: "Họp phổ biến với người có đất", label: "Họp dân", forms: "Mẫu 01", output: "Biên bản họp dân" },
  { number: 3, title: "Thông báo thu hồi đất", label: "Thông báo", forms: "Mẫu 02, 02.1, 02.2", output: "Thông báo thu hồi đất" },
  { number: 4, title: "Điều tra, đo đạc, kiểm đếm", label: "Kiểm đếm", legalDays: 30, forms: "Mẫu 03, 03.1–03.3", output: "Biên bản kiểm kê" },
  { number: 5, title: "Lập phương án bồi thường, hỗ trợ, TĐC", label: "Lập PA", output: "Dự thảo phương án" },
  { number: 6, title: "Niêm yết công khai phương án", label: "Niêm yết", legalDays: 10, mandatory: true, forms: "Mẫu 04, 04.1", output: "Biên bản niêm yết" },
  { number: 7, title: "Lấy ý kiến về phương án", label: "Lấy ý kiến", legalDays: 30, output: "Biên bản lấy ý kiến, đối thoại" },
  { number: 8, title: "Thẩm định phương án", label: "Thẩm định", legalDays: 30, mandatory: true, output: "Biên bản thẩm định" },
  { number: 9, title: "Phê duyệt phương án BT-HT-TĐC", label: "Phê duyệt PA", forms: "Mẫu 05", output: "Quyết định phê duyệt", requiresApproval: true },
  { number: 10, title: "Phổ biến, niêm yết quyết định phê duyệt", label: "Niêm yết QĐ", forms: "Mẫu 06", output: "Biên bản niêm yết" },
  { number: 11, title: "Gửi phương án đến từng hộ dân", label: "Giao QĐ", forms: "Mẫu 07", output: "Biên bản giao quyết định" },
  { number: 12, title: "Thực hiện chi trả tiền bồi thường", label: "Chi trả", output: "Hồ sơ, biên bản chi trả" },
  { number: 13, title: "Ban hành quyết định thu hồi đất", label: "QĐ thu hồi", legalDays: 10, mandatory: true, forms: "Mẫu 08", output: "Quyết định thu hồi đất", requiresApproval: true },
  { number: 14, title: "Xử lý hộ không đồng ý phương án", label: "Vận động", legalDays: 20, mandatory: true, forms: "Mẫu 08", output: "Biên bản vận động" },
  { number: 15, title: "Xử lý hộ không bàn giao đất", label: "Cưỡng chế", legalDays: 20, mandatory: true, forms: "Mẫu 09", output: "Quyết định cưỡng chế", requiresApproval: true },
  { number: 16, title: "Quản lý đất đã thu hồi", label: "Bàn giao đất", output: "Bàn giao đơn vị quản lý" },
];

export const TOTAL_GPMB_STEPS = GPMB_STEPS.length;
export const PAYMENT_STEP = 12;
export const PLAN_APPROVAL_STEP = 9;

export const SPECIAL_STATUS_META: Record<
  SpecialStatus,
  { label: string; intent: "success" | "warning" | "danger" | "info"; hint: string }
> = {
  NORMAL: { label: "Bình thường", intent: "success", hint: "Hộ dân hợp tác theo quy trình" },
  UNCOOPERATIVE: {
    label: "Không hợp tác",
    intent: "warning",
    hint: "Không đồng ý phương án – áp dụng thêm bước 14 (vận động)",
  },
  COMPLAINT: { label: "Đang khiếu kiện", intent: "info", hint: "Theo dõi kết quả giải quyết khiếu nại" },
  ENFORCEMENT: {
    label: "Cưỡng chế",
    intent: "danger",
    hint: "Không bàn giao đất – áp dụng bước 14 và 15 (cưỡng chế)",
  },
};

export const LAND_TYPE_LABELS: Record<LandType, string> = {
  ONT: "Đất ở nông thôn",
  CLN: "Đất trồng cây lâu năm",
  RSX: "Đất rừng sản xuất",
  HNK: "Đất trồng cây hằng năm",
  "Hỗn hợp": "Nhiều loại đất",
};

export const HOUSEHOLD_FILTER_LABELS: Record<HouseholdFilter, string> = {
  ALL: "Tất cả",
  OVERDUE: "Quá hạn pháp lý",
  SOON: "Sắp hết hạn",
  PENDING_APPROVAL: "Chờ duyệt",
  REJECTED: "Bị trả lại",
  SPECIAL: "Không hợp tác / Khiếu kiện",
  PAYMENT_READY: "Đến bước chi trả",
  DONE: "Đã bàn giao đất",
};

export const GPMB_TAB_LABELS: Record<GpmbTabKey, string> = {
  households: "Danh sách hộ dân",
  matrix: "Ma trận 16 bước",
  process: "Quy trình & biểu mẫu",
};
