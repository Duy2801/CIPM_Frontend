"use client";

import { useQuery } from "@tanstack/react-query";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { useProjectStore } from "@/stores/project.store";
import { getProjects } from "../services/project.api";

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  procedure: (projectId: string) => [...projectKeys.all, "procedure", projectId] as const,
  disbursements: (projectId: string) => [...projectKeys.all, "disbursements", projectId] as const,
  history: (projectId: string) => [...projectKeys.all, "history", projectId] as const,
};

export function useProjectList() {
  const isBackend = hasBackendSession();
  const storeProjects = useProjectStore((s) => s.projects);
  const query = useQuery({ queryKey: projectKeys.list(), queryFn: getProjects, enabled: isBackend });
  return {
    isBackend,
    projects: isBackend ? (query.data ?? []) : storeProjects,
    isLoading: isBackend && query.isLoading,
    error: isBackend ? (query.error as Error | null) : null,
  };
}
