import apiClient from "@/config";

export interface ApiProjectFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: string;
  url?: string;
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
