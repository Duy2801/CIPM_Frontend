import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import { saveProjectProcedure } from "@/features/construction-procedures/utils/project-procedure-storage";
import { loadProcedureLibrary } from "@/features/construction-procedures/utils/procedure-library";
import type { ProcedureStep, ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import type { ProcedureSource } from "../types/project-procedure.types";
import type { ProjectItem } from "../types/project.types";
import { withPlannedDates } from "./step-schedule";

const SLOT_SUFFIX = /\s\(\d+\)$/;
export function sameDepartmentKey(a: string, b: string): boolean {
  if (a === b) return true;
  if (SLOT_SUFFIX.test(a) || SLOT_SUFFIX.test(b)) return false;
  return isSameDepartment(a, b);
}

export function createEmptyProcedure(project: ProjectItem): ProjectProcedureData {
  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    projectType: project.type,
    totalInvestment: project.totalInvestment,
    managerName: project.managerName,
    supervisorName: project.supervisorName,
    startDate: project.startDate,
    expectedFinishDate: project.endDatePlanned || project.startDate,
    departments: project.departments ?? [],
    departmentStatuses: {},
    directorApproval: { status: "PENDING" },
    stageApprovals: {},
    steps: [],
    history: [],
  };
}

export function toDepartmentSteps(projectId: string, department: string, procedure: ProcedureSource): ProcedureStep[] {
  const prefix = `${projectId}-${department}`.replace(/\s+/g, "_");
  return procedure.steps.map<ProcedureStep>((s) => ({
    ...s,
    id: `${prefix}-${s.id}`,
    department,
    responsibleUnit: s.responsibleUnit && s.responsibleUnit !== "Chủ đầu tư" ? s.responsibleUnit : department,
    status: s.isEnabled ? "NOT_STARTED" : "DISABLED",
    submissionStatus: undefined,
    attachments: [],
  }));
}

export function withProcedureAssignees(data: ProjectProcedureData): ProjectProcedureData {
  const library = loadProcedureLibrary();
  let changed = false;
  const steps = data.steps.map((step) => {
    if (step.assignedTo || !step.department) return step;
    const procedureId = data.departmentStatuses?.[step.department]?.procedureId;
    const source = library.find((p) => p.id === procedureId)?.steps.find((s) => s.code === step.code);
    if (!source?.assignedTo) return step;
    changed = true;
    return { ...step, assignedTo: source.assignedTo, assignedToId: source.assignedToId };
  });
  return changed ? { ...data, steps } : data;
}

export const applyLog = (department: string, procedure: ProcedureSource, stepCount: number) => ({
  stepId: "DEPT-CONFIG",
  stepCode: "THIET-LAP",
  stepName: `Quy trình ${department}`,
  action: "TOGGLE_STEP" as const,
  actionLabel: "Cấu hình quy trình phòng ban",
  details: `Áp dụng "${procedure.name}" (${stepCount} bước) cho ${department}.`,
});

export function initProjectProcedure(
  project: ProjectItem,
  selections: { department: string; procedure: ProcedureSource; tabLabel?: string }[],
  actor: { name: string; role: string },
) {
  if (selections.length === 0) return;
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const steps = selections.map(({ department, procedure }) => toDepartmentSteps(project.id, department, procedure));
  saveProjectProcedure({
    ...createEmptyProcedure(project),
    steps: withPlannedDates(steps.flat(), project.startDate),
    departmentStatuses: Object.fromEntries(
      selections.map(({ department, procedure, tabLabel }) => [
        department,
        {
          department,
          isCompletedByLead: false,
          procedureId: procedure.id,
          procedureName: procedure.name,
          tabLabel: tabLabel?.trim() || undefined,
        },
      ]),
    ),
    history: selections.map(({ department, procedure }, i) => ({
      ...applyLog(department, procedure, steps[i].length),
      id: `LOG-${Date.now()}-${i}`,
      timestamp,
      performedBy: actor.name,
      role: actor.role,
    })),
  });
}
