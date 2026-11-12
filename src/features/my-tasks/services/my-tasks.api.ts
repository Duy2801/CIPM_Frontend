import type { UploadedAttachment } from "@/components/ui";
import { withBackend } from "@/features/personnel-assignment/services/backend";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import { uploadProjectFileApi } from "@/features/projects_works/api/project.backend";
import * as backend from "../api/my-tasks.backend";
import { buildMyTaskData, type MyTaskData, type TaskRef } from "../utils/my-task-data";
import type { TaskActor, TaskIdentity } from "../utils/my-tasks";
import { mockMyTasksRepository } from "./mock-my-tasks.repository";
import { toTaskActivityEntry } from "../utils/task-history";
import { toApiDocumentInputs, toStepLog, toTaskSource } from "./my-tasks.mapper";

const repo = mockMyTasksRepository;

const today = () => new Date().toISOString().slice(0, 10);

export async function getMyTaskData(
  me: TaskIdentity,
  canReview: (department: string) => boolean,
  canProxy = false,
): Promise<MyTaskData> {
  const source = await withBackend(
    async () => toTaskSource(await backend.getMyTasksApi()),
    () => repo.getSource(me.name),
  );
  return buildMyTaskData(source.projects, {
    today: today(),
    me,
    canReview,
    ownerOf: (id) => source.owners.get(id),
    reached: source.reached,
    canProxy,
  });
}

export async function getStepHistory(ref: TaskRef): Promise<ActivityEntry[]> {
  const logs = await withBackend(
    async () => (await backend.getStepHistoryApi(ref)).map(toStepLog),
    () => repo.getHistory(ref),
  );
  return logs.map(toTaskActivityEntry);
}

export async function submitStep(ref: TaskRef, actor: TaskActor): Promise<"ok" | "empty"> {
  return withBackend(
    async () => {
      await backend.submitStepApi(ref);
      return "ok" as const;
    },
    async () => {
      if (!(await repo.hasSubmission(ref))) return "empty" as const;
      await repo.submit(ref, actor);
      return "ok" as const;
    },
  );
}

export function acceptStep(ref: TaskRef, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.acceptStepApi(ref)),
    () => repo.accept(ref, actor),
  );
}

export function approveStep(ref: TaskRef, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.approveStepApi(ref)),
    () => repo.approve(ref, actor),
  );
}

export function rejectStep(ref: TaskRef, reason: string, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.rejectStepApi(ref, reason.trim())),
    () => repo.reject(ref, reason, actor),
  );
}

export function reportStepIncident(ref: TaskRef, reason: string, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.reportIncidentApi(ref, reason.trim())),
    () => repo.reportIncident(ref, reason, actor),
  );
}

export function resolveStepIncident(ref: TaskRef, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.resolveIncidentApi(ref)),
    () => repo.resolveIncident(ref, actor),
  );
}

export function declineStep(ref: TaskRef, reason: string, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.declineStepApi(ref, reason.trim())),
    () => repo.decline(ref, reason, actor),
  );
}

export function giveBackStep(ref: TaskRef, reason: string, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.giveBackStepApi(ref, reason.trim() || null)),
    () => repo.giveBack(ref, reason, actor),
  );
}

export function saveStepNote(ref: TaskRef, note: string): Promise<void> {
  return withBackend(
    async () => void (await backend.saveStepNoteApi(ref, note)),
    () => repo.saveNote(ref, note),
  );
}

export function addStepFiles(ref: TaskRef, files: UploadedAttachment[], actor: TaskActor): Promise<void> {
  return withBackend(
    async () => {
      const fileIds: string[] = [];
      for (const file of files) {
        if (!file.rawFile) throw new Error(`Không đọc được tệp ${file.name}.`);
        fileIds.push((await uploadProjectFileApi(file.rawFile)).id);
      }
      await backend.addStepDocumentsApi(ref, toApiDocumentInputs(files, fileIds));
    },
    () => repo.addFiles(ref, files, actor),
  );
}

export function removeStepDocument(ref: TaskRef, documentId: string, actor: TaskActor): Promise<void> {
  return withBackend(
    async () => void (await backend.removeStepDocumentApi(ref, documentId)),
    () => repo.removeFile(ref, documentId, actor),
  );
}
