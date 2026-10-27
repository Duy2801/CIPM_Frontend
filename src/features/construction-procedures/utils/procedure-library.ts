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
  type CustomProcedureProfile,
} from "../constants/procedure-templates";
import type { ProcedureStep } from "../types/procedure.types";

export interface ProcedureLibraryItem {
  id: string;
  name: string;
  /** Tổ phụ trách của quy trình mẫu; quy trình tự tạo không có */
  department?: string;
  isCustom: boolean;
  /** Ngày tạo (YYYY-MM-DD); null = không rõ */
  createdAt: string | null;
  createdBy: string | null;
  /** Lần bấm "Lưu quy trình" gần nhất (ISO); null = chưa cập nhật */
  updatedAt: string | null;
  updatedBy: string | null;
  steps: ProcedureStep[];
}

type ProcedureMeta = Pick<ProcedureLibraryItem, "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;

/** Dữ liệu mẫu cho các quy trình theo dự thảo (chưa có backend) */
const TEMPLATE_MOCK_META: Record<string, ProcedureMeta> = {
  "template-khkt": {
    createdAt: "2025-01-09",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: "2026-09-18T09:30:00+07:00",
    updatedBy: "Trần Trung Tín",
  },
  "template-dauthau": {
    createdAt: "2025-01-09",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
  "template-gskt": {
    createdAt: "2025-02-14",
    createdBy: "Trần Trung Tín",
    updatedAt: "2026-10-02T14:15:00+07:00",
    updatedBy: "Trần Minh Ơn",
  },
  "template-quy-hoach": {
    createdAt: "2025-03-20",
    createdBy: "Huỳnh Thái Hải",
    updatedAt: null,
    updatedBy: null,
  },
};

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
  const templates = Object.values(DEPARTMENT_PROCEDURE_TEMPLATES)
    .filter((tpl) => !hidden.includes(tpl.id))
    .map<ProcedureLibraryItem>((tpl) => {
      const mock = TEMPLATE_MOCK_META[tpl.id];
      return {
        id: tpl.id,
        name: tpl.name,
        department: tpl.department,
        isCustom: false,
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
    createdAt: p.createdAt || null,
    createdBy: p.createdBy ?? null,
    updatedAt: updates[p.id]?.updatedAt ?? null,
    updatedBy: updates[p.id]?.updatedBy ?? null,
    steps: p.steps ?? [],
  }));
  return [...templates, ...customs];
}

/** Bản sao các bước của một quy trình (để sao chép sang quy trình mới) */
export function getProcedureSteps(procedureId: string): ProcedureStep[] {
  const custom = loadCustomProfiles().find((p) => p.id === procedureId);
  if (custom) return (custom.steps ?? []).map((s) => ({ ...s }));
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
