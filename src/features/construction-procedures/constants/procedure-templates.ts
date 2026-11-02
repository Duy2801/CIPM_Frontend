import { PERSONNEL_MOCK_DATA } from "@/features/personnel-assignment/constants/personnel-mock-data";
import type { ProcedureStep } from "../types/procedure.types";

const MOCK_STEP_DAYS = [5, 7, 10, 15, 20, 30];

export const stableHash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const withMockStepDefaults = (steps: ProcedureStep[]): ProcedureStep[] => {
  const staff = PERSONNEL_MOCK_DATA.staff;
  return steps.map((s) => {
    const h = stableHash(`${s.code}|${s.name}`);
    const hasDays = !!(s.plannedDays || s.durationDaysMax || s.durationDaysMin);
    const days = MOCK_STEP_DAYS[h % MOCK_STEP_DAYS.length];
    const person = staff.length > 0 ? staff[h % staff.length] : undefined;
    return {
      ...s,
      ...(hasDays ? {} : { plannedDays: days, durationDaysMin: days, durationDaysMax: days, durationMargin: `${days} ngày` }),
      ...(s.assignedTo || !person ? {} : { assignedTo: person.name, assignedToId: person.id }),
    };
  });
};

export interface CustomProcedureProfile {
  id: string;
  name: string;
  createdAt: string;
  createdBy?: string;
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

export const getTemplateSteps = (template: { id: string; createSteps: () => ProcedureStep[] }): ProcedureStep[] => {
  const override = loadTemplateOverrides()[template.id];
  return withMockStepDefaults(override ? override.map((s) => ({ ...s })) : template.createSteps());
};

export const saveCustomProfiles = (profiles: CustomProcedureProfile[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROCEDURE_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error("Failed to save procedure profiles", e);
  }
};
