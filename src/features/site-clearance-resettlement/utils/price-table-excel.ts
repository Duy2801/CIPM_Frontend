import type { CatalogEntry } from "../constants/gpmb-compensation-catalog.ts";
import type { CompensationGroup } from "../types/gpmb.types";
import type { PriceTable } from "./compensation-catalog-store.ts";

/**
 * Nhập / xuất bảng giá theo bố cục sheet BANG_GIA của phương án:
 *   1) ĐƠN GIÁ ĐẤT          — Loại Đất | Đơn Giá Bồi Thường (đ/m2) | Đơn Giá Hỗ Trợ (đ/m2)
 *   2) ĐƠN GIÁ CÂY TRỒNG    — Loại Cây | ĐVT | Đơn Giá
 *   3) ĐƠN GIÁ VẬT KIẾN TRÚC — Hạng Mục | ĐVT | Đơn Giá
 *   4) ĐƠN GIÁ / MỨC HỖ TRỢ — Loại Hỗ Trợ | ĐVT | Đơn Giá
 * Mỗi bảng được nhận ra bằng dòng tiêu đề cột (không phụ thuộc vị trí dòng, thứ tự cột).
 */

export type Cell = string | number | null;

type ImportGroup = Exclude<CompensationGroup, "SUPPORT">;

interface SectionSpec {
  title: string;
  /** Tên cột đúng như file */
  headers: string[];
}

export const PRICE_SECTIONS: Record<ImportGroup, SectionSpec> = {
  LAND: {
    title: "1) ĐƠN GIÁ ĐẤT (theo loại đất)",
    headers: ["Loại Đất", "Đơn Giá Bồi Thường (đ/m2)", "Đơn Giá Hỗ Trợ (đ/m2)"],
  },
  CROPS: { title: "2) ĐƠN GIÁ CÂY TRỒNG (theo loại/kích cỡ cây)", headers: ["Loại Cây", "ĐVT", "Đơn Giá"] },
  STRUCTURES: {
    title: "3) ĐƠN GIÁ VẬT KIẾN TRÚC (nhà, hàng rào, hạng mục...)",
    headers: ["Hạng Mục", "ĐVT", "Đơn Giá"],
  },
  POLICY: {
    title: "4) ĐƠN GIÁ / MỨC HỖ TRỢ (mẫu tham khảo theo NĐ 88/2024 - bổ sung/sửa tên khoản hỗ trợ thực tế của dự án)",
    headers: ["Loại Hỗ Trợ", "ĐVT", "Đơn Giá"],
  },
};
export const IMPORT_GROUPS = Object.keys(PRICE_SECTIONS) as ImportGroup[];

