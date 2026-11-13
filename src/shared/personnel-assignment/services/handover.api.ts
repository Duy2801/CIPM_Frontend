import type { UploadedAttachment } from "@/components/ui";
import {
  loadProcedureProjects,
  saveProjectProcedure,
} from "@/shared/construction-procedures/utils/project-procedure-storage";
import { handoverTasks, isOpenTaskOf, type TaskActor, type TaskIdentity } from "@/shared/my-tasks/utils/my-tasks";
import { withBackend } from "@/config/backend";

export interface HandoverTask {
  projectId: string;
  projectName: string;
  stepId: string;
  stepCode: string;
  stepName: string;
  department?: string;
  dueDate?: string;
  submitted: boolean;
}

export interface HandoverInput {
  from: TaskIdentity;
  to: TaskIdentity;
  stepIds: string[];
  files: UploadedAttachment[];
  actor: TaskActor;
}

const notSupported = () => {
  throw new Error("Máy chủ chưa hỗ trợ bàn giao công việc giữa cán bộ.");
};

export function getOpenTasksOf(owner: TaskIdentity): Promise<HandoverTask[]> {
  return withBackend(notSupported, () =>
    loadProcedureProjects().flatMap((project) =>
      project.steps
        .filter((step) => isOpenTaskOf(step, owner))
        .sort((a, b) => a.order - b.order)
        .map((step) => ({
          projectId: project.projectId,
          projectName: project.projectName,
          stepId: step.id,
          stepCode: step.code,
          stepName: step.name,
          department: step.department,
          dueDate: step.endDatePlanned,
          submitted: step.submissionStatus === "SUBMITTED",
        })),
    ),
  );
}

export function handoverNote({ files }: Pick<HandoverInput, "files">): string {
  return files.length > 0 ? `Hồ sơ bàn giao: ${files.map((f) => f.name).join(", ")}` : "";
}

export function handoverOpenTasks(input: HandoverInput): Promise<number> {
  const { from, to, stepIds, actor } = input;
  const note = handoverNote(input);
  return withBackend(notSupported, () => {
    const selected = new Set(stepIds);
    let moved = 0;
    for (const project of loadProcedureProjects()) {
      const ids = project.steps.filter((s) => selected.has(s.id) && isOpenTaskOf(s, from)).map((s) => s.id);
      if (ids.length === 0) continue;
      saveProjectProcedure(handoverTasks(project, ids, from, to, note, actor));
      moved += ids.length;
    }
    return moved;
  });
}
