import type { ProcedureHistoryLog, StepChange } from "../types/procedure.types";
import { isOrderOnlyChange } from "./step-diff.ts";

const LIBRARY_HISTORY_STORAGE_KEY = "cipm_procedure_library_history";

export function loadLibraryHistory(): ProcedureHistoryLog[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LIBRARY_HISTORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLibraryHistory(logs: ProcedureHistoryLog[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIBRARY_HISTORY_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save procedure library history", e);
  }
}

export function buildAutoSaveLog(
  procedureId: string,
  procedureName: string,
  changes: StepChange[],
  actor: { name: string; role: string },
): ProcedureHistoryLog {
  return {
    id: `LOG-${Date.now()}`,
    stepId: procedureId,
    stepCode: "QUY-TRINH",
    stepName: procedureName,
    timestamp: new Date().toISOString(),
    performedBy: actor.name,
    role: actor.role,
    action: "TOGGLE_STEP",
    actionLabel: isOrderOnlyChange(changes) ? "Cập nhật tiến độ" : "Cập nhật quy trình",
    details: `${changes.length} thay đổi trên quy trình "${procedureName}".`,
    changes,
  };
}
