"use client";

import React, { useEffect, useState } from "react";
import { message } from "antd";
import { Drawer, Flex, Spin, Tag } from "@/components/ui";
import { useAuth } from "@/features/auth";
import {
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
} from "../constants/project-enums";
import type {
  ProjectFormData,
  ProjectItem,
  ProjectStage,
} from "../types/project.types";
import { isBoardOfDirectors } from "../utils/project-permissions";
import ProjectViewTab from "./detail/ProjectViewTab";
import ProjectProgressTab from "./detail/ProjectProgressTab";
import ProjectEditTab from "./detail/ProjectEditTab";

export type ProjectDetailTab = "view" | "progress" | "edit";

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  open: boolean;
  initialMode?: ProjectDetailTab;
  onClose: () => void;
  onSaveProgress: (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => void;
  onUpdateProject: (projectId: string, data: ProjectFormData) => void;
  onCloseProject?: (project: ProjectItem) => void;
  onReopenProject?: (project: ProjectItem) => void;
  onDeleteProject?: (project: ProjectItem) => void;
  onOpenProgressModal?: (project: ProjectItem) => void;
}

export default function ProjectDetailModal({
  project,
  open,
  initialMode = "view",
  onClose,
  onSaveProgress,
  onUpdateProject,
  onCloseProject,
  onReopenProject,
  onDeleteProject,
}: ProjectDetailModalProps) {
  const { user } = useAuth();

  // Tab điều hướng: "view" (chi tiết), "progress" (cập nhật tiến độ tuần), "edit" (cập nhật thông tin DA)
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(initialMode);
  // Trạng thái tải lại chi tiết sau khi cập nhật
  const [isReloading, setIsReloading] = useState<boolean>(false);

  // Đồng bộ tab khi modal được mở lại
  useEffect(() => {
    if (project && open) {
      const targetTab = initialMode === "edit" && !isBoardOfDirectors(user) ? "view" : (initialMode || "view");
      setActiveTab(targetTab);
    }
  }, [project, open, initialMode, user]);

  if (!project) return null;

  const handleSaveProgressWrapper = (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => {
    setIsReloading(true);
    onSaveProgress(projectId, newProgress, note, actualEndDate, newStage);
    message.success("Đã cập nhật tiến độ và giai đoạn thành công!");
    setActiveTab("view");
    setTimeout(() => {
      setIsReloading(false);
    }, 350);
  };

  const handleUpdateProjectWrapper = (projectId: string, data: ProjectFormData) => {
    setIsReloading(true);
    onUpdateProject(projectId, data);
    setActiveTab("view");
    setTimeout(() => {
      setIsReloading(false);
    }, 350);
  };

  return (
    <Drawer
      open={open}
      closable={false}
      width="min(680px, 100vw)"
      onClose={onClose}
      className="[&_.ant-drawer-body]:!p-0 [&_.ant-drawer-body]:!overflow-hidden [&_.ant-drawer-body]:flex [&_.ant-drawer-body]:flex-col [&_.ant-drawer-body]:h-full"
      title={
        <div className="w-full flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Flex align="center" gap={8} className="flex-wrap">
              <span className="text-base font-bold text-[#102A43]">{project.code}</span>
              {project.status === "closed" ? (
                <Tag intent="danger" scale="sm">
                  Đã đóng
                </Tag>
              ) : (
                <Tag intent="success" scale="sm">
                  Đang hoạt động
                </Tag>
              )}
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                  STAGE_BADGE_CLASSES[project.currentStage]
                }`}
              >
                {STAGE_DISPLAY_NAMES[project.currentStage]}
              </span>
            </Flex>
            <span className="block text-xs font-normal text-slate-500 mt-1 line-clamp-1">
              {project.name}
            </span>
          </div>
        </div>
      }
    >
      <Spin
        spinning={isReloading}
        description="Đang tải lại dữ liệu chi tiết..."
        className="flex-1 flex flex-col h-full overflow-hidden [&>.ant-spin-container]:flex-1 [&>.ant-spin-container]:flex [&>.ant-spin-container]:flex-col [&>.ant-spin-container]:h-full [&>.ant-spin-container]:overflow-hidden"
      >
        {activeTab === "view" && (
          <ProjectViewTab
            project={project}
            user={user}
            onEditClick={() => setActiveTab("edit")}
            onProgressClick={() => setActiveTab("progress")}
            onReopenProject={onReopenProject}
            onClose={onClose}
          />
        )}

        {activeTab === "progress" && (
          <ProjectProgressTab
            project={project}
            user={user}
            onBackToView={() => setActiveTab("view")}
            onClose={onClose}
            onSaveProgress={handleSaveProgressWrapper}
          />
        )}

        {activeTab === "edit" && isBoardOfDirectors(user) && (
          <ProjectEditTab
            project={project}
            onBackToView={() => setActiveTab("view")}
            onUpdateProject={handleUpdateProjectWrapper}
          />
        )}
      </Spin>
    </Drawer>
  );
}
