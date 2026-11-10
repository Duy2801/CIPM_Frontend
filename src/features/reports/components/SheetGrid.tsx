"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CloseOutlined, MinusOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { cn } from "@/utils/cn";
import type { CellValue, SheetData, SheetMerge } from "@/utils/xlsx-reader";
import { columnLetter } from "@/utils/xlsx-writer";

/**
 * Lưới xem bảng tính thao tác như Excel (chỉ xem):
 * chọn ô / vùng bằng chuột hoặc phím, thanh công thức, Ctrl+C dán sang Excel, Tổng / Trung bình vùng chọn,
 * Ctrl+F tìm, Ctrl + lăn chuột phóng to, kéo đổi độ rộng cột; giữ bố cục file: độ rộng cột, chiều cao dòng,
 * ô gộp, dòng / cột ẩn, cố định dòng / cột (Freeze Panes), định dạng ngày / phần trăm.
 */

/** Số dòng vẽ mỗi lần (sheet rất lớn bấm "Xem thêm") */
const ROW_STEP = 2000;
const MAX_COLS = 200;
const ROW_HEADER_WIDTH = 48;
const HEADER_HEIGHT = 22;
const MIN_COL_WIDTH = 24;
const ZOOMS = [50, 75, 90, 100, 110, 125, 150, 200];

type Pos = { r: number; c: number };
type Rect = { r1: number; c1: number; r2: number; c2: number };

const key = (r: number, c: number) => `${r}:${c}`;
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

