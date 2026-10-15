"use client";

import React from "react";
import { EyeOutlined, StopOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Pagination, Tag, Text, Tooltip } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
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
      barClassName: "bg-[#DC2626]",
    };
  }

  if (status === "warning") {
    return {
      tagIntent: "warning" as const,
      barClassName: "bg-[#DC2626]",
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

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span className="inline-flex flex-col items-center justify-center shrink-0 w-3 h-3 text-[9px] leading-none select-none">
      <svg
        className={`w-2.5 h-2 transition-transform duration-150 -mb-[1px] ${
          direction === "asc"
            ? "text-[#DC2626] scale-125"
            : "text-slate-300 group-hover/col:text-slate-400"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 0.5L9.5 5.5H0.5L5 0.5Z" />
      </svg>
      <svg
        className={`w-2.5 h-2 transition-transform duration-150 -mt-[1px] ${
          direction === "desc"
            ? "text-[#DC2626] scale-125"
            : "text-slate-300 group-hover/col:text-slate-400"
        }`}
        viewBox="0 0 10 6"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 5.5L0.5 0.5H9.5L5 5.5Z" />
      </svg>
    </span>
  );
}

interface SortColumnHeaderProps {
  label: string;
  widthClass: string;
  align?: "left" | "center";
  currentSort?: string;
  onSortChange?: (sortKey: string) => void;
  sortKeys: {
    asc: string;
    desc: string;
    matches?: (sort: string) => boolean;
  };
  defaultSort?: "asc" | "desc";
  paddingClass?: string;
}

function SortColumnHeader({
  label,
  widthClass,
  align = "left",
  currentSort = "",
  onSortChange,
  sortKeys,
  defaultSort = "asc",
  paddingClass = "px-3 py-2",
}: SortColumnHeaderProps) {
  const isAsc = currentSort === sortKeys.asc;
  const isDesc = currentSort === sortKeys.desc;
  const isMatched = sortKeys.matches ? sortKeys.matches(currentSort) : isAsc || isDesc;

  let direction: "asc" | "desc" | null = null;
  if (isAsc) direction = "asc";
  else if (isDesc) direction = "desc";
  else if (isMatched) {
    direction = currentSort.endsWith("_desc") ? "desc" : "asc";
  }

  const handleClick = () => {
    if (!onSortChange) return;
    if (direction === "asc") {
      onSortChange(sortKeys.desc);
    } else if (direction === "desc") {
      onSortChange(sortKeys.asc);
    } else {
      onSortChange(defaultSort === "desc" ? sortKeys.desc : sortKeys.asc);
    }
  };

  const title = !direction
    ? `Sắp xếp theo ${label.toLowerCase()}`
    : direction === "asc"
      ? `${label}: Đang tăng dần (A → Z, Thấp → Cao). Nhấp để chuyển sang giảm dần`
      : `${label}: Đang giảm dần (Z → A, Cao → Thấp). Nhấp để chuyển sang tăng dần`;

  return (
    <th
      scope="col"
      className={`${widthClass} ${paddingClass} group/col cursor-pointer transition-colors select-none hover:bg-slate-100/90 ${
        align === "center" ? "text-center" : "text-left"
      } ${direction ? "bg-slate-100/60" : ""}`}
      onClick={handleClick}
      title={title}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <div
        className={`inline-flex items-center gap-1.5 ${
          align === "center" ? "justify-center w-full" : ""
        }`}
      >
        <span
          className={`transition-colors text-[11px] font-bold uppercase tracking-wider ${
            direction ? "text-[#DC2626] font-extrabold" : "text-slate-600 group-hover/col:text-slate-900"
          }`}
        >
          {label}
        </span>
        <SortIcon direction={direction} />
      </div>
    </th>
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
  sortBy?: string;
  onSortChange?: (sortKey: string) => void;
}

export default function ProjectsTable({
  projects,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onViewDetail,
  onCloseProject,
  sortBy = "code_asc",
  onSortChange,
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
        <table className="w-full min-w-[960px] table-fixed text-left border-collapse flex-1 h-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider h-[40px]">
              <SortColumnHeader
                label="DỰ ÁN"
                widthClass="w-[24%]"
                paddingClass="px-3.5 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{
                  asc: "code_asc",
                  desc: "code_desc",
                  matches: (s) => s.startsWith("code_") || s.startsWith("name_"),
                }}
                defaultSort="asc"
              />
              <SortColumnHeader
                label="VỐN ĐẦU TƯ (VNĐ)"
                widthClass="w-[12%]"
                paddingClass="px-3 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "investment_asc", desc: "investment_desc" }}
                defaultSort="desc"
              />
              <SortColumnHeader
                label="TIẾN ĐỘ"
                widthClass="w-[15%]"
                align="center"
                paddingClass="px-3 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "progress_asc", desc: "progress_desc" }}
                defaultSort="desc"
              />
              <SortColumnHeader
                label="GIAI ĐOẠN"
                widthClass="w-[11%]"
                align="center"
                paddingClass="px-3 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "stage_asc", desc: "stage_desc" }}
                defaultSort="asc"
              />
              <SortColumnHeader
                label="CHỦ NHIỆM"
                widthClass="w-[13%]"
                paddingClass="px-3 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "manager_asc", desc: "manager_desc" }}
                defaultSort="asc"
              />
              <SortColumnHeader
                label="BẮT ĐẦU"
                widthClass="w-[10%]"
                align="center"
                paddingClass="px-2.5 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "startDate_asc", desc: "startDate_desc" }}
                defaultSort="desc"
              />
              <SortColumnHeader
                label="HOÀN THÀNH"
                widthClass="w-[10%]"
                align="center"
                paddingClass="px-2.5 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "endDate_asc", desc: "endDate_desc" }}
                defaultSort="asc"
              />
              <th className="w-[8%] px-2 py-2 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                THAO TÁC
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs h-full">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-full text-center text-slate-400 py-16">
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                    <p className="text-sm font-semibold text-slate-600 m-0">
                      {total === 0
                        ? "Chưa có dự án nào trong hệ thống"
                        : "Không tìm thấy dự án nào phù hợp với bộ lọc"}
                    </p>
                    <p className="text-xs text-slate-400 m-0">
                      {total === 0
                        ? 'Nhấn nút "+ Thêm mới dự án" ở góc phải phía trên để khởi tạo dự án đầu tiên'
                        : "Thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc khác"}
                    </p>
                  </div>
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
                              className={`text-xs leading-snug line-clamp-1 transition-colors ${isClosed ? "text-slate-600" : "text-slate-900 group-hover:text-[#DC2626]"
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
                          {formatMoneyString(prj.totalInvestment || 0)} VNĐ
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
                        <Text strong className="block truncate text-slate-800 text-xs" title={prj.managerName}>
                          {prj.managerName || "—"}
                        </Text>
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
                              className="h-7 w-7 p-0 flex items-center justify-center text-slate-600 hover:text-[#DC2626] hover:border-[#DC2626]/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(prj, "view");
                              }}
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
                              className="h-7 w-7 p-0 flex items-center justify-center text-slate-600 hover:text-[#DC2626] hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                              disabled={!progressPerm.allowed || isClosed}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(prj, "progress");
                              }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCloseProject(prj);
                                }}
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
