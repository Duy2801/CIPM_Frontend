import { withPlannedDates } from "@/shared/projects_works/utils/step-schedule";
import { withMockStepDefaults } from "../constants/procedure-templates";
import type { ProjectProcedureData } from "../types/procedure.types";
import { loadProcedureLibrary } from "./procedure-library";

export const PROCEDURE_PROJECTS_STORAGE_KEY = "cipm_procedure_projects_data_v6";

/**
 * Điền đủ dữ liệu bước còn thiếu (dữ liệu tạo trước khi có các cột này):
 * - Người thực hiện: người đã nộp → người phân công trong quy trình gốc (cùng mã bước) → cán bộ mẫu.
 * - Số ngày: chưa đặt thì dùng số ngày mẫu.
 * - Ngày bắt đầu / hạn hoàn thành: tính từ ngày bắt đầu dự án + số ngày của từng bước.
 */
const withDates = (p: ProjectProcedureData): ProjectProcedureData => {
  const library = typeof window === "undefined" ? [] : loadProcedureLibrary();
  const withAssignees = (p.steps ?? []).map((raw) => {
    // Bước chưa được duyệt (đang chờ duyệt / bị từ chối / đang làm) thì không mang người duyệt của lần trước
    const approved = raw.submissionStatus === "APPROVED" || raw.status === "COMPLETED";
    const step = !approved && (raw.approvedBy || raw.approvedAt) ? { ...raw, approvedBy: undefined, approvedAt: undefined } : raw;
    if (step.assignedTo) return step;
    if (step.submittedBy) return { ...step, assignedTo: step.submittedBy };
    const procedureId = step.department ? p.departmentStatuses?.[step.department]?.procedureId : undefined;
    const source = library.find((lib) => lib.id === procedureId)?.steps.find((s) => s.code === step.code);
    return source?.assignedTo ? { ...step, assignedTo: source.assignedTo, assignedToId: source.assignedToId } : step;
  });
  return { ...p, steps: withPlannedDates(withMockStepDefaults(withAssignees), p.startDate) };
};

export function loadProcedureProjects(): ProjectProcedureData[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(PROCEDURE_PROJECTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.map(withDates) : [];
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
    localStorage.setItem(PROCEDURE_PROJECTS_STORAGE_KEY, JSON.stringify([...others, withDates(data)]));
  } catch (e) {
    console.error("Failed to save project procedure data", e);
  }
}
