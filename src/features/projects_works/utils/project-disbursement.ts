
import { readFileForStorage, storedFileUrl } from "@/utils/stored-file";

export const DEFAULT_DISBURSEMENT_CATEGORIES = [
  "Chi phí bồi thường, hỗ trợ, tái định cư",
  "Chi phí xây dựng",
  "Chi phí thiết bị",
  "Chi phí quản lý dự án",
  "Chi phí tư vấn đầu tư xây dựng",
  "Chi phí khác",
  "Chi phí dự phòng",
] as const;

export interface DisbursementAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export const attachmentUrl = (file: DisbursementAttachment): string | undefined => storedFileUrl(file);

export async function toDisbursementAttachment(file: {
  id: string;
  name: string;
  size: string;
  type: string;
  rawFile?: File;
}): Promise<DisbursementAttachment> {
  const base = { id: file.id, name: file.name, size: file.size, type: file.type };
  const dataUrl = await readFileForStorage(file.id, file.rawFile);
  return dataUrl ? { ...base, dataUrl } : base;
}

export type DisbursementKind = "disburse" | "withdraw";

export interface DisbursementEntry {
  id: string;
  kind?: DisbursementKind;
  category: string;
  amount: number;
  date: string;
  content?: string;
  attachments?: DisbursementAttachment[];
  createdBy: string;
  createdAt: string;
}

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

export function validateDisbursement(
  input: { kind: DisbursementKind; category?: string; amount: number; attachmentCount: number; content?: string },
  limit: number | undefined,
): string | undefined {
  const withdraw = input.kind === "withdraw";
  if (!input.category) return "Vui lòng chọn danh mục.";
  if (!(input.amount > 0)) return `Số tiền ${withdraw ? "thu hồi" : "giải ngân"} phải lớn hơn 0.`;
  if (limit !== undefined && input.amount > limit) {
    return withdraw
      ? "Số tiền thu hồi vượt số đã giải ngân của danh mục."
      : "Số tiền vượt phần còn lại của tổng mức đầu tư.";
  }
  if (withdraw && !input.content?.trim()) return "Vui lòng nhập lý do thu hồi.";
  if (input.attachmentCount < 1) return "Vui lòng đính kèm ít nhất 1 file chứng từ.";
  return undefined;
}

const STORAGE_KEY = "cipm_project_disbursements_v1";
const CATEGORY_STORAGE_KEY = "cipm_disbursement_categories_v1";

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

const isDemoEntry = (e: DisbursementEntry) => e.id.startsWith("GN-DEMO-");

export function loadProjectDisbursements(projectId: string): DisbursementEntry[] {
  const entries = readStore()[projectId] ?? [];
  const real = entries.filter((e) => !isDemoEntry(e));
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
