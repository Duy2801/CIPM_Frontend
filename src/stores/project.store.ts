"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_PROJECTS_MOCK } from "../features/projects_works/constants/projects-mock-data.ts";
import type { ProjectItem, ProjectFormData } from "../features/projects_works/types/project.types";

interface ProjectStoreState {
  projects: ProjectItem[];
  setProjects: (updater: ProjectItem[] | ((prev: ProjectItem[]) => ProjectItem[])) => void;
  addProjectItem: (project: ProjectItem) => void;
  createAndAddProject: (data: ProjectFormData, autoCode: string, creatorName?: string) => ProjectItem;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  resetToDefault: () => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS_MOCK,

      setProjects: (updater) => {
        const next = typeof updater === "function" ? updater(get().projects) : updater;
        set({ projects: next });
      },

      addProjectItem: (project: ProjectItem) => {
        const current = get().projects;
        if (!current.some((p) => p.id === project.id || p.code === project.code)) {
          set({ projects: [project, ...current] });
        }
      },

      createAndAddProject: (data: ProjectFormData, autoCode: string, creatorName = "Cán bộ quản lý") => {
        const currentProjects = get().projects;
        const initialProgress = data.actualProgress ?? 0;
        const initialPlanProgress = data.plannedProgress ?? 0;
        const nextNum = currentProjects.length + 1;
        const newId = `PRJ-${String(nextNum).padStart(3, "0")}`;

        const newProject: ProjectItem = {
          id: newId,
          code: autoCode,
          name: data.name,
          type: data.type,
          location: data.location || "TP. Hà Tiên",
          scale: data.scale?.trim() || "",
          fundingSource: data.fundingSource ?? "Ngân sách thành phố",
          totalInvestment: data.totalInvestment ?? 0,
          plan2026: data.plan2026 ?? 0,
          managerName: data.managerName || "Huỳnh Thái Hải",
          supervisorName: data.supervisorName || "Huỳnh Thái Hải",
          departments: data.departments && data.departments.length > 0 ? data.departments : ["Tổ Giám sát – Kỹ thuật"],
          startDate: data.startDate,
          endDatePlanned: data.endDatePlanned,
          currentStage: data.currentStage || "PREPARATION",
          nature: data.nature || (initialProgress > 0 ? "transitional" : "new"),
          actualProgress: initialProgress,
          plannedProgress: initialPlanProgress,
          disbursedAmount: 0,
          note: data.note?.trim() || "",
          status: "active",
          progressHistory: [
            {
              id: `HIS-INIT-${Date.now()}`,
              updatedAt: new Date().toISOString().slice(0, 10),
              updatedBy: creatorName,
              oldProgress: 0,
              newProgress: initialProgress,
              note: data.note || "Khởi tạo hồ sơ dự án mới trên hệ thống.",
            },
          ],
        };

        set({ projects: [newProject, ...currentProjects] });
        return newProject;
      },

      updateProject: (id: string, updates: Partial<ProjectItem>) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id
              ? { ...p, ...updates }
              : p
          ),
        });
      },

      deleteProject: (id: string) => {
        set({ projects: get().projects.filter((p) => p.id !== id) });
      },

      resetToDefault: () => {
        set({ projects: INITIAL_PROJECTS_MOCK });
      },
    }),
    {
      name: "cipm_shared_projects_store_v4",
    }
  )
);

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("cipm_shared_projects_store_v1");
    window.localStorage.removeItem("cipm_shared_projects_store_v2");
    window.localStorage.removeItem("cipm_shared_projects_store_v3");
  } catch {
    // Ignore error
  }
}

/** Helper lấy danh sách dự án dùng chung cho tất cả các trang */
export function getSharedProjects(): ProjectItem[] {
  if (typeof window === "undefined") return INITIAL_PROJECTS_MOCK;
  try {
    const state = useProjectStore.getState();
    if (state.projects && state.projects.length > 0) {
      return state.projects;
    }
  } catch {
    // Fallback nếu chưa khởi tạo
  }
  return INITIAL_PROJECTS_MOCK;
}
