"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectList } from "@/features/projects_works/hooks/useProjectList";
import type { ProjectItem } from "@/features/projects_works/types/project.types";
import { useAuthStore } from "@/stores/auth.store";
import { useAppRefreshStore } from "@/stores/app-refresh.store";
import {
  mockActivities,
  mockKpiData,
  mockQuarterlyData,
  mockUrgentTasks,
  type ActivityItem,
  type KpiCardData,
  type QuarterlyData,
  type UrgentTask,
} from "../constants/dashboard-mock-data";

const REFRESH_INTERVAL_SECONDS = 15 * 60; // 15 phút theo BRD 4.1.3

const toBillion = (vnd: number) => Math.round((vnd / 1_000_000_000) * 10) / 10;

function kpiFromProjects(projects: ProjectItem[]): KpiCardData {
  const active = projects.filter((p) => p.status !== "closed");
  const completed = projects.filter((p) => p.actualProgress >= 100);
  const delayed = active.filter((p) => p.actualProgress < 100 && p.actualProgress < p.plannedProgress);
  const disbursed = projects.reduce((sum, p) => sum + (p.disbursedAmount || 0), 0);
  const planned = projects.reduce((sum, p) => sum + (p.totalInvestment || 0), 0);
  return {
    totalProjects: projects.length,
    ongoingProjects: active.filter((p) => p.actualProgress < 100).length,
    newProjects: projects.filter((p) => p.nature === "new").length,
    disbursedAmount: toBillion(disbursed),
    plannedAmount: toBillion(planned),
    disbursementRate: planned > 0 ? Math.round((disbursed / planned) * 1000) / 10 : 0,
    delayedProjects: delayed.length,
    criticalDelayed: delayed.filter((p) => p.plannedProgress - p.actualProgress >= 20).length,
    delayedNote: delayed.length > 0 ? "Có dự án chậm so với tiến độ kế hoạch" : "Không có dự án chậm tiến độ",
    completedProjects: completed.length,
    warrantyProjects: 0,
    gpmbRate: 0,
    gpmbRemainingHouseholds: 0,
    gpmbHandedOver: 0,
    gpmbTotal: 0,
    gpmbDialogNeeded: 0,
  };
}

export function useDashboardData() {
  const { isBackend, projects } = useProjectList();
  const [mockKpi, setKpiData] = useState<KpiCardData>(mockKpiData);
  const [mockTasks, setTasks] = useState<UrgentTask[]>(mockUrgentTasks);
  const [mockQuarterly, setQuarterlyData] = useState<QuarterlyData[]>(mockQuarterlyData);
  const [mockActivityItems, setActivities] = useState<ActivityItem[]>(mockActivities);
  const backendKpi = useMemo(() => kpiFromProjects(projects), [projects]);
  const kpiData = isBackend ? backendKpi : mockKpi;
  const tasks = isBackend ? [] : mockTasks;
  const quarterlyData = isBackend ? [] : mockQuarterly;
  const activities = isBackend ? [] : mockActivityItems;
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Vừa xong");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(REFRESH_INTERVAL_SECONDS);
  const user = useAuthStore((state) => state.user);
  const refreshTrigger = useAppRefreshStore((state) => state.refreshTrigger);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const now = new Date();
    const formatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setKpiData({ ...mockKpiData });
    setTasks([...mockUrgentTasks]);
    setQuarterlyData([...mockQuarterlyData]);
    setActivities([...mockActivities]);
    setLastUpdated(formatted);
    setSecondsRemaining(REFRESH_INTERVAL_SECONDS);
    setLoading(false);
    useAppRefreshStore.getState().setRefreshing(false);
  }, []);

  // Lắng nghe kích hoạt làm mới từ nút trên Topbar
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // Bộ đếm tự động làm mới mỗi 15 phút (BRD 4.1.3)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshData();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshData]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const countdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    isBackend,
    kpiData,
    tasks,
    quarterlyData,
    activities,
    loading,
    lastUpdated,
    secondsRemaining,
    countdown,
    refreshData,
    currentUser: user?.displayName || "Cán bộ BQL",
    currentRole: user?.roleName || "Ban Giám đốc",
  };
}
