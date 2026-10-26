/** Một chức danh tùy chỉnh đã lưu (các phiên bản cũ đặt tên trường khác nhau nên đều là tùy chọn) */
export interface StoredRoleItem {
  code?: string;
  id?: string;
  name?: string;
  title?: string;
  label?: string;
  shortName?: string;
  group?: string;
  isLeader?: boolean;
}

/** Các key từng dùng để lưu danh mục chức danh tùy chỉnh; đọc hết để không sót dữ liệu của phiên bản cũ */
const CUSTOM_ROLE_STORAGE_KEYS = [
  "cipm_custom_roles_matrix_v3",
  "cipm_custom_roles_matrix_v2",
  "cipm_custom_roles_matrix",
  "cipm_custom_roles",
  "cipm_roles",
];

/** Toàn bộ chức danh tùy chỉnh đã lưu, theo thứ tự key mới → cũ */
export function readStoredRoleItems(): StoredRoleItem[] {
  if (typeof window === "undefined") return [];
  const items: StoredRoleItem[] = [];
  for (const key of CUSTOM_ROLE_STORAGE_KEYS) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
      if (Array.isArray(parsed)) items.push(...parsed.filter(Boolean));
    } catch {
      // Bỏ qua key hỏng, đọc tiếp các key khác
    }
  }
  return items;
}

/** Tên hiển thị của một chức danh đã lưu */
export const getStoredRoleName = (item: StoredRoleItem) => item.name || item.title || item.label || item.shortName;
