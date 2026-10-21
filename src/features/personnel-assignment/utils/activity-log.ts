/**
 * activity-log.ts — Nhật ký thao tác cho hồ sơ cán bộ
 *
 * 1. Sổ nhật ký của phân hệ Nhân sự (lưu trình duyệt): mỗi lần thêm / sửa hồ sơ, khóa / mở tài khoản... ghi ngày giờ,
 *    người thực hiện, đối tượng và từng thay đổi "cũ → mới".
 * 2. "Việc người này đã làm": gom theo tên người thực hiện từ sổ nhật ký Nhân sự + lịch sử duyệt giải ngân (Tài chính)
 *    + lịch sử từng bước (Thủ tục XDCB).
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

const FINANCE_STORAGE_KEY = "cipm_finance_settlement_store_v1";
const PROCEDURE_STORAGE_KEY = "cipm_procedure_projects_data_v6";

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

// "10:57:00 20/10/2026" (toLocaleString vi-VN) hoặc "20/10/2026, 10:57:00" → ISO
function parseViDateTime(value: string): string | null {
  const date = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!date) return null;
  const time = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const d = new Date(
    Number(date[3]),
    Number(date[2]) - 1,
    Number(date[1]),
    time ? Number(time[1]) : 0,
    time ? Number(time[2]) : 0,
    time && time[3] ? Number(time[3]) : 0
  );
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// "2026-10-20 10:57" → ISO
function parseIsoLike(value: string): string | null {
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const sameName = (a?: string, b?: string) => Boolean(a && b) && a!.trim().toLowerCase() === b!.trim().toLowerCase();

interface FinanceStore {
  disbursements?: {
    id: string;
    code: string;
    content?: string;
    amount?: number;
    approvals?: { role?: string; actor: string; at: string; action: string; note?: string }[];
  }[];
}

interface ProcedureStore {
  projectId: string;
  projectCode?: string;
  projectName?: string;
  history?: {
    id: string;
    stepCode?: string;
    stepName?: string;
    timestamp: string;
    performedBy: string;
    role?: string;
    actionLabel: string;
    previousStatus?: string;
    newStatus?: string;
    details?: string;
    reason?: string;
  }[];
}

/** Việc một người đã thực hiện trên hệ thống (gom từ Nhân sự, Tài chính, Thủ tục XDCB), mới nhất lên đầu */
export function getActivitiesByActor(actorName: string): ActivityEntry[] {
  const result: ActivityEntry[] = getPersonnelActivities().filter((e) => sameName(e.actorName, actorName));

  // Tài chính: lịch sử duyệt hồ sơ giải ngân
  const finance = readJson<FinanceStore>(FINANCE_STORAGE_KEY, {});
  (finance.disbursements ?? []).forEach((d) =>
    (d.approvals ?? []).forEach((a, index) => {
      if (!sameName(a.actor, actorName)) return;
      result.push({
        id: `FIN-${d.id}-${index}`,
        at: parseViDateTime(a.at) ?? new Date(0).toISOString(),
        actorName: a.actor,
        actorRole: a.role,
        module: "Tài chính",
        action: `${a.action} hồ sơ giải ngân ${d.code}`,
        targetType: "disbursement",
        targetId: d.id,
        targetName: d.content,
        note: a.note,
      });
    })
  );

  // Thủ tục XDCB: lịch sử từng bước của dự án
  const procedures = readJson<ProcedureStore[]>(PROCEDURE_STORAGE_KEY, []);
  (Array.isArray(procedures) ? procedures : []).forEach((p) =>
    (p.history ?? []).forEach((h) => {
      if (!sameName(h.performedBy, actorName)) return;
      result.push({
        id: `PROC-${p.projectId}-${h.id}`,
        at: parseIsoLike(h.timestamp) ?? new Date(0).toISOString(),
        actorName: h.performedBy,
        actorRole: h.role,
        module: "Thủ tục XDCB",
        action: `${h.actionLabel}${h.stepCode ? ` [${h.stepCode}]` : ""}`,
        targetType: "procedure",
        targetId: p.projectId,
        targetName: [p.projectCode, h.stepName].filter(Boolean).join(" · "),
        changes:
          h.previousStatus || h.newStatus ? [{ label: "Trạng thái", from: h.previousStatus, to: h.newStatus }] : undefined,
        note: [h.details, h.reason].filter(Boolean).join(" — ") || undefined,
      });
    })
  );

  return result.sort((a, b) => b.at.localeCompare(a.at));
}

/** "20/10/2026 10:57" */
export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
