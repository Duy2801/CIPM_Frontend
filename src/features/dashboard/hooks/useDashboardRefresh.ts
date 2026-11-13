"use client";

import { useCallback, useEffect } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { myTaskKeys } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import { projectKeys } from "@/shared/projects_works/hooks/useProjectList";
import { useAppRefreshStore } from "@/stores/app-refresh.store";
import { dashboardKeys } from "./useDashboardQueries";

const AUTO_REFRESH_MS = 15 * 60 * 1000;
const REFRESH_KEYS = [dashboardKeys.all, myTaskKeys.all, projectKeys.list()];

export function useDashboardRefresh() {
  const queryClient = useQueryClient();
  const refreshTrigger = useAppRefreshStore((state) => state.refreshTrigger);
  const fetching = useIsFetching({
    predicate: (query) => REFRESH_KEYS.some((key) => key.every((part, i) => query.queryKey[i] === part)),
  });

  const refresh = useCallback(
    () => Promise.all(REFRESH_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
    [queryClient],
  );

  useEffect(() => {
    if (refreshTrigger > 0) void refresh();
  }, [refreshTrigger, refresh]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { loading: fetching > 0 };
}
