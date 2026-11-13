"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { projectKeys, useProjectList } from "@/shared/projects_works/hooks/useProjectList";
import { getProjectProcedure } from "@/shared/projects_works/services/project.api";
import { withPlannedDates } from "@/shared/projects_works/utils/step-schedule";
import { MOCK_SCHEDULE, mockProjectProgress, mockStepSchedule } from "../constants/dashboard-mock-data";
import { buildScheduleKpi, buildTaskKpi } from "../utils/schedule-kpi";

export function useDashboardSchedule() {
  const { projects } = useProjectList();
  const procedures = useQueries({
    queries: projects.map((project) => ({
      queryKey: projectKeys.procedure(project.id),
      queryFn: () => getProjectProcedure(project),
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      loading: results.some((r) => r.isLoading),
    }),
  });

  const projectKpi = useMemo(
    () => buildScheduleKpi(MOCK_SCHEDULE ? projects.map(mockProjectProgress) : projects),
    [projects],
  );
  const stepsByProject = useMemo(
    () =>
      projects.map((project, i) => ({
        id: project.id,
        code: project.code,
        name: project.name,
        steps: procedures.data[i]
          ? withPlannedDates(procedures.data[i]!.steps, project.startDate).map((step) =>
              MOCK_SCHEDULE ? mockStepSchedule(step, project.id) : step,
            )
          : [],
      })),
    [procedures.data, projects],
  );
  const taskKpi = useMemo(() => buildTaskKpi(stepsByProject.flatMap((p) => p.steps)), [stepsByProject]);

  return { projects: projectKpi, tasks: taskKpi, stepsByProject, loadingTasks: procedures.loading };
}
