import type { ApiAuditLog } from "@/features/personnel-assignment/services/personnel.mapper";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import type {
  ProcedureDocument,
  ProcedureStep,
  ProjectProcedureData,
  StageApprovalStatus,
  StepStatus,
  StepType,
} from "@/features/construction-procedures/types/procedure.types";
import type { ProcedureChanges } from "../types/project-procedure.types";
import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectStage,
  ProjectWorkType,
} from "../types/project.types";
import type { DisbursementEntry, DisbursementKind, DisbursementSummary } from "../utils/project-disbursement";
import { createEmptyProcedure } from "../utils/project-procedure-data";

export type ApiProjectStatus = "active" | "closed";

export type ApiProjectSort =
  | "latest"
  | "investment_asc"
  | "investment_desc"
  | "progress_asc"
  | "progress_desc"
  | "endDate_asc"
  | "endDate_desc";

export interface ApiPerson {
  id: string;
  fullName: string;
}

export interface ApiProjectFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: string;
  url?: string;
}

export interface ApiProjectProcedureRef {
  id: string;
  procedureId: string;
  procedureName: string;
  tabLabel: string | null;
}

export interface ApiProjectListItem {
  id: string;
  code: string;
  name: string;
  type: string;
  fundingSource: string;
  totalInvestment: number;
  disbursedAmount: number;
  actualProgress: number;
  plannedProgress: number;
  currentStage: ProjectStage;
  manager: ApiPerson | null;
  supervisor: ApiPerson | null;
  startDate: string;
  endDatePlanned: string;
  status: ApiProjectStatus;
}

export interface ApiProject extends ApiProjectListItem {
  location: string | null;
  nature: ProjectNature | null;
  plan2026: number;
  actualEndDate: string | null;
  procedures: ApiProjectProcedureRef[];
  documents: ApiProjectFile[];
}

