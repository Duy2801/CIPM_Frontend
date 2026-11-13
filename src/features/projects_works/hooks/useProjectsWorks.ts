"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import { hasMatrixPermission } from "@/access-control";
import { useAuth } from "@/shared/auth";
import { loadProcedureLibrary } from "@/shared/construction-procedures/utils/procedure-library";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectActionType, ProjectFormData, ProjectItem, ProjectWorkType } from "@/shared/projects_works/types/project.types";
import {
  createProjectItem,
  filterAndSortProjects,
  nextProjectCode,
  type ProjectStatusFilter,
} from "@/shared/projects_works/utils/project-list";
import { initProjectProcedure } from "@/shared/projects_works/utils/project-procedure-data";
import * as projectApi from "@/shared/projects_works/services/project.api";
import { useProjectList } from "@/shared/projects_works/hooks/useProjectList";
import { useProjectMutations } from "./useProjectMutations";

const PAGE_SIZE = 15;

type ConfirmState = { open: boolean; type: ProjectActionType; project: ProjectItem | null };
const CLOSED_CONFIRM: ConfirmState = { open: false, type: "rule5_warning", project: null };

export function useProjectsWorks() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const { projects, isLoading, error: loadError } = useProjectList();
  const { isBackend, refreshProjects } = useProjectMutations();
  const setProjects = useProjectStore((s) => s.setProjects);
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

  const openDetailId = projects.some((p) => p.id === detailProjectId) ? detailProjectId : null;
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
    canCreateProject: hasMatrixPermission(user, "project:create_update"),
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    nextAutoCode,
    detailProjectId: openDetailId,
    openDetail: (project: ProjectItem) => setDetailProjectId(project.id),
    closeDetail: () => setDetailProjectId(null),
    createProject,
    confirmAction,
    requestToggleProject,
    confirmProjectAction,
    cancelProjectAction: () => setConfirmAction(CLOSED_CONFIRM),
  };
}

export type ProjectsWorksController = ReturnType<typeof useProjectsWorks>;
