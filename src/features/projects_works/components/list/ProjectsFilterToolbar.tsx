"use client";

import React from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Select } from "@/components/ui";
import { WORK_TYPE_OPTIONS } from "../../constants/project-enums";
import type { ProjectWorkType } from "../../types/project.types";

interface ProjectsFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedType: ProjectWorkType | "ALL";
  onTypeChange: (val: ProjectWorkType | "ALL") => void;
  statusFilter?: "ALL" | "active" | "closed";
  onStatusFilterChange?: (val: "ALL" | "active" | "closed") => void;
  canCreateProject?: boolean;
  onOpenCreateModal: () => void;
}

export default function ProjectsFilterToolbar({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  statusFilter = "ALL",
  onStatusFilterChange,
  canCreateProject = false,
  onOpenCreateModal,
}: ProjectsFilterToolbarProps) {
  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="w-full border border-slate-200/80 shadow-xs select-none"
    >
      <div className="w-full p-3 sm:p-3.5">
        <div className="w-full flex items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <Input
              prefix={<SearchOutlined className="text-slate-400 text-xs" />}
              placeholder="Tìm theo tên dự án, mã, nhân sự phụ trách..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              className="h-8.5 rounded-lg text-xs"
            />
          </div>

          <div className="w-[160px] shrink-0">
            <Select
              value={selectedType}
              onChange={(val) => onTypeChange(val as ProjectWorkType | "ALL")}
              className="h-8.5 w-full text-xs"
              options={[
                { value: "ALL", label: "Tất cả loại" },
                ...WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>

          {onStatusFilterChange && (
            <div className="w-[160px] shrink-0">
              <Select
                value={statusFilter}
                onChange={(val) => onStatusFilterChange(val as "ALL" | "active" | "closed")}
                className="h-8.5 w-full text-xs"
                options={[
                  { value: "ALL", label: "Tất cả trạng thái" },
                  { value: "active", label: "Đang hoạt động" },
                  { value: "closed", label: "Đã đóng (Lưu trữ)" },
                ]}
              />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {canCreateProject && (
              <Button
                intent="primary"
                scale="compact"
                className="h-8 rounded-lg border-[#DC2626] bg-[#DC2626] px-3.5 font-semibold text-white shadow-xs hover:bg-[#B91C1C] text-xs"
                onClick={onOpenCreateModal}
              >
                Thêm dự án
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
