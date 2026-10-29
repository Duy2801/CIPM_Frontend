/**
 * procedure-library.ts — Danh mục quy trình thủ tục: quy trình mẫu (theo dự thảo) + quy trình tự tạo
 */

import { PERSONNEL_MOCK_DATA } from "@/features/personnel-assignment/constants/personnel-mock-data";
import { DEPARTMENT_PROCEDURE_TEMPLATES, isSameDepartment } from "../constants/procedure-department-templates";
import {
  getTemplateSteps,
  loadCustomProfiles,
  loadHiddenTemplateIds,
  saveCustomProfiles,
  saveHiddenTemplateIds,
  withMockStepDefaults,
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import type { ProcedureStep } from "../types/procedure.types";

/** Trạng thái quy trình; APPLIED = đã có người duyệt; STOPPED = đã tắt bằng công tắc */
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
  /** Tổ phụ trách của quy trình mẫu; quy trình tự tạo không có */
  department?: string;
  isCustom: boolean;
  status: ProcedureStatus;
  /** Đang bật (STOPPED khi tắt) */
  enabled: boolean;
  /** Người duyệt; null = chưa duyệt */
  approvedBy: string | null;
  /** Lúc bấm "Duyệt quy trình" (ISO); null = duyệt từ dữ liệu mẫu / chưa duyệt */
  approvedAt: string | null;
  /** Ngày tạo (YYYY-MM-DD); null = không rõ */
  createdAt: string | null;
  createdBy: string | null;
  /** Lần bấm "Lưu quy trình" gần nhất (ISO); null = chưa cập nhật */
  updatedAt: string | null;
  updatedBy: string | null;
  steps: ProcedureStep[];
}

type ProcedureMeta = Pick<ProcedureLibraryItem, "createdAt" | "createdBy" | "updatedAt" | "updatedBy" | "approvedBy"> & {
  /** Trạng thái khi đang bật và chưa duyệt */
  status: Exclude<ProcedureStatus, "STOPPED" | "APPLIED">;
};

/** Tắt → Đã ngưng; đã có người duyệt → Đang áp dụng; còn lại theo trạng thái xử lý */
const resolveStatus = (
  enabled: boolean,
  approvedBy: string | null,
  pending: Exclude<ProcedureStatus, "STOPPED" | "APPLIED">,
): ProcedureStatus => (!enabled ? "STOPPED" : approvedBy ? "APPLIED" : pending);

/** Dữ liệu mẫu cho các quy trình theo dự thảo (chưa có backend) */
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
    approvedBy: "Trần Minh Ơn",
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
    approvedBy: "Huỳnh Thái Hải",
    createdAt: "2025-03-20",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
};

/** Id các quy trình đang tắt (lưu trình duyệt) */
const DISABLED_STORAGE_KEY = "cipm_procedure_disabled_ids";

function loadDisabledIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DISABLED_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Bật / tắt quy trình */
export function setProcedureEnabled(procedureId: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  const others = loadDisabledIds().filter((id) => id !== procedureId);
  try {
    localStorage.setItem(DISABLED_STORAGE_KEY, JSON.stringify(enabled ? others : [...others, procedureId]));
  } catch (e) {
    console.error("Failed to save procedure enabled state", e);
  }
}

/** Các lần duyệt quy trình (lưu trình duyệt) */
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

/** Duyệt quy trình: ghi người duyệt → trạng thái chuyển sang "Đang áp dụng" */
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

/** Lần cập nhật gần nhất của từng quy trình (lưu trình duyệt) */
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

/** Ghi nhận vừa bấm "Lưu quy trình" */
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

/** Quy trình mẫu chưa bị xóa khỏi danh sách, rồi tới quy trình tự tạo (mới nhất trước) */
export function loadProcedureLibrary(): ProcedureLibraryItem[] {
  const hidden = loadHiddenTemplateIds();
  const updates = loadUpdateMeta();
  const disabled = loadDisabledIds();
  const approvals = loadApprovals();
  const templates = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES)
    .filter((tpl) => !hidden.includes(tpl.id))
    .map<ProcedureLibraryItem>((tpl) => {
      const mock = TEMPLATE_MOCK_META[tpl.id];
      const enabled = !disabled.includes(tpl.id);
      const approvedBy = approvals[tpl.id]?.approvedBy ?? mock?.approvedBy ?? null;
      return {
        id: tpl.id,
        name: tpl.name,
        department: tpl.department,
        isCustom: false,
        enabled,
        status: resolveStatus(enabled, approvedBy, mock?.status ?? "PROCESSING"),
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
    isCustom: true,
    enabled: !disabled.includes(p.id),
    // Quy trình tự tạo: chờ duyệt cho tới khi có người bấm "Duyệt quy trình"
    status: resolveStatus(!disabled.includes(p.id), approvals[p.id]?.approvedBy ?? null, "PENDING_APPROVAL"),
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

/** Bản sao các bước của một quy trình (để sao chép sang quy trình mới) */
export function getProcedureSteps(procedureId: string): ProcedureStep[] {
  const custom = loadCustomProfiles().find((p) => p.id === procedureId);
  if (custom) return withMockStepDefaults(custom.steps ?? []);
  const template = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).find((tpl) => tpl.id === procedureId);
  return template ? getTemplateSteps(template) : [];
}

/** Tổ có thể phụ trách quy trình: tổ của các quy trình mẫu + các ban / tổ trong cơ cấu nhân sự */
export function getProcedureDepartmentOptions(): string[] {
  const names = [
    ...Object.values(DEPARTMENT_PROCEDURE_TEMPLATES).map((tpl) => tpl.department),
    ...PERSONNEL_MOCK_DATA.teams.map((team) => team.name),
  ];
  return names.filter((name, index) => names.findIndex((other) => isSameDepartment(other, name)) === index);
}

export interface CreateProcedureInput {
  name: string;
  department?: string;
  steps: ProcedureStep[];
  createdBy?: string;
}

/** Tạo và lưu quy trình tự tạo mới (đưa lên đầu danh sách quy trình tự tạo) */
export function createProcedure({ name, department, steps, createdBy }: CreateProcedureInput): CustomProcedureProfile {
  const created: CustomProcedureProfile = {
    id: `custom_${Date.now()}`,
    name,
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy,
    department,
    steps,
  };
  saveCustomProfiles([created, ...loadCustomProfiles()]);
  return created;
}

/** Xóa khỏi danh sách: quy trình tự tạo thì xóa hẳn, quy trình mẫu thì ẩn đi */
export function deleteProcedure(procedureId: string) {
  const customs = loadCustomProfiles();
  if (customs.some((p) => p.id === procedureId)) {
    saveCustomProfiles(customs.filter((p) => p.id !== procedureId));
    return;
  }
  saveHiddenTemplateIds([...new Set([...loadHiddenTemplateIds(), procedureId])]);
}
