import type { CompensationBreakdown, CompensationGroup, CompensationItem, Household } from "../types/gpmb.types";

export const COMPENSATION_GROUPS: CompensationGroup[] = ["LAND", "SUPPORT", "CROPS", "STRUCTURES", "POLICY"];

/** Tên cột theo bảng tổng hợp chi trả bồi thường */
export const COMPENSATION_GROUP_LABELS: Record<CompensationGroup, string> = {
  LAND: "Bồi thường về Đất",
  SUPPORT: "Thành tiền hỗ trợ",
  CROPS: "Bồi thường Cây trồng",
  STRUCTURES: "Bồi thường Vật kiến trúc",
  POLICY: "Chính sách Hỗ trợ",
};

/** Thành tiền bồi thường của một dòng bảng kê (làm tròn đến đồng) */
export function itemAmount(item: CompensationItem): number {
  return Math.round(item.quantity * item.unitPrice * (item.factor ?? 1) * ((item.ratePercent ?? 100) / 100));
}

/** Thửa đất: tiền hỗ trợ chuyển đổi nghề và tìm kiếm việc làm = diện tích × đơn giá hỗ trợ */
export function itemSupportAmount(item: CompensationItem): number {
  if (item.group !== "LAND" || !item.supportPrice) return 0;
  // Đất ở không có hỗ trợ chuyển đổi nghề và tìm kiếm việc làm
  if (["ODT", "ONT"].includes(landCodeFromName(item.name))) return 0;
  return Math.round(item.quantity * item.supportPrice);
}

/** Tên loại đất ngắn từ tên đầy đủ trong bảng giá (vd "Đất ở đô thị-VT1…" → ODT) */
export function landCodeFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("đất ở đô thị") || n.includes("đất ở tại đô thị")) return "ODT";
  if (n.includes("đất ở")) return "ONT";
  if (n.includes("cây lâu năm")) return "CLN";
  if (n.includes("hằng năm") || n.includes("hàng năm")) return "HNK";
  if (n.includes("rừng sản xuất")) return "RSX";
  const code = name.match(/\(([A-Z]{2,4})\)/);
  return code ? code[1] : name.trim();
}

const emptyBreakdown = (): CompensationBreakdown => ({
  LAND: 0,
  SUPPORT: 0,
  CROPS: 0,
  STRUCTURES: 0,
  POLICY: 0,
  total: 0,
  itemized: false,
});

/** Tổng hợp tiền theo nhóm; hộ chưa có bảng kê thì chỉ có tổng tiền nhập tay */
export function summarizeCompensation(household: Pick<Household, "compensation" | "compensationItems">): CompensationBreakdown {
  const items = household.compensationItems ?? [];
  if (items.length === 0) return { ...emptyBreakdown(), total: household.compensation || 0 };
  const result = { ...emptyBreakdown(), itemized: true };
  for (const item of items) {
    const amount = itemAmount(item);
    const support = itemSupportAmount(item);
    result[item.group] += amount;
    result.SUPPORT += support;
    result.total += amount + support;
  }
  return result;
}

/** Cộng dồn nhiều hộ (dòng tổng cộng của bảng) */
export function sumCompensation(list: CompensationBreakdown[]): CompensationBreakdown {
  return list.reduce((acc, b) => {
    for (const g of COMPENSATION_GROUPS) acc[g] += b[g];
    acc.total += b.total;
    acc.itemized = acc.itemized || b.itemized;
    return acc;
  }, emptyBreakdown());
}
