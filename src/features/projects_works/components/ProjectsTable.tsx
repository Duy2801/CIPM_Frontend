"use client";

import React from "react";
import { EditOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Pagination, Switch, Tag, Text, Tooltip } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { useAuth } from "@/features/auth";
import {
  getProjectHealthStatus,
} from "../constants/project-enums";
import type { ProjectItem } from "../types/project.types";
import {
  canDeleteOrCloseProject,
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
      className={`${widthClass} ${paddingClass} group/col cursor-pointer transition-colors select-none hover:bg-slate-200/70 ${
        align === "center" ? "text-center" : "text-left"
      } ${direction ? "bg-red-50/70" : ""}`}
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
          className={`whitespace-nowrap transition-colors text-[11px] font-bold uppercase tracking-wider ${
            direction ? "text-[#DC2626] font-extrabold" : "text-slate-700 group-hover/col:text-slate-900"
          }`}
        >
          {label}
        </span>
        <SortIcon direction={direction} />
      </div>
    </th>
  );
}

/** Tiêu đề cột không sắp xếp */
function PlainColumnHeader({
  label,
  widthClass,
  align = "left",
  paddingClass = "px-3 py-2",
}: {
  label: string;
  widthClass: string;
  align?: "left" | "center";
  paddingClass?: string;
}) {
  return (
    <th
      scope="col"
      className={`${widthClass} ${paddingClass} whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-700 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}

interface ProjectsTableProps {
  projects: ProjectItem[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetail: (project: ProjectItem) => void;
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
      <div className="w-full overflow-x-auto flex-1 flex flex-col">
        <table className="w-full min-w-[960px] table-fixed text-left border-collapse">
          <thead>
            <tr className="h-[44px] border-b-2 border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <PlainColumnHeader label="DỰ ÁN" widthClass="w-[30%]" paddingClass="px-3.5 py-2" />
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
              <PlainColumnHeader label="CHỦ NHIỆM" widthClass="w-[15%]" paddingClass="px-3 py-2" />
              <PlainColumnHeader label="BẮT ĐẦU" widthClass="w-[10%]" align="center" paddingClass="px-2.5 py-2" />
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
              <PlainColumnHeader label="THAO TÁC" widthClass="w-[11%]" align="center" paddingClass="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-full text-center text-slate-400 py-16">
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
                  const isClosed = prj.status === "closed";

                  return (
                    <tr
                      key={prj.id}
                      className={`h-12 transition-colors group cursor-pointer ${isClosed ? "bg-slate-50/60 opacity-85 hover:bg-slate-100/70" : "hover:bg-slate-50/70"
                        }`}
                      onClick={() => onViewDetail(prj)}
                    >
                      <td className="px-3.5 py-1.5 align-middle">
                        <Flex vertical className="min-w-0">
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

                      <td className="px-3 py-1.5 align-middle">
                        <Text strong className="block truncate text-slate-800 text-xs" title={prj.managerName}>
                          {prj.managerName || "—"}
                        </Text>
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap text-slate-700 text-xs">
                        {prj.startDate ? formatDateVi(prj.startDate) : "—"}
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap text-slate-700 text-xs">
                        {prj.endDatePlanned ? formatDateVi(prj.endDatePlanned) : "—"}
                      </td>

                      <td
                        className="px-2 py-1.5 align-middle text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flex align="center" justify="center" gap={4}>
                          <Tooltip title="Xem & cập nhật dự án">
                            <Button
                              scale="compact"
                              aria-label="Xem và cập nhật dự án"
                              className="h-7 w-7 p-0 flex items-center justify-center text-slate-600 hover:text-[#DC2626] hover:border-[#DC2626]/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(prj);
                              }}
                            >
                              <EditOutlined className="text-xs" />
                            </Button>
                          </Tooltip>

                          {onCloseProject && deletePerm.allowed && (
                            <Tooltip title={isClosed ? "Bật lại dự án" : "Tắt (đóng) dự án"}>
                              <Switch
                                size="small"
                                checked={!isClosed}
                                aria-label={`${isClosed ? "Bật lại" : "Tắt"} dự án ${prj.code}`}
                                onClick={(_checked, e) => e.stopPropagation()}
                                onChange={() => onCloseProject(prj)}
                                className={isClosed ? "" : "!bg-[#DC2626]"}
                              />
                            </Tooltip>
                          )}
                        </Flex>
                      </td>
                    </tr>
                  );
                })}

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
