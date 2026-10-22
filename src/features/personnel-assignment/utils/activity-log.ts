/**
 * activity-log.ts — Nhật ký thao tác cho hồ sơ cán bộ
 *
 * 1. Sổ nhật ký của phân hệ Nhân sự (lưu trình duyệt): mỗi lần thêm / sửa hồ sơ, khóa / mở tài khoản... ghi ngày giờ,
 *    người thực hiện, đối tượng và từng thay đổi "cũ → mới".
 * 2. Mỗi màn hình chỉ xem lịch sử của chính nó: hồ sơ cán bộ lọc theo hồ sơ, Phân quyền / Thư viện pháp lý lọc theo phân hệ.
 */

export interface ActivityChange {
  label: string;
  from?: string;
  to?: string;
}

export interface ActivityEntry {
  id: string;
  /** Thời điểm (ISO) */
  at: string;
  actorName: string;
  actorRole?: string;
  /** Phân hệ: Nhân sự, Tài chính, Thủ tục XDCB... */
  module: string;
  /** Mô tả ngắn thao tác, VD: "Cập nhật hồ sơ cán bộ" */
  action: string;
  targetType?: "staff" | "team" | "role" | "disbursement" | "procedure";
  targetId?: string;
  targetName?: string;
  changes?: ActivityChange[];
  note?: string;
}

export const ACTIVITY_LOG_STORAGE_KEY = "cipm_personnel_activity_log_v1";
export const ACTIVITY_LOG_EVENT = "cipm-activity-log-updated";
/** Giữ tối đa số dòng nhật ký gần nhất */
const MAX_ENTRIES = 1000;


function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getPersonnelActivities(): ActivityEntry[] {
  const list = readJson<ActivityEntry[]>(ACTIVITY_LOG_STORAGE_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Ghi một dòng nhật ký (dòng mới nhất lên đầu) */
export function appendActivity(entry: Omit<ActivityEntry, "id" | "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const next: ActivityEntry = {
    ...entry,
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
  };
  try {
    const list = [next, ...getPersonnelActivities()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(ACTIVITY_LOG_EVENT));
  } catch (err) {
    console.error("Lỗi khi ghi nhật ký thao tác:", err);
  }
}

/** Phân hệ của các thay đổi chức danh / quyền ở màn Quản lý chức danh */
export const PERMISSION_LOG_MODULE = "Phân quyền";

/** Lịch sử thay đổi quyền (tạo / cập nhật / bật / tắt chức danh) — ai mở màn Quản lý chức danh cũng xem được */
export function getPermissionChangeHistory(): ActivityEntry[] {
  return getPersonnelActivities().filter((e) => e.module === PERMISSION_LOG_MODULE);
}

/** Thay đổi trên hồ sơ của một cán bộ */
export function getStaffProfileHistory(staffId: string): ActivityEntry[] {
  return getPersonnelActivities().filter((e) => e.targetType === "staff" && e.targetId === staffId);
}

/** "20/10/2026 10:57" */
export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
