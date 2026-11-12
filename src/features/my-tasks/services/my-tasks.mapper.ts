import type { UploadedAttachment } from "@/components/ui";
import type {
  ProcedureHistoryLog,
  ProjectProcedureData,
} from "@/features/construction-procedures/types/procedure.types";
import {
  toProcedureParts,
  type ApiPerson,
  type ApiProjectProcedure,
  type ApiProjectProcedureRef,
  type ApiProjectStep,
} from "@/features/projects_works/services/project.mapper";
import type { ProjectOwner } from "../utils/my-task-data";

export interface ApiMyTaskProjectRef {
  id: string;
  code: string;
  name: string;
  type: string | null;
  manager: ApiPerson | null;
  supervisor: ApiPerson | null;
  startDate: string | null;
  endDatePlanned: string | null;
}

export interface ApiStepLog {
  id: string;
  stepId: string;
  stepCode: string;
  stepName: string;
  at: string;
  actorName: string;
  actorRole: string | null;
  action: ProcedureHistoryLog["action"];
  actionLabel: string;
  reason: string | null;
  details: string | null;
}

export interface ApiMyTaskProcedureRef extends ApiProjectProcedureRef {
  department: string | null;
}

export interface ApiMyTaskStep extends ApiProjectStep {
  reached: boolean;
}

export interface ApiMyTaskProject extends Omit<ApiProjectProcedure, "procedures" | "steps"> {
  project: ApiMyTaskProjectRef;
  procedures: ApiMyTaskProcedureRef[];
  steps: ApiMyTaskStep[];
}

export interface MyTaskSource {
  projects: ProjectProcedureData[];
  owners: Map<string, ProjectOwner>;
  reached?: Set<string>;
}

export interface ApiStepDocumentInput {
  fileId: string;
  title: string;
}

export const toStepLog = (log: ApiStepLog): ProcedureHistoryLog => ({
  id: log.id,
  stepId: log.stepId,
  stepCode: log.stepCode,
  stepName: log.stepName,
  timestamp: log.at,
  performedBy: log.actorName,
  role: log.actorRole ?? "",
  action: log.action,
  actionLabel: log.actionLabel,
  reason: log.reason ?? undefined,
  details: log.details ?? "",
});

export function toTaskProject(api: ApiMyTaskProject): ProjectProcedureData {
  const { project } = api;
  const parts = toProcedureParts(api);
  const departmentStatuses = Object.fromEntries(
    api.procedures.map((p) => [p.id, { ...parts.departmentStatuses?.[p.id], department: p.department ?? p.id, isCompletedByLead: false }]),
  );
  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    projectType: project.type ?? "",
    totalInvestment: 0,
    managerName: project.manager?.fullName ?? "",
    supervisorName: project.supervisor?.fullName ?? "",
    startDate: project.startDate ?? "",
    expectedFinishDate: project.endDatePlanned ?? "",
    directorApproval: { status: "PENDING" },
    ...parts,
    departmentStatuses,
    history: [],
  };
}

export const toTaskSource = (apis: ApiMyTaskProject[]): MyTaskSource => ({
  projects: apis.map(toTaskProject),
  owners: new Map(
    apis.map((a) => [a.project.id, { id: a.project.manager?.id, name: a.project.manager?.fullName }]),
  ),
  reached: new Set(apis.flatMap((a) => a.steps.filter((s) => s.reached).map((s) => s.id))),
});

export const toApiDocumentInputs = (files: UploadedAttachment[], fileIds: string[]): ApiStepDocumentInput[] =>
  files.map((file, i) => ({ fileId: fileIds[i], title: file.name }));
