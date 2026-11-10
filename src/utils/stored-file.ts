/**
 * Giữ nội dung tệp đính kèm để xem lại (bản mock: không có máy chủ lưu tệp).
 * Tệp nhỏ đọc thành data URL để lưu cùng dữ liệu; tệp lớn chỉ xem được trong phiên hiện tại.
 */

/** Tệp lớn chỉ xem được trong phiên làm việc hiện tại (đường dẫn tạm của trình duyệt) */
const sessionFileUrls = new Map<string, string>();
/** Tệp ≤ 1,5MB được lưu kèm nội dung; lớn hơn thì chỉ giữ đường dẫn tạm */
const MAX_STORED_FILE_BYTES = 1.5 * 1024 * 1024;

/** Đường dẫn xem tệp (undefined = tệp demo / không còn nội dung) */
export function storedFileUrl(file: { id: string; dataUrl?: string }): string | undefined {
  return file.dataUrl ?? sessionFileUrls.get(file.id);
}

/** Đọc nội dung tệp vừa chọn: trả data URL nếu đủ nhỏ để lưu, ngược lại chỉ giữ đường dẫn tạm trong phiên */
export async function readFileForStorage(id: string, raw?: File): Promise<string | undefined> {
  if (!raw) return undefined;
  if (raw.size > MAX_STORED_FILE_BYTES) {
    sessionFileUrls.set(id, URL.createObjectURL(raw));
    return undefined;
  }
  return new Promise<string | undefined>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(raw);
  });
}
