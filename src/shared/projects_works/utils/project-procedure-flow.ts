
import type {
  ProcedureStep,
  StageApprovalStatus,
} from "@/shared/construction-procedures/types/procedure.types.ts";

export type StepFlowKey =
  | "DISABLED"
  | "SKIPPED"
  | "UNASSIGNED"
  | "IN_PROGRESS"
  | "RETURNED"
  | "AWAITING_APPROVAL"
  | "COMPLETED";

export function getStepFlow(step: ProcedureStep): StepFlowKey {
  if (!step.isEnabled || step.status === "DISABLED") return "DISABLED";
  if (step.status === "SKIPPED") return "SKIPPED";
  if (step.status === "COMPLETED") return "COMPLETED";
  if (step.submissionStatus === "SUBMITTED") return "AWAITING_APPROVAL";
  if (step.submissionStatus === "REJECTED") return "RETURNED";
  return step.assignedTo || step.status === "IN_PROGRESS" ? "IN_PROGRESS" : "UNASSIGNED";
}

export function isReadyToStart(step: ProcedureStep): boolean {
  return (
    step.status === "NOT_STARTED" &&
    step.isEnabled &&
    Boolean(step.assignedTo && step.startDatePlanned && step.endDatePlanned)
  );
}

export type StageState = "IN_PROGRESS" | "AWAITING_DIRECTOR" | "APPROVED" | "RETURNED";

export interface StageSummary {
  code: string;
  title: string;
  approvalKey: string;
  steps: ProcedureStep[];
  total: number;
  done: number;
  awaitingApproval: number;
  returned: number;
  state: StageState;
  approval?: StageApprovalStatus;
}

export const stageApprovalKey = (department: string, groupCode: string) => `${department}::${groupCode}`;

export function groupStepsByStage(
  department: string,
  deptSteps: ProcedureStep[],
  stageApprovals: Record<string, StageApprovalStatus> = {},
): StageSummary[] {
  const ordered = [...deptSteps].sort((a, b) => a.order - b.order);
  const stages = new Map<string, { title: string; steps: ProcedureStep[] }>();
  for (const step of ordered) {
    const stage = stages.get(step.groupCode) ?? { title: step.groupTitle, steps: [] };
    stage.steps.push(step);
    stages.set(step.groupCode, stage);
  }

  return [...stages.entries()].map(([code, { title, steps }]) => {
    const flows = steps.map(getStepFlow);
    const active = flows.filter((f) => f !== "DISABLED");
    const done = active.filter((f) => f === "COMPLETED" || f === "SKIPPED").length;
    const approvalKey = stageApprovalKey(department, code);
    const approval = stageApprovals[approvalKey] ?? stageApprovals[title];
    const allDone = active.length > 0 && done === active.length;

    let state: StageState = "IN_PROGRESS";
    if (approval?.status === "REJECTED") state = "RETURNED";
    else if (allDone) state = approval?.status === "APPROVED" ? "APPROVED" : "AWAITING_DIRECTOR";

    return {
      code,
      title,
      approvalKey,
      steps,
      total: active.length,
      done,
      awaitingApproval: flows.filter((f) => f === "AWAITING_APPROVAL").length,
      returned: flows.filter((f) => f === "RETURNED").length,
      state,
      approval,
    };
  });
}

export function getAppliedDepartments(
  departmentStatuses: Record<string, { procedureId?: string }> = {},
  steps: ProcedureStep[],
): string[] {
  return Object.keys(departmentStatuses).filter((dept) => steps.some((s) => s.department === dept));
}

export function getProcedureProgress(
  departments: string[],
  steps: ProcedureStep[],
  stageApprovals: Record<string, StageApprovalStatus> = {},
): number {
  let done = 0;
  let total = 0;
  for (const dept of departments) {
    for (const stage of groupStepsByStage(dept, steps.filter((s) => s.department === dept), stageApprovals)) {
      done += stage.done;
      total += stage.total;
    }
  }
  return total ? Math.round((done / total) * 100) : 0;
}
