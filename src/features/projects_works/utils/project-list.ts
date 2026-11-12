import type { ProjectProcedureSync } from "../types/project-procedure.types";
import type { ProjectFormData, ProjectItem, ProjectWorkType } from "../types/project.types";

export type ProjectStatusFilter = "ALL" | "active" | "closed";

export interface ProjectListFilters {
  statusFilter: ProjectStatusFilter;
  selectedType: ProjectWorkType | "ALL";
  searchTerm: string;
  sortBy: string;
}

const STAGE_ORDER: Record<string, number> = {
  PREPARATION: 1,
  DESIGN: 2,
  BIDDING: 3,
  CONSTRUCTION: 4,
  COMPENSATION: 5,
  INSPECTION: 6,
  SETTLEMENT: 7,
  COMPLETED: 8,
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function compareProjects(a: ProjectItem, b: ProjectItem, sortBy: string): number {
  switch (sortBy) {
    case "investment_desc":
      return b.totalInvestment - a.totalInvestment;
    case "investment_asc":
      return a.totalInvestment - b.totalInvestment;
    case "progress_asc":
      return a.actualProgress - b.actualProgress;
    case "progress_desc":
      return b.actualProgress - a.actualProgress;
    case "code_asc":
      return a.code.localeCompare(b.code, "vi");
    case "code_desc":
      return b.code.localeCompare(a.code, "vi");
    case "name_asc":
      return a.name.localeCompare(b.name, "vi");
    case "name_desc":
      return b.name.localeCompare(a.name, "vi");
    case "stage_asc":
      return (STAGE_ORDER[a.currentStage] || 0) - (STAGE_ORDER[b.currentStage] || 0);
    case "stage_desc":
      return (STAGE_ORDER[b.currentStage] || 0) - (STAGE_ORDER[a.currentStage] || 0);
    case "manager_asc":
      return (a.managerName || "").localeCompare(b.managerName || "", "vi");
    case "manager_desc":
      return (b.managerName || "").localeCompare(a.managerName || "", "vi");
    case "startDate_asc":
      return (a.startDate || "").localeCompare(b.startDate || "");
    case "startDate_desc":
      return (b.startDate || "").localeCompare(a.startDate || "");
    case "endDate_asc":
      return (a.endDatePlanned || "").localeCompare(b.endDatePlanned || "");
    case "endDate_desc":
      return (b.endDatePlanned || "").localeCompare(a.endDatePlanned || "");
    default:
      return 0;
  }
}

export function filterAndSortProjects(projects: ProjectItem[], filters: ProjectListFilters): ProjectItem[] {
  const q = filters.searchTerm.toLowerCase().trim();
  return projects
    .filter((p) => filters.statusFilter === "ALL" || p.status === filters.statusFilter)
    .filter((p) => filters.selectedType === "ALL" || p.type === filters.selectedType)
    .filter(
      (p) =>
        !q ||
        [p.name, p.code, p.managerName, p.supervisorName, p.type, p.fundingSource].some((v) =>
          (v ?? "").toLowerCase().includes(q),
        ),
    )
    .sort((a, b) => compareProjects(a, b, filters.sortBy));
}

export function nextProjectCode(existingCount: number, year = new Date().getFullYear()): string {
  return `BQL-DA-${year}-${String(existingCount + 1).padStart(3, "0")}`;
}

export function createProjectItem(data: ProjectFormData, code: string, creatorName: string): ProjectItem {
  const initialProgress = data.actualProgress ?? 0;
  return {
    id: `PRJ-${Date.now()}`,
    code,
    name: data.name,
    type: data.type,
    location: data.location || "TP. Hà Tiên",
    scale: data.scale?.trim() || "",
    fundingSource: data.fundingSource ?? "Ngân sách thành phố",
    totalInvestment: data.totalInvestment ?? 0,
    plan2026: data.plan2026 ?? 0,
    disbursedAmount: 0.0,
    managerName: data.managerName || "Chưa phân công",
    supervisorName: data.supervisorName || "Nguyễn Văn An",
    departments: data.departments || ["Tổ Giám sát – Kỹ thuật"],
    documents: data.documents || [],
    startDate: data.startDate,
    endDatePlanned: data.endDatePlanned,
    currentStage: data.currentStage || "PREPARATION",
    nature: data.nature || (initialProgress > 0 ? "transitional" : "new"),
    actualProgress: initialProgress,
    plannedProgress: data.plannedProgress ?? 0,
    note: data.note?.trim() || "",
    status: "active",
    progressHistory: [
      {
        id: `HIS-INIT-${Date.now()}`,
        updatedAt: todayIso(),
        updatedBy: creatorName,
        oldProgress: 0,
        newProgress: initialProgress,
        note: data.note || "Khởi tạo hồ sơ dự án mới trên hệ thống.",
      },
    ],
  };
}

export function applyProjectUpdate(project: ProjectItem, data: ProjectFormData, updaterName: string): ProjectItem {
  const newActualProgress = data.actualProgress !== undefined ? data.actualProgress : project.actualProgress;
  const newPlannedProgress = data.plannedProgress !== undefined ? data.plannedProgress : project.plannedProgress;
  const newStage = data.currentStage ?? project.currentStage;
  const historyNote = data.progressNote?.trim() || data.note?.trim();

  const newHistory = [...(project.progressHistory ?? [])];
  if (newActualProgress !== project.actualProgress || historyNote) {
    newHistory.unshift({
      id: `HIS-${Date.now()}`,
      updatedAt: todayIso(),
      updatedBy: updaterName,
      oldProgress: project.actualProgress,
      newProgress: newActualProgress,
      note: historyNote || "Cập nhật thông tin và tiến độ dự án.",
      actualEndDateRecorded: newActualProgress === 100 ? data.endDatePlanned || project.actualEndDate : undefined,
      stageRecorded: newStage,
    });
  }

  return {
    ...project,
    name: data.name,
    type: data.type,
    location: data.location ?? project.location,
    scale: data.scale ?? project.scale,
    fundingSource: data.fundingSource ?? project.fundingSource,
    totalInvestment: data.totalInvestment !== undefined ? data.totalInvestment : project.totalInvestment,
    plan2026: data.plan2026 !== undefined ? data.plan2026 : project.plan2026,
    managerName: data.managerName ?? project.managerName,
    supervisorName: data.supervisorName ?? project.supervisorName,
    departments: data.departments ?? project.departments,
    documents: data.documents !== undefined ? data.documents : project.documents,
    startDate: data.startDate,
    endDatePlanned: data.endDatePlanned,
    currentStage: newStage,
    nature: data.nature ?? project.nature,
    actualProgress: newActualProgress,
    plannedProgress: newPlannedProgress,
    actualEndDate: newActualProgress === 100 ? project.actualEndDate || data.endDatePlanned : project.actualEndDate,
    note: data.note !== undefined ? data.note : project.note,
    progressHistory: newHistory,
  };
}

export function applyProcedureSync(project: ProjectItem, sync: ProjectProcedureSync, updaterName: string): ProjectItem {
  const progressChanged = sync.actualProgress !== project.actualProgress;
  if (!progressChanged && JSON.stringify(sync.departments) === JSON.stringify(project.departments ?? [])) {
    return project;
  }
  const today = todayIso();
  return {
    ...project,
    departments: sync.departments,
    actualProgress: sync.actualProgress,
    actualEndDate: sync.actualProgress === 100 ? project.actualEndDate || today : project.actualEndDate,
    progressHistory: progressChanged
      ? [
          {
            id: `HIS-${Date.now()}`,
            updatedAt: today,
            updatedBy: updaterName,
            oldProgress: project.actualProgress,
            newProgress: sync.actualProgress,
            note: "Tự cập nhật theo tiến độ các quy trình của dự án.",
            actualEndDateRecorded: sync.actualProgress === 100 ? today : undefined,
            stageRecorded: project.currentStage,
          },
          ...(project.progressHistory ?? []),
        ]
      : project.progressHistory,
  };
}
