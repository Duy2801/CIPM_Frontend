import { COMPENSATION_CATALOG, type CatalogEntry } from "../constants/gpmb-compensation-catalog.ts";
import type { CompensationGroup, CompensationItem } from "../types/gpmb.types";

/**
 * Bảng giá bồi thường, hỗ trợ của từng dự án (tương đương sheet BANG_GIA của phương án):
 * đơn giá đất theo vị trí của dự án, cây trồng, vật kiến trúc, mức hỗ trợ.
 * Bản mock lưu trong trình duyệt; dự án chưa có bảng giá riêng thì dùng bảng giá mẫu.
 * Đổi đơn giá chỉ áp dụng khi lập bảng kê mới — hộ đã lập giữ nguyên đơn giá lúc lập.
 */

/** Các nhóm có bảng giá ("Thành tiền hỗ trợ" CĐN & TKVL nằm trong bảng giá đất) */
export const PRICE_TABLE_GROUPS: CompensationGroup[] = ["LAND", "CROPS", "STRUCTURES", "POLICY"];

export type PriceTable = Record<CompensationGroup, CatalogEntry[]>;

/** v3: bảng giá trích giữ nguyên file Excel (bản cũ bỏ dòng trùng, đổi cách viết ĐVT, sót 1 dòng hỗ trợ) */
const TABLE_KEY = (projectId: string) => `cipm_gpmb_price_table_v3:${projectId}`;
/** Bản cũ: các khoản người dùng đã thêm (chung mọi dự án) — gộp vào bảng giá khi dự án lập bảng giá lần đầu */
const LEGACY_KEY = "cipm_gpmb_compensation_catalog_v1";

const normalize = (name: string) => name.trim().toLowerCase();

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function defaultTable(): PriceTable {
  const table = Object.fromEntries(
    Object.entries(COMPENSATION_CATALOG).map(([g, list]) => [g, list.map((e) => ({ ...e }))]),
  ) as PriceTable;
  const legacy = readJson<Partial<PriceTable>>(LEGACY_KEY) ?? {};
  for (const group of PRICE_TABLE_GROUPS) {
    for (const entry of legacy[group] ?? []) {
      const list = table[group].filter((e) => normalize(e.name) !== normalize(entry.name));
      table[group] = [...list, { name: entry.name, unit: entry.unit, price: entry.price, supportPrice: entry.supportPrice }];
    }
  }
  return table;
}

/** Bảng giá của dự án (chưa lập riêng thì lấy bảng giá mẫu) */
export function loadPriceTable(projectId?: string): PriceTable {
  const saved = projectId ? readJson<Partial<PriceTable>>(TABLE_KEY(projectId)) : null;
  const base = defaultTable();
  if (!saved) return base;
  return Object.fromEntries(
    (Object.keys(base) as CompensationGroup[]).map((g) => [g, Array.isArray(saved[g]) ? saved[g] : base[g]]),
  ) as PriceTable;
}

export function savePriceTable(projectId: string, table: PriceTable): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TABLE_KEY(projectId), JSON.stringify(table));
  } catch (e) {
    console.error("Failed to save price table", e);
  }
}

/** Danh mục của một nhóm trong bảng giá dự án */
export function loadCatalog(group: CompensationGroup, projectId?: string): CatalogEntry[] {
  return loadPriceTable(projectId)[group] ?? [];
}

/** Khoản mới nhập ở bảng kê của hộ: thêm vào bảng giá của dự án để lần sau chọn lại (khoản đã có giữ nguyên) */
export function rememberCatalogItems(items: CompensationItem[], projectId?: string): void {
  if (typeof window === "undefined" || !projectId) return;
  const table = loadPriceTable(projectId);
  let changed = false;
  for (const item of items) {
    const name = item.name.trim();
    if (!name || !PRICE_TABLE_GROUPS.includes(item.group)) continue;
    if (table[item.group].some((e) => normalize(e.name) === normalize(name))) continue;
    table[item.group] = [
      ...table[item.group],
      {
        name,
        unit: item.unit.trim() || (item.group === "LAND" ? "m²" : "khoản"),
        price: item.unitPrice,
        ...(item.group === "LAND" && item.supportPrice ? { supportPrice: item.supportPrice } : {}),
      },
    ];
    changed = true;
  }
  if (changed) savePriceTable(projectId, table);
}

// ── Đơn vị tính: danh sách mặc định + đơn vị người dùng đã thêm ──

const UNIT_STORAGE_KEY = "cipm_gpmb_compensation_units_v1";
const DEFAULT_UNITS = ["m²", "m", "m³", "cây", "bụi", "cái", "hộ", "khẩu", "tháng", "suất", "nền", "mộ", "khoản"];

function loadSavedUnits(): string[] {
  const parsed = readJson<unknown>(UNIT_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : [];
}

/** Đơn vị chọn được: mặc định + đơn vị trong bảng giá + đơn vị đã thêm */
export function loadUnits(projectId?: string): string[] {
  const fromTable = Object.values(loadPriceTable(projectId)).flatMap((list) => list.map((e) => e.unit));
  return [...new Set([...DEFAULT_UNITS, ...fromTable, ...loadSavedUnits()].filter(Boolean))];
}

/** Lưu đơn vị mới để lần sau chọn lại */
export function rememberUnit(unit: string): void {
  const name = unit.trim();
  if (typeof window === "undefined" || !name) return;
  try {
    window.localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify([...new Set([...loadSavedUnits(), name])]));
  } catch (e) {
    console.error("Failed to save compensation unit", e);
  }
}
