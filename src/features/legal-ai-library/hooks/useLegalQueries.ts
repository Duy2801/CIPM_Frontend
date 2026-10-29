"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActivityLogVersion } from "@/features/personnel-assignment/hooks/useActivityLogVersion";
import * as legalApi from "../services/legal.api";
import type { AttachedDocumentFile, LegalDocument } from "../types/legal-ai.types";

/** Khóa cache dữ liệu thư viện; sau mỗi thao tác ghi chỉ cần làm mới `legalKeys.all` */
export const legalKeys = {
  all: ["legal-library"] as const,
  documents: () => [...legalKeys.all, "documents"] as const,
  document: (documentId: string) => [...legalKeys.all, "documents", documentId] as const,
  history: (documentId?: string) => [...legalKeys.all, "history", documentId ?? "all"] as const,
  file: (documentId: string, fileId: string) => [...legalKeys.all, "file", documentId, fileId] as const,
};

/** Danh sách văn bản trong thư viện */
export function useLegalDocuments() {
  return useQuery({ queryKey: legalKeys.documents(), queryFn: legalApi.getDocuments });
}

/** Một văn bản */
export function useLegalDocument(documentId: string | null | undefined) {
  return useQuery({
    queryKey: legalKeys.document(documentId ?? ""),
    queryFn: () => legalApi.getDocument(documentId!),
    enabled: Boolean(documentId),
  });
}

/** Lịch sử thay đổi của thư viện, hoặc của một văn bản (bản mock: đọc lại khi nhật ký trình duyệt có dòng mới) */
export function useLegalHistory(documentId?: string) {
  const logVersion = useActivityLogVersion();
  return useQuery({
    queryKey: [...legalKeys.history(documentId), logVersion],
    queryFn: () => legalApi.getLegalHistory(documentId),
  });
}

/**
 * Đường dẫn xem trước một tệp: tệp vừa chọn đọc ngay, tệp trên backend tải về kèm token rồi tạo đường dẫn tạm
 * (thu hồi khi đổi tệp / đóng). Tệp mẫu có sẵn đường dẫn công khai thì dùng luôn.
 */
export function useLegalFileUrl(document: LegalDocument, file?: AttachedDocumentFile) {
  const needsDownload = Boolean(file && !file.rawFile && file.url?.startsWith("/api/"));
  const { data: blob, isFetching } = useQuery({
    queryKey: legalKeys.file(document.id, file?.id ?? ""),
    queryFn: () => legalApi.getFileBlob(document, file!),
    enabled: needsDownload,
    staleTime: Infinity,
  });
  const source = file?.rawFile ?? (needsDownload ? blob : null);
  const url = useMemo(
    () => (source ? URL.createObjectURL(source) : needsDownload ? undefined : file?.url),
    [source, needsDownload, file],
  );
  useEffect(() => {
    if (!source || !url) return;
    return () => URL.revokeObjectURL(url);
  }, [source, url]);
  return { url, loading: isFetching };
}
