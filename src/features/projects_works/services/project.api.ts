import { withBackend } from "@/features/personnel-assignment/services/backend";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import type { ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import * as backend from "../api/project.backend";
import type { ProcedureChanges } from "../types/project-procedure.types";
import type { ProjectFormData, ProjectItem } from "../types/project.types";
import { summarizeDisbursements, type DisbursementEntry, type DisbursementSummary } from "../utils/project-disbursement";
import { mockProjectRepository, type ProgressInput, type ProjectActor } from "./mock-project.repository";
import {
  toApiCreateBody,
  toApiDisbursementBody,
  toApiProceduresBody,
  toApiUpdateBody,
  toDisbursementEntry,
  toDisbursementSummary,
  toProjectActivityEntry,
  toProjectItem,
  toProjectProcedureData,
  type ApiProjectListItem,
  type ApiProjectProceduresResult,
} from "./project.mapper";

const repo = mockProjectRepository;

const PAGE_SIZE = 100;

async function uploadFiles(files: File[] = []): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) ids.push((await backend.uploadProjectFileApi(file)).id);
  return ids;
}

export function getProjects(): Promise<ProjectItem[]> {
  return withBackend(
    async () => {
      const items: ApiProjectListItem[] = [];
      for (let page = 1, totalPages = 1; page <= totalPages; page++) {
        const result = await backend.getProjectsPageApi({ page, limit: PAGE_SIZE });
        items.push(...result.data);
        totalPages = Math.max(1, result.meta.totalPages);
      }
      return items.map(toProjectItem);
    },
    () => repo.getProjects(),
  );
}

export function getProject(projectId: string): Promise<ProjectItem> {
  return withBackend(
    async () => toProjectItem(await backend.getProjectApi(projectId)),
    () => repo.getProject(projectId),
  );
}

export function setProjectStatus(projectId: string, status: ProjectItem["status"]): Promise<ProjectItem> {
  return withBackend(
    async () => {
      await backend.setProjectStatusApi(projectId, status);
      return toProjectItem(await backend.getProjectApi(projectId));
    },
    () => repo.setStatus(projectId, status),
  );
}

export function createProject(data: ProjectFormData, actor: ProjectActor, files: File[] = []): Promise<ProjectItem> {
  return withBackend(
    async () => toProjectItem(await backend.createProjectApi(toApiCreateBody(data, await uploadFiles(files)))),
    () => repo.createProject(data, actor),
  );
}

export function updateProject(project: ProjectItem, data: ProjectFormData, actorName: string): Promise<ProjectItem> {
  return withBackend(
    async () => {
      const body = toApiUpdateBody(project, data);
      if (Object.keys(body).length === 0) return project;
      return toProjectItem(await backend.updateProjectApi(project.id, body));
    },
    () => repo.updateProject(project.id, data, actorName),
  );
}

export function saveProjectProcedures(
  projectId: string,
  changes: ProcedureChanges,
  current: ProjectProcedureData,
): Promise<ApiProjectProceduresResult | null> {
  return withBackend(
    () => backend.updateProjectProceduresApi(projectId, toApiProceduresBody(changes, current)),
    () => null,
  );
}

export function getProjectProcedure(project: ProjectItem, projectProcedureId?: string): Promise<ProjectProcedureData> {
  return withBackend(
    async () => toProjectProcedureData(project, await backend.getProjectProcedureApi(project.id, projectProcedureId)),
    () => repo.getProcedure(project.id),
  );
}

export function getDisbursements(
  projectId: string,
  categories: readonly string[],
): Promise<{ entries: DisbursementEntry[]; summary: DisbursementSummary }> {
  return withBackend(
    async () => {
      const data = await backend.getDisbursementsApi(projectId);
      return { entries: data.entries.map(toDisbursementEntry), summary: toDisbursementSummary(data.summary) };
    },
    async () => {
      const entries = await repo.getDisbursements(projectId);
      return { entries, summary: summarizeDisbursements(entries, categories) };
    },
  );
}

export function addDisbursement(
  projectId: string,
  input: Pick<DisbursementEntry, "kind" | "category" | "amount" | "content" | "attachments">,
  actorName: string,
  files: File[] = [],
): Promise<DisbursementEntry> {
  return withBackend(
    async () => {
      const created = await backend.createDisbursementApi(projectId, toApiDisbursementBody(input, await uploadFiles(files)));
      return toDisbursementEntry(created.entry);
    },
    () => repo.addDisbursement(projectId, input, actorName),
  );
}

export function getProjectHistory(projectId: string, date?: string): Promise<ActivityEntry[] | null> {
  return withBackend(
    async () => (await backend.getProjectAuditLogsApi(projectId, date)).map(toProjectActivityEntry),
    () => null,
  );
}

export function updateProjectProgress(projectId: string, input: ProgressInput, actorName: string): Promise<ProjectItem> {
  return withBackend(
    async () =>
      toProjectItem(
        await backend.updateProgressApi(projectId, {
          actualProgress: input.actualProgress,
          currentStage: input.currentStage,
          note: input.note.trim(),
          actualEndDate: input.actualProgress === 100 ? input.actualEndDate ?? null : null,
        }),
      ),
    () => repo.updateProgress(projectId, input, actorName),
  );
}

export function downloadProjectFile(projectId: string, fileId: string): Promise<Blob | null> {
  return withBackend(
    () => backend.downloadProjectFileApi(projectId, fileId),
    () => null,
  );
}
