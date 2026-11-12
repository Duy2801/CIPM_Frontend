"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";
import type { CellValue, SheetData } from "@/utils/xlsx-reader";
import {
  bodyCellStyle,
  buildMergeMap,
  cellKey,
  columnWidth,
  displayHeaderRows,
  formatCellNumber,
  shapeSheet,
  visibleColumns,
} from "../utils/sheet-table";

export default function SheetTable({ data }: { data: SheetData }) {
  const { layout } = data;
  const shape = useMemo(() => shapeSheet(data), [data]);
  const mergeOf = useMemo(() => buildMergeMap(layout.merges), [layout.merges]);
  const cols = useMemo(() => visibleColumns(shape, mergeOf), [shape, mergeOf]);
  const headerRows = useMemo(() => displayHeaderRows(shape), [shape]);
  const headerSet = useMemo(() => new Set(headerRows), [headerRows]);
  const bodySet = useMemo(() => new Set(shape.bodyRows), [shape.bodyRows]);
  const tableWidth = cols.reduce((sum, c) => sum + columnWidth(layout, c), 0);

  const textOf = (r: number, c: number): string => {
    const v = shape.rows[r]?.[c] ?? null;
    if (v === null) return "";
    if (typeof v === "number") return layout.texts.get(cellKey(r, c)) ?? formatCellNumber(v);
    return v;
  };

  const renderCells = (r: number, rowSet: Set<number>, header: boolean) => {
    const colSet = new Set(cols);
    return cols.map((c) => {
      const m = mergeOf.get(cellKey(r, c));
      let rowSpan: number | undefined;
      let colSpan: number | undefined;
      if (m) {
        const firstC = cols.find((x) => x >= m.c1 && x <= m.c2);
        if (c !== firstC) return null;
        const firstR = [...rowSet].find((x) => x >= m.r1 && x <= m.r2);
        if (r !== firstR) return null;
        let cs = 0;
        for (let x = m.c1; x <= m.c2; x++) if (colSet.has(x)) cs++;
        if (cs > 1) colSpan = cs;
        let rs = 0;
        for (let x = Math.max(m.r1, r); x <= m.r2; x++) if (rowSet.has(x)) rs++;
        if (rs > 1) rowSpan = rs;
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
          style={bodyCellStyle(layout.styles.get(cellKey(r0, c0)), isNum)}
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

  return (
    <div className="overflow-x-auto overscroll-x-contain p-4">
      <table className="table-fixed border-collapse" style={{ width: tableWidth, minWidth: "100%" }}>
        <colgroup>
          {cols.map((c) => (
            <col key={c} style={{ width: columnWidth(layout, c) }} />
          ))}
        </colgroup>
        <thead>
          {headerRows.map((r) => (
            <tr key={r}>{renderCells(r, headerSet, true)}</tr>
          ))}
        </thead>
        <tbody>
          {shape.bodyRows.map((r) => (
            <tr key={r} className="transition-colors hover:[&>td]:bg-red-50/40">
              {renderCells(r, bodySet, false)}
            </tr>
          ))}
          {shape.bodyRows.length === 0 && (
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
