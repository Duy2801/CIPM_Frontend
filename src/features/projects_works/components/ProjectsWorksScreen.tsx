"use client";

import React, { useMemo, useState } from "react";
import { message } from "antd";
import { DEFAULT_LIST_PAGE_SIZE, Modal } from "@/components/ui";
import { INITIAL_PROJECTS_MOCK } from "../constants/projects-mock-data";
import type {
  ProjectFormData,
  ProjectItem,
  ProjectStage,
  ProjectStatusFilter,
  ProjectWorkType,
} from "../types/project.types";
import { useAuth } from "@/features/auth";
import ProjectsFilterToolbar from "./ProjectsFilterToolbar";
import ProjectsTable from "./ProjectsTable";
import ProjectDetailModal, { type ProjectDetailTab } from "./ProjectDetailModal";
import CreateProjectModal from "./CreateProjectModal";
import ProjectActionConfirmModal, { type ProjectActionType } from "./ProjectActionConfirmModal";
import { isBoardOfDirectors } from "../utils/project-permissions";

export default function ProjectsWorksScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS_MOCK);
  const [activeTab, setActiveTab] = useState<ProjectStatusFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<ProjectWorkType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "closed">("ALL");
  const [sortBy, setSortBy] = useState<string>("code_asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Quản lý Drawer xem chi tiết và cập nhật inline (tiến độ tuần / thông tin dự án)
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<ProjectDetailTab>("view");
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Quản lý Modal xác nhận hành động căn giữa khung trắng (Quy tắc 5, Đóng, Xóa, Mở lại)
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    type: ProjectActionType;
    project: ProjectItem | null;
  }>({
    open: false,
    type: "rule5_warning",
    project: null,
  });

  // Lấy dữ liệu dự án hiện tại trực tiếp từ mảng state để luôn đồng bộ ngay sau khi cập nhật
  const detailProject = useMemo(() => {
    return projects.find((p) => p.id === detailProjectId) ?? null;
  }, [projects, detailProjectId]);

  // Sinh mã tự động tiếp theo: BQL-DA-2026-###
  const nextAutoCode = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const count = projects.length + 1;
    const padded = String(count).padStart(3, "0");
    return `BQL-DA-${currentYear}-${padded}`;
  }, [projects.length]);

  // Lọc danh sách dự án
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // 1. Phân tab giai đoạn
    if (activeTab !== "ALL") {
      result = result.filter((p) => p.currentStage === activeTab);
    }

    // 2. Lọc trạng thái vận hành (Quy tắc 5: Đang hoạt động / Đã đóng)
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // 3. Lọc loại công trình
    if (selectedType !== "ALL") {
      result = result.filter((p) => p.type === selectedType);
    }

    // 4. Tìm kiếm full-text
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.managerName.toLowerCase().includes(q) ||
          p.supervisorName.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.fundingSource.toLowerCase().includes(q)
      );
    }

    // 5. Sắp xếp đa chiều
    result.sort((a, b) => {
      switch (sortBy) {
        case "investment_desc":
          return b.totalInvestment - a.totalInvestment;
        case "investment_asc":
          return a.totalInvestment - b.totalInvestment;
        case "progress_asc":
          return a.actualProgress - b.actualProgress;
        case "progress_desc":
          return b.actualProgress - a.actualProgress;
        case "code_asc":
        default:
          return a.code.localeCompare(b.code);
      }
    });

    return result;
  }, [projects, activeTab, statusFilter, selectedType, searchTerm, sortBy]);

  // Phân trang
  const total = filteredProjects.length;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Reset trang về 1 khi đổi tab hoặc bộ lọc
  const handleTabChange = (tab: ProjectStatusFilter) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: ProjectWorkType | "ALL") => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: "ALL" | "active" | "closed") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Cập nhật tiến độ tuần & giai đoạn (Quy tắc 4, 4.2.3 & Quy tắc 6)
  const handleSaveProgress = (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;

        const stageToSet = newStage || (newProgress === 100 ? "COMPLETED" : p.currentStage);

        const newHistoryRecord = {
          id: `HIS-${Date.now()}`,
          updatedAt: new Date().toISOString().slice(0, 10),
          updatedBy: "Kỹ sư Giám sát (Tổ KT)",
          oldProgress: p.actualProgress,
          newProgress,
          note,
          actualEndDateRecorded: actualEndDate,
          stageRecorded: stageToSet,
        };

        return {
          ...p,
          actualProgress: newProgress,
          // QUY TẮC 6: Lưu ngày hoàn thành thực tế khi đạt 100%
          actualEndDate: newProgress === 100 ? (actualEndDate || p.actualEndDate) : p.actualEndDate,
          currentStage: stageToSet,
          progressHistory: [newHistoryRecord, ...p.progressHistory],
        };
      })
    );
  };

  // Tạo mới dự án
  const handleCreateProject = (data: ProjectFormData, autoCode: string) => {
    const creatorName = user?.name || user?.displayName || "Người tạo dự án";
    const initialProgress = data.actualProgress ?? 0;
    const initialPlanProgress = data.plannedProgress ?? 0;
    const newProject: ProjectItem = {
      id: `PRJ-${Date.now()}`,
      code: autoCode,
      name: data.name,
      type: data.type,
      location: data.location || "TP. Hà Tiên",
      scale: data.scale?.trim() || "",
      fundingSource: data.fundingSource,
      totalInvestment: data.totalInvestment,
      plan2026: data.plan2026 ?? 0,
      disbursedAmount: 0.0,
      managerName: data.managerName || "Chưa phân công",
      supervisorName: data.supervisorName || "Nguyễn Văn An",
      startDate: data.startDate,
      endDatePlanned: data.endDatePlanned,
      currentStage: data.currentStage || "PREPARATION",
      nature: data.nature || (initialProgress > 0 ? "transitional" : "new"),
      actualProgress: initialProgress,
      plannedProgress: initialPlanProgress,
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

    setProjects((prev) => [newProject, ...prev]);
    message.success(`Đã khởi tạo thành công dự án mới với mã: ${autoCode}`);
  };

  const handleUpdateProject = (projectId: string, data: ProjectFormData) => {
    const updaterName = user?.name || user?.displayName || "Cán bộ quản lý";
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;

        const newActualProgress =
          data.actualProgress !== undefined ? data.actualProgress : project.actualProgress;
        const newPlannedProgress =
          data.plannedProgress !== undefined ? data.plannedProgress : project.plannedProgress;
        const newStage = data.currentStage ?? project.currentStage;
        const hasProgressChanged = newActualProgress !== project.actualProgress;
        const hasNote = Boolean(data.note?.trim());

        const newHistory = [...(project.progressHistory ?? [])];
        if (hasProgressChanged || hasNote) {
          newHistory.unshift({
            id: `HIS-${Date.now()}`,
            updatedAt: new Date().toISOString().slice(0, 10),
            updatedBy: updaterName,
            oldProgress: project.actualProgress,
            newProgress: newActualProgress,
            note: data.note?.trim() || "Cập nhật thông tin và tiến độ dự án.",
            actualEndDateRecorded:
              newActualProgress === 100
                ? (data.endDatePlanned || project.actualEndDate)
                : undefined,
            stageRecorded: newStage,
          });
        }

        return {
          ...project,
          name: data.name,
          type: data.type,
          location: data.location ?? project.location,
          scale: data.scale ?? project.scale,
          fundingSource: data.fundingSource,
          totalInvestment: data.totalInvestment,
          plan2026: data.plan2026 !== undefined ? data.plan2026 : project.plan2026,
          managerName: data.managerName ?? project.managerName,
          supervisorName: data.supervisorName ?? project.supervisorName,
          startDate: data.startDate,
          endDatePlanned: data.endDatePlanned,
          currentStage: newStage,
          nature: data.nature ?? project.nature,
          actualProgress: newActualProgress,
          plannedProgress: newPlannedProgress,
          actualEndDate:
            newActualProgress === 100
              ? (project.actualEndDate || data.endDatePlanned)
              : project.actualEndDate,
          note: data.note !== undefined ? data.note : project.note,
          progressHistory: newHistory,
        };
      })
    );
    message.success("Đã cập nhật thông tin dự án thành công!");
  };

  // Đóng dự án (Chuyển trạng thái sang "closed")
  const handleCloseProject = (prj: ProjectItem) => {
    if (prj.status === "closed") {
      message.info(`Dự án ${prj.code} hiện đã ở trạng thái Đóng.`);
      return;
    }

    // Nếu đã phát sinh tài chính -> Hiển thị cảnh báo Quy tắc 5 (BRD 4.2.4)
    if (prj.disbursedAmount > 0) {
      setConfirmAction({
        open: true,
        type: "rule5_warning",
        project: prj,
      });
    } else {
      setConfirmAction({
        open: true,
        type: "close_confirm",
        project: prj,
      });
    }
  };

  // Quy tắc nghiệp vụ 5 (BRD 4.2.4): Không được xóa dự án đã có phát sinh tài chính. Chỉ được chuyển trạng thái "Đóng".
  const handleDeleteProject = (prj: ProjectItem) => {
    if (prj.disbursedAmount > 0) {
      setConfirmAction({
        open: true,
        type: "rule5_warning",
        project: prj,
      });
    } else {
      setConfirmAction({
        open: true,
        type: "delete_confirm",
        project: prj,
      });
    }
  };

  // Mở lại dự án đã đóng
  const handleReopenProject = (prj: ProjectItem) => {
    setConfirmAction({
      open: true,
      type: "reopen_confirm",
      project: prj,
    });
  };

  // Thao tác từ bảng danh sách
  const handleTableProjectAction = (prj: ProjectItem) => {
    if (prj.status === "closed") {
      handleReopenProject(prj);
    } else {
      handleDeleteProject(prj);
    }
  };

  // Xác nhận thực thi hành động trong modal căn giữa
  const handleConfirmAction = () => {
    if (!confirmAction.project) return;
    const prj = confirmAction.project;

    if (confirmAction.type === "rule5_warning" || confirmAction.type === "close_confirm") {
      setProjects((prev) =>
        prev.map((p) => (p.id === prj.id ? { ...p, status: "closed" } : p))
      );
      message.success(`Dự án ${prj.code} đã được chuyển sang trạng thái "Đóng".`);
    } else if (confirmAction.type === "delete_confirm") {
      setProjects((prev) => prev.filter((p) => p.id !== prj.id));
      if (detailProjectId === prj.id) {
        setDetailProjectId(null);
      }
      message.success(`Đã xóa thành công dự án ${prj.code} khỏi hệ thống.`);
    } else if (confirmAction.type === "reopen_confirm") {
      setProjects((prev) =>
        prev.map((p) => (p.id === prj.id ? { ...p, status: "active" } : p))
      );
      message.success(`Dự án ${prj.code} đã được mở lại và chuyển sang trạng thái "Đang hoạt động".`);
    }

    setConfirmAction({ open: false, type: "rule5_warning", project: null });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-2.5 select-none">
      {/* 3. Bộ lọc trạng thái & Thanh công cụ */}
      <ProjectsFilterToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalFilteredCount={total}
        filteredProjects={filteredProjects}
        canCreateProject={isBoardOfDirectors(user)}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* 4. Bảng danh mục dự án & Phân trang căn giữa */}
      <ProjectsTable
        projects={paginatedProjects}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        onPageChange={(page) => setCurrentPage(page)}
        onViewDetail={(prj, mode = "view") => {
          setDetailProjectId(prj.id);
          setDetailMode(mode);
        }}
        onCloseProject={handleTableProjectAction}
      />

      {/* 5. Khung Chi tiết & Cập nhật inline dự án (BRD 4.2.2, 4.2.3, 4.2.4) */}
      <ProjectDetailModal
        project={detailProject}
        open={Boolean(detailProject)}
        initialMode={detailMode}
        onClose={() => {
          setDetailProjectId(null);
          setDetailMode("view");
        }}
        onSaveProgress={handleSaveProgress}
        onUpdateProject={handleUpdateProject}
        onCloseProject={handleCloseProject}
        onDeleteProject={handleDeleteProject}
        onReopenProject={handleReopenProject}
      />

      {/* 6. Modal Tạo mới dự án với mã tự sinh (BRD 4.2.2) */}
      {isCreateOpen && (
        <CreateProjectModal
          key="create-project"
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          nextAutoCode={nextAutoCode}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* 7. Modal xác nhận hành động căn giữa khung trắng (Quy tắc 5, Đóng, Xóa, Mở lại) */}
      <ProjectActionConfirmModal
        open={confirmAction.open}
        type={confirmAction.type}
        project={confirmAction.project}
        onClose={() => setConfirmAction((prev) => ({ ...prev, open: false, project: null }))}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
