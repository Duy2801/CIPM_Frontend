import type { ProcedureStep } from "@/shared/construction-procedures/types/procedure.types";

export type ProcedureSource = { id: string; name: string; steps: ProcedureStep[] };

export interface ProcedureChanges {
  remove: string[];
  add: { department: string; procedure: ProcedureSource }[];
  labels: Record<string, string>;
}

export interface ProjectProcedureSync {
  departments: string[];
  actualProgress: number;
}

export type StepDraft = Partial<
  Pick<ProcedureStep, "assignedTo" | "assignedToId" | "assignedBy" | "assignedAt" | "startDatePlanned" | "endDatePlanned">
>;
