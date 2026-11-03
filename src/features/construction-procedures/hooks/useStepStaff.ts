"use client";

import { useMemo } from "react";
import { useStaffList } from "@/features/personnel-assignment/hooks/usePersonnelQueries";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { getDepartmentStaff } from "../constants/procedure-department-templates";
import type { ProcedureStep } from "../types/procedure.types";

/**
 * Cán bộ chọn làm người thực hiện bước.
 * Tài khoản thật: lấy danh sách cán bộ của backend (backend chỉ nhận mã cán bộ của chính nó); thử nghiệm: dữ liệu mẫu.
 */
export function useStepStaff() {
  const backendStaff = useStaffList();
  const isBackend = hasBackendSession();
  const staffList = useMemo(
    () =>
      isBackend
        ? (backendStaff.data ?? []).filter((s) => s.accountActive !== false)
        : getDepartmentStaff(),
    [isBackend, backendStaff.data],
  );
  const staffOptions = useMemo(
    () => staffList.map((st) => ({ value: st.name, label: st.title ? `${st.name} (${st.title})` : st.name })),
    [staffList],
  );

  const findStaff = (name?: string) => (name ? staffList.find((st) => st.name === name) : undefined);

  const buildAssignment = (
    name?: string,
  ): Pick<ProcedureStep, "assignedTo" | "assignedToId" | "assignedBy" | "assignedAt"> => ({
    assignedTo: name || undefined,
    assignedToId: findStaff(name)?.id,
    assignedBy: undefined,
    assignedAt: name ? new Date().toISOString().slice(0, 10) : undefined,
  });

  return {
    staffOptions,
    emailOf: (name?: string): string | undefined => findStaff(name)?.email,
    staffIdOf: (name?: string): string | undefined => findStaff(name)?.id,
    buildAssignment,
  };
}

export type StepStaff = ReturnType<typeof useStepStaff>;
