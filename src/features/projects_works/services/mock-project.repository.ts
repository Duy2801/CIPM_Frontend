import { loadProcedureLibrary } from "@/features/construction-procedures/utils/procedure-library";
import { loadProjectProcedure } from "@/features/construction-procedures/utils/project-procedure-storage";
import type { ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import { useProjectStore } from "@/stores/project.store";
import { todayIso } from "@/utils/date";
import type { ProjectFormData, ProjectItem, ProjectStage } from "../types/project.types";
import {
  loadProjectDisbursements,
  saveProjectDisbursements,
  signedAmount,
  type DisbursementEntry,
} from "../utils/project-disbursement";
import { applyProjectUpdate, createProjectItem, nextProjectCode } from "../utils/project-list";
import { createEmptyProcedure, initProjectProcedure, withProcedureAssignees } from "../utils/project-procedure-data";

export type ProjectActor = { name: string; role: string };

export type ProgressInput = {
  actualProgress: number;
  currentStage: ProjectStage;
  note: string;
  actualEndDate?: string;
};

const store = () => useProjectStore.getState();

function findProject(projectId: string): ProjectItem {
  const project = store().projects.find((p) => p.id === projectId);
  if (!project) throw new Error("Không tìm thấy dự án.");
  return project;
}

function patchProject(projectId: string, patch: (project: ProjectItem) => ProjectItem): ProjectItem {
  const updated = patch(findProject(projectId));
  store().setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
  return updated;
}

export const mockProjectRepository = {
  async getProjects(): Promise<ProjectItem[]> {
    return store().projects;
  },

  async getProject(projectId: string): Promise<ProjectItem> {
    return findProject(projectId);
  },

  async setStatus(projectId: string, status: ProjectItem["status"]): Promise<ProjectItem> {
    return patchProject(projectId, (p) => ({ ...p, status }));
  },

  async createProject(data: ProjectFormData, actor: ProjectActor): Promise<ProjectItem> {
    const project = createProjectItem(data, nextProjectCode(store().projects.length), actor.name);
    const library = loadProcedureLibrary();
    initProjectProcedure(
      project,
      Object.entries(data.procedures ?? {}).flatMap(([department, procedureId]) => {
        const procedure = library.find((p) => p.id === procedureId);
        return procedure ? [{ department, procedure, tabLabel: data.procedureTabLabels?.[procedureId] }] : [];
      }),
      actor,
    );
    store().setProjects((prev) => [project, ...prev]);
    return project;
  },

  async updateProject(projectId: string, data: ProjectFormData, actorName: string): Promise<ProjectItem> {
    return patchProject(projectId, (p) => applyProjectUpdate(p, data, actorName));
  },

  async getProcedure(projectId: string): Promise<ProjectProcedureData> {
    const project = findProject(projectId);
    const data = loadProjectProcedure(project.id, project.code);
    return data ? withProcedureAssignees(data) : createEmptyProcedure(project);
  },

  async getDisbursements(projectId: string): Promise<DisbursementEntry[]> {
    return loadProjectDisbursements(projectId);
  },

  async addDisbursement(
    projectId: string,
    input: Pick<DisbursementEntry, "kind" | "category" | "fundingSource" | "amount" | "date" | "content" | "attachments">,
    actorName: string,
  ): Promise<DisbursementEntry> {
    const now = new Date();
    const entry: DisbursementEntry = {
      ...input,
      id: `GN-${now.getTime()}`,
      createdBy: actorName,
      createdAt: now.toISOString(),
    };
    const entries = [entry, ...loadProjectDisbursements(projectId)];
    saveProjectDisbursements(projectId, entries);
    const total = entries.reduce((sum, e) => sum + signedAmount(e), 0);
    patchProject(projectId, (p) => ({ ...p, disbursedAmount: total }));
    return entry;
  },

  async updateProgress(projectId: string, input: ProgressInput, actorName: string): Promise<ProjectItem> {
    return patchProject(projectId, (p) => ({
      ...p,
      actualProgress: input.actualProgress,
      currentStage: input.currentStage,
      actualEndDate: input.actualProgress === 100 ? input.actualEndDate : p.actualEndDate,
      progressHistory: [
        {
          id: `HIS-${Date.now()}`,
          updatedAt: todayIso(),
          updatedBy: actorName,
          oldProgress: p.actualProgress,
          newProgress: input.actualProgress,
          note: input.note.trim(),
          stageRecorded: input.currentStage,
          actualEndDateRecorded: input.actualProgress === 100 ? input.actualEndDate : undefined,
        },
        ...p.progressHistory,
      ],
    }));
  },
};
