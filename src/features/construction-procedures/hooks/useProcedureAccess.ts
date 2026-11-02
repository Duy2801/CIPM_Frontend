"use client";

import { useAuth } from "@/features/auth";
import { canUserDo, hasMatrixPermission } from "@/access-control";

export function useProcedureAccess() {
  const { user } = useAuth();

  const canUpdateProcedure =
    canUserDo(user, "m3_construction_procedures", "input") || hasMatrixPermission(user, "m3.update_step");

  const canConfigureProcedure =
    canUserDo(user, "m3_construction_procedures", "configure") ||
    hasMatrixPermission(user, "m3.config_template") ||
    canUpdateProcedure;

  const canApproveProcedure =
    canUserDo(user, "m3_construction_procedures", "approve") || hasMatrixPermission(user, "m3.approve_step");

  return {
    canConfigureProcedure,
    canApproveProcedure,
    operatorName: user?.displayName || user?.name || "Cán bộ quản lý",
    operatorRole: user?.roleName || "Cán bộ Ban QLDA",
  };
}
