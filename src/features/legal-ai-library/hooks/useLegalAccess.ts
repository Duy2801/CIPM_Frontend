"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { getLegalAiPermissions } from "../utils/legal-ai-permissions";

/** Quyền của người đang đăng nhập trong Thư viện Pháp lý (theo ma trận phân quyền BRD Mục 5) */
export function useLegalPermissions() {
  const currentUser = useAuthStore((state) => state.user);
  const permissions = useMemo(() => getLegalAiPermissions(currentUser), [currentUser]);
  return { permissions, currentUser };
}

/** Có được thêm / sửa văn bản không */
export function useCanManageLegalDocuments() {
  return useLegalPermissions().permissions.canCreateDocument;
}
