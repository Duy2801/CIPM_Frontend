/**
 * project-procedure-storage.ts — Dữ liệu quy trình theo từng dự án (lưu trình duyệt, chưa có backend)
 *
 * Màn hình "Quy trình dự án" (M3) và trang chi tiết dự án (M2) cùng đọc / ghi một nơi để luôn khớp nhau.
 */

import type { ProjectProcedureData } from "../types/procedure.types";

// v6: bỏ quy trình chuẩn 16 bước dựng sẵn → dữ liệu cũ (v5) có 16 bước được xóa
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

/** Quy trình của một dự án (tìm theo id, dữ liệu cũ có thể lưu theo mã dự án) */
export function loadProjectProcedure(projectId: string, projectCode?: string): ProjectProcedureData | undefined {
  return loadProcedureProjects().find(
    (p) => p.projectId === projectId || (Boolean(projectCode) && p.projectId === projectCode),
  );
}

/** Ghi đè (hoặc thêm mới) quy trình của một dự án */
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
