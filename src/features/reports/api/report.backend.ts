import apiClient from "@/config";
import type { ApiReportFile, ApiReportType } from "../services/report.mapper";

export async function getReportTypesApi(): Promise<ApiReportType[]> {
  return (await apiClient.get<ApiReportType[]>("reports/types")).data;
}

export async function createReportTypeApi(name: string): Promise<ApiReportType> {
  return (await apiClient.post<ApiReportType>("reports/types", { name })).data;
}

export async function deleteReportTypeApi(typeId: string): Promise<void> {
  await apiClient.delete(`reports/types/${typeId}`);
}

export async function getReportsApi(): Promise<ApiReportFile[]> {
  return (await apiClient.get<ApiReportFile[]>("reports")).data;
}

export async function uploadReportApi(typeId: string, file: File): Promise<ApiReportFile> {
  const form = new FormData();
  form.append("typeId", typeId);
  form.append("file", file);
  return (
    await apiClient.post<ApiReportFile>("reports", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    })
  ).data;
}

export async function downloadReportApi(reportId: string, inline: boolean): Promise<Blob> {
  return apiClient.get<never, Blob>(`reports/${reportId}/file`, {
    params: { inline },
    responseType: "blob",
    timeout: 120_000,
  });
}

