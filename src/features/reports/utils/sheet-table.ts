/**
 * Chuyển một sheet Excel thành cấu trúc bảng: tiêu đề báo cáo (các dòng tên ở trên),
 * dòng đầu mục cột (có thể nhiều tầng, ô gộp), và các dòng dữ liệu.
 * Hàm thuần — không phụ thuộc giao diện.
 */
import type { CellValue, SheetData, SheetMerge } from "../../../utils/xlsx-reader.ts";

export const cellKey = (r: number, c: number) => `${r}:${c}`;
const filled = (v: CellValue | undefined) => v !== null && v !== undefined && v !== "";

/** Bỏ các dòng trống ở cuối sheet */
export function trimRows(rows: CellValue[][]): CellValue[][] {
  let end = rows.length;
  while (end > 0 && !rows[end - 1].some(filled)) end--;
  return rows.slice(0, end);
}

/** Số cột tới cột cuối có dữ liệu (kể cả ô gộp có nội dung kéo dài sang phải) */
export function usedColCount(rows: CellValue[][], merges: SheetMerge[], max = 200): number {
  let n = 1;
  for (const row of rows) {
    for (let c = row.length - 1; c >= n; c--) {
      if (filled(row[c])) {
        n = c + 1;
        break;
      }
    }
  }
  for (const m of merges) if (filled(rows[m.r1]?.[m.c1])) n = Math.max(n, m.c2 + 1);
  return Math.min(max, n);
}

/** Ô bị gộp → vùng gộp chứa nó */
export function buildMergeMap(merges: SheetMerge[], budget = 200_000): Map<string, SheetMerge> {
  const map = new Map<string, SheetMerge>();
  for (const m of merges) {
    for (let r = m.r1; r <= m.r2 && budget > 0; r++) {
      for (let c = m.c1; c <= m.c2 && budget > 0; c++, budget--) map.set(cellKey(r, c), m);
    }
  }
  return map;
}

export interface SheetTableShape {
  rows: CellValue[][];
  /** Cột hiển thị (bỏ cột ẩn) */
  cols: number[];
  /** Dòng tên báo cáo phía trên bảng (đã ghép chữ) */
  titles: string[];
  /** Các dòng đầu mục cột [từ, đến] (gồm cả dòng đánh số cột 1, 2, 3… nếu có) */
  headerRows: number[];
  /** Các dòng dữ liệu (bỏ dòng ẩn, dòng trống) */
  bodyRows: number[];
}

/**
 * Nhận diện bố cục bảng:
 * - Dòng đầu mục = dòng đầu tiên có chữ ở ít nhất ~40% số cột (tính cả ô gộp), không phải một ô gộp dài duy nhất;
 *   kéo xuống theo các ô gộp dọc bắt đầu trong vùng đầu mục (đầu mục nhiều tầng).
 * - Dòng ngay sau toàn số nguyên (1, 2, 3…) = dòng đánh số cột → gộp vào đầu mục.
 * - Các dòng có chữ phía trên đầu mục = tên báo cáo.
 */
export function shapeSheet(data: SheetData): SheetTableShape {
  const { layout } = data;
  const rows = trimRows(data.rows);
  const colCount = usedColCount(rows, layout.merges);
  const cols = Array.from({ length: colCount }, (_, c) => c).filter((c) => !layout.hiddenCols.has(c));
  const mergeOf = buildMergeMap(layout.merges);
  const valueAt = (r: number, c: number) => {
    const m = mergeOf.get(cellKey(r, c));
    return m ? rows[m.r1]?.[m.c1] : rows[r]?.[c];
  };

  const isEmptyRow = (r: number) => cols.every((c) => !filled(rows[r]?.[c]));
  // Số cột có chữ của một dòng (ô thuộc vùng gộp có chữ cũng tính) và có phải một ô gộp phủ gần hết dòng
  const filledCount = (r: number) => cols.filter((c) => filled(valueAt(r, c))).length;
  const isBanner = (r: number) => {
    const distinct = new Set(cols.filter((c) => filled(valueAt(r, c))).map((c) => mergeOf.get(cellKey(r, c)) ?? c));
    return distinct.size <= 1;
  };

  // Ngưỡng theo dòng "rộng" nhất của sheet (sheet gồm nhiều bảng con hẹp vẫn nhận được đầu mục)
  // (bỏ qua dòng tên báo cáo gộp ngang hết bảng — dòng đó "rộng" nhưng không phải đầu mục)
  const widest = Math.max(0, ...rows.map((_, r) => (isBanner(r) ? 0 : filledCount(r))));
  const need = Math.max(2, Math.ceil(widest * 0.6));
  let start = rows.findIndex((_, r) => !layout.hiddenRows.has(r) && !isBanner(r) && filledCount(r) >= need);
  if (start < 0) start = rows.findIndex((_, r) => !isEmptyRow(r));
  if (start < 0) return { rows, cols, titles: [], headerRows: [], bodyRows: [] };

  let end = start;
  // Đầu mục nhóm (ô gộp ngang như "ĐẤT ĐAI" phủ nhiều cột) thì dòng kế tiếp là đầu mục con, nếu phần lớn là chữ
  const hasGroupHeader = layout.merges.some((m) => m.r1 === start && m.r2 === start && m.c2 > m.c1);
  if (hasGroupHeader) {
    const values = cols.map((c) => rows[start + 1]?.[c]).filter(filled);
    if (values.length >= 2 && values.filter((v) => typeof v === "string").length / values.length >= 0.7) end = start + 1;
  }
  // Đầu mục nhiều tầng: kéo tới đáy các ô gộp dọc bắt đầu trong vùng đầu mục
  for (let grew = true; grew; ) {
    grew = false;
    for (const m of layout.merges) {
      if (m.r1 >= start && m.r1 <= end && m.r2 > end) {
        end = m.r2;
        grew = true;
      }
    }
  }
  // Dòng đánh số cột (1, 2, 3…)
  const next = end + 1;
  const nums = cols.map((c) => rows[next]?.[c]).filter(filled);
  if (nums.length >= 2 && nums.every((v) => typeof v === "number" && Number.isInteger(v))) end = next;

  const titles: string[] = [];
  for (let r = 0; r < start; r++) {
    if (layout.hiddenRows.has(r) || isEmptyRow(r)) continue;
    const text = cols
      .map((c) => rows[r]?.[c])
      .filter(filled)
      .map(String)
      .join("  ");
    if (text.trim()) titles.push(text.trim());
  }

  const headerRows: number[] = [];
  for (let r = start; r <= end; r++) if (!layout.hiddenRows.has(r)) headerRows.push(r);
  const bodyRows: number[] = [];
  for (let r = end + 1; r < rows.length; r++) if (!layout.hiddenRows.has(r) && !isEmptyRow(r)) bodyRows.push(r);

  return { rows, cols, titles, headerRows, bodyRows };
}
