"use client";

import { useMemo } from "react";
import type { ActivityItem } from "../types/dashboard.types";
import { useDashboardActivities } from "./useDashboardQueries";
import { useDashboardStore } from "./useDashboardStore";

export const ACTIVITY_PAGE_SIZE = 10;
const NO_ACTIVITIES: ActivityItem[] = [];

const projectKeyOf = (item: ActivityItem) => item.projectId || item.projectCode || item.projectName;

export function useActivityFilterOptions() {
  const { data: activities = NO_ACTIVITIES } = useDashboardActivities();
  return useMemo(() => {
    const projects = new Map<string, string>();
    const actors = new Map<string, string>();
    for (const item of activities) {
      const key = projectKeyOf(item);
      if (key && item.projectName && !projects.has(key)) {
        projects.set(key, item.projectCode ? `${item.projectName} (${item.projectCode})` : item.projectName);
      }
      if (item.actor && !actors.has(item.actor)) {
        actors.set(item.actor, item.actorTitle ? `${item.actor} (${item.actorTitle})` : item.actor);
      }
    }
    return {
      projectOptions: [...projects].map(([value, label]) => ({ value, label })),
      actorOptions: [...actors].map(([value, label]) => ({ value, label })),
    };
  }, [activities]);
}

export function useActivityLog() {
  const { data: activities = NO_ACTIVITIES, isLoading } = useDashboardActivities();
  const method = useDashboardStore((s) => s.activityMethod);
  const project = useDashboardStore((s) => s.activityProject);
  const actor = useDashboardStore((s) => s.activityActor);
  const page = useDashboardStore((s) => s.activityPage);

  const filtered = useMemo(
    () =>
      activities.filter((item) => {
        if (method === "PROJECT" && project && ![item.projectId, item.projectCode, item.projectName].includes(project)) {
          return false;
        }
        return !(method === "ACTOR" && actor && item.actor !== actor);
      }),
    [activities, method, project, actor],
  );

  const rows = useMemo(
    () => filtered.slice((page - 1) * ACTIVITY_PAGE_SIZE, page * ACTIVITY_PAGE_SIZE),
    [filtered, page],
  );

  return {
    rows,
    total: filtered.length,
    page,
    isLoading,
    hasFilter: (method === "PROJECT" && Boolean(project)) || (method === "ACTOR" && Boolean(actor)),
  };
}
