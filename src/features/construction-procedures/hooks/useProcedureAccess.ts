"use client";

import { useAuth } from "@/features/auth";
import { hasMatrixPermission } from "@/access-control";

export function useProcedureAccess() {
  const { user } = useAuth();

  return {
    canConfigureProcedure: hasMatrixPermission(user, "procedure:config_template"),
    canApproveProcedure: hasMatrixPermission(user, "procedure:approve_template"),
    operatorName: user?.displayName || user?.name || "Cán bộ quản lý",
    operatorRole: user?.roleName || "Cán bộ Ban QLDA",
  };
}
