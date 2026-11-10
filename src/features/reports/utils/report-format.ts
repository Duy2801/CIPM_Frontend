import { readXlsx } from "../../../utils/xlsx-reader.ts";
import { OTHER_REPORT_TYPE_ID } from "../services/report-types.ts";
import type { ReportFile } from "../types/report.types";

export const REPORT_ACCEPT = ".xlsx,.xlsm,.xls,.xlsb,.csv";
export const isReportFile = (name: string) => /\.(xlsx|xlsm|xls|xlsb|csv)$/i.test(name);

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

/** Tên hiển thị: tên đặt riêng, không có thì tên tệp bỏ đuôi */
export const reportTitle = (r: ReportFile) => r.title || r.name.replace(/\.[^.]+$/, "").replace(/\.(xlsx|xlsb|xls)$/i, "");

export const reportTypeOf = (r: ReportFile) => r.typeId || OTHER_REPORT_TYPE_ID;

/** Số sheet của tệp; null nếu không đọc được (xls / xlsb / tệp lỗi) */
export async function countSheets(file: Blob & { name?: string }): Promise<number | null> {
  if (file.name && /\.csv$/i.test(file.name)) return 1;
  try {
    return (await readXlsx(file)).sheetNames.length;
  } catch {
    return null;
  }
}
