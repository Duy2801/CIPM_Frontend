import type { UploadedAttachment } from "@/components/ui";
import type { ProcedureHistoryLog, ProjectProcedureData } from "@/shared/construction-procedures/types/procedure.types";
import {
  loadProcedureProjects,
  saveProjectProcedure,
} from "@/shared/construction-procedures/utils/project-procedure-storage";
import { getAppliedDepartments, getProcedureProgress } from "@/shared/projects_works/utils/project-procedure-flow";
import { useProjectStore } from "@/stores/project.store";
import type { TaskRef } from "../utils/my-task-data";
import type { MyTaskSource } from "./my-tasks.mapper";
import { ensureMyTasksDemo } from "../utils/my-tasks-demo";
import {
  acceptTask,
  addTaskDocuments,
  approveTask,
  declineTask,
  giveBackTask,
  rejectTask,
  removeTaskDocument,
  reportTaskIncident,
  resolveTaskIncident,
  saveTaskNote,
  submitTask,
  type TaskActor,
} from "../utils/my-tasks";
import { toProcedureDocuments } from "../utils/task-documents";

const notFound = () => new Error("Không tìm thấy quy trình của dự án, vui lòng tải lại trang.");

async function update(ref: TaskRef, change: (data: ProjectProcedureData) => ProjectProcedureData): Promise<void> {
  const latest = loadProcedureProjects().find((p) => p.projectId === ref.projectId);
  if (!latest) throw notFound();
  const next = change(latest);
  saveProjectProcedure(next);
  const departments = getAppliedDepartments(next.departmentStatuses, next.steps);
  useProjectStore.getState().updateProject(next.projectId, {
    actualProgress: getProcedureProgress(departments, next.steps, next.stageApprovals),
  });
}

export const mockMyTasksRepository = {
  async getSource(meName: string): Promise<MyTaskSource> {
    ensureMyTasksDemo(meName);
    const owners = new Map(
      useProjectStore.getState().projects.map((p) => [p.id, { id: p.managerId, name: p.managerName }]),
    );
    return { projects: loadProcedureProjects(), owners };
  },

  async getHistory(ref: TaskRef): Promise<ProcedureHistoryLog[]> {
    const project = loadProcedureProjects().find((p) => p.projectId === ref.projectId);
    return (project?.history ?? []).filter((log) => log.stepId === ref.stepId);
  },

  async hasSubmission(ref: TaskRef): Promise<boolean> {
    const step = loadProcedureProjects()
      .find((p) => p.projectId === ref.projectId)
      ?.steps.find((s) => s.id === ref.stepId);
    if (!step) throw notFound();
    return Boolean(step.submissionNote?.trim()) || step.attachments.length > 0;
  },

  accept: (ref: TaskRef, actor: TaskActor) => update(ref, (d) => acceptTask(d, ref.stepId, actor)),
  submit: (ref: TaskRef, actor: TaskActor) => update(ref, (d) => submitTask(d, ref.stepId, {}, actor)),
  approve: (ref: TaskRef, actor: TaskActor) => update(ref, (d) => approveTask(d, ref.stepId, actor)),
  reject: (ref: TaskRef, reason: string, actor: TaskActor) => update(ref, (d) => rejectTask(d, ref.stepId, reason, actor)),
  reportIncident: (ref: TaskRef, reason: string, actor: TaskActor) =>
    update(ref, (d) => reportTaskIncident(d, ref.stepId, reason, actor)),
  resolveIncident: (ref: TaskRef, actor: TaskActor) => update(ref, (d) => resolveTaskIncident(d, ref.stepId, actor)),
  decline: (ref: TaskRef, reason: string, actor: TaskActor) => update(ref, (d) => declineTask(d, ref.stepId, reason, actor)),
  giveBack: (ref: TaskRef, reason: string, actor: TaskActor) =>
    update(ref, (d) => giveBackTask(d, ref.stepId, reason, actor)),
  saveNote: (ref: TaskRef, note: string) => update(ref, (d) => saveTaskNote(d, ref.stepId, note)),
  async addFiles(ref: TaskRef, files: UploadedAttachment[], actor: TaskActor) {
    const documents = await toProcedureDocuments(files, actor.name);
    await update(ref, (d) => addTaskDocuments(d, ref.stepId, documents, actor));
  },
  removeFile: (ref: TaskRef, documentId: string, actor: TaskActor) =>
    update(ref, (d) => removeTaskDocument(d, ref.stepId, documentId, actor)),
};
