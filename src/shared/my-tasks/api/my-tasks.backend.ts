import apiClient from "@/config";
import type { ApiProjectStep } from "@/shared/projects_works/services/project.mapper";
import type { TaskRef } from "../utils/my-task-data";
import type { ApiMyTaskProject, ApiStepDocumentInput, ApiStepLog } from "../services/my-tasks.mapper";

const stepUrl = ({ projectId, stepId }: TaskRef, action = "") =>
  `projects/${projectId}/procedure/steps/${stepId}${action ? `/${action}` : ""}`;

export async function getMyTasksApi(): Promise<ApiMyTaskProject[]> {
  return (await apiClient.get<ApiMyTaskProject[]>("my-tasks")).data;
}

export async function getStepHistoryApi(ref: TaskRef): Promise<ApiStepLog[]> {
  return (await apiClient.get<ApiStepLog[]>(stepUrl(ref, "history"))).data;
}

export async function acceptStepApi(ref: TaskRef): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "accept"))).data;
}

export async function submitStepApi(ref: TaskRef): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "submit"))).data;
}

export async function approveStepApi(ref: TaskRef): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "approve"))).data;
}

export async function rejectStepApi(ref: TaskRef, reason: string): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "return"), { reason })).data;
}

export async function reportIncidentApi(ref: TaskRef, reason: string): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "incident"), { reason })).data;
}

export async function resolveIncidentApi(ref: TaskRef): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "incident/resolve"))).data;
}

export async function declineStepApi(ref: TaskRef, reason: string): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "decline"), { reason })).data;
}

export async function giveBackStepApi(ref: TaskRef, reason: string | null): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "give-back"), { reason })).data;
}

export async function saveStepNoteApi(ref: TaskRef, note: string): Promise<ApiProjectStep> {
  return (await apiClient.patch<ApiProjectStep>(stepUrl(ref, "note"), { note })).data;
}

export async function addStepDocumentsApi(ref: TaskRef, documents: ApiStepDocumentInput[]): Promise<ApiProjectStep> {
  return (await apiClient.post<ApiProjectStep>(stepUrl(ref, "documents"), { documents })).data;
}

export async function removeStepDocumentApi(ref: TaskRef, documentId: string): Promise<ApiProjectStep> {
  return (await apiClient.delete<ApiProjectStep>(stepUrl(ref, `documents/${documentId}`))).data;
}
