/** Loại báo cáo (nhóm các tệp báo cáo cùng mẫu) */
export interface ReportType {
  id: string;
  name: string;
  description?: string;
  /** Loại tự thêm (xóa được khi chưa có báo cáo) */
  custom?: boolean;
}

/** Một tệp báo cáo Excel đã nhập vào hệ thống */
export interface ReportFile {
  id: string;
  /** Loại báo cáo; dữ liệu cũ chưa có thì coi như "Báo cáo khác" */
  typeId?: string;
  /** Tên hiển thị; mặc định là tên tệp bỏ đuôi */
  title?: string;
  name: string;
  /** Dung lượng (byte) */
  size: number;
  /** Số sheet; null = không đọc được (định dạng .xls / .xlsb hoặc tệp lỗi) */
  sheetCount: number | null;
  uploadedAt: number;
  uploadedBy: string;
  blob: Blob;
}
