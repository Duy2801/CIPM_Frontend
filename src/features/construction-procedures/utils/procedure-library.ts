import { DEPARTMENT_PROCEDURE_TEMPLATES } from "../constants/procedure-department-templates";
import { PROCEDURE_CATEGORY, TEMPLATE_CATEGORY } from "../constants/procedure-categories";
import {
  getTemplateSteps,
  loadCustomProfiles,
  loadHiddenTemplateIds,
  saveCustomProfiles,
  saveTemplateOverride,
  withMockStepDefaults,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import type { ProcedureStep } from "../types/procedure.types";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { seedGpmbAssignee } from "./seed-gpmb-assignee";

export type ProcedureStatus = "APPLIED" | "PROCESSING" | "PENDING_APPROVAL" | "STOPPED";

export const PROCEDURE_STATUS_LABELS: Record<ProcedureStatus, string> = {
  APPLIED: "Đang áp dụng",
  PROCESSING: "Đang xử lý",
  PENDING_APPROVAL: "Chờ duyệt",
  STOPPED: "Đã ngưng",
};

export interface ProcedureLibraryItem {
  id: string;
  name: string;
  department?: string;
  category: string;
  isCustom: boolean;
  status: ProcedureStatus;
  enabled: boolean;
  version: string;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  steps: ProcedureStep[];
}

type ProcedureMeta = Pick<ProcedureLibraryItem, "createdAt" | "createdBy" | "updatedAt" | "updatedBy" | "approvedBy"> & {
  status: Exclude<ProcedureStatus, "STOPPED" | "APPLIED">;
  enabled?: boolean;
};

const resolveStatus = (
  enabled: boolean,
  approvedBy: string | null,
  submitted: boolean,
  pending: Exclude<ProcedureStatus, "STOPPED" | "APPLIED">,
): ProcedureStatus => (!enabled ? "STOPPED" : approvedBy ? "APPLIED" : submitted ? "PENDING_APPROVAL" : pending);

const TEMPLATE_MOCK_META: Record<string, ProcedureMeta> = {
  "template-khkt": {
    status: "PROCESSING",
    approvedBy: "Trần Minh Ơn",
    createdAt: "2025-01-09",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: "2026-09-18T09:30:00+07:00",
    updatedBy: "Trần Trung Tín",
  },
  "template-dauthau": {
    status: "PROCESSING",
    approvedBy: null,
    createdAt: "2025-01-09",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
  "template-gskt": {
    status: "PENDING_APPROVAL",
    approvedBy: null,
    createdAt: "2025-02-14",
    createdBy: "Trần Trung Tín",
    updatedAt: "2026-10-02T14:15:00+07:00",
    updatedBy: "Trần Minh Ơn",
  },
  "template-quy-hoach": {
    status: "PROCESSING",
    enabled: false,
    approvedBy: "Huỳnh Thái Hải",
    createdAt: "2025-03-20",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
  "template-gpmb": {
    status: "PROCESSING",
    approvedBy: "Trần Minh Ơn",
    createdAt: "2025-04-08",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
};

const ENABLED_STORAGE_KEY = "cipm_procedure_disabled_ids";

function loadEnabledOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(ENABLED_STORAGE_KEY) ?? "{}");
    if (Array.isArray(parsed)) return Object.fromEntries(parsed.map((id: string) => [id, false]));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function setProcedureEnabled(procedureId: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, JSON.stringify({ ...loadEnabledOverrides(), [procedureId]: enabled }));
  } catch (e) {
    console.error("Failed to save procedure enabled state", e);
  }
}

const APPROVAL_STORAGE_KEY = "cipm_procedure_approvals";

function loadApprovals(): Record<string, { approvedBy: string; approvedAt: string }> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(APPROVAL_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function approveProcedure(procedureId: string, approvedBy: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      APPROVAL_STORAGE_KEY,
      JSON.stringify({ ...loadApprovals(), [procedureId]: { approvedBy, approvedAt: new Date().toISOString() } }),
    );
  } catch (e) {
    console.error("Failed to save procedure approval", e);
  }
}

const SUBMISSION_STORAGE_KEY = "cipm_procedure_submissions";

function loadSubmissions(): Record<string, { submittedBy: string; submittedAt: string }> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(SUBMISSION_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function submitProcedure(procedureId: string, submittedBy: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SUBMISSION_STORAGE_KEY,
      JSON.stringify({ ...loadSubmissions(), [procedureId]: { submittedBy, submittedAt: new Date().toISOString() } }),
    );
  } catch (e) {
    console.error("Failed to save procedure submission", e);
  }
}

const VERSION_STORAGE_KEY = "cipm_procedure_versions";
export const DEFAULT_PROCEDURE_VERSION = "1.0";

function loadVersions(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setProcedureVersion(procedureId: string, version: string) {
  if (typeof window === "undefined") return;
  try {
    const versions = loadVersions();
    const value = version.trim();
    if (value) versions[procedureId] = value;
    else delete versions[procedureId];
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
  } catch (e) {
    console.error("Failed to save procedure version", e);
  }
}

const UPDATE_META_STORAGE_KEY = "cipm_procedure_update_meta";

function loadUpdateMeta(): Record<string, { updatedAt: string; updatedBy: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(UPDATE_META_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markProcedureUpdated(procedureId: string, updatedBy: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      UPDATE_META_STORAGE_KEY,
      JSON.stringify({ ...loadUpdateMeta(), [procedureId]: { updatedAt: new Date().toISOString(), updatedBy } }),
    );
  } catch (e) {
    console.error("Failed to save procedure update meta", e);
  }
}

// ── Bản sao quy trình lấy từ backend: các màn khác (dự án, thêm dự án...) đọc đồng bộ từ đây ──

const BACKEND_CACHE_KEY = "cipm_procedure_backend_cache_v1";

function readBackendCache(): ProcedureLibraryItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKEND_CACHE_KEY) ?? "null");
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBackendProcedureCache(items: ProcedureLibraryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BACKEND_CACHE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to cache backend procedures", e);
  }
}

