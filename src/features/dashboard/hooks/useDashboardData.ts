"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useDashboardData() {
  const [kpiData, setKpiData] = useState<KpiCardData>(mockKpiData);
  const [tasks, setTasks] = useState<UrgentTask[]>(mockUrgentTasks);
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>(mockQuarterlyData);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
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
