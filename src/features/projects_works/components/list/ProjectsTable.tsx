"use client";

import React from "react";
import { EditOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Pagination, Switch, Tag, Tooltip } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { formatDateVi } from "@/utils/date";
import { useAuth } from "@/shared/auth";
import type { ProjectItem } from "@/shared/projects_works/types/project.types";
import ProjectProgressCell from "./ProjectProgressCell";
import { PlainColumnHeader, SortColumnHeader } from "@/shared/projects_works/components/list/ProjectsTableHeaders";
import {
  canDeleteOrCloseProject,
} from "../../utils/project-permissions";

interface ProjectsTableProps {
  projects: ProjectItem[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onViewDetail: (project: ProjectItem) => void;
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
        <table className="w-full min-w-[1080px] table-fixed text-left border-collapse">
          <thead>
            <tr className="h-[44px] border-b-2 border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <PlainColumnHeader label="DỰ ÁN" widthClass="w-[20%]" paddingClass="px-3.5 py-2" />
              <PlainColumnHeader label="LOẠI DỰ ÁN" widthClass="w-[12%]" paddingClass="px-3 py-2" />
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
                widthClass="w-[12%]"
                align="center"
                paddingClass="px-3 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "progress_asc", desc: "progress_desc" }}
                defaultSort="desc"
              />
              <PlainColumnHeader label="CHỦ NHIỆM" widthClass="w-[13%]" paddingClass="px-3 py-2" />
              <SortColumnHeader
                label="NGÀY BẮT ĐẦU"
                widthClass="w-[10.5%]"
                align="center"
                paddingClass="px-2.5 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "startDate_asc", desc: "startDate_desc" }}
                defaultSort="desc"
              />
              <SortColumnHeader
                label="NGÀY KẾT THÚC"
                widthClass="w-[10.5%]"
                align="center"
                paddingClass="px-2.5 py-2"
                currentSort={sortBy}
                onSortChange={onSortChange}
                sortKeys={{ asc: "endDate_asc", desc: "endDate_desc" }}
                defaultSort="asc"
              />
              <PlainColumnHeader label="THAO TÁC" widthClass="w-[10%]" align="center" paddingClass="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-full text-center text-slate-400 py-16">
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                    <p className="text-sm font-semibold text-slate-600 m-0">
                      {total === 0
                        ? "Chưa có dự án nào trong hệ thống"
                        : "Không tìm thấy dự án nào phù hợp với bộ lọc"}
                    </p>
                    {total > 0 && (
                      <p className="text-xs text-slate-400 m-0">Thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc khác</p>
                    )}
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
                      className={`h-12 transition-colors group cursor-pointer ${isClosed ? "bg-slate-50/60 hover:bg-slate-100/70" : "hover:bg-slate-50/70"
                        }`}
                      onClick={() => onViewDetail(prj)}
                    >
                      <td className="px-3.5 py-1.5 align-middle">
                        <Flex vertical className="min-w-0">
                          <Flex align="center" gap={6}>
                            <span title={prj.name} className="text-xs font-medium leading-snug line-clamp-2 text-slate-800 transition-colors group-hover:text-[#DC2626]">
                              {prj.name}
                            </span>
                            {isClosed && (
                              <Tag intent="danger" scale="sm" className="shrink-0 text-[10px] py-0 px-1.5">
                                Đã đóng
                              </Tag>
                            )}
                          </Flex>
                        </Flex>
                      </td>

                      <td className="px-3 py-1.5 align-middle">
                        <span className="block truncate text-xs font-medium text-slate-800" title={prj.type}>
                          {prj.type || "—"}
                        </span>
                      </td>

                      <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                        <span className="tabular-nums text-xs font-medium text-slate-800">
                          {formatMoneyString(prj.totalInvestment || 0)} VNĐ
                        </span>
                      </td>

                      <td className="px-3 py-1.5 align-middle text-center">
                        <ProjectProgressCell actualProgress={prj.actualProgress} />
                      </td>

                      <td className="px-3 py-1.5 align-middle">
                        <span className="block truncate text-xs font-medium text-slate-800" title={prj.managerName}>
                          {prj.managerName || "—"}
                        </span>
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap tabular-nums text-xs font-medium text-slate-800">
                        {prj.startDate ? formatDateVi(prj.startDate) : "—"}
                      </td>

                      <td className="px-2.5 py-1.5 align-middle text-center whitespace-nowrap tabular-nums text-xs font-medium text-slate-800">
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
