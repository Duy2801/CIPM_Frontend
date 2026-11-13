"use client";

import { hasMatrixPermission } from "@/access-control";
import { useAuth } from "@/features/auth";

export function useReportPermissions() {
  const { user } = useAuth();
  return {
    canImport: hasMatrixPermission(user, "report:import"),
    canExport: hasMatrixPermission(user, "report:export"),
    canConfigure: hasMatrixPermission(user, "report:configure"),
  };
}
