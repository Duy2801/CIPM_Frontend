import { addMonths, daysBetween } from "../../../utils/date.ts";
import type {
  CountdownStatus,
  FixInput,
  Incident,
  IncidentFilter,
  IncidentInput,
  WarrantyFilter,
  WarrantyRecord,
} from "../types/warranty.types";

/** Ngày hết hạn = ngày nghiệm thu + thời hạn bảo hành; màu: xanh > 90, vàng ≤ 90, đỏ ≤ 30 (BRD 4.8.1) */
export function getCountdown(warranty: WarrantyRecord, today: string): CountdownStatus {
  const expiryDate = addMonths(warranty.acceptanceDate, warranty.months);
  const daysLeft = daysBetween(today, expiryDate);
  const totalDays = Math.max(1, daysBetween(warranty.acceptanceDate, expiryDate));
  const elapsedPercent = Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)));
  const level = daysLeft < 0 ? "EXPIRED" : daysLeft <= 30 ? "URGENT" : daysLeft <= 90 ? "WATCH" : "SAFE";
  return { level, expiryDate, daysLeft, elapsedPercent };
}

export function isIncidentOverdue(incident: Incident, today: string): boolean {
  return incident.status !== "FIXED" && incident.requiredFixDate < today;
}

export function getOpenIncidents(warrantyId: string, incidents: Incident[]): Incident[] {
  return incidents.filter((item) => item.warrantyId === warrantyId && item.status !== "FIXED");
}

/**
 * Chỉ hoàn trả bảo lãnh khi đã hết thời hạn bảo hành và không còn sự cố chưa khắc phục.
 * Trả về lý do khi chưa đủ điều kiện.
 */
export function getBondReturnBlocker(
  warranty: WarrantyRecord,
  incidents: Incident[],
  today: string,
): string | undefined {
  if (warranty.bondStatus !== "HOLDING") return "Bảo lãnh đã được xử lý trước đó.";
  const countdown = getCountdown(warranty, today);
  if (countdown.daysLeft >= 0) return `Còn ${countdown.daysLeft} ngày mới hết hạn bảo hành.`;
  const open = getOpenIncidents(warranty.id, incidents).length;
  if (open > 0) return `Còn ${open} sự cố chưa khắc phục xong.`;
  return undefined;
}

export function validateIncident(input: IncidentInput): string | undefined {
  if (!input.description.trim()) return "Vui lòng mô tả sự cố.";
  if (!input.location.trim()) return "Vui lòng nhập vị trí sự cố tại công trình.";
  if (!input.foundDate || !input.requiredFixDate) return "Vui lòng nhập ngày phát hiện và hạn khắc phục.";
  if (input.requiredFixDate < input.foundDate) return "Hạn khắc phục không được trước ngày phát hiện.";
  return undefined;
}

export function validateFix(incident: Incident, input: FixInput): string | undefined {
  if (incident.status === "FIXED") return "Sự cố này đã được nghiệm thu khắc phục.";
  if (!input.acceptanceDocument.trim()) return "Cần số biên bản nghiệm thu khắc phục.";
  if (!input.fixedDate || input.fixedDate < incident.foundDate) return "Ngày hoàn thành không hợp lệ.";
  return undefined;
}

export function matchesWarrantyFilter(
  warranty: WarrantyRecord,
  filter: WarrantyFilter,
  incidents: Incident[],
  today: string,
): boolean {
  const level = getCountdown(warranty, today).level;
  switch (filter) {
    case "ALL":
      return true;
    case "URGENT":
      return level === "URGENT";
    case "WATCH":
      return level === "WATCH" || level === "URGENT";
    case "EXPIRED":
      return level === "EXPIRED";
    case "BOND_READY":
      return !getBondReturnBlocker(warranty, incidents, today);
  }
}

export function matchesIncidentFilter(incident: Incident, filter: IncidentFilter, today: string): boolean {
  switch (filter) {
    case "ALL":
      return true;
    case "OVERDUE":
      return isIncidentOverdue(incident, today);
    default:
      return incident.status === filter;
  }
}
