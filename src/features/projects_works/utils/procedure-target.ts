import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import type { ProjectProcedureData } from "@/features/construction-procedures/types/procedure.types";
import { DEPARTMENT_OPTIONS } from "../constants/project-enums";
import { sameDepartmentKey } from "./project-procedure-data";
import { getAppliedDepartments } from "./project-procedure-flow";

export const procedureDepartment = (procedure: ProcedureLibraryItem) =>
  procedure.department
    ? (DEPARTMENT_OPTIONS.find((d) => isSameDepartment(d.value, procedure.department))?.value ?? procedure.department)
    : undefined;

export const procedureTarget = (procedure: ProcedureLibraryItem, procedures: Record<string, string>) => {
  const dept =
    procedureDepartment(procedure) ??
    DEPARTMENT_OPTIONS.find((d) => !procedures[d.value])?.value ??
    DEPARTMENT_OPTIONS[0].value;
  if (!procedures[dept] || procedures[dept] === procedure.id) return dept;
  for (let n = 2; ; n++) {
    const key = `${dept} (${n})`;
    if (!procedures[key] || procedures[key] === procedure.id) return key;
  }
};

export const departmentName = (key: string) => key.replace(/\s\(\d+\)$/, "");

export function shortProcedureLabel(name: string): string {
  const rest = name.replace(/^\s*quy\s+trình\s*/i, "").trim();
  return rest ? rest.charAt(0).toLocaleUpperCase("vi") + rest.slice(1) : name;
}

export function procedureTabLabel(data: Pick<ProjectProcedureData, "departmentStatuses">, department: string): string {
  const status = Object.entries(data.departmentStatuses ?? {}).find(([key]) => sameDepartmentKey(key, department))?.[1];
  return status?.tabLabel || shortProcedureLabel(status?.procedureName ?? department);
}

export function procedureHeadings(data: Pick<ProjectProcedureData, "departmentStatuses" | "steps">): string[] {
  const departments = getAppliedDepartments(data.departmentStatuses, data.steps);
  return [...new Set(departments.map((dept) => procedureTabLabel(data, dept)))];
}
