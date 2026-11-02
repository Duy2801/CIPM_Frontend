"use client";

import { useMemo } from "react";
import { getDepartmentStaff } from "../constants/procedure-department-templates";
import type { ProcedureStep } from "../types/procedure.types";

export function useStepStaff() {
  const staffList = useMemo(() => getDepartmentStaff(), []);
  const staffOptions = useMemo(
    () => staffList.map((st) => ({ value: st.name, label: `${st.name} (${st.title})` })),
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
