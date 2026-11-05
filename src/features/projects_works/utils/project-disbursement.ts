/**
 * Giải ngân theo danh mục chi phí của từng dự án (bản mock: lưu trong trình duyệt).
 * Hàm thuần (tổng hợp, kiểm tra) tách riêng để test được bằng `node --test`.
 */

/** Danh mục chi phí theo cơ cấu tổng mức đầu tư (NĐ 10/2021/NĐ-CP) — dùng khi chưa có danh mục backend */
export const DEFAULT_DISBURSEMENT_CATEGORIES = [
  "Chi phí bồi thường, hỗ trợ, tái định cư",
  "Chi phí xây dựng",
  "Chi phí thiết bị",
  "Chi phí quản lý dự án",
  "Chi phí tư vấn đầu tư xây dựng",
  "Chi phí khác",
  "Chi phí dự phòng",
] as const;

/** Tệp chứng từ đính kèm một đợt (bản mock chỉ giữ thông tin tệp) */
export interface DisbursementAttachment {
  id: string;
  name: string;
  size: string;
  type: string;  /** Nội dung tệp nhỏ (data URL) để xem lại sau khi tải lại trang */
  dataUrl?: string;
}

/** Tệp lớn chỉ xem được trong phiên làm việc hiện tại (đường dẫn tạm của trình duyệt) */
const sessionFileUrls = new Map<string, string>();
/** Tệp ≤ 1,5MB được lưu kèm nội dung; lớn hơn thì chỉ giữ đường dẫn tạm */
const MAX_STORED_FILE_BYTES = 1.5 * 1024 * 1024;

/** Đường dẫn xem tệp (undefined = tệp demo / không còn nội dung) */
export function attachmentUrl(file: DisbursementAttachment): string | undefined {
  return file.dataUrl ?? sessionFileUrls.get(file.id);
}

/** Chuyển tệp vừa tải lên thành chứng từ lưu được (đọc nội dung tệp nhỏ) */
export async function toDisbursementAttachment(file: {
  id: string;
  name: string;
  size: string;
  type: string;
  rawFile?: File;
}): Promise<DisbursementAttachment> {
  const base = { id: file.id, name: file.name, size: file.size, type: file.type };
  const raw = file.rawFile;
  if (!raw) return base;
  if (raw.size > MAX_STORED_FILE_BYTES) {
    sessionFileUrls.set(file.id, URL.createObjectURL(raw));
    return base;
  }
  const dataUrl = await new Promise<string | undefined>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(raw);
  });
  return dataUrl ? { ...base, dataUrl } : base;
}

/** Loại đợt: giải ngân (cộng) hoặc thu hồi (trừ vào số đã giải ngân của danh mục) */
export type DisbursementKind = "disburse" | "withdraw";

export interface DisbursementEntry {
  id: string;
  /** Không có = giải ngân (dữ liệu cũ) */
  kind?: DisbursementKind;
  /** Tên danh mục chi phí */
  category: string;
  /** Số tiền (VNĐ) */
  amount: number;
  /** Ngày giải ngân YYYY-MM-DD */
  date: string;
  /** Nội dung thanh toán */
  content?: string;
  /** Chứng từ giải ngân (bắt buộc ≥ 1 tệp) */
  attachments?: DisbursementAttachment[];
  createdBy: string;
  createdAt: string;
}

/** Số tiền có dấu: thu hồi là số âm */
export const signedAmount = (e: Pick<DisbursementEntry, "amount" | "kind">) =>
  e.kind === "withdraw" ? -e.amount : e.amount;

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  lastDate?: string;
}

export interface DisbursementSummary {
  total: number;
  count: number;
  byCategory: CategorySummary[];
}

/** Tổng hợp theo danh mục; danh mục có trong danh sách luôn hiện (kể cả chưa giải ngân), danh mục lạ xếp cuối */
export function summarizeDisbursements(entries: DisbursementEntry[], categories: readonly string[]): DisbursementSummary {
  const map = new Map<string, CategorySummary>(categories.map((c) => [c, { category: c, total: 0, count: 0 }]));
  for (const e of entries) {
    const row = map.get(e.category) ?? { category: e.category, total: 0, count: 0 };
    row.total += signedAmount(e);
    row.count += 1;
    if (!row.lastDate || e.date > row.lastDate) row.lastDate = e.date;
    map.set(e.category, row);
  }
  return {
    total: entries.reduce((sum, e) => sum + signedAmount(e), 0),
    count: entries.length,
    byCategory: [...map.values()],
  };
}

/**
 * Kiểm tra một đợt mới; trả về thông báo lỗi hoặc undefined.
 * `limit`: giải ngân = phần còn lại của TMĐT (undefined = dự án chưa có TMĐT); thu hồi = số đã giải ngân của danh mục.
 */
export function validateDisbursement(
  input: { kind: DisbursementKind; category?: string; amount: number; attachmentCount: number; content?: string },
  limit: number | undefined,
): string | undefined {
  const withdraw = input.kind === "withdraw";
  if (!input.category) return "Vui lòng chọn danh mục.";
  if (!(input.amount > 0)) return `Số tiền ${withdraw ? "thu hồi" : "giải ngân"} phải lớn hơn 0.`;
  if (limit !== undefined && input.amount > limit) {
    // BRD 4.4.3: tổng giải ngân không vượt tổng mức đầu tư
    return withdraw
      ? "Số tiền thu hồi vượt số đã giải ngân của danh mục."
      : "Số tiền vượt phần còn lại của tổng mức đầu tư.";
  }
  if (withdraw && !input.content?.trim()) return "Vui lòng nhập lý do thu hồi.";
  // BRD 4.4.3: mỗi đợt phải có ít nhất 1 file chứng từ
  if (input.attachmentCount < 1) return "Vui lòng đính kèm ít nhất 1 file chứng từ.";
  return undefined;
}

const STORAGE_KEY = "cipm_project_disbursements_v1";
const CATEGORY_STORAGE_KEY = "cipm_disbursement_categories_v1";

/** Danh mục người dùng tự thêm khi giải ngân (dùng chung mọi dự án) */
export function loadCustomCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function saveCustomCategories(categories: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save disbursement categories", e);
  }
}

type Store = Record<string, DisbursementEntry[]>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

/** Đợt mẫu do bản demo cũ tự tạo (không phải người dùng nhập) */
const isDemoEntry = (e: DisbursementEntry) => e.id.startsWith("GN-DEMO-");

export function loadProjectDisbursements(projectId: string): DisbursementEntry[] {
  const entries = readStore()[projectId] ?? [];
  const real = entries.filter((e) => !isDemoEntry(e));
  // Dọn đợt mẫu đã lưu trước đây để số "Đã giải ngân" chỉ tính đợt thật
  if (real.length !== entries.length) saveProjectDisbursements(projectId, real);
  return real;
}

export function saveProjectDisbursements(projectId: string, entries: DisbursementEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStore(), [projectId]: entries }));
  } catch (e) {
    console.error("Failed to save project disbursements", e);
  }
}
