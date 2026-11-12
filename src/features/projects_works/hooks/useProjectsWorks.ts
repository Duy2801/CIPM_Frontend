"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { canUserDo } from "@/access-control";
import { useAuth } from "@/features/auth";
import { loadProcedureLibrary } from "@/features/construction-procedures/utils/procedure-library";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectActionType, ProjectFormData, ProjectItem, ProjectWorkType } from "../types/project.types";
import {
  applyProcedureSync,
  applyProjectUpdate,
  createProjectItem,
  filterAndSortProjects,
  nextProjectCode,
  type ProjectStatusFilter,
} from "../utils/project-list";
import type { ProjectProcedureSync } from "../types/project-procedure.types";
import { initProjectProcedure } from "../utils/project-procedure-data";
import * as projectApi from "../services/project.api";
import { projectKeys, useProjectList } from "./useProjectList";

const PAGE_SIZE = 15;

type ConfirmState = { open: boolean; type: ProjectActionType; project: ProjectItem | null };
const CLOSED_CONFIRM: ConfirmState = { open: false, type: "rule5_warning", project: null };

export function useProjectsWorks() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isBackend, projects, isLoading, error: loadError } = useProjectList();
  const setProjects = useProjectStore((s) => s.setProjects);
  const refreshProjects = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
  const actorRole = user?.roleName || "Cán bộ Ban QLDA";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ProjectWorkType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmState>(CLOSED_CONFIRM);

  const actorName = (fallback: string) => user?.name || user?.displayName || fallback;

  const detailProject = useMemo(
    () => projects.find((p) => p.id === detailProjectId) ?? null,
    [projects, detailProjectId],
  );
  const nextAutoCode = useMemo(() => nextProjectCode(projects.length), [projects.length]);

  const filteredProjects = useMemo(
    () => filterAndSortProjects(projects, { statusFilter, selectedType, searchTerm, sortBy }),
    [projects, statusFilter, selectedType, searchTerm, sortBy],
  );
  const paginatedProjects = useMemo(
    () => filteredProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProjects, currentPage],
  );

  const resetPageWith =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setCurrentPage(1);
    };

  const afterCreated = (code: string) => {
    setIsCreateOpen(false);
    setSortBy("latest");
    setCurrentPage(1);
    if (statusFilter === "closed") setStatusFilter("ALL");
    setSearchTerm("");
    message.success(`Đã khởi tạo thành công dự án mới với mã: ${code}`);
  };

  const createProject = async (data: ProjectFormData, autoCode: string, files: File[] = []) => {
    const creatorName = actorName("Người tạo dự án");
    if (isBackend) {
      try {
        const created = await projectApi.createProject(data, { name: creatorName, role: actorRole }, files);
        await refreshProjects();
        afterCreated(created.code);
      } catch (e) {
        message.error((e as Error).message);
      }
      return;
    }
    const newProject = createProjectItem(data, autoCode, creatorName);

    const library = loadProcedureLibrary();
    initProjectProcedure(
      newProject,
      Object.entries(data.procedures ?? {}).flatMap(([department, procedureId]) => {
        const procedure = library.find((p) => p.id === procedureId);
        return procedure && newProject.departments?.includes(department)
          ? [{ department, procedure, tabLabel: data.procedureTabLabels?.[procedureId] }]
          : [];
      }),
      { name: creatorName, role: user?.roleName || "Cán bộ Ban QLDA" },
    );

    setProjects((prev) => [newProject, ...prev]);
    afterCreated(autoCode);
  };

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

  const requestToggleProject = (project: ProjectItem) => {
    if (project.status === "closed") {
      setConfirmAction({ open: true, type: "reopen_confirm", project });
      return;
    }
    setConfirmAction({ open: true, type: project.disbursedAmount > 0 ? "rule5_warning" : "close_confirm", project });
  };

  const confirmProjectAction = async () => {
    const prj = confirmAction.project;
    if (!prj) return;
    if (isBackend) {
      try {
        if (confirmAction.type === "delete_confirm") throw new Error("Máy chủ chưa hỗ trợ xóa dự án, hãy dùng chức năng khóa dự án.");
        const closing = confirmAction.type === "rule5_warning" || confirmAction.type === "close_confirm";
        await projectApi.setProjectStatus(prj.id, closing ? "closed" : "active");
        await refreshProjects();
        message.success(
          closing
            ? `Dự án ${prj.code} đã được chuyển sang trạng thái "Đóng".`
            : `Dự án ${prj.code} đã được mở lại và chuyển sang trạng thái "Đang hoạt động".`,
        );
      } catch (e) {
        message.error((e as Error).message);
      }
      setConfirmAction(CLOSED_CONFIRM);
      return;
    }
    if (confirmAction.type === "rule5_warning" || confirmAction.type === "close_confirm") {
      setProjects((prev) => prev.map((p) => (p.id === prj.id ? { ...p, status: "closed" } : p)));
      message.success(`Dự án ${prj.code} đã được chuyển sang trạng thái "Đóng".`);
    } else if (confirmAction.type === "delete_confirm") {
      setProjects((prev) => prev.filter((p) => p.id !== prj.id));
      if (detailProjectId === prj.id) setDetailProjectId(null);
      message.success(`Đã xóa thành công dự án ${prj.code} khỏi hệ thống.`);
    } else if (confirmAction.type === "reopen_confirm") {
      setProjects((prev) => prev.map((p) => (p.id === prj.id ? { ...p, status: "active" } : p)));
      message.success(`Dự án ${prj.code} đã được mở lại và chuyển sang trạng thái "Đang hoạt động".`);
    }
    setConfirmAction(CLOSED_CONFIRM);
  };

  return {
    isLoading,
    loadError,
    searchTerm,
    setSearchTerm: resetPageWith(setSearchTerm),
    selectedType,
    setSelectedType: resetPageWith(setSelectedType),
    statusFilter,
    setStatusFilter: resetPageWith(setStatusFilter),
    sortBy,
    setSortBy: resetPageWith(setSortBy),
    currentPage,
    setCurrentPage,
    pageSize: PAGE_SIZE,
    filteredProjects,
    paginatedProjects,
    canCreateProject: canUserDo(user, "m2_projects", "input"),
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    nextAutoCode,
    detailProject,
    openDetail: (project: ProjectItem) => setDetailProjectId(project.id),
    closeDetail: () => setDetailProjectId(null),
    createProject,
    updateProject,
    syncProcedure,
    setDisbursedAmount,
    confirmAction,
    requestToggleProject,
    confirmProjectAction,
    cancelProjectAction: () => setConfirmAction(CLOSED_CONFIRM),
  };
}

export type ProjectsWorksController = ReturnType<typeof useProjectsWorks>;
