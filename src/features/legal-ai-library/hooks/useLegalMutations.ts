"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { appendActivity } from "@/features/personnel-assignment/utils/activity-log";
import { useAuthStore } from "@/stores/auth.store";
import { LEGAL_LOG_MODULE, STATUS_META, getCategoryLabel } from "../constants/legal-labels";
import * as legalApi from "../services/legal.api";
import type { LegalDocument } from "../types/legal-ai.types";
import { describeLegalChanges, type LegalDocumentPatch } from "../utils/document-changes";
import { legalKeys } from "./useLegalQueries";

type LogEntry = Omit<Parameters<typeof appendActivity>[0], "actorName" | "actorRole" | "module">;

/** Ghi nhật ký thao tác thư viện; người thực hiện lấy theo tài khoản đang đăng nhập */
function useLegalActivityLogger() {
  const currentUser = useAuthStore((state) => state.user);
  return (entry: LogEntry) =>
    appendActivity({
      ...entry,
      module: LEGAL_LOG_MODULE,
      actorName: currentUser?.displayName || currentUser?.name || "Không rõ",
      actorRole: currentUser?.roleName,
    });
}

/**
 * Khung chung cho thao tác ghi: gọi API → làm mới dữ liệu thư viện → báo thành công → ghi nhật ký.
 * `run` trả về kết quả khi thành công, null khi lỗi (đã báo lỗi bằng toast).
 */
function useLegalAction<TVars, TResult>(
  action: (vars: TVars) => Promise<TResult>,
  options: {
    successText?: (vars: TVars, result: TResult) => string;
    log: (vars: TVars, result: TResult) => LogEntry;
  },
) {
  const queryClient = useQueryClient();
  const logActivity = useLegalActivityLogger();
  const mutation = useMutation({ mutationFn: action });

  const run = async (vars: TVars): Promise<TResult | null> => {
    try {
      const result = await mutation.mutateAsync(vars);
      await queryClient.invalidateQueries({ queryKey: legalKeys.all });
      const text = options.successText?.(vars, result);
      if (text) toast.success(text);
      logActivity(options.log(vars, result));
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể hoàn tất thao tác, vui lòng thử lại.");
      return null;
    }
  };

  return { run, isPending: mutation.isPending };
}

/** Thêm văn bản vào thư viện */
export function useCreateLegalDocument() {
  return useLegalAction((input: Omit<LegalDocument, "id">) => legalApi.createDocument(input), {
    log: (_input, created) => ({
      action: `Thêm văn bản: ${created.code}`,
      targetId: created.id,
      targetName: created.title || created.code,
      changes: [
        { label: "Loại văn bản", to: getCategoryLabel(created.category) },
        { label: "Cơ quan ban hành", to: created.issuer },
        { label: "Tình trạng", to: STATUS_META[created.status].label },
      ],
    }),
  });
}

/** Lưu các trường đã sửa của một văn bản (kèm danh sách "cũ → mới" vào nhật ký) */
export function useUpdateLegalDocument() {
  return useLegalAction(
    async ({ original, patch }: { original: LegalDocument; patch: LegalDocumentPatch }) =>
      legalApi.updateDocument(original.id, patch),
    {
      successText: ({ original, patch }) =>
        `Đã lưu ${Object.keys(patch).length} thay đổi của văn bản ${original.code}.`,
      log: ({ original, patch }, updated) => ({
        action: `Cập nhật văn bản: ${updated.code}`,
        targetId: updated.id,
        targetName: updated.title || updated.code,
        changes: describeLegalChanges(original, patch).map(({ label, from, to }) => ({ label, from, to })),
      }),
    },
  );
}