/** Số: bỏ sai số dấu phẩy động, nhóm hàng nghìn kiểu Việt Nam */
function formatNumber(value: number): string {
  return Number(value.toPrecision(12)).toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

const fitWidth = (chars: number, max: number) => Math.min(max, Math.max(40, Math.ceil(chars * 7 + 14)));

interface CellInfo {
  value: CellValue;
  text: string;
  rowSpan?: number;
  colSpan?: number;
}

interface RowProps {
  r: number;
  height: number;
  cells: (CellInfo | null)[];
  visCols: number[];
  /** Cột đang chọn trong dòng này [c1, c2]; null = dòng ngoài vùng chọn */
  sel: [number, number] | null;
  activeCol: number | null;
  /** Dòng cố định: top (px) */
  stickyTop?: number;
  colLeft: (c: number) => number | undefined;
  widthOf: (c: number) => number;
  rowSelected: boolean;
  onCellDown: (r: number, c: number, e: ReactPointerEvent) => void;
  onCellEnter: (r: number, c: number, e: ReactPointerEvent) => void;
  onRowHeader: (r: number, e: ReactPointerEvent) => void;
}

/** Một dòng của lưới; chỉ vẽ lại khi vùng chọn đi qua dòng này */
const SheetRow = memo(function SheetRow({
  r,
  height,
  cells,
  visCols,
  sel,
  activeCol,
  stickyTop,
  colLeft,
  widthOf,
  rowSelected,
  onCellDown,
  onCellEnter,
  onRowHeader,
}: RowProps) {
  const frozenRow = stickyTop !== undefined;
  return (
    <tr style={{ height }}>
      <th
        scope="row"
        onPointerDown={(e) => onRowHeader(r, e)}
        style={{ top: stickyTop }}
        className={cn(
          "sticky left-0 cursor-e-resize select-none border-b border-r border-slate-200 px-1 text-center text-[11px] font-normal",
          frozenRow ? "z-30" : "z-20",
          rowSelected ? "bg-red-100 font-semibold text-[#B91C1C]" : "bg-slate-100 text-slate-500",
        )}
      >
        {r + 1}
      </th>
      {visCols.map((c, i) => {
        const cell = cells[i];
        if (!cell) return null; // ô bị ô gộp phủ
        const inSel = sel !== null && c >= sel[0] && c <= sel[1];
        const active = activeCol === c;
        const left = colLeft(c);
        const frozen = frozenRow || left !== undefined;
        const isNum = typeof cell.value === "number";
        // Chữ tràn sang các ô trống liền kề bên phải như Excel, dừng ở ô có dữ liệu
        let spill = 0;
        if (!isNum && !cell.colSpan && !cell.rowSpan && cell.text !== "") {
          for (let j = i + 1; j < cells.length; j++) {
            const next = cells[j];
            if (!next || next.text !== "" || next.colSpan || next.rowSpan) break;
            spill += widthOf(visCols[j]);
          }
        }
        const overflow = spill > 0;
        const style: CSSProperties = {};
        if (frozenRow) style.top = stickyTop;
        if (left !== undefined) style.left = left;
        return (
          <td
            key={c}
            rowSpan={cell.rowSpan}
            colSpan={cell.colSpan}
            data-cell={key(r, c)}
            onPointerDown={(e) => onCellDown(r, c, e)}
            onPointerEnter={(e) => onCellEnter(r, c, e)}
            style={style}
            className={cn(
              "whitespace-nowrap border-b border-r border-slate-200/70 px-1.5 align-bottom leading-tight",
              overflow ? "overflow-visible" : "overflow-hidden text-ellipsis",
              isNum && "text-right tabular-nums",
              (cell.rowSpan || cell.colSpan) && "align-middle",
              frozen && "sticky",
              frozenRow && left !== undefined ? "z-15" : frozen && "z-10",
              inSel ? "bg-red-50" : frozen && "bg-white",
              active && "outline-2 -outline-offset-2 outline-[#DC2626]",
            )}
          >
            {overflow ? (
              <div className="overflow-hidden text-ellipsis" style={{ width: widthOf(c) + spill - 12 }}>
                {cell.text}
              </div>
            ) : (
              cell.text
            )}
          </td>
        );
      })}
    </tr>
  );
});

export default function SheetGrid({ data, fallbackFit }: { data: SheetData; fallbackFit: boolean }) {
  const { rows, layout } = data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);

  const colCount = useMemo(() => {
    let n = Math.max(1, ...rows.map((r) => r.length));
    for (const m of layout.merges) n = Math.max(n, m.c2 + 1);
    return Math.min(MAX_COLS, n);
  }, [rows, layout.merges]);

  const textOf = useCallback(
    (r: number, c: number): string => {
      const v = rows[r]?.[c] ?? null;
      if (v === null) return "";
      if (typeof v === "number") return layout.texts.get(key(r, c)) ?? formatNumber(v);
      return v;
    },
    [rows, layout.texts],
  );

  // Độ rộng ban đầu: theo file; CSV (không có bố cục) thì đo theo nội dung
  const [widths, setWidths] = useState<number[]>(() =>
    Array.from({ length: colCount }, (_, c) => {
      if (layout.colWidths[c]) return layout.colWidths[c]!;
      if (!fallbackFit) return layout.defaultColWidth;
      let longest = 0;
      for (let r = 0; r < Math.min(rows.length, 300); r++) longest = Math.max(longest, textOf(r, c).length);
      return fitWidth(longest, 360);
    }),
  );
  const [limit, setLimit] = useState(ROW_STEP);
  const [zoom, setZoom] = useState(100);
  const [anchor, setAnchor] = useState<Pos>({ r: 0, c: 0 });
  const [focus, setFocus] = useState<Pos>({ r: 0, c: 0 });
  const [resizing, setResizing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchNote, setSearchNote] = useState("");
  const [copied, setCopied] = useState(false);

  const visCols = useMemo(
    () => Array.from({ length: colCount }, (_, c) => c).filter((c) => !layout.hiddenCols.has(c)),
    [colCount, layout.hiddenCols],
  );
  const rowEnd = Math.min(rows.length, limit);
  const visRows = useMemo(
    () => Array.from({ length: rowEnd }, (_, r) => r).filter((r) => !layout.hiddenRows.has(r)),
    [rowEnd, layout.hiddenRows],
  );
  const heightOf = useCallback(
    (r: number) => layout.rowHeights[r] ?? layout.defaultRowHeight,
    [layout.rowHeights, layout.defaultRowHeight],
  );

  // Ô gộp: ô bị phủ → vùng gộp chứa nó
  const mergeOf = useMemo(() => {
    const map = new Map<string, SheetMerge>();
    let budget = 200_000;
    for (const m of layout.merges) {
      for (let r = m.r1; r <= m.r2 && budget > 0; r++) {
        for (let c = m.c1; c <= m.c2 && budget > 0; c++, budget--) map.set(key(r, c), m);
      }
    }
    return map;
  }, [layout.merges]);

  // Nội dung từng dòng đã tính sẵn (ô gộp: rowSpan / colSpan theo số dòng / cột đang hiện)
  const rowCells = useMemo(() => {
    const visColSet = new Set(visCols);
    const visRowSet = new Set(visRows);
    const countIn = (from: number, to: number, set: Set<number>) => {
      let n = 0;
      for (let i = from; i <= to; i++) if (set.has(i)) n++;
      return n;
    };
    const result = new Map<number, (CellInfo | null)[]>();
    for (const r of visRows) {
      result.set(
        r,
        visCols.map((c) => {
          const m = mergeOf.get(key(r, c));
          if (m && (m.r1 !== r || m.c1 !== c)) {
            // Ô đầu vùng gộp bị ẩn: ô hiện đầu tiên của vùng đứng thay
            const firstR = visRows.find((x) => x >= m.r1 && x <= m.r2);
            const firstC = visCols.find((x) => x >= m.c1 && x <= m.c2);
            if (firstR !== r || firstC !== c) return null;
          }
          const value = rows[m ? m.r1 : r]?.[m ? m.c1 : c] ?? null;
          const info: CellInfo = { value, text: textOf(m ? m.r1 : r, m ? m.c1 : c) };
          if (m) {
            const rs = countIn(Math.max(m.r1, r), m.r2, visRowSet);
            const cs = countIn(Math.max(m.c1, c), m.c2, visColSet);
            if (rs > 1) info.rowSpan = rs;
            if (cs > 1) info.colSpan = cs;
          }
          return info;
        }),
      );
    }
    return result;
  }, [visRows, visCols, mergeOf, rows, textOf]);

  // Vị trí dính của dòng / cột cố định
  const stickyTops = useMemo(() => {
    const tops = new Map<number, number>();
    let y = HEADER_HEIGHT;
    for (const r of visRows) {
      if (r >= layout.freezeRows) break;
      tops.set(r, y);
      y += heightOf(r);
    }
    return tops;
  }, [visRows, layout.freezeRows, heightOf]);
  const stickyLefts = useMemo(() => {
    const lefts = new Map<number, number>();
    let x = ROW_HEADER_WIDTH;
    for (const c of visCols) {
      if (c >= layout.freezeCols) break;
      lefts.set(c, x);
      x += widths[c] ?? layout.defaultColWidth;
    }
    return lefts;
  }, [visCols, layout.freezeCols, widths, layout.defaultColWidth]);
  const colLeft = useCallback((c: number) => stickyLefts.get(c), [stickyLefts]);
  const widthOf = useCallback((c: number) => widths[c] ?? layout.defaultColWidth, [widths, layout.defaultColWidth]);

  // ── Vùng chọn (nới ra để phủ trọn ô gộp) ──
  const rect: Rect = useMemo(() => {
    const box = {
      r1: Math.min(anchor.r, focus.r),
      r2: Math.max(anchor.r, focus.r),
      c1: Math.min(anchor.c, focus.c),
      c2: Math.max(anchor.c, focus.c),
    };
    for (let pass = 0, grew = true; grew && pass < 5; pass++) {
      grew = false;
      for (const m of layout.merges) {
        if (m.r2 < box.r1 || m.r1 > box.r2 || m.c2 < box.c1 || m.c1 > box.c2) continue;
        if (m.r1 < box.r1 || m.r2 > box.r2 || m.c1 < box.c1 || m.c2 > box.c2) {
          box.r1 = Math.min(box.r1, m.r1);
          box.r2 = Math.max(box.r2, m.r2);
          box.c1 = Math.min(box.c1, m.c1);
          box.c2 = Math.max(box.c2, m.c2);
          grew = true;
        }
      }
    }
    return box;
  }, [anchor, focus, layout.merges]);

  const lastRow = Math.max(0, rows.length - 1);
  const lastCol = colCount - 1;
  const activeStart = mergeOf.get(key(focus.r, focus.c));
  const active: Pos = activeStart ? { r: activeStart.r1, c: activeStart.c1 } : focus;

  const select = useCallback((pos: Pos, extend: boolean) => {
    setFocus(pos);
    if (!extend) setAnchor(pos);
  }, []);

  // Đưa ô đang chọn vào tầm nhìn (sheet dài: vẽ thêm dòng nếu cần)
  useEffect(() => {
    if (focus.r >= limit) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-cell="${key(active.r, active.c)}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [focus, active.r, active.c, limit]);

  const ensureVisible = (r: number) => {
    if (r >= limit) setLimit(Math.ceil((r + 1) / ROW_STEP) * ROW_STEP);
  };

  // ── Chuột ──
  const onCellDown = useCallback(
    (r: number, c: number, e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      scrollRef.current?.focus({ preventScroll: true });
      dragging.current = true;
      select({ r, c }, e.shiftKey);
    },
    [select],
  );
  const onCellEnter = useCallback((r: number, c: number, e: ReactPointerEvent) => {
    if (dragging.current && e.buttons === 1) setFocus({ r, c });
  }, []);
  const onRowHeader = useCallback(
    (r: number, e: ReactPointerEvent) => {
      e.preventDefault();
      scrollRef.current?.focus({ preventScroll: true });
      if (e.shiftKey) setFocus({ r, c: lastCol });
      else {
        setAnchor({ r, c: 0 });
        setFocus({ r, c: lastCol });
      }
    },
    [lastCol],
  );
  const onColHeader = (c: number, e: ReactPointerEvent) => {
    e.preventDefault();
    scrollRef.current?.focus({ preventScroll: true });
    if (e.shiftKey) setFocus({ r: lastRow, c });
    else {
      setAnchor({ r: 0, c });
      setFocus({ r: lastRow, c });
    }
  };
  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  // Ctrl + lăn chuột: phóng to / thu nhỏ (cần listener không passive để chặn phóng cả trang)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => {
        const i = ZOOMS.indexOf(z);
        return ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + (e.deltaY < 0 ? 1 : -1)))];
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Bàn phím ──
  /** Bước sang ô kế bên, bỏ qua dòng / cột ẩn và vượt qua ô gộp */
  const step = (pos: Pos, dr: number, dc: number, jump: boolean): Pos => {
    if (jump) {
      return {
        r: dr ? (dr > 0 ? lastRow : 0) : pos.r,
        c: dc ? (dc > 0 ? lastCol : 0) : pos.c,
      };
    }
    const m = mergeOf.get(key(pos.r, pos.c));
    let r = dr > 0 && m ? m.r2 : dr < 0 && m ? m.r1 : pos.r;
    let c = dc > 0 && m ? m.c2 : dc < 0 && m ? m.c1 : pos.c;
    do r += dr;
    while (dr && r > 0 && r < lastRow && layout.hiddenRows.has(r));
    do c += dc;
    while (dc && c > 0 && c < lastCol && layout.hiddenCols.has(c));
    r = Math.max(0, Math.min(lastRow, r));
    c = Math.max(0, Math.min(lastCol, c));
    const target = mergeOf.get(key(r, c));
    return target ? { r: target.r1, c: target.c1 } : { r, c };
  };

  const copySelection = async () => {
    const lines: string[] = [];
    for (let r = rect.r1; r <= rect.r2; r++) {
      if (layout.hiddenRows.has(r)) continue;
      const cols: string[] = [];
      for (let c = rect.c1; c <= rect.c2; c++) {
        if (layout.hiddenCols.has(c)) continue;
        const v = rows[r]?.[c] ?? null;
        // Số chép dạng gốc để dán sang Excel vẫn là số; ngày / % chép như đang hiện
        const t = typeof v === "number" && !layout.texts.has(key(r, c)) ? String(v) : textOf(r, c);
        cols.push(/[\t\n"]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t);
      }
      lines.push(cols.join("\t"));
    }
    try {
      await navigator.clipboard.writeText(lines.join("\r\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn bộ nhớ tạm: bỏ qua
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      const next = step(focus, dr, dc, mod);
      ensureVisible(next.r);
      select(next, e.shiftKey);
    } else if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const back = e.shiftKey;
      const next = e.key === "Tab" ? step(active, 0, back ? -1 : 1, false) : step(active, back ? -1 : 1, 0, false);
      ensureVisible(next.r);
      select(next, false);
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      const r = Math.max(0, Math.min(lastRow, focus.r + (e.key === "PageDown" ? 25 : -25)));
      ensureVisible(r);
      select({ r, c: focus.c }, e.shiftKey);
    } else if (e.key === "Home") {
      e.preventDefault();
      select({ r: mod ? 0 : focus.r, c: 0 }, e.shiftKey);
    } else if (e.key === "End" && mod) {
      e.preventDefault();
      ensureVisible(lastRow);
      select({ r: lastRow, c: lastCol }, e.shiftKey);
    } else if (mod && e.key.toLowerCase() === "c") {
      e.preventDefault();
      void copySelection();
    } else if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setAnchor({ r: 0, c: 0 });
      setFocus({ r: lastRow, c: lastCol });
    } else if (mod && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setSearchOpen(true);
      setTimeout(() => searchRef.current?.select(), 0);
    }
  };

  // ── Tìm (Ctrl+F): ô kế tiếp sau ô đang chọn, theo thứ tự dòng ──
  const findNext = (backward = false) => {
    const q = fold(query.trim());
    if (!q) return;
    const total = rows.length * colCount;
    const start = active.r * colCount + active.c;
    for (let i = 1; i <= total; i++) {
      const idx = (start + (backward ? -i : i) + total * 2) % total;
      const r = Math.floor(idx / colCount);
      const c = idx % colCount;
      if (layout.hiddenRows.has(r) || layout.hiddenCols.has(c)) continue;
      const m = mergeOf.get(key(r, c));
      if (m && (m.r1 !== r || m.c1 !== c)) continue;
      if (fold(textOf(r, c)).includes(q)) {
        ensureVisible(r);
        select({ r, c }, false);
        setSearchNote(`Ô ${columnLetter(c)}${r + 1}`);
        return;
      }
    }
    setSearchNote("Không tìm thấy");
  };

  // ── Kéo đổi độ rộng cột; nhấp đúp vừa nội dung ──
  const startResize = (c: number, e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const start = widths[c] ?? layout.defaultColWidth;
    const scale = zoom / 100;
    const move = (ev: PointerEvent) =>
      setWidths((prev) => {
        const next = [...prev];
        next[c] = Math.max(MIN_COL_WIDTH, Math.round(start + (ev.clientX - startX) / scale));
        return next;
      });
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      setResizing(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    setResizing(true);
  };
  const autoFit = (c: number) => {
    let longest = 0;
    for (let r = 0; r < rows.length; r++) {
      const m = mergeOf.get(key(r, c));
      if (!m || m.c1 === m.c2) longest = Math.max(longest, textOf(r, c).length);
    }
    setWidths((prev) => {
      const next = [...prev];
      next[c] = fitWidth(longest, 800);
      return next;
    });
  };

  // ── Thanh trạng thái: Số ô / Tổng / Trung bình vùng chọn ──
  const stats = useMemo(() => {
    if (rect.r1 === rect.r2 && rect.c1 === rect.c2) return null;
    let count = 0;
    let numbers = 0;
    let sum = 0;
    let budget = 500_000;
    for (let r = rect.r1; r <= rect.r2 && budget > 0; r++) {
      if (layout.hiddenRows.has(r)) continue;
      for (let c = rect.c1; c <= rect.c2 && budget > 0; c++, budget--) {
        const v = rows[r]?.[c] ?? null;
        if (v === null || v === "") continue;
        count++;
        if (typeof v === "number" && !layout.texts.has(key(r, c))) {
          numbers++;
          sum += v;
        }
      }
    }
    return { count, numbers, sum };
  }, [rect, rows, layout.hiddenRows, layout.texts]);

  const refName =
    rect.r1 === rect.r2 && rect.c1 === rect.c2
      ? `${columnLetter(active.c)}${active.r + 1}`
      : `${columnLetter(rect.c1)}${rect.r1 + 1}:${columnLetter(rect.c2)}${rect.r2 + 1}`;
  const activeValue = rows[active.r]?.[active.c] ?? null;
  const formulaText =
    layout.formulas.get(key(active.r, active.c)) ??
    (activeValue === null ? "" : layout.texts.get(key(active.r, active.c)) ?? String(activeValue));

  const tableWidth = ROW_HEADER_WIDTH + visCols.reduce((sum, c) => sum + (widths[c] ?? layout.defaultColWidth), 0);
  const zoomBy = (dir: number) =>
    setZoom((z) => ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + dir))]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Thanh công thức: tên ô · nội dung đầy đủ / công thức */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 py-1">
        <span className="w-28 shrink-0 truncate rounded border border-slate-200 px-2 py-0.5 text-center text-xs font-semibold text-slate-700">
          {refName}
        </span>
        <span className="shrink-0 text-xs italic text-slate-400">fx</span>
        <input
          readOnly
          value={formulaText}
          title={formulaText}
          className="min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-800 outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setSearchOpen((o) => !o);
            setTimeout(() => searchRef.current?.select(), 0);
          }}
          title="Tìm (Ctrl+F)"
          aria-label="Tìm trong sheet"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
        >
          <SearchOutlined />
        </button>
      </div>

      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1">
          <SearchOutlined className="text-xs text-slate-400" />
          <input
            ref={searchRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchNote("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                findNext(e.shiftKey);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setSearchOpen(false);
                scrollRef.current?.focus();
              }
            }}
            placeholder="Tìm trong sheet..."
            className="w-72 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs outline-none focus:border-[#DC2626]"
          />
          <button
            type="button"
            onClick={() => findNext(false)}
            className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:border-[#DC2626] hover:text-[#DC2626]"
          >
            Tìm tiếp
          </button>
          {searchNote && <span className="text-xs text-slate-500">{searchNote}</span>}
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Đóng tìm kiếm"
            className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-400 hover:text-slate-700"
          >
            <CloseOutlined className="text-[10px]" />
          </button>
        </div>
      )}

      {/* Lưới ô */}
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-white outline-none"
      >
        {resizing && <div className="fixed inset-0 z-3000 cursor-col-resize select-none" />}
        <table
          className="table-fixed select-none border-separate border-spacing-0 text-xs text-slate-800"
          style={{ width: tableWidth, zoom: zoom / 100 }}
        >
          <colgroup>
            <col style={{ width: ROW_HEADER_WIDTH }} />
            {visCols.map((c) => (
              <col key={c} style={{ width: widths[c] ?? layout.defaultColWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ height: HEADER_HEIGHT }}>
              <th
                onPointerDown={(e) => {
                  e.preventDefault();
                  setAnchor({ r: 0, c: 0 });
                  setFocus({ r: lastRow, c: lastCol });
                }}
                title="Chọn tất cả (Ctrl+A)"
                className="sticky left-0 top-0 z-40 cursor-pointer border-b border-r border-slate-300 bg-slate-100"
              />
              {visCols.map((c) => {
                const on = c >= rect.c1 && c <= rect.c2;
                const left = stickyLefts.get(c);
                return (
                  <th
                    key={c}
                    onPointerDown={(e) => onColHeader(c, e)}
                    style={left !== undefined ? { left } : undefined}
                    className={cn(
                      "sticky top-0 cursor-s-resize border-b border-r border-slate-300 px-1 text-center text-[11px] font-normal",
                      left !== undefined ? "z-40" : "z-30",
                      on ? "bg-red-100 font-semibold text-[#B91C1C]" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {columnLetter(c)}
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Đổi độ rộng cột ${columnLetter(c)}`}
                      title="Kéo để đổi độ rộng · nhấp đúp để vừa nội dung"
                      onPointerDown={(e) => startResize(c, e)}
                      onDoubleClick={() => autoFit(c)}
                      className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize after:absolute after:bottom-0.5 after:left-1/2 after:top-0.5 after:w-0.5 after:-translate-x-1/2 after:rounded after:bg-transparent hover:after:bg-[#DC2626]"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visRows.map((r) => {
              const inRows = r >= rect.r1 && r <= rect.r2;
              return (
                <SheetRow
                  key={r}
                  r={r}
                  height={heightOf(r)}
                  cells={rowCells.get(r) ?? []}
                  visCols={visCols}
                  sel={inRows ? [rect.c1, rect.c2] : null}
                  activeCol={r === active.r ? active.c : null}
                  stickyTop={stickyTops.get(r)}
                  colLeft={colLeft}
                  widthOf={widthOf}
                  rowSelected={inRows}
                  onCellDown={onCellDown}
                  onCellEnter={onCellEnter}
                  onRowHeader={onRowHeader}
                />
              );
            })}
          </tbody>
        </table>
        {rows.length > limit && (
          <div className="sticky left-0 flex items-center gap-3 p-3 text-xs text-slate-500">
            Đang hiện {limit.toLocaleString("vi-VN")}/{rows.length.toLocaleString("vi-VN")} dòng
            <button
              type="button"
              onClick={() => setLimit((l) => l + ROW_STEP)}
              className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#DC2626] hover:text-[#DC2626]"
            >
              Xem thêm {ROW_STEP.toLocaleString("vi-VN")} dòng
            </button>
          </div>
        )}
        {rows.length === 0 && <div className="p-6 text-center text-sm text-slate-500">Sheet này không có dữ liệu.</div>}
      </div>

      {/* Thanh trạng thái: thống kê vùng chọn · phóng to */}
      <div className="flex shrink-0 items-center gap-4 border-t border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
        {copied && <span className="truncate">Đã chép vùng chọn</span>}
        {stats && (
          <span className="ml-auto flex shrink-0 gap-4 tabular-nums">
            {stats.numbers > 0 && (
              <>
                <span>
                  Trung bình: <strong>{formatNumber(stats.sum / stats.numbers)}</strong>
                </span>
                <span>
                  Tổng: <strong>{formatNumber(stats.sum)}</strong>
                </span>
              </>
            )}
            <span>
              Số ô: <strong>{stats.count.toLocaleString("vi-VN")}</strong>
            </span>
          </span>
        )}
        <span className={cn("flex shrink-0 items-center gap-1", !stats && "ml-auto")}>
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            aria-label="Thu nhỏ"
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-500 hover:bg-slate-200"
          >
            <MinusOutlined className="text-[10px]" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="Về 100%"
            className="w-10 cursor-pointer border-0 bg-transparent text-center text-[11px] text-slate-600 hover:text-[#DC2626]"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            aria-label="Phóng to"
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-slate-500 hover:bg-slate-200"
          >
            <PlusOutlined className="text-[10px]" />
          </button>
        </span>
      </div>
    </div>
  );
}
