"use client";

import React from "react";
import { EyeOutlined, StopOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Pagination, Tag, Text, Tooltip } from "@/components/ui";
import { useAuth } from "@/features/auth";
import {
  STAGE_BADGE_CLASSES,
  STAGE_DISPLAY_NAMES,
  getProjectHealthStatus,
} from "../constants/project-enums";
import type { ProjectItem } from "../types/project.types";
import {
  canDeleteOrCloseProject,
  canUpdateProjectProgress,
} from "../utils/project-permissions";

function getProgressTone(status: ReturnType<typeof getProjectHealthStatus>["status"]) {
  if (status === "normal") {
    return {
      tagIntent: "success" as const,
      barClassName: "bg-[#007A78]",
    };
  }

  if (status === "warning") {
    return {
      tagIntent: "warning" as const,
      barClassName: "bg-[#D97706]",
    };
  }

  return {
    tagIntent: "danger" as const,
    barClassName: "bg-[#DC2626]",
  };
}

interface ProjectProgressCellProps {
  actualProgress: number;
  plannedProgress: number;
}

function ProjectProgressCell({
  actualProgress,
  plannedProgress,
}: ProjectProgressCellProps) {
  const health = getProjectHealthStatus(actualProgress, plannedProgress);
  const tone = getProgressTone(health.status);

  return (
    <div className="w-[110px] max-w-full mx-auto flex flex-col items-center gap-1">
      <span className="font-mono text-xs font-bold text-slate-950 text-center">
        {actualProgress}%
      </span>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        aria-label={`Tiến độ ${actualProgress}%`}
      >
        <div
          style={{ width: `${actualProgress}%` }}
          className={`h-full rounded-full transition-all ${tone.barClassName}`}
        />
      </div>
    </div>
  );
}

