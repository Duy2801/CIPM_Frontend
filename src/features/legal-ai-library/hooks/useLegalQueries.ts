"use client";

import { useQuery } from "@tanstack/react-query";
import * as legalApi from "../services/legal.api";

/** Khóa cache dữ liệu thư viện; sau mỗi thao tác ghi chỉ cần làm mới `legalKeys.all` */
export const legalKeys = {
  all: ["legal-library"] as const,
  documents: () => [...legalKeys.all, "documents"] as const,
  document: (documentId: string) => [...legalKeys.all, "documents", documentId] as const,
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
