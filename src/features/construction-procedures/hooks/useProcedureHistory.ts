"use client";

import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/project.store";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import type { ProjectProcedureData, StepChange } from "../types/procedure.types";
import { buildAutoSaveLog, loadLibraryHistory, saveLibraryHistory } from "../utils/procedure-library-history";
import { loadProcedureProjects } from "../utils/project-procedure-storage";

export function useProcedureHistory(actor: { name: string; role: string }) {
  const sharedProjects = useProjectStore((s) => s.projects);
  const [libraryHistory, setLibraryHistory] = useState(loadLibraryHistory);
  const [projectProcedures] = useState(() => (hasBackendSession() ? [] : loadProcedureProjects()));

  const historyProjects = useMemo<ProjectProcedureData[]>(() => {
    const projects = projectProcedures.map((p) => {
      const shared = sharedProjects.find((sp) =>
        [p.projectId, p.projectCode].some((key) => key && (key === sp.id || key === sp.code)),
      );
      return shared ? { ...p, projectId: shared.id, projectCode: shared.code, projectName: shared.name } : p;
    });
    return [
      {
        projectId: "PROCEDURE-LIBRARY",
        projectCode: "QT",
        projectName: "Danh mục quy trình",
        projectType: "",
        totalInvestment: 0,
        managerName: "",
        supervisorName: "",
        startDate: "",
        expectedFinishDate: "",
        steps: [],
        history: libraryHistory,
      },
      ...projects,
    ];
  }, [libraryHistory, projectProcedures, sharedProjects]);

  const recordAutoSave = (procedureId: string, procedureName: string, changes: StepChange[]) => {
    const log = buildAutoSaveLog(procedureId, procedureName, changes, actor);
    setLibraryHistory((prev) => {
      const next = [log, ...prev];
      saveLibraryHistory(next);
      return next;
    });
  };

  return { historyProjects, recordAutoSave };
}
