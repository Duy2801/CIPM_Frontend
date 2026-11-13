"use client";

import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectFormData } from "@/shared/projects_works/types/project.types";
import type { ProjectProcedureSync } from "@/shared/projects_works/types/project-procedure.types";
import { applyProcedureSync, applyProjectUpdate } from "@/shared/projects_works/utils/project-list";
import * as projectApi from "@/shared/projects_works/services/project.api";
import { projectKeys, useProjectList } from "@/shared/projects_works/hooks/useProjectList";

export function useProjectMutations() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isBackend, projects } = useProjectList();
  const setProjects = useProjectStore((s) => s.setProjects);

  const refreshProjects = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
  const actorName = (fallback: string) => user?.name || user?.displayName || fallback;

  const updateProject = async (projectId: string, data: ProjectFormData) => {
    const updaterName = actorName("Cán bộ quản lý");
    if (isBackend) {
      const current = projects.find((p) => p.id === projectId);
      if (!current) return;
      try {
        await projectApi.updateProject(current, data, updaterName);
        await refreshProjects();
        message.success("Đã cập nhật thông tin dự án thành công!");
      } catch (e) {
        message.error((e as Error).message);
      }
      return;
    }
    setProjects((prev) => prev.map((p) => (p.id === projectId ? applyProjectUpdate(p, data, updaterName) : p)));
    message.success("Đã cập nhật thông tin dự án thành công!");
  };

  const setDisbursedAmount = (projectId: string, total: number) => {
    if (isBackend) {
      void refreshProjects();
      return;
    }
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, disbursedAmount: total } : p)));
  };

  const syncProcedure = (projectId: string, sync: ProjectProcedureSync) => {
    if (isBackend) {
      void refreshProjects();
      return;
    }
    const updaterName = actorName("Cán bộ quản lý");
    setProjects((prev) => prev.map((p) => (p.id === projectId ? applyProcedureSync(p, sync, updaterName) : p)));
  };

  return { isBackend, refreshProjects, updateProject, setDisbursedAmount, syncProcedure };
}