/** Loại quy trình người dùng chọn khi tạo (backend chưa lưu trường này) */
const BACKEND_CATEGORY_KEY = "cipm_procedure_backend_categories_v1";

export function loadBackendProcedureCategories(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKEND_CATEGORY_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function setBackendProcedureCategory(id: string, category: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BACKEND_CATEGORY_KEY, JSON.stringify({ ...loadBackendProcedureCategories(), [id]: category }));
  } catch (e) {
    console.error("Failed to save procedure category", e);
  }
}

/** Cập nhật một quy trình trong bản sao backend (sau khi lưu bước, bật/tắt, nộp, duyệt) */
export function patchBackendProcedureCache(id: string, patch: Partial<ProcedureLibraryItem>) {
  const items = readBackendCache();
  if (!items) return;
  saveBackendProcedureCache(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

/** Thư viện quy trình: đăng nhập tài khoản thật → bản sao từ backend; tài khoản thử nghiệm → dữ liệu mẫu */
export function loadProcedureLibrary(): ProcedureLibraryItem[] {
  if (hasBackendSession()) return readBackendCache() ?? [];
  return loadMockProcedureLibrary();
}

function loadMockProcedureLibrary(): ProcedureLibraryItem[] {
  // Dữ liệu test: giao quy trình GPMB cho ông Huỳnh Thái Hải (chạy một lần)
  seedGpmbAssignee();
  const hidden = loadHiddenTemplateIds();
  const updates = loadUpdateMeta();
  const enabledOverrides = loadEnabledOverrides();
  const approvals = loadApprovals();
  const submissions = loadSubmissions();
  const versions = loadVersions();
  const templates = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES)
    .filter((tpl) => !hidden.includes(tpl.id))
    .map<ProcedureLibraryItem>((tpl) => {
      const mock = TEMPLATE_MOCK_META[tpl.id];
      const enabled = enabledOverrides[tpl.id] ?? mock?.enabled ?? true;
      const approvedBy = approvals[tpl.id]?.approvedBy ?? mock?.approvedBy ?? null;
      return {
        id: tpl.id,
        name: tpl.name,
        department: tpl.department,
        category: TEMPLATE_CATEGORY[tpl.id] ?? PROCEDURE_CATEGORY.XDCB,
        isCustom: false,
        enabled,
        status: resolveStatus(enabled, approvedBy, !!submissions[tpl.id], mock?.status ?? "PROCESSING"),
        version: versions[tpl.id] ?? DEFAULT_PROCEDURE_VERSION,
        submittedBy: submissions[tpl.id]?.submittedBy ?? null,
        submittedAt: submissions[tpl.id]?.submittedAt ?? null,
        approvedBy,
        approvedAt: approvals[tpl.id]?.approvedAt ?? null,
        createdAt: mock?.createdAt ?? null,
        createdBy: mock?.createdBy ?? null,
        updatedAt: updates[tpl.id]?.updatedAt ?? mock?.updatedAt ?? null,
        updatedBy: updates[tpl.id]?.updatedBy ?? mock?.updatedBy ?? null,
        steps: getTemplateSteps(tpl),
      };
    });
  const customs = loadCustomProfiles().map<ProcedureLibraryItem>((p) => ({
    id: p.id,
    name: p.name,
    department: p.department,
    category: p.category ?? PROCEDURE_CATEGORY.XDCB,
    isCustom: true,
    enabled: enabledOverrides[p.id] ?? true,
    status: resolveStatus(
      enabledOverrides[p.id] ?? true,
      approvals[p.id]?.approvedBy ?? null,
      !!submissions[p.id],
      "PROCESSING",
    ),
    version: versions[p.id] ?? DEFAULT_PROCEDURE_VERSION,
    submittedBy: submissions[p.id]?.submittedBy ?? null,
    submittedAt: submissions[p.id]?.submittedAt ?? null,
    approvedBy: approvals[p.id]?.approvedBy ?? null,
    approvedAt: approvals[p.id]?.approvedAt ?? null,
    createdAt: p.createdAt || null,
    createdBy: p.createdBy ?? null,
    updatedAt: updates[p.id]?.updatedAt ?? null,
    updatedBy: updates[p.id]?.updatedBy ?? null,
    steps: withMockStepDefaults(p.steps ?? []),
  }));
  return [...templates, ...customs];
}

export function saveProcedureSteps(procedureId: string, steps: ProcedureStep[]) {
  const customs = loadCustomProfiles();
  if (customs.some((p) => p.id === procedureId)) {
    saveCustomProfiles(customs.map((p) => (p.id === procedureId ? { ...p, steps } : p)));
    return;
  }
  saveTemplateOverride(procedureId, steps);
}

export interface CreateProcedureInput {
  name: string;
  category: string;
  steps: ProcedureStep[];
  createdBy?: string;
  version?: string;
}

export function createProcedure({ name, category, steps, createdBy, version }: CreateProcedureInput): CustomProcedureProfile {
  const created: CustomProcedureProfile = {
    id: `custom_${Date.now()}`,
    name,
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy,
    category,
    steps,
  };
  saveCustomProfiles([created, ...loadCustomProfiles()]);
  if (version?.trim()) setProcedureVersion(created.id, version);
  return created;
}

