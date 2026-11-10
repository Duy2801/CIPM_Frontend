"use client";

import { useMemo, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import type { CellStyle, CellValue, SheetData } from "@/utils/xlsx-reader";
import { buildMergeMap, cellKey, shapeSheet } from "../utils/sheet-table";

const formatNumber = (v: number) => Number(v.toPrecision(12)).toLocaleString("vi-VN", { maximumFractionDigits: 4 });

/** Độ rộng cột tối thiểu / tối đa khi lấy theo file (px) */
const MIN_COL = 56;
const MAX_COL = 360;

/** Kiểu chữ / nền / căn lề của file áp vào ô dữ liệu (viền và cỡ chữ theo bảng của hệ thống cho đồng bộ) */
function bodyStyle(fmt: CellStyle | undefined, isNum: boolean): CSSProperties {
  const style: CSSProperties = {
    textAlign: fmt?.h ?? (isNum ? "right" : "left"),
    verticalAlign: fmt?.v ?? "middle",
  };
  if (!fmt) return style;
  if (fmt.indent) style.paddingLeft = 12 + fmt.indent * 9;
  if (fmt.bold) style.fontWeight = 600;
  if (fmt.italic) style.fontStyle = "italic";
  if (fmt.underline) style.textDecoration = "underline";
  if (fmt.color) style.color = fmt.color;
  if (fmt.bg) style.backgroundColor = fmt.bg;
  return style;
}

/**
 * Sheet hiển thị dạng bảng: đầu mục cột lấy từ file (nhiều tầng, ô gộp), dòng dữ liệu bên dưới.
 * Không hiện tên báo cáo / dòng đánh số cột của file cho bảng gọn.
 */
export default function SheetTable({ data }: { data: SheetData }) {
  const { layout } = data;
  const shape = useMemo(() => shapeSheet(data), [data]);
  const mergeOf = useMemo(() => buildMergeMap(layout.merges), [layout.merges]);

  // Bỏ cột số thứ tự (STT / TT) của file: đầu mục cột đó chỉ là "STT", "TT", "Số TT"…
  const cols = useMemo(() => {
    const isOrder = (c: number) =>
      shape.headerRows.some((r) => {
        const m = mergeOf.get(cellKey(r, c));
        if (m && m.c1 !== m.c2) return false; // ô gộp ngang nhiều cột = đầu mục nhóm, không phải cột STT
        const v = m ? shape.rows[m.r1]?.[m.c1] : shape.rows[r]?.[c];
        return typeof v === "string" && /^(stt|tt|số tt|số thứ tự)\.?$/i.test(v.trim());
      });
    return shape.cols.filter((c) => !isOrder(c));
  }, [shape, mergeOf]);

  const textOf = (r: number, c: number): string => {
    const v = shape.rows[r]?.[c] ?? null;
    if (v === null) return "";
    if (typeof v === "number") return layout.texts.get(cellKey(r, c)) ?? formatNumber(v);
    return v;
  };

  const widthOf = (c: number) => Math.min(MAX_COL, Math.max(MIN_COL, layout.colWidths[c] ?? layout.defaultColWidth));
  const tableWidth = cols.reduce((sum, c) => sum + widthOf(c), 0);

  const bodyRows = shape.bodyRows;

  /** Các ô của một dòng (bỏ ô bị gộp phủ); `rowSet` = các dòng đang hiện, để tính rowSpan */
  const renderCells = (r: number, rowSet: Set<number>, header: boolean) => {
    const colSet = new Set(cols);
    return cols.map((c) => {
      const m = mergeOf.get(cellKey(r, c));
      let rowSpan: number | undefined;
      let colSpan: number | undefined;
      if (m) {
        // Chỉ vẽ ở ô hiện đầu tiên của vùng gộp (ô đầu bị ẩn / bị bỏ thì ô kế tiếp đứng thay)
        const firstC = cols.find((x) => x >= m.c1 && x <= m.c2);
        if (c !== firstC) return null;
        if (rowSet) {
          const firstR = [...rowSet].find((x) => x >= m.r1 && x <= m.r2);
          if (r !== firstR) return null;
        }
        let cs = 0;
        for (let x = m.c1; x <= m.c2; x++) if (colSet.has(x)) cs++;
        if (cs > 1) colSpan = cs;
        if (rowSet) {
          let rs = 0;
          for (let x = Math.max(m.r1, r); x <= m.r2; x++) if (rowSet.has(x)) rs++;
          if (rs > 1) rowSpan = rs;
        }
      }
      const r0 = m ? m.r1 : r;
      const c0 = m ? m.c1 : c;
      const value: CellValue = shape.rows[r0]?.[c0] ?? null;
      const text = textOf(r0, c0);
      if (header) {
        return (
          <th
            key={c}
            rowSpan={rowSpan}
            colSpan={colSpan}
            className="border border-slate-200 bg-slate-50 px-3 py-2 text-center align-middle text-xs font-semibold leading-snug text-slate-700"
          >
            {text}
          </th>
        );
      }
      const isNum = typeof value === "number";
      return (
        <td
          key={c}
          rowSpan={rowSpan}
          colSpan={colSpan}
          style={bodyStyle(layout.styles.get(cellKey(r0, c0)), isNum)}
          className={cn(
            "border border-slate-200 px-3 py-2 text-[13px] leading-snug text-slate-800",
            isNum ? "whitespace-nowrap tabular-nums" : "whitespace-pre-wrap wrap-anywhere",
          )}
        >
          {text}
        </td>
      );
    });
  };

  // Bỏ dòng đánh số cột (1, 2, 3…) của file: chỉ giữ đầu mục chữ
  const headerRows = useMemo(() => {
    const last = shape.headerRows[shape.headerRows.length - 1];
    const isNumbering =
      shape.headerRows.length > 1 &&
      shape.cols.every((c) => {
        const v = shape.rows[last]?.[c];
        return v === null || v === undefined || v === "" || typeof v === "number";
      });
    return isNumbering ? shape.headerRows.slice(0, -1) : shape.headerRows;
  }, [shape]);
  const headerSet = useMemo(() => new Set(headerRows), [headerRows]);
  const bodySet = useMemo(() => new Set(bodyRows), [bodyRows]);

  return (
    // overscroll-x-contain: vuốt ngang tới mép bảng không kích hoạt "quay lại trang trước" của trình duyệt
    <div className="overflow-x-auto overscroll-x-contain p-4">
        <table className="table-fixed border-collapse" style={{ width: tableWidth, minWidth: "100%" }}>
          <colgroup>
            {cols.map((c) => (
              <col key={c} style={{ width: widthOf(c) }} />
            ))}
          </colgroup>
          <thead>
            {headerRows.map((r) => (
              <tr key={r}>{renderCells(r, headerSet, true)}</tr>
            ))}
          </thead>
          <tbody>
            {bodyRows.map((r) => (
              <tr key={r} className="transition-colors hover:[&>td]:bg-red-50/40">
                {renderCells(r, bodySet, false)}
              </tr>
            ))}
            {bodyRows.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="py-10 text-center text-sm text-slate-500">
                  Sheet này không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </div>
  );
}
