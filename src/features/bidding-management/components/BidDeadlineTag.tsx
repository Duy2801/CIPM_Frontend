"use client";

import { addDays, formatDateVi } from "@/utils/date";
import type { BidPackage } from "../types/bidding.types";
import {
  getBidDeadlineStatus,
  getContractDeadlineStatus,
  getCurrentBidStep,
} from "../utils/bidding-rules";

/** Thời gian chuẩn (số ngày tối đa) cho từng bước theo quy định đấu thầu */
const STEP_MAX_DAYS: Record<number, number> = {
  1: 10, // Lập KHLCNT (5-10 ngày)
  2: 10, // Thẩm định, phê duyệt KHLCNT (7-10 ngày)
  3: 15, // Lập HSMT (5-15 ngày)
  4: 7,  // Đăng thông báo mời thầu (5-7 ngày)
  5: 20, // Phát hành HSMT, nhận HSDT
  6: 1,  // Mở thầu (1 ngày)
  7: 30, // Đánh giá HSDT (20-30 ngày)
  8: 10, // Thẩm định, phê duyệt KQ LCNT (7-10 ngày)
  9: 30, // Ký kết hợp đồng (30 ngày sau QĐ)
};

const STEP_DEADLINE_LABELS: Record<number, string> = {
  1: "Hạn lập KH",
  2: "Hạn duyệt KH",
  3: "Hạn lập HSMT",
  4: "Hạn đăng TB",
  5: "Hạn nộp HSDT",
  6: "Hạn mở thầu",
  7: "Hạn đánh giá",
  8: "Hạn duyệt KQ",
  9: "Hạn ký HĐ",
};

function renderDeadline(label: string, date: string) {
  const cleanLabel = label.replace(/:+$/, "").trim();
  return (
    <div className="py-0.5 flex flex-col items-center justify-center text-center">
      <span className="text-[11.5px] text-slate-500 font-medium leading-tight">
        {cleanLabel}
      </span>
      <span className="text-xs font-semibold text-slate-800 whitespace-nowrap leading-tight mt-0.5">
        {formatDateVi(date)}
      </span>
    </div>
  );
}

/** Mốc thời gian gói thầu: hiển thị ngày và cập nhật liên tục theo từng giai đoạn / bước */
export default function BidDeadlineTag({ pkg, today }: { pkg: BidPackage; today: string }) {
  const current = getCurrentBidStep(pkg);

  // 1. Khi gói thầu đã hoàn tất 9/9 bước (đã ký HĐ)
  if (current === null) {
    const step9 = pkg.records.find((r) => r.step === 9);
    const finishDate = step9?.completedAt || pkg.currentStepStartedAt;
    return renderDeadline("Đã ký HĐ", finishDate);
  }

  // 2. Khi bước đang có tờ trình gửi Ban Giám đốc phê duyệt
  if (pkg.submission) {
    return renderDeadline("Trình duyệt", pkg.submission.submittedAt);
  }

  // 3. Mốc quan trọng: Hạn nộp HSDT (khi có bidDeadline hoặc đang ở bước 5)
  const bidStatus = getBidDeadlineStatus(pkg, today);
  if (bidStatus.state !== "NONE" && bidStatus.date) {
    return renderDeadline("Hạn nộp HSDT", bidStatus.date);
  }

  // 4. Mốc quan trọng: Hạn ký hợp đồng (khi đang ở bước 9)
  const contractStatus = getContractDeadlineStatus(pkg, today);
  if (contractStatus.state !== "NONE" && contractStatus.date) {
    return renderDeadline("Hạn ký HĐ", contractStatus.date);
  }

  // 5. Cập nhật liên tục theo từng giai đoạn / bước đang thực hiện (Bước 1, 2, 3, 4, 6, 7, 8...)
  const stepStart = pkg.currentStepStartedAt || pkg.records[pkg.records.length - 1]?.completedAt || today;
  const maxDays = STEP_MAX_DAYS[current] || 10;
  const targetDeadline = addDays(stepStart, maxDays);
  const label = STEP_DEADLINE_LABELS[current] || `Hạn B${current}`;

  return renderDeadline(label, targetDeadline);
}
