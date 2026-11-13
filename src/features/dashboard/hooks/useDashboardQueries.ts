"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyTaskData } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import * as dashboardApi from "../services/dashboard.api";
import { toDisbursementTotals } from "../services/dashboard.mapper";
import { buildUrgentTasks } from "../utils/urgent-tasks";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  activities: () => [...dashboardKeys.all, "activities"] as const,
  quarterly: () => [...dashboardKeys.all, "quarterly"] as const,
};

export function useDashboardSummary() {
  return useQuery({ queryKey: dashboardKeys.summary(), queryFn: dashboardApi.getDashboardSummary });
}

export function useDisbursementTotals() {
  const { data } = useDashboardSummary();
  return useMemo(() => (data ? toDisbursementTotals(data) : { disbursed: 0, remaining: 0, monthlySpeed: 0 }), [data]);
}

export function useQuarterlyDisbursement() {
  return useQuery({ queryKey: dashboardKeys.quarterly(), queryFn: dashboardApi.getQuarterlyDisbursement });
}

export function useDashboardActivities() {
  return useQuery({ queryKey: dashboardKeys.activities(), queryFn: dashboardApi.getDashboardActivities });
}

export function useDashboardActivity(activityId: string | undefined) {
  const { data } = useDashboardActivities();
  return useMemo(() => (activityId ? data?.find((a) => a.id === activityId) : undefined), [data, activityId]);
}

export function useUrgentTasks() {
  const { groups } = useMyTaskData();
  return useMemo(() => buildUrgentTasks(groups), [groups]);
}

export function useUrgentTask(taskId: string) {
  return useUrgentTasks().find((t) => t.id === taskId);
}
