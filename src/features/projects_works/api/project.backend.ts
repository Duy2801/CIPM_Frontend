import apiClient from "@/config";
import type { ApiAuditLog } from "@/features/personnel-assignment/services/personnel.mapper";
import type {
  ApiDisbursementBody,
  ApiDisbursementCreated,
  ApiDisbursementList,
  ApiProgressBody,
  ApiProject,
  ApiProjectBody,
  ApiProjectFile,
  ApiProjectPage,
  ApiProjectProcedure,
  ApiProjectProceduresBody,
  ApiProjectProceduresResult,
  ApiProjectQuery,
  ApiProjectStatus,
  ApiProjectUpdateBody,
} from "../services/project.mapper";

export async function getProjectsPageApi(query: ApiProjectQuery): Promise<ApiProjectPage> {
  return (await apiClient.get<ApiProjectPage>("projects", { params: query })).data;
}

export async function setProjectStatusApi(projectId: string, status: ApiProjectStatus): Promise<{ id: string; status: ApiProjectStatus }> {
  return (await apiClient.patch<{ id: string; status: ApiProjectStatus }>(`projects/${projectId}/status`, { status })).data;
}

export async function createProjectApi(body: ApiProjectBody): Promise<ApiProject> {
  return (await apiClient.post<ApiProject>("projects", body)).data;
}

export async function uploadProjectFileApi(file: File): Promise<ApiProjectFile> {
  const form = new FormData();
  form.append("file", file);
  return (
    await apiClient.post<ApiProjectFile>("projects/files", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    })
  ).data;
}

export async function downloadProjectFileApi(projectId: string, fileId: string): Promise<Blob> {
  return apiClient.get<never, Blob>(`projects/${projectId}/files/${fileId}`, { responseType: "blob", timeout: 120_000 });
}

export async function getProjectApi(projectId: string): Promise<ApiProject> {
  return (await apiClient.get<ApiProject>(`projects/${projectId}`)).data;
}

export async function updateProjectApi(projectId: string, body: ApiProjectUpdateBody): Promise<ApiProject> {
  return (await apiClient.patch<ApiProject>(`projects/${projectId}`, body)).data;
}

export async function updateProjectProceduresApi(
  projectId: string,
  body: ApiProjectProceduresBody,
): Promise<ApiProjectProceduresResult> {
  return (await apiClient.put<ApiProjectProceduresResult>(`projects/${projectId}/procedures`, body)).data;
}

export async function getProjectProcedureApi(projectId: string, projectProcedureId?: string): Promise<ApiProjectProcedure> {
  return (await apiClient.get<ApiProjectProcedure>(`projects/${projectId}/procedure`, { params: { projectProcedureId } })).data;
}

export async function getDisbursementsApi(projectId: string): Promise<ApiDisbursementList> {
  return (await apiClient.get<ApiDisbursementList>(`projects/${projectId}/disbursements`)).data;
}

export async function createDisbursementApi(projectId: string, body: ApiDisbursementBody): Promise<ApiDisbursementCreated> {
  return (await apiClient.post<ApiDisbursementCreated>(`projects/${projectId}/disbursements`, body)).data;
}

export async function getProjectAuditLogsApi(projectId: string, date?: string): Promise<ApiAuditLog[]> {
  return (await apiClient.get<ApiAuditLog[]>("audit-logs", { params: { module: "projects", targetId: projectId, date } })).data;
}

export async function updateProgressApi(projectId: string, body: ApiProgressBody): Promise<ApiProject> {
  return (await apiClient.post<ApiProject>(`projects/${projectId}/progress`, body)).data;
}
