/**
 * Đọc file Excel (.xlsx / .xlsm) ngay trên trình duyệt, không cần thư viện ngoài:
 * file Excel là gói ZIP chứa XML — giải nén bằng DecompressionStream, đọc XML bằng DOMParser.
 * Chỉ lấy giá trị ô (với ô công thức lấy giá trị đã tính lưu trong file). Không hỗ trợ .xls / .xlsb (định dạng nhị phân).
 */

export type CellValue = string | number | null;

export interface XlsxWorkbook {
  sheetNames: string[];
  /** Bảng giá trị của một sheet: hàng × cột (bắt đầu từ A1) */
  readSheet: (name: string) => Promise<CellValue[][]>;
  /** Giá trị kèm bố cục (độ rộng cột, ô gộp, ẩn, cố định, công thức, định dạng ngày / %) */
  readSheetFull: (name: string) => Promise<SheetData>;
}

interface ZipEntry {
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readZipDirectory(buf: ArrayBuffer): Map<string, ZipEntry> {
  const view = new DataView(buf);
  // Tìm "End of central directory" (chữ ký 0x06054b50) từ cuối file
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Không đọc được file: không phải file Excel (.xlsx/.xlsm).");
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(new Uint8Array(buf, offset + 46, nameLen));
    entries.set(name, { method, compressedSize, localHeaderOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function readZipText(buf: ArrayBuffer, entries: Map<string, ZipEntry>, path: string): Promise<string | null> {
  const entry = entries.get(path);
  if (!entry) return null;
  const view = new DataView(buf);
  const start =
    entry.localHeaderOffset + 30 + view.getUint16(entry.localHeaderOffset + 26, true) + view.getUint16(entry.localHeaderOffset + 28, true);
  const data = new Uint8Array(buf, start, entry.compressedSize);
  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method !== 8) throw new Error("File Excel dùng kiểu nén không hỗ trợ.");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

const parseXml = (text: string) => new DOMParser().parseFromString(text, "application/xml");
/** Phần tử theo tên cục bộ (bỏ qua namespace) */
const byTag = (root: Element | Document, tag: string) => Array.from(root.getElementsByTagNameNS("*", tag));

/** "AB12" → chỉ số cột 27 (bắt đầu từ 0) */
function columnIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export async function readXlsx(file: Blob): Promise<XlsxWorkbook> {
  const buf = await file.arrayBuffer();
  const entries = readZipDirectory(buf);

  const workbookXml = await readZipText(buf, entries, "xl/workbook.xml");
  const relsXml = await readZipText(buf, entries, "xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relsXml) throw new Error("Không đọc được file: thiếu cấu trúc workbook.");

  const targets = new Map(
    byTag(parseXml(relsXml), "Relationship").map((r) => [r.getAttribute("Id") ?? "", r.getAttribute("Target") ?? ""]),
  );
  const sheets = byTag(parseXml(workbookXml), "sheet").map((s) => {
    const rid = s.getAttribute("r:id") ?? s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? "";
    const target = targets.get(rid) ?? "";
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
    return { name: s.getAttribute("name") ?? "", path };
  });

  const sharedXml = await readZipText(buf, entries, "xl/sharedStrings.xml");
  const shared = sharedXml ? byTag(parseXml(sharedXml), "si").map(richText) : [];

  // Định dạng số của từng kiểu ô (để hiện ngày / phần trăm như Excel)
  const stylesXml = await readZipText(buf, entries, "xl/styles.xml");
  const xfKinds: (NumberKind | undefined)[] = [];
  if (stylesXml) {
    const doc = parseXml(stylesXml);
    const custom = new Map(byTag(doc, "numFmt").map((f) => [Number(f.getAttribute("numFmtId")), f.getAttribute("formatCode") ?? ""]));
    const cellXfs = byTag(doc, "cellXfs")[0];
    if (cellXfs) {
      for (const xf of Array.from(cellXfs.children).filter((e) => e.localName === "xf")) {
        const id = Number(xf.getAttribute("numFmtId") ?? 0);
        xfKinds.push(numberKind(id, custom.get(id)));
      }
    }
  }
  const date1904 = byTag(parseXml(workbookXml), "workbookPr")[0]?.getAttribute("date1904") === "1";

  const readSheetFull = async (name: string): Promise<SheetData> => {
    const sheet = sheets.find((s) => s.name === name);
    const xml = sheet ? await readZipText(buf, entries, sheet.path) : null;
    const layout = emptyLayout();
    if (!xml) return { rows: [], layout };
    const doc = parseXml(xml);

    // Độ rộng mặc định, độ rộng / ẩn từng cột (đơn vị ký tự → px như Excel)
    const formatPr = byTag(doc, "sheetFormatPr")[0];
    const defaultChars = Number(formatPr?.getAttribute("defaultColWidth") ?? "") || (Number(formatPr?.getAttribute("baseColWidth") ?? 8) + 0.71);
    layout.defaultColWidth = charsToPx(defaultChars);
    const defaultHt = Number(formatPr?.getAttribute("defaultRowHeight") ?? "");
    if (defaultHt) layout.defaultRowHeight = Math.round((defaultHt * 4) / 3);
    for (const col of byTag(doc, "col")) {
      const min = Number(col.getAttribute("min")) - 1;
      const max = Math.min(Number(col.getAttribute("max")) - 1, MAX_LAYOUT_COLS);
      const width = Number(col.getAttribute("width") ?? "");
      for (let c = min; c <= max; c++) {
        if (width) layout.colWidths[c] = charsToPx(width);
        if (col.getAttribute("hidden") === "1") layout.hiddenCols.add(c);
      }
    }

    // Cố định dòng / cột (Freeze Panes)
    const pane = byTag(doc, "pane")[0];
    if (pane && /^frozen/.test(pane.getAttribute("state") ?? "")) {
      layout.freezeRows = Number(pane.getAttribute("ySplit") ?? 0) || 0;
      layout.freezeCols = Number(pane.getAttribute("xSplit") ?? 0) || 0;
    }

    // Ô gộp
    for (const m of byTag(doc, "mergeCell")) {
      const [a, b] = (m.getAttribute("ref") ?? "").split(":");
      if (!a || !b) continue;
      const p = parseCellRef(a);
      const q = parseCellRef(b);
      layout.merges.push({ r1: p.r, c1: p.c, r2: q.r, c2: q.c });
    }

    const rows: CellValue[][] = [];
    for (const row of byTag(doc, "row")) {
      const r = Number(row.getAttribute("r") ?? rows.length + 1) - 1;
      if (row.getAttribute("hidden") === "1") layout.hiddenRows.add(r);
      const ht = Number(row.getAttribute("ht") ?? "");
      if (ht && row.getAttribute("customHeight") === "1") layout.rowHeights[r] = Math.round((ht * 4) / 3);
      const cells: CellValue[] = [];
      for (const c of byTag(row, "c")) {
        const col = columnIndex(c.getAttribute("r") ?? "A");
        const type = c.getAttribute("t");
        const v = byTag(c, "v")[0]?.textContent ?? null;
        const f = byTag(c, "f")[0]?.textContent;
        if (f) layout.formulas.set(`${r}:${col}`, `=${f}`);
        let value: CellValue = null;
        if (type === "s") value = v === null ? null : (shared[Number(v)] ?? null);
        else if (type === "inlineStr") value = richText(c);
        else if (type === "str" || type === "e") value = v;
        else if (type === "b") value = v === "1" ? "TRUE" : "FALSE";
        else value = v === null || v === "" ? null : Number(v);
        // Số mang định dạng ngày / giờ / phần trăm: lưu chuỗi hiển thị như Excel
        if (typeof value === "number") {
          const kind = xfKinds[Number(c.getAttribute("s") ?? 0)];
          if (kind) layout.texts.set(`${r}:${col}`, formatNumberKind(value, kind, date1904));
        }
        cells[col] = value;
      }
      rows[r] = Array.from(cells, (x) => x ?? null);
    }
    return { rows: Array.from(rows, (x) => x ?? []), layout };
  };

  return {
    sheetNames: sheets.map((s) => s.name),
    readSheet: async (name) => (await readSheetFull(name)).rows,
    readSheetFull,
  };
}

// ── Bố cục sheet: độ rộng cột, chiều cao dòng, ô gộp, ẩn, cố định, định dạng ──

/** Giới hạn số cột đọc bố cục (thẻ <col> có thể khai báo tới cột 16384) */
const MAX_LAYOUT_COLS = 300;

export interface SheetMerge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

export interface SheetLayout {
  /** Độ rộng cột (px) khai báo trong file; trống = dùng `defaultColWidth` */
  colWidths: (number | undefined)[];
  defaultColWidth: number;
  /** Chiều cao dòng (px) khai báo trong file */
  rowHeights: (number | undefined)[];
  defaultRowHeight: number;
  hiddenRows: Set<number>;
  hiddenCols: Set<number>;
  merges: SheetMerge[];
  /** Số dòng / cột cố định (Freeze Panes) */
  freezeRows: number;
  freezeCols: number;
  /** Công thức theo ô "dòng:cột" */
  formulas: Map<string, string>;
  /** Chuỗi hiển thị đã định dạng (ngày, giờ, phần trăm) theo ô "dòng:cột" */
  texts: Map<string, string>;
}

export interface SheetData {
  rows: CellValue[][];
  layout: SheetLayout;
}

export const emptyLayout = (): SheetLayout => ({
  colWidths: [],
  defaultColWidth: 64,
  rowHeights: [],
  defaultRowHeight: 20,
  hiddenRows: new Set(),
  hiddenCols: new Set(),
  merges: [],
  freezeRows: 0,
  freezeCols: 0,
  formulas: new Map(),
  texts: new Map(),
});

/** Độ rộng Excel (số ký tự) → px */
const charsToPx = (chars: number) => Math.round(chars * 7 + 5);

/** "B12" → { r: 11, c: 1 } */
function parseCellRef(ref: string): { r: number; c: number } {
  return { r: Number(ref.replace(/[^0-9]/g, "")) - 1, c: columnIndex(ref.replace(/\$/g, "")) };
}

/** Chữ trong <si> / <is>: bỏ phần phiên âm <rPh> */
function richText(el: Element): string {
  return byTag(el, "t")
    .filter((t) => t.parentElement?.localName !== "rPh")
    .map((t) => t.textContent ?? "")
    .join("");
}

type NumberKind = "date" | "datetime" | "time" | "percent";

/** Loại định dạng số theo mã numFmt (mã dựng sẵn của Excel hoặc chuỗi định dạng tự đặt) */
function numberKind(id: number, code?: string): NumberKind | undefined {
  if ((id >= 14 && id <= 17) || id === 22) return id === 22 ? "datetime" : "date";
  if ((id >= 18 && id <= 21) || (id >= 45 && id <= 47)) return "time";
  if (id === 9 || id === 10) return "percent";
  if (!code) return undefined;
  // Bỏ phần trong ngoặc kép / ngoặc vuông (chữ cố định, màu, mã vùng)
  // và ký tự đệm (_x), ký tự lấp đầy (*x), ký tự thoát (\x) – không phải mã ngày giờ
  const bare = code.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/[\\_*]./g, "");
  if (/%/.test(bare)) return "percent";
  const hasDate = /[dy]/i.test(bare);
  const hasTime = /[hs]/i.test(bare);
  if (hasDate && hasTime) return "datetime";
  if (hasDate) return "date";
  if (hasTime) return "time";
  return undefined;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatNumberKind(value: number, kind: NumberKind, date1904: boolean): string {
  if (kind === "percent") return `${Number((value * 100).toPrecision(12)).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
  // Số ngày kể từ 30/12/1899 (hệ 1900) hoặc 01/01/1904
  const ms = Math.round((value + (date1904 ? 1462 : 0) - 25569) * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(value);
  const date = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return kind === "date" ? date : kind === "time" ? time : `${date} ${time}`;
}

/** Đọc file .csv (dấu phẩy, có thể có BOM) thành bảng giá trị */
export async function readCsv(file: Blob): Promise<CellValue[][]> {
  const text = (await file.text()).replace(/^﻿/, "");
  const rows: CellValue[][] = [];
  let row: CellValue[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => (c === "" ? null : c)));
}
