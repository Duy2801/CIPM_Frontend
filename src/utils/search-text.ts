/**
 * Chuẩn hóa chuỗi để tìm kiếm tiếng Việt: không phân biệt hoa/thường, bỏ dấu, gộp khoảng trắng.
 * VD: "Giám  Đốc" → "giam doc"
 */
export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** true nếu `text` chứa `query` sau khi cùng chuẩn hóa (query rỗng luôn khớp) */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  const q = normalizeSearchText(query);
  return !q || normalizeSearchText(text).includes(q);
}
