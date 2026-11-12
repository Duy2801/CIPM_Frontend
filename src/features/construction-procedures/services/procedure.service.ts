import { hasBackendSession, withBackend } from "@/features/personnel-assignment/services/backend";
import * as backend from "../api/procedure.backend";
import type { ProcedureStep } from "../types/procedure.types";
import {
  approveProcedure as approveMock,
  createProcedure as createMock,
  loadBackendProcedureCategories,
  loadProcedureLibrary,
  markProcedureUpdated,
  patchBackendProcedureCache,
  saveBackendProcedureCache,
  saveProcedureSteps as saveStepsMock,
  setBackendProcedureCategory,
  setProcedureEnabled,
  submitProcedure as submitMock,
  type CreateProcedureInput,
  type ProcedureLibraryItem,
} from "../utils/procedure-library";
import type { ActivityEntry } from "@/features/personnel-assignment/utils/activity-log";
import { isBackendId, toLibraryItem, toProcedureActivityEntry, toProcedureSteps, toStepInput } from "./procedure.mapper";

/**
 * Quy trình thủ tục (Module 3): đăng nhập tài khoản thật thì gọi backend (api/procedure.backend.ts),
 * lưu bản sao để các màn khác đọc đồng bộ; tài khoản thử nghiệm / mất kết nối thì chạy trên dữ liệu mẫu.
 * Mọi hàm ném Error kèm câu báo lỗi của backend khi thất bại.
 */

const cachedItem = (id: string) => loadProcedureLibrary().find((p) => p.id === id);

/** 1.1 + 2.1 Tải thư viện quy trình (kèm các bước của từng quy trình) và làm mới bản sao */
export async function fetchProcedureLibrary(): Promise<ProcedureLibraryItem[]> {
  return withBackend(
    async () => {
      const list = await backend.listProceduresApi();
      const details = await Promise.all(list.map((p) => backend.getProcedureApi(p.id)));
      const categories = loadBackendProcedureCategories();
      const items = details.map((d) => toLibraryItem(d, toProcedureSteps(d.steps), categories[d.id]));
      saveBackendProcedureCache(items);
      return items;
    },
    () => loadProcedureLibrary(),
  );
}

/** 2.1 Tải lại một quy trình */
export async function fetchProcedure(id: string): Promise<ProcedureLibraryItem | undefined> {
  return withBackend(
    async () => {
      const detail = await backend.getProcedureApi(id);
      const item = toLibraryItem(detail, toProcedureSteps(detail.steps), loadBackendProcedureCategories()[id]);
      patchBackendProcedureCache(id, item);
      return item;
    },
    () => cachedItem(id),
  );
}

/** 1.2 Bật / tắt quy trình */
export async function toggleProcedure(id: string, enabled: boolean): Promise<void> {
  await withBackend(
    async () => {
      const res = await backend.toggleProcedureApi(id, enabled);
      patchBackendProcedureCache(id, { enabled: res.enabled, status: res.status });
    },
    () => setProcedureEnabled(id, enabled),
  );
}

/** 2.2 Nộp quy trình: Đang xử lý → Chờ duyệt */
export async function submitProcedureForReview(id: string, actorName: string): Promise<void> {
  await withBackend(
    async () => {
      const res = await backend.submitProcedureApi(id);
      patchBackendProcedureCache(id, {
        status: res.status,
        submittedBy: res.submittedBy?.fullName ?? actorName,
        submittedAt: res.submittedAt ?? new Date().toISOString(),
      });
    },
    () => submitMock(id, actorName),
  );
}

/** 2.3 Duyệt quy trình: Chờ duyệt → Đang áp dụng */
export async function approveProcedureReview(id: string, actorName: string): Promise<void> {
  await withBackend(
    async () => {
      const res = await backend.approveProcedureApi(id);
      patchBackendProcedureCache(id, {
        status: res.status,
        approvedBy: res.approvedBy?.fullName ?? actorName,
        approvedAt: res.approvedAt ?? new Date().toISOString(),
      });
    },
    () => approveMock(id, actorName),
  );
}

/**
 * 2.5 Tự lưu toàn bộ danh sách bước. Trả về các bước sau khi lưu:
 * backend cấp mã thật cho bước mới, màn hình phải dùng lại danh sách này để lần lưu sau khớp mã.
 */
export async function saveProcedureSteps(id: string, steps: ProcedureStep[], actorName: string): Promise<ProcedureStep[]> {
  return withBackend(
    async () => {
      const res = await backend.updateStepsApi(id, {
        steps: steps.map(toStepInput),
        // Người khác vừa sửa quy trình → backend trả 409, tránh ghi đè
        expectedUpdatedAt: cachedItem(id)?.updatedAt ?? undefined,
      });
      const saved = toProcedureSteps(res.steps);
      patchBackendProcedureCache(id, { steps: saved, updatedAt: res.updatedAt, updatedBy: res.updatedBy?.fullName ?? actorName });
      return saved;
    },
    () => {
      saveStepsMock(id, steps);
      markProcedureUpdated(id, actorName);
      return steps;
    },
  );
}

/** 2.4 Đổi thứ tự làm của một bước (song song với bước khác / tách thành lượt riêng) */
export async function moveProcedureStepStage(
  id: string,
  stepId: string,
  drop: { parallelWith: string } | { insertAt: number },
): Promise<ProcedureStep[] | null> {
  // Chỉ gọi khi cả hai bước đã có mã backend; còn lại để màn hình tự đổi và tự lưu (2.5)
  const partner = "parallelWith" in drop ? drop.parallelWith : undefined;
  if (!hasBackendSession() || !isBackendId(stepId) || (partner !== undefined && !isBackendId(partner))) return null;
  return withBackend(
    async () => {
      const res = await backend.moveStepStageApi(id, stepId, {
        ...drop,
        expectedUpdatedAt: cachedItem(id)?.updatedAt ?? undefined,
      });
      const saved = toProcedureSteps(res.steps);
      patchBackendProcedureCache(id, { steps: saved, updatedAt: res.updatedAt, updatedBy: res.updatedBy?.fullName });
      return saved;
    },
    () => null,
  );
}

/** 3.1 Tạo quy trình mới */
export async function createProcedure(input: CreateProcedureInput): Promise<void> {
  await withBackend(
    async () => {
      const created = await backend.createProcedureApi({
        name: input.name.trim(),
        version: input.version?.trim() || undefined,
        steps: input.steps.map(toStepInput),
      });
      if (input.category) setBackendProcedureCategory(created.id, input.category);
      saveBackendProcedureCache([
        toLibraryItem(created, toProcedureSteps(created.steps), input.category),
        ...loadProcedureLibrary().filter((p) => p.id !== created.id),
      ]);
    },
    () => {
      createMock(input);
    },
  );
}

/**
 * Lịch sử thay đổi của một quy trình từ backend (audit log).
 * Trả về null khi không dùng backend (tài khoản thử nghiệm / quy trình mẫu / mất kết nối) để màn hình dùng lịch sử mẫu.
 */
export async function fetchProcedureHistory(id: string): Promise<ActivityEntry[] | null> {
  if (!isBackendId(id)) return hasBackendSession() ? [] : null;
  return withBackend(
    async () => (await backend.getProcedureAuditLogsApi(id)).map(toProcedureActivityEntry),
    () => null,
  );
}
