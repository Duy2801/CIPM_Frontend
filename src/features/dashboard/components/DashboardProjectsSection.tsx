"use client";

import React, { useMemo, useState } from "react";
import {
  ProjectOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Pagination,
  Tag,
  Text,
} from "@/components/ui";
import { useProjectStore } from "@/stores/project.store";
import { formatMoneyString } from "@/utils/format-money";
import {
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
} from "@/features/projects_works/constants/project-enums";
import type {
  ProjectFormData,
  ProjectItem,
  ProjectStage,
} from "@/features/projects_works/types/project.types";
import ProjectDetailModal from "@/features/projects_works/components/ProjectDetailModal";
import { useAuth } from "@/features/auth";

const PAGE_SIZE = 5;

export default function DashboardProjectsSection() {
  const { user } = useAuth();
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);

  // Chỉ dùng bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Chi tiết dự án drawer
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const detailProject = useMemo(() => {
    return projects.find((p) => p.id === detailProjectId) ?? null;
  }, [projects, detailProjectId]);

  // Lọc danh sách dự án theo từ khóa tìm kiếm (mã, tên, chủ nhiệm)
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;

    return projects.filter((project) => {
      const matchCode = project.code?.toLowerCase().includes(term);
      const matchName = project.name?.toLowerCase().includes(term);
      const matchManager = project.managerName?.toLowerCase().includes(term);
      return Boolean(matchCode || matchName || matchManager);
    });
  }, [projects, searchTerm]);

  // Phân trang 5 dự án / trang
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  const hasFilter = Boolean(searchTerm.trim());

  const handleResetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Cập nhật tiến độ dự án
  const handleSaveProgress = (
    projectId: string,
    newProgress: number,
    note: string,
    actualEndDate?: string,
    newStage?: ProjectStage,
  ) => {
    const updaterName = user?.name || user?.displayName || "Cán bộ quản lý";
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;

        const stage = newStage ?? project.currentStage;
        const historyRecord = {
          id: `HIS-${Date.now()}`,
          updatedAt: new Date().toISOString().slice(0, 10),
          updatedBy: updaterName,
          oldProgress: project.actualProgress,
          newProgress,
          note: note.trim() || "Cập nhật tiến độ dự án từ Dashboard.",
          actualEndDateRecorded: actualEndDate,
          stageRecorded: stage,
        };

        return {
          ...project,
          actualProgress: newProgress,
          currentStage: stage,
          actualEndDate:
            actualEndDate !== undefined ? actualEndDate : project.actualEndDate,
          progressHistory: [historyRecord, ...(project.progressHistory ?? [])],
        };
      })
    );
  };

  // Cập nhật thông tin dự án
  const handleUpdateProject = (projectId: string, data: ProjectFormData) => {
    const updaterName = user?.name || user?.displayName || "Cán bộ quản lý";
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;

        const newActual =
          data.actualProgress !== undefined
            ? data.actualProgress
            : project.actualProgress;
        const newPlanned =
          data.plannedProgress !== undefined
            ? data.plannedProgress
            : project.plannedProgress;
        const newStage = data.currentStage ?? project.currentStage;

        const hasProgressChanged = newActual !== project.actualProgress;
        const hasNote = Boolean(data.note?.trim());

        const newHistory = [...(project.progressHistory ?? [])];
        if (hasProgressChanged || hasNote) {
          newHistory.unshift({
            id: `HIS-${Date.now()}`,
            updatedAt: new Date().toISOString().slice(0, 10),
            updatedBy: updaterName,
            oldProgress: project.actualProgress,
            newProgress: newActual,
            note: data.note?.trim() || "Cập nhật thông tin dự án từ Dashboard.",
            actualEndDateRecorded:
              newActual === 100
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
          fundingSource: data.fundingSource ?? project.fundingSource,
          totalInvestment:
            data.totalInvestment !== undefined
              ? data.totalInvestment
              : project.totalInvestment,
          plan2026:
            data.plan2026 !== undefined ? data.plan2026 : project.plan2026,
          managerName: data.managerName ?? project.managerName,
          supervisorName: data.supervisorName ?? project.supervisorName,
          departments: data.departments ?? project.departments,
          documents:
            data.documents !== undefined ? data.documents : project.documents,
          startDate: data.startDate,
          endDatePlanned: data.endDatePlanned,
          currentStage: newStage,
          nature: data.nature ?? project.nature,
          actualProgress: newActual,
          plannedProgress: newPlanned,
          actualEndDate:
            newActual === 100
              ? (project.actualEndDate || data.endDatePlanned)
              : project.actualEndDate,
          note: data.note !== undefined ? data.note : project.note,
          progressHistory: newHistory,
        };
      })
    );
  };

  return (
    <>
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="w-full border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5"
      >
        <Flex vertical gap={12} className="w-full">
          {/* Header: Tiêu đề bên trái, Thanh tìm kiếm bên phải */}
          <Flex
            align="center"
            justify="space-between"
            wrap="wrap"
            gap={12}
            className="border-b border-slate-100 pb-3"
          >
            {/* Tiêu đề & số lượng dự án */}
            <Flex align="center" gap={8} className="shrink-0">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#DC2626]">
                <ProjectOutlined className="text-base" />
              </div>
              <Text
                strong
                className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight"
              >
                DANH SÁCH DỰ ÁN & CÔNG TRÌNH
              </Text>
            </Flex>

            {/* Chỉ để lại thanh tìm kiếm gọn gàng, thanh thoát */}
            <div className="w-full sm:w-72">
              <Input
                prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                placeholder="Tìm mã, tên dự án, chủ nhiệm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
                className="w-full text-xs h-9 !rounded-lg !border-slate-300 hover:!border-[#DC2626] focus:!border-[#DC2626]"
              />
            </div>
          </Flex>

          {/* Bảng danh sách dự án */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 min-w-[260px]">DỰ ÁN</th>
                  <th className="py-2.5 px-3 min-w-[120px]">LOẠI CÔNG TRÌNH</th>
                  <th className="py-2.5 px-3 min-w-[130px]">CHỦ NHIỆM</th>
                  <th className="py-2.5 px-3 min-w-[130px] text-right">TỔNG MỨC ĐẦU TƯ</th>
                  <th className="py-2.5 px-3 min-w-[130px] text-center">TIẾN ĐỘ</th>
                  <th className="py-2.5 px-3 min-w-[110px] text-center">GIAI ĐOẠN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Flex vertical align="center" gap={8}>
                        <ProjectOutlined className="text-3xl text-slate-300" />
                        <span className="text-sm">
                          {hasFilter
                            ? "Không tìm thấy dự án phù hợp với từ khóa tìm kiếm"
                            : "Chưa có dự án nào trong hệ thống"}
                        </span>
                        {hasFilter && (
                          <Button
                            size="small"
                            onClick={handleResetFilters}
                            className="text-xs text-[#DC2626] border-[#DC2626] hover:bg-red-50 mt-1"
                          >
                            Xóa tìm kiếm
                          </Button>
                        )}
                      </Flex>
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((project) => {
                    const stageName =
                      STAGE_DISPLAY_NAMES[project.currentStage] ||
                      project.currentStage;
                    const stageBadge =
                      STAGE_BADGE_CLASSES[project.currentStage] ||
                      "bg-slate-100 text-slate-800 border-slate-200";

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-red-50/20 transition-colors cursor-pointer group"
                        onClick={() => setDetailProjectId(project.id)}
                        title="Nhấp để xem chi tiết dự án"
                      >
                        {/* Dự án: Mã + Tên trên 1 khối gọn đẹp */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                              {project.code}
                            </span>
                            <span className="font-semibold text-slate-900 group-hover:text-[#DC2626] transition-colors truncate">
                              {project.name}
                            </span>
                          </div>
                        </td>

                        {/* Loại công trình */}
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {project.type}
                        </td>

                        {/* Chủ nhiệm */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <UserOutlined className="text-slate-400 text-xs shrink-0" />
                            <span className="font-medium truncate max-w-[130px]">
                              {project.managerName || "Huỳnh Thái Hải"}
                            </span>
                          </div>
                        </td>

                        {/* TMĐT */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {formatMoneyString(project.totalInvestment, false, 2)} tỷ
                          </span>
                        </td>

                        {/* Tiến độ: % và thanh tiến độ thanh thoát */}
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                            <span className="font-mono font-bold text-slate-800 text-[11px] w-8 text-right">
                              {project.actualProgress}%
                            </span>
                            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, project.actualProgress))}%`,
                                }}
                                className="h-full rounded-full bg-[#DC2626] transition-all duration-300"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Giai đoạn */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${stageBadge}`}
                          >
                            {stageName}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar - Cố định 5 dự án mỗi trang */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500">
              Hiển thị{" "}
              <strong className="text-slate-800 font-semibold">
                {filteredProjects.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                -
                {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)}
              </strong>{" "}
              trong tổng số{" "}
              <strong className="text-slate-800 font-semibold">
                {filteredProjects.length}
              </strong>{" "}
              dự án (5 dự án/trang)
            </span>

            {filteredProjects.length > PAGE_SIZE && (
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredProjects.length}
                onChange={(page) => setCurrentPage(page)}
                size="small"
                showSizeChanger={false}
              />
            )}
          </div>
        </Flex>
      </Card>

      {/* Drawer xem chi tiết dự án khi nhấp vào dòng */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          open={Boolean(detailProject)}
          initialMode="view"
          onClose={() => setDetailProjectId(null)}
          onSaveProgress={handleSaveProgress}
          onUpdateProject={handleUpdateProject}
        />
      )}
    </>
  );
}