interface ProjectsTableProps {
  projects: ProjectItem[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetail: (project: ProjectItem, mode?: "view" | "progress" | "edit") => void;
  onOpenProgressModal?: (project: ProjectItem) => void;
  onCloseProject?: (project: ProjectItem) => void;
}

export default function ProjectsTable({
  projects,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onViewDetail,
  onCloseProject,
}: ProjectsTableProps) {
  const { user } = useAuth();
  const deletePerm = canDeleteOrCloseProject(user);

  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="w-full border border-slate-200/80 shadow-xs overflow-hidden select-none flex-1 flex flex-col justify-between [&>.ant-card-body]:flex-1 [&>.ant-card-body]:flex [&>.ant-card-body]:flex-col [&>.ant-card-body]:justify-between [&>.ant-card-body]:h-full"
    >
      <div className="order-last w-full overflow-x-auto flex-1 flex flex-col">
        <table className="w-full table-fixed text-left border-collapse flex-1 h-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider h-[40px]">
              <th className="w-[24%] px-3.5 py-2">DỰ ÁN</th>
              <th className="w-[10%] px-3 py-2">VỐN ĐẦU TƯ</th>
              <th className="w-[15%] px-3 py-2 text-center">TIẾN ĐỘ</th>
              <th className="w-[11%] px-3 py-2 text-center">GIAI ĐOẠN</th>
              <th className="w-[12%] px-3 py-2">NGƯỜI PHỤ TRÁCH</th>
              <th className="w-[10%] px-2.5 py-2 text-center">BẮT ĐẦU</th>
              <th className="w-[10%] px-2.5 py-2 text-center">HOÀN THÀNH</th>
              <th className="w-[8%] px-2 py-2 text-center">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs h-full">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-full text-center text-slate-400 py-16">
                  Không tìm thấy dự án nào phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              <>
                {projects.map((prj) => {
                  const progressPerm = canUpdateProjectProgress(user, prj);
                  const isClosed = prj.status === "closed";

                  return (
                    <tr
                      key={prj.id}
                      style={{ height: `${100 / pageSize}%` }}
                      className={`transition-colors group cursor-pointer ${isClosed ? "bg-slate-50/60 opacity-85 hover:bg-slate-100/70" : "hover:bg-slate-50/70"
                        }`}
                      onClick={() => onViewDetail(prj, "view")}
                    >
                      <td className="px-3.5 py-1.5 align-middle">
                        <Flex vertical gap={1} className="min-w-0">
                          <Flex align="center" gap={6}>
                            <Text
                              strong
                              className={`text-xs leading-snug line-clamp-1 transition-colors ${isClosed ? "text-slate-600" : "text-slate-900 group-hover:text-[#007A78] group-hover:underline"
                                }`}
                            >
                              {prj.name}
                            </Text>
                            {isClosed && (
                              <Tag intent="danger" scale="sm" className="shrink-0 text-[10px] py-0 px-1.5">
                                Đã đóng
                              </Tag>
                            )}
                          </Flex>
                          <span className="text-[10px] font-mono text-slate-400">
                            {prj.code} {prj.location ? `• ${prj.location}` : ""}
                          </span>
                        </Flex>
                      </td>

                      <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                        <Text strong className="font-sans text-slate-900 text-xs font-semibold">
                          {prj.totalInvestment.toFixed(2)} tỷ
                        </Text>
                      </td>

                      <td className="px-3 py-1.5 align-middle text-center">
                        <ProjectProgressCell
                          actualProgress={prj.actualProgress}
                          plannedProgress={prj.plannedProgress}
                        />
                      </td>

                      <td className="px-3 py-1.5 align-middle text-center">
                        <span
                          className={`max-w-full truncate text-[11px] px-2 py-0.5 rounded-md font-medium border inline-block ${STAGE_BADGE_CLASSES[prj.currentStage]
                            }`}
                          title={STAGE_DISPLAY_NAMES[prj.currentStage]}
                        >
                          {STAGE_DISPLAY_NAMES[prj.currentStage]}
                        </span>
                      </td>

                      <td className="px-3 py-1.5 align-middle">
                        {prj.managerName === "Chưa phân công" ? (
                          <span className="inline-block text-[10.5px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            Chờ BQL phân công (M5)
                          </span>
                        ) : (
                          <>
                            <Text strong className="block truncate text-slate-800 text-xs" title={prj.managerName}>
                              {prj.managerName}
                            </Text>
                            <span className="text-[10px] text-slate-400 truncate block" title={prj.supervisorName}>
                              GS: {prj.supervisorName}
                            </span>
                          </>
                        )}
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap font-mono text-slate-700 text-xs">
                        {prj.startDate}
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap font-mono text-slate-700 text-xs">
                        {prj.endDatePlanned}
                      </td>

                      <td
                        className="px-2 py-1.5 align-middle text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flex align="center" justify="center" gap={4}>
                          <Tooltip title="Xem chi tiết">
                            <Button
                              scale="compact"
                              className="h-7 w-7 p-0 flex items-center justify-center text-slate-600 hover:text-[#007A78] hover:border-[#007A78]/50"
                              onClick={() => onViewDetail(prj, "view")}
                            >
                              <EyeOutlined className="text-xs" />
                            </Button>
                          </Tooltip>

                          <Tooltip
                            title={
                              isClosed
                                ? "Dự án đã đóng"
                                : !progressPerm.allowed
                                  ? progressPerm.reason
                                  : "Cập nhật tiến độ (Quy tắc 4)"
                            }
                          >
                            <Button
                              scale="compact"
                              className="h-7 w-7 p-0 flex items-center justify-center text-teal-700 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent"
                              disabled={!progressPerm.allowed || isClosed}
                              onClick={() => onViewDetail(prj, "progress")}
                            >
                              <ThunderboltOutlined className="text-xs" />
                            </Button>
                          </Tooltip>

                          {onCloseProject && deletePerm.allowed && (
                            <Tooltip
                              title={
                                isClosed
                                  ? "Quản lý mở lại dự án (Quy tắc 5)"
                                  : "Đóng / Xóa dự án (Quy tắc 5)"
                              }
                            >
                              <Button
                                scale="compact"
                                className="h-7 w-7 p-0 flex items-center justify-center text-rose-600 hover:bg-rose-50"
                                onClick={() => onCloseProject(prj)}
                              >
                                <StopOutlined className="text-xs" />
                              </Button>
                            </Tooltip>
                          )}
                        </Flex>
                      </td>
                    </tr>
                  );
                })}

                {/* Giữ đúng chiều cao cố định cho các hàng kể cả khi trang có ít hơn pageSize dự án */}
                {Array.from({ length: Math.max(0, pageSize - projects.length) }).map((_, idx) => (
                  <tr key={`empty-slot-${idx}`} style={{ height: `${100 / pageSize}%` }} className="border-b border-transparent">
                    <td colSpan={8} className="px-3.5 py-1.5 pointer-events-none select-none">&nbsp;</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center justify-end px-4 py-2.5 bg-slate-50/60 border-t border-slate-100">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={onPageChange}
          showSizeChanger={false}
          size="small"
        />
      </div>
    </Card>
  );
}