const norm = (v: Cell) =>
  String(v ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Ô số: số trong Excel, hoặc chữ "3.843.000" / "3,843,000" */
function toPrice(v: Cell): number {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : 0;
  const digits = String(v ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

const isEmptyRow = (row: Cell[]) => row.every((c) => norm(c) === "");

/** Dòng tiêu đề cột của bảng nào (theo tên cột đầu tiên của bảng) — trả về nhóm và vị trí từng cột */
function matchHeader(row: Cell[]): { group: ImportGroup; cols: number[] } | null {
  for (const group of IMPORT_GROUPS) {
    const headers = PRICE_SECTIONS[group].headers.map((h) => norm(h));
    const cols = headers.map((h) => row.findIndex((c) => norm(c) === h));
    if (cols[0] >= 0 && cols.slice(1).every((i) => i >= 0)) return { group, cols };
  }
  return null;
}

export interface ParsedPriceTable {
  table: Partial<Record<ImportGroup, CatalogEntry[]>>;
  /** Các bảng tìm thấy trong file */
  found: ImportGroup[];
}

/** Đọc các bảng giá trong một sheet (hàng × cột) */
export function parsePriceTableRows(rows: Cell[][]): ParsedPriceTable {
  const table: ParsedPriceTable["table"] = {};
  let current: { group: ImportGroup; cols: number[] } | null = null;
  for (const raw of rows) {
    const row = raw ?? [];
    const header = matchHeader(row);
    if (header) {
      current = header;
      table[header.group] = table[header.group] ?? [];
      continue;
    }
    if (!current) continue;
    // Hết bảng: dòng trống hoặc dòng tiêu đề mục kế tiếp ("2) ĐƠN GIÁ …")
    if (isEmptyRow(row) || /^\d+\)/.test(norm(row.find((c) => norm(c) !== "") ?? ""))) {
      current = null;
      continue;
    }
    const [nameCol, c2, c3] = current.cols;
    const name = String(row[nameCol] ?? "").replace(/\s+/g, " ").trim();
    if (!name) continue;
    const entry: CatalogEntry =
      current.group === "LAND"
        ? { name, unit: "m²", price: toPrice(row[c2]), ...(toPrice(row[c3]) ? { supportPrice: toPrice(row[c3]) } : {}) }
        : { name, unit: String(row[c2] ?? "").trim(), price: toPrice(row[c3]) };
    table[current.group]!.push(entry);
  }
  return { table, found: IMPORT_GROUPS.filter((g) => table[g]?.length) };
}

export interface GroupDiff {
  added: number;
  updated: number;
  unchanged: number;
}

const sameEntry = (a: CatalogEntry, b: CatalogEntry) =>
  a.unit === b.unit && a.price === b.price && (a.supportPrice ?? 0) === (b.supportPrice ?? 0);

/** So bảng giá trong file với bảng giá hiện tại (theo tên) */
export function diffPriceTable(current: PriceTable, parsed: ParsedPriceTable): Record<ImportGroup, GroupDiff> {
  const result = {} as Record<ImportGroup, GroupDiff>;
  for (const group of IMPORT_GROUPS) {
    const byName = new Map(current[group].map((e) => [norm(e.name), e]));
    const diff: GroupDiff = { added: 0, updated: 0, unchanged: 0 };
    for (const entry of parsed.table[group] ?? []) {
      const existing = byName.get(norm(entry.name));
      if (!existing) diff.added += 1;
      else if (sameEntry(existing, entry)) diff.unchanged += 1;
      else diff.updated += 1;
    }
    result[group] = diff;
  }
  return result;
}

export type ImportMode = "merge" | "replace";

/**
 * Áp bảng giá từ file:
 * - merge: dòng trùng tên thì cập nhật ĐVT / đơn giá, dòng mới thêm vào cuối, dòng không có trong file giữ nguyên;
 * - replace: bảng nào có trong file thì thay toàn bộ bằng đúng các dòng trong file.
 */
export function applyPriceTableImport(current: PriceTable, parsed: ParsedPriceTable, mode: ImportMode): PriceTable {
  const next: PriceTable = { ...current };
  for (const group of parsed.found) {
    const incoming = parsed.table[group] ?? [];
    if (mode === "replace") {
      next[group] = incoming.map((e) => ({ ...e }));
      continue;
    }
    const list = current[group].map((e) => ({ ...e }));
    for (const entry of incoming) {
      const i = list.findIndex((e) => norm(e.name) === norm(entry.name));
      if (i >= 0) list[i] = { ...list[i], unit: entry.unit || list[i].unit, price: entry.price, supportPrice: entry.supportPrice };
      else list.push({ ...entry });
    }
    next[group] = list;
  }
  return next;
}

/** Bảng giá → các dòng theo bố cục sheet BANG_GIA (để xuất file, sửa rồi nhập lại) */
export function buildPriceTableRows(table: PriceTable): Cell[][] {
  const rows: Cell[][] = [];
  IMPORT_GROUPS.forEach((group, i) => {
    if (i > 0) rows.push([]);
    rows.push([PRICE_SECTIONS[group].title]);
    rows.push([...PRICE_SECTIONS[group].headers]);
    for (const e of table[group]) {
      rows.push(group === "LAND" ? [e.name, e.price || null, e.supportPrice || null] : [e.name, e.unit, e.price || null]);
    }
  });
  return rows;
}

/** Các dòng → nội dung CSV (có BOM để Excel đọc đúng tiếng Việt) */
export function toCsv(rows: Cell[][]): string {
  const esc = (v: Cell) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
