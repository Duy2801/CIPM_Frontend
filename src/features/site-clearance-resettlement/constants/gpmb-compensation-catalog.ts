import type { CompensationGroup } from "../types/gpmb.types";
import {
  CROP_PRICE_TABLE,
  LAND_PRICE_TABLE,
  STRUCTURE_PRICE_TABLE,
  SUPPORT_POLICY_TABLE,
} from "./gpmb-price-tables.ts";

/**
 * Danh mục đơn giá bồi thường, hỗ trợ dùng làm gợi ý khi lập bảng kê cho hộ dân.
 * Lấy theo bảng giá của phương án mẫu (xem `gpmb-price-tables.ts`); đơn giá vẫn sửa được trên từng dòng.
 */
export interface CatalogEntry {
  name: string;
  unit: string;
  price: number;
  /** Đất: đơn giá hỗ trợ chuyển đổi nghề và tìm kiếm việc làm (đ/m²) — chỉ đất nông nghiệp đủ điều kiện */
  supportPrice?: number;
}

/** Bảng kê nhập theo 4 nhóm; "Thành tiền hỗ trợ" (CĐN & TKVL) tính trên từng thửa đất */
export const COMPENSATION_CATALOG: Record<CompensationGroup, CatalogEntry[]> = {
  LAND: LAND_PRICE_TABLE,
  SUPPORT: [],
  CROPS: CROP_PRICE_TABLE,
  STRUCTURES: STRUCTURE_PRICE_TABLE,
  POLICY: SUPPORT_POLICY_TABLE,
};

/** Tìm đơn giá theo đúng tên trong bảng giá (dữ liệu mẫu) */
export function priceOf(group: CompensationGroup, name: string): CatalogEntry {
  const entry = COMPENSATION_CATALOG[group].find((e) => e.name === name);
  if (!entry) throw new Error(`Không có "${name}" trong bảng giá nhóm ${group}`);
  return entry;
}