export interface ApiProjectPage {
  data: ApiProjectListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiProjectQuery {
  q?: string;
  type?: string;
  status?: ApiProjectStatus;
  sort?: ApiProjectSort;
  page?: number;
  limit?: number;
}

export interface ApiProjectProcedureInput {
  procedureId: string;
  tabLabel: string | null;
}

export interface ApiProjectBody {
  name: string;
  type: string;
  location: string | null;
  nature: ProjectNature | null;
  fundingSource: string;
  totalInvestment: number;
  plan2026: number;
  managerId: string | null;
  supervisorId: string | null;
  startDate: string;
  endDatePlanned: string;
  procedures: ApiProjectProcedureInput[];
  fileIds: string[];
}

export type ApiProjectUpdateBody = Partial<Omit<ApiProjectBody, "procedures" | "fileIds">>;

export interface ApiProjectProceduresBody {
  remove: string[];
  add: ApiProjectProcedureInput[];
  labels: Record<string, string>;
}

export interface ApiProjectProceduresResult {
  actualProgress: number;
  procedures: ApiProjectProcedureRef[];
}

export interface ApiStepDocument {
  id: string;
  documentCode: string;
  title: string;
  issuer?: string | null;
  issueDate?: string | null;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ApiProjectStep {
  id: string;
  projectProcedureId: string;
  code: string;
  groupCode: string;
  groupTitle: string;
  name: string;
  type: StepType;
  isEnabled?: boolean;
  plannedDays: number | null;
  startDatePlanned: string | null;
  endDatePlanned: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  assignee: ApiPerson | null;
  supervisor: ApiPerson | null;
  status: StepStatus;
  submissionStatus: ProcedureStep["submissionStatus"] | null;
  submittedBy: string | null;
  submittedAt: string | null;
  submissionNote: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason: string | null;
  rejectedBy?: string | null;
  documents: ApiStepDocument[];
}

export interface ApiProjectProcedure {
  procedures: ApiProjectProcedureRef[];
  steps: ApiProjectStep[];
  stageApprovals: Record<string, StageApprovalStatus>;
}

export interface ApiDisbursementEntry {
  id: string;
  kind: DisbursementKind;
  category: string;
  amount: number;
  date: string;
  content: string | null;
  attachments: ApiProjectFile[];
  createdBy: ApiPerson | null;
  createdAt: string;
}

export interface ApiDisbursementSummary {
  totalInvestment: number;
  total: number;
  remaining: number;
  count: number;
  byCategory: { category: string; total: number; count: number; lastDate?: string | null }[];
}

export interface ApiDisbursementList {
  summary: ApiDisbursementSummary;
  entries: ApiDisbursementEntry[];
}

export interface ApiDisbursementBody {
  kind: DisbursementKind;
  category: string;
  amount: number;
  content: string | null;
  fileIds: string[];
}

export interface ApiDisbursementCreated {
  entry: ApiDisbursementEntry;
  summary: ApiDisbursementSummary;
}

export interface ApiProgressBody {
  actualProgress: number;
  currentStage: ProjectStage;
  note: string;
  actualEndDate: string | null;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const toProjectDocument = (file: ApiProjectFile): ProjectDocument => ({
  id: file.id,
  name: file.fileName,
  fileName: file.fileName,
  fileSize: formatFileSize(file.fileSize),
  uploadedAt: file.uploadedAt,
  type: file.mimeType,
  url: file.url,
});

export function toProjectItem(api: ApiProjectListItem | ApiProject): ProjectItem {
  const detail = "procedures" in api ? api : undefined;
  return {
    id: api.id,
    code: api.code,
    name: api.name,
    type: api.type as ProjectWorkType,
    location: detail?.location ?? undefined,
    fundingSource: api.fundingSource as FundingSourceType,
    totalInvestment: api.totalInvestment,
    plan2026: detail?.plan2026 ?? 0,
    disbursedAmount: api.disbursedAmount,
    managerName: api.manager?.fullName ?? "",
    supervisorName: api.supervisor?.fullName ?? "",
    managerId: api.manager?.id,
    supervisorId: api.supervisor?.id,
    departments: detail?.procedures.map((p) => p.id),
    startDate: api.startDate,
    endDatePlanned: api.endDatePlanned,
    actualEndDate: detail?.actualEndDate ?? undefined,
    currentStage: api.currentStage,
    actualProgress: api.actualProgress,
    plannedProgress: api.plannedProgress,
    progressHistory: [],
    status: api.status,
    nature: detail?.nature ?? undefined,
    documents: detail?.documents.map(toProjectDocument),
  };
}

export function toApiProcedureInputs(data: Pick<ProjectFormData, "procedures" | "procedureTabLabels">): ApiProjectProcedureInput[] {
  return Object.values(data.procedures ?? {}).map((procedureId) => ({
    procedureId,
    tabLabel: data.procedureTabLabels?.[procedureId]?.trim() || null,
  }));
}

export function toApiCreateBody(data: ProjectFormData, fileIds: string[]): ApiProjectBody {
  return {
    name: data.name.trim(),
    type: data.type,
    location: data.location?.trim() || null,
    nature: data.nature ?? null,
    fundingSource: data.fundingSource ?? "",
    totalInvestment: data.totalInvestment ?? 0,
    plan2026: data.plan2026 ?? 0,
    managerId: data.managerId ?? null,
    supervisorId: data.supervisorId ?? null,
    startDate: data.startDate,
    endDatePlanned: data.endDatePlanned,
    procedures: toApiProcedureInputs(data),
    fileIds,
  };
}

export function toApiUpdateBody(project: ProjectItem, data: ProjectFormData): ApiProjectUpdateBody {
  const next = toApiCreateBody(data, []);
  const current: ApiProjectUpdateBody = {
    name: project.name,
    type: project.type,
    location: project.location ?? null,
    nature: project.nature ?? null,
    fundingSource: project.fundingSource,
    totalInvestment: project.totalInvestment,
    plan2026: project.plan2026,
    managerId: project.managerId ?? null,
    supervisorId: project.supervisorId ?? null,
    startDate: project.startDate,
    endDatePlanned: project.endDatePlanned,
  };
  const keys = Object.keys(current) as (keyof ApiProjectUpdateBody)[];
  return Object.fromEntries(
    keys.filter((key) => data[key as keyof ProjectFormData] !== undefined && next[key] !== current[key]).map((key) => [key, next[key]]),
  ) as ApiProjectUpdateBody;
}

export function toApiProceduresBody(changes: ProcedureChanges, data: ProjectProcedureData): ApiProjectProceduresBody {
  const procedureIdOf = (key: string) => data.departmentStatuses?.[key]?.procedureId ?? key;
  const added = new Set(changes.add.map((a) => a.department));
  return {
    remove: changes.remove.map(procedureIdOf),
    add: changes.add.map(({ department, procedure }) => ({
      procedureId: procedure.id,
      tabLabel: changes.labels[department]?.trim() || null,
    })),
    labels: Object.fromEntries(
      Object.entries(changes.labels)
        .filter(([key]) => !added.has(key))
        .map(([key, label]) => [procedureIdOf(key), label.trim()]),
    ),
  };
}

const toStepDocument = (doc: ApiStepDocument): ProcedureDocument => ({
  id: doc.id,
  documentCode: doc.documentCode,
  title: doc.title,
  issuer: doc.issuer ?? "",
  issueDate: doc.issueDate ?? "",
  fileName: doc.fileName,
  fileSize: formatFileSize(doc.fileSize),
  uploadedAt: doc.uploadedAt,
  uploadedBy: doc.uploadedBy,
});

export function toProjectStep(step: ApiProjectStep, index: number): ProcedureStep {
  const days = step.plannedDays ?? null;
  return {
    id: step.id,
    order: index + 1,
    code: step.code,
    groupCode: step.groupCode,
    groupTitle: step.groupTitle,
    name: step.name,
    type: step.type,
    responsibleUnit: "",
    durationMargin: days ? `${days} ngày` : "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
    plannedDays: days ?? undefined,
    isEnabled: step.isEnabled ?? step.status !== "DISABLED",
    status: step.status,
    startDatePlanned: step.startDatePlanned ?? undefined,
    endDatePlanned: step.endDatePlanned ?? undefined,
    actualStartDate: step.actualStartDate ?? undefined,
    actualEndDate: step.actualEndDate ?? undefined,
    department: step.projectProcedureId,
    assignedTo: step.assignee?.fullName,
    assignedToId: step.assignee?.id,
    supervisor: step.supervisor?.fullName,
    supervisorId: step.supervisor?.id,
    submissionStatus: step.submissionStatus ?? undefined,
    submittedBy: step.submittedBy ?? undefined,
    submittedAt: step.submittedAt ?? undefined,
    submissionNote: step.submissionNote ?? undefined,
    approvedBy: step.approvedBy ?? undefined,
    approvedAt: step.approvedAt ?? undefined,
    rejectionReason: step.rejectionReason ?? undefined,
    rejectedBy: step.rejectedBy ?? undefined,
    attachments: step.documents.map(toStepDocument),
  };
}

export function toProcedureParts(
  api: ApiProjectProcedure,
): Pick<ProjectProcedureData, "departments" | "departmentStatuses" | "stageApprovals" | "steps"> {
  return {
    departments: api.procedures.map((p) => p.id),
    departmentStatuses: Object.fromEntries(
      api.procedures.map((p) => [
        p.id,
        {
          department: p.id,
          procedureId: p.procedureId,
          procedureName: p.procedureName,
          tabLabel: p.tabLabel ?? undefined,
          isCompletedByLead: false,
        },
      ]),
    ),
    stageApprovals: api.stageApprovals ?? {},
    steps: api.steps.map(toProjectStep),
  };
}

export function toProjectProcedureData(project: ProjectItem, api: ApiProjectProcedure): ProjectProcedureData {
  return { ...createEmptyProcedure(project), ...toProcedureParts(api) };
}

export const toDisbursementEntry = (api: ApiDisbursementEntry): DisbursementEntry => ({
  id: api.id,
  kind: api.kind,
  category: api.category,
  amount: api.amount,
  date: api.date,
  content: api.content ?? undefined,
  attachments: api.attachments.map((file) => ({
    id: file.id,
    name: file.fileName,
    size: formatFileSize(file.fileSize),
    type: file.mimeType ?? "",
  })),
  createdBy: api.createdBy?.fullName ?? "",
  createdAt: api.createdAt,
});

export const toDisbursementSummary = (api: ApiDisbursementSummary): DisbursementSummary => ({
  total: api.total,
  count: api.count,
  byCategory: api.byCategory.map((row) => ({
    category: row.category,
    total: row.total,
    count: row.count,
    lastDate: row.lastDate ?? undefined,
  })),
});

export const toApiDisbursementBody = (
  input: Pick<DisbursementEntry, "kind" | "category" | "amount" | "content">,
  fileIds: string[],
): ApiDisbursementBody => ({
  kind: input.kind ?? "disburse",
  category: input.category,
  amount: input.amount,
  content: input.content?.trim() || null,
  fileIds,
});

export const toProjectActivityEntry = (log: ApiAuditLog): ActivityEntry => ({
  id: log.id,
  at: log.at,
  actorName: log.actorName || "Hệ thống",
  actorRole: log.actorRole ?? undefined,
  module: "Dự án & Công trình",
  action: log.action,
  targetType: "project",
  targetId: log.targetId ?? undefined,
  targetName: log.targetName ?? undefined,
  changes: log.changes ?? [],
  note: log.note ?? undefined,
});
