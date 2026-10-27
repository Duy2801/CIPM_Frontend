/**
 * procedure-templates.ts — Danh mục các Quy trình Thủ tục mẫu chuẩn hóa cho dự án
 *
 * Kiểu dữ liệu quy trình + lưu trữ các quy trình tùy chỉnh do người dùng cấu hình.
 * Quy trình thủ tục ĐTXD theo dự thảo nằm ở procedure-department-templates.ts.
 */

import type { ProcedureStep } from "../types/procedure.types";

export interface ProcedureProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  stepCount: number;
  badge: string;
  tagColor: "teal" | "blue" | "amber" | "purple" | "slate";
  isSystem?: boolean;
  createSteps: () => ProcedureStep[];
}

export interface CustomProcedureProfile {
  id: string;
  name: string;
  createdAt: string;
  /** Người tạo (tên hiển thị) */
  createdBy?: string;
  /** Tổ phụ trách */
  department?: string;
  isSystem?: boolean;
  steps: ProcedureStep[];
}

export const PROCEDURE_STORAGE_KEY = "cipm_custom_procedure_profiles";

export const loadCustomProfiles = (): CustomProcedureProfile[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROCEDURE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Quy trình mẫu (theo dự thảo) người dùng đã xóa khỏi danh sách chọn */
export const HIDDEN_TEMPLATE_STORAGE_KEY = "cipm_hidden_procedure_templates";

export const loadHiddenTemplateIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_TEMPLATE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveHiddenTemplateIds = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HIDDEN_TEMPLATE_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to save hidden procedure templates", e);
  }
};

/** Bộ bước đã chỉnh của quy trình mẫu (theo mã quy trình), lưu trình duyệt */
export const TEMPLATE_OVERRIDE_STORAGE_KEY = "cipm_procedure_template_overrides";

const loadTemplateOverrides = (): Record<string, ProcedureStep[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TEMPLATE_OVERRIDE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveTemplateOverride = (templateId: string, steps: ProcedureStep[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      TEMPLATE_OVERRIDE_STORAGE_KEY,
      JSON.stringify({ ...loadTemplateOverrides(), [templateId]: steps }),
    );
  } catch (e) {
    console.error("Failed to save procedure template override", e);
  }
};

/** Bước của quy trình mẫu: bản đã chỉnh (nếu có), không thì bộ bước gốc */
export const getTemplateSteps = (template: { id: string; createSteps: () => ProcedureStep[] }): ProcedureStep[] => {
  const override = loadTemplateOverrides()[template.id];
  return override ? override.map((s) => ({ ...s })) : template.createSteps();
};

export const saveCustomProfiles = (profiles: CustomProcedureProfile[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROCEDURE_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to save procedure profiles", e);
  }
};
