/**
 * Ghi file Excel (.xlsx) ngay trên trình duyệt, không cần thư viện ngoài:
 * dựng các tệp XML tối thiểu của SpreadsheetML rồi đóng gói ZIP (không nén – Excel vẫn mở bình thường).
 * Chỉ ghi giá trị ô (chuỗi / số), có độ rộng cột; không ghi định dạng, công thức.
 */

import type { CellValue } from "./xlsx-reader.ts";

export interface XlsxSheetInput {
  name: string;
  rows: CellValue[][];
  /** Độ rộng cột theo số ký tự (tùy chọn) */
  widths?: number[];
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Ngày giờ kiểu DOS cố định (01/01/2020) – Excel không dùng tới nhưng cần hợp lệ */
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

/** Đóng gói ZIP kiểu "stored" (không nén) */
function zipStored(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // tên tệp UTF-8
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    entry.set(name, 46);

    parts.push(local, file.data);
    central.push(entry);
    offset += local.length + size;
  }
  const centralSize = central.reduce((sum, e) => sum + e.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end] as BlobPart[], { type: XLSX_MIME });
}

const escapeXml = (s: string) =>
  s
    // Bỏ ký tự điều khiển XML không cho phép
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Chỉ số cột (từ 0) → chữ cột Excel: 0 → A, 27 → AB */
export function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Tên sheet hợp lệ: tối đa 31 ký tự, không có []:*?/\ và không trùng nhau */
function sheetNames(inputs: XlsxSheetInput[]): string[] {
  const used = new Set<string>();
  return inputs.map((s, i) => {
    const base = (s.name.replace(/[[\]:*?/\\]/g, " ").trim() || `Sheet${i + 1}`).slice(0, 31);
    let name = base;
    for (let n = 2; used.has(name.toLowerCase()); n++) name = `${base.slice(0, 28)} (${n})`;
    used.add(name.toLowerCase());
    return name;
  });
}

function sheetXml(sheet: XlsxSheetInput): string {
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          if (value === null || value === undefined || value === "") return "";
          const ref = `${columnLetter(c)}${r + 1}`;
          if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

/** Dựng file .xlsx từ một hoặc nhiều sheet */
export function writeXlsx(sheets: XlsxSheetInput[]): Blob {
  const encoder = new TextEncoder();
  const names = sheetNames(sheets);
  const xml = (s: string) => encoder.encode(s);
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  return zipStored([
    {
      name: "[Content_Types].xml",
      data: xml(
        `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          sheets
            .map(
              (_, i) =>
                `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
            )
            .join("") +
          "</Types>",
      ),
    },
    {
      name: "_rels/.rels",
      data: xml(
        `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: xml(
        `${head}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${rel}"><sheets>` +
          names.map((n, i) => `<sheet name="${escapeXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
          "</sheets></workbook>",
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: xml(
        `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          sheets
            .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${rel}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
            .join("") +
          "</Relationships>",
      ),
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: xml(sheetXml(s)) })),
  ]);
}

/** Tải một Blob về máy với tên tệp cho trước */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
