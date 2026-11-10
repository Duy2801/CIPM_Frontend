/** Một tệp báo cáo Excel đã nhập vào hệ thống */
export interface ReportFile {
  id: string;
  name: string;
  /** Dung lượng (byte) */
  size: number;
  /** Số sheet; null = không đọc được (định dạng .xls / .xlsb hoặc tệp lỗi) */
  sheetCount: number | null;
  uploadedAt: number;
  uploadedBy: string;
  blob: Blob;
}
