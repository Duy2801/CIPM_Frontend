import { SYSTEM_ROLE_META } from "../constants/personnel-labels.ts";
import type { Staff } from "../types/personnel.types";

/** Chú thích chấm màu ở cột Tài khoản */
export const ACCOUNT_STATUS_LEGEND = [
  { key: "active", label: "Đang hoạt động", dotClass: "bg-emerald-500", ringClass: "ring-emerald-100" },
  {
    key: "noAccess",
    label: "Đang hoạt động nhưng tài khoản chưa có quyền (chưa có chức danh hoặc chức danh đang tắt)",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-100",
  },
  { key: "locked", label: "Đang khóa", dotClass: "bg-rose-500", ringClass: "ring-rose-100" },
] as const;

export type AccountStatusLegend = (typeof ACCOUNT_STATUS_LEGEND)[number];

/**
 * Danh sách chức danh hiển thị của cán bộ: tách từ chức danh ghép ("A · B"), đổi mã chức danh tùy chỉnh
 * sang tên thật. Rỗng = cán bộ chưa có chức danh.
 */
export function getStaffDisplayRoles(staff: Staff, rolesMap: Map<string, string>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const resolveText = (text: string): string => {
    let clean = text.trim();
    if (!clean) return "";

    // Nếu mã trùng khớp trong từ điển vai trò tùy chỉnh
    if (rolesMap.has(clean)) {
      return rolesMap.get(clean)!;
    }

    // Nếu chứa mã CUSTOM_\d+ thì thay thế bằng tên thật
    if (/CUSTOM_\d+/i.test(clean)) {
      clean = clean.replace(/CUSTOM_\d+/gi, (matched) => {
        return rolesMap.get(matched) || "Chức danh tùy chỉnh";
      });
    }

    // Nếu trùng mã hệ thống
    if (SYSTEM_ROLE_META[clean]) {
      return SYSTEM_ROLE_META[clean].label;
    }

    return clean;
  };

  const addRole = (roleStr: string) => {
    const resolved = resolveText(roleStr);
    if (!resolved) return;
    const key = resolved.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(resolved);
    }
  };

  // 1. Lấy danh sách các vai trò từ staff.title (ngăn cách bởi dấu ·, ;, hoặc xuống dòng)
  const rawTitle = (staff.title || "").trim();
  if (rawTitle) {
    rawTitle
      .split(/\s*·\s*|\s*;\s*|\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => addRole(p));
  }

  // 2. Nếu cán bộ được gán vai trò tùy chỉnh qua roleCode (dạng CUSTOM_...)
  if (staff.roleCode) {
    const rCode = staff.roleCode.trim();
    if (/CUSTOM_\d+/i.test(rCode)) {
      const customName = rolesMap.get(rCode) || "Chức danh tùy chỉnh";
      // Nếu hiện tại chỉ có chức danh mặc định "Thành viên", ưu tiên thay thế bằng tên vai trò mới
      if (result.length === 1 && result[0].toLowerCase() === "thành viên") {
        result[0] = customName;
        seen.clear();
        seen.add(customName.toLowerCase().trim());
      } else if (!seen.has(customName.toLowerCase().trim())) {
        addRole(customName);
      }
    }
  }

  return result;
}

/**
 * Trạng thái tài khoản để tô chấm màu: khóa / hoạt động / hoạt động nhưng chưa có quyền.
 * Chức danh đang tắt chỉ ảnh hưởng tài khoản (tạm không có quyền); cán bộ vẫn giữ chức danh.
 */
export function getAccountStatus(
  person: Staff,
  hasTitle: boolean,
  titleLocked: boolean
): { legend: AccountStatusLegend; tooltip: string } {
  const status = !person.accountActive ? "locked" : hasTitle && !titleLocked ? "active" : "noAccess";
  const legend = ACCOUNT_STATUS_LEGEND.find((item) => item.key === status)!;
  const tooltip =
    status === "locked"
      ? `${legend.label}${person.lockReason ? `: ${person.lockReason}` : ""}`
      : status === "noAccess"
      ? titleLocked
        ? `Chức danh "${person.title}" đang tắt — tài khoản tạm không có quyền`
        : "Chưa có chức danh — tài khoản chưa có quyền"
      : legend.label;
  return { legend, tooltip };
}
