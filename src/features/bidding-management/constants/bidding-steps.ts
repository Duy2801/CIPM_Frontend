import type { BiddingTabKey, PackageFilter, PackageType, SelectionMethod } from "../types/bidding.types";

export interface BidStepDefinition {
  number: number;
  title: string;
  label: string;
  duration: string;
  output: string;
  /** Bước do Giám đốc / Phó Giám đốc phê duyệt */
  requiresApproval?: boolean;
}

/** Quy trình 9 bước KHLCNT theo Luật Đấu thầu 22/2023/QH15 (BRD 4.7.2) */
export const BID_STEPS: BidStepDefinition[] = [
  { number: 1, title: "Lập kế hoạch lựa chọn nhà thầu", label: "Lập KH", duration: "5–10 ngày", output: "Dự thảo KHLCNT trình duyệt" },
  { number: 2, title: "Thẩm định, phê duyệt KHLCNT", label: "Duyệt KH", duration: "7–10 ngày", output: "Quyết định phê duyệt KHLCNT", requiresApproval: true },
  { number: 3, title: "Lập hồ sơ mời thầu", label: "Lập HSMT", duration: "5–15 ngày", output: "Hồ sơ mời thầu được phê duyệt" },
  { number: 4, title: "Đăng thông báo mời thầu", label: "Đăng TB", duration: "Theo quy định", output: "Thông báo trên Hệ thống mạng đấu thầu quốc gia" },
  { number: 5, title: "Phát hành HSMT, nhận hồ sơ dự thầu", label: "Nhận HSDT", duration: "Theo HSMT", output: "Danh sách nhà thầu đã nộp hồ sơ" },
  { number: 6, title: "Mở thầu", label: "Mở thầu", duration: "1 ngày", output: "Biên bản mở thầu" },
  { number: 7, title: "Đánh giá hồ sơ dự thầu", label: "Đánh giá", duration: "20–30 ngày", output: "Báo cáo đánh giá HSDT" },
  { number: 8, title: "Thẩm định, phê duyệt kết quả LCNT", label: "Duyệt KQ", duration: "7–10 ngày", output: "Quyết định phê duyệt kết quả", requiresApproval: true },
  { number: 9, title: "Thông báo và ký kết hợp đồng", label: "Ký HĐ", duration: "Trong 30 ngày sau QĐ", output: "Hợp đồng được ký kết" },
];

export const TOTAL_BID_STEPS = BID_STEPS.length;
export const BID_DEADLINE_STEP = 5;
export const RESULT_APPROVAL_STEP = 8;
export const CONTRACT_STEP = 9;
export const CONTRACT_SIGNING_DAYS = 30;

export const PACKAGE_TYPES: PackageType[] = [
  "Xây lắp",
  "Tư vấn thiết kế",
  "Tư vấn thẩm tra",
  "Tư vấn giám sát",
  "Mua sắm thiết bị",
];

export const SELECTION_METHODS: SelectionMethod[] = [
  "Đấu thầu rộng rãi",
  "Đấu thầu hạn chế",
  "Chỉ định thầu",
  "Mua sắm trực tiếp",
];

export const PACKAGE_FILTER_LABELS: Record<PackageFilter, string> = {
  ALL: "Tất cả",
  DEADLINE: "Sắp hết hạn nộp HSDT",
  PENDING_APPROVAL: "Chờ phê duyệt",
  REJECTED: "Bị trả lại",
  CONTRACT_DUE: "Cần ký hợp đồng",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Đã ký hợp đồng",
};

export const BIDDING_TAB_LABELS: Record<BiddingTabKey, string> = {
  packages: "Gói thầu",
  process: "Quy trình 9 bước",
};
