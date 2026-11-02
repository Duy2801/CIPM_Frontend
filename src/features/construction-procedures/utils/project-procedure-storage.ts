
import type { ProjectProcedureData } from "../types/procedure.types";

export const PROCEDURE_PROJECTS_STORAGE_KEY = "cipm_procedure_projects_data_v6";

export function loadProcedureProjects(): ProjectProcedureData[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(PROCEDURE_PROJECTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadProjectProcedure(projectId: string, projectCode?: string): ProjectProcedureData | undefined {
  return loadProcedureProjects().find(
    (p) => p.projectId === projectId || (Boolean(projectCode) && p.projectId === projectCode),
  );
}

export function saveProjectProcedure(data: ProjectProcedureData) {
  if (typeof window === "undefined") return;
  const others = loadProcedureProjects().filter(
    (p) => p.projectId !== data.projectId && p.projectId !== data.projectCode,
  );
  try {
    localStorage.setItem(PROCEDURE_PROJECTS_STORAGE_KEY, JSON.stringify([...others, data]));
  } catch (e) {
    console.error("Failed to save project procedure data", e);
  }
}
