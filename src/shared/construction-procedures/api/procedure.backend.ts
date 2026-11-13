import apiClient from "@/config";
import type {
  ApiProcedure,
  ApiProcedureDetail,
  ApiProcedureReview,
  ApiProcedureToggle,
  ApiStepInput,
  ApiStepsUpdate,
} from "../services/procedure.mapper";

/**
 * Các API Quy trình thủ tục (Module 3) của backend thật — chỉ gọi API, không xử lý thêm.
 * Chuyển dữ liệu sang dạng màn hình dùng + chạy bản mock khi không có backend: services/procedure.service.ts.
 */

/** 1.1 GET /procedures — danh sách quy trình */
export async function listProceduresApi(params: { q?: string; enabled?: boolean } = {}): Promise<ApiProcedure[]> {
  return (await apiClient.get<ApiProcedure[]>("procedures", { params })).data;
}

/** 1.2 PATCH /procedures/:id — bật / tắt quy trình */
export async function toggleProcedureApi(id: string, enabled: boolean): Promise<ApiProcedureToggle> {
  return (await apiClient.patch<ApiProcedureToggle>(`procedures/${id}`, { enabled })).data;
}

/** 2.1 GET /procedures/:id — chi tiết quy trình + các bước */
export async function getProcedureApi(id: string): Promise<ApiProcedureDetail> {
  return (await apiClient.get<ApiProcedureDetail>(`procedures/${id}`)).data;
}

/** 2.2 POST /procedures/:id/submit — nộp quy trình (Đang xử lý → Chờ duyệt) */
export async function submitProcedureApi(id: string): Promise<ApiProcedureReview> {
  return (await apiClient.post<ApiProcedureReview>(`procedures/${id}/submit`)).data;
}

/** 2.3 POST /procedures/:id/approve — duyệt quy trình (Chờ duyệt → Đang áp dụng) */
export async function approveProcedureApi(id: string): Promise<ApiProcedureReview> {
  return (await apiClient.post<ApiProcedureReview>(`procedures/${id}/approve`)).data;
}

/** 2.4 PATCH /procedures/:id/steps/:stepId/stage — làm song song với bước khác hoặc tách thành lượt riêng */
export async function moveStepStageApi(
  id: string,
  stepId: string,
  body: { parallelWith?: string; insertAt?: number; expectedUpdatedAt?: string },
): Promise<ApiStepsUpdate> {
  return (await apiClient.patch<ApiStepsUpdate>(`procedures/${id}/steps/${stepId}/stage`, body)).data;
}

/** 2.5 PUT /procedures/:id/steps — lưu toàn bộ danh sách bước (tự lưu) */
export async function updateStepsApi(
  id: string,
  body: { steps: ApiStepInput[]; expectedUpdatedAt?: string },
): Promise<ApiStepsUpdate> {
  return (await apiClient.put<ApiStepsUpdate>(`procedures/${id}/steps`, body)).data;
}

/** 3.1 POST /procedures — tạo quy trình mới */
export async function createProcedureApi(body: {
  name: string;
  version?: string;
  steps: ApiStepInput[];
}): Promise<ApiProcedureDetail> {
  return (await apiClient.post<ApiProcedureDetail>("procedures", body)).data;
}
