"use client";

import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  ProjectOutlined,
  SearchOutlined,
  SlidersOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Select, Tag } from "@/components/ui";
import type {
  ProcedureFilterStatus,
  ProcedureViewMode,
  ProjectProcedureData,
} from "../types/procedure.types";

export interface ProcedureOptionItem {
  id: string;
  name: string;
  shortName: string;
  stepCount: number;
  badge?: string;
}

interface ProcedureFilterToolbarProps {
  projects: ProjectProcedureData[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ProcedureFilterStatus;
  onStatusFilterChange: (status: ProcedureFilterStatus) => void;
  viewMode: ProcedureViewMode;
  onViewModeChange: (mode: ProcedureViewMode) => void;
  onOpenAuditLog: () => void;
  onOpenStepConfig?: () => void;
  procedureProfiles?: ProcedureOptionItem[];
  selectedProcedureId?: string;
  onSelectProcedure?: (procedureId: string) => void;
  canUpdateProcedure?: boolean;
}

const statusOptions: { value: ProcedureFilterStatus; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "DANGER_RED", label: "Quá hạn kế hoạch" },
  { value: "WARNING_YELLOW", label: "Sắp đến hạn ≤ 7 ngày" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
  { value: "SKIPPED", label: "Đã bỏ qua" },
  { value: "DISABLED", label: "Bước điều kiện đã tắt" },
];

const viewModes: Array<{ value: ProcedureViewMode; label: string; icon: React.ReactNode }> = [
  { value: "tree", label: "Phân cấp", icon: <AppstoreOutlined /> },
];

export default function ProcedureFilterToolbar({
  projects,
  selectedProjectId,
  onSelectProject,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onOpenAuditLog,
  onOpenStepConfig,
  canUpdateProcedure = true,
}: ProcedureFilterToolbarProps) {
  const currentProject = projects.find((project) => project.projectId === selectedProjectId);

  return (
    <Card surface="workspace" padding="none" className="overflow-hidden border border-slate-200/80 shadow-xs">
      {/* 1. Header: Chọn dự án & Thao tác cấu hình / nhật ký */}
      <div className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 bg-white">
        {/* Chọn dự án */}
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl lg:max-w-2xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-[#007A78] shadow-2xs">
            <ProjectOutlined className="text-base" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Dự án theo dõi
              </span>
              {currentProject?.projectCode && (
                <span className="font-mono text-[10px] text-slate-400">
                  • {currentProject.projectCode}
                </span>
              )}
            </div>
            <Select
              className="h-8.5 w-full text-xs"
              value={selectedProjectId}
              showSearch
              optionFilterProp="label"
              onChange={onSelectProject}
              options={projects.map((project) => ({
                value: project.projectId,
                label: `[${project.projectCode}] ${project.projectName}`,
              }))}
            />
          </div>
        </div>

        {/* Cụm nút thao tác bên phải */}
        <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
          {canUpdateProcedure && (
            <Button
              intent="outline"
              scale="compact"
              icon={<SlidersOutlined />}
              onClick={onOpenStepConfig}
              className="h-9 text-xs font-semibold text-slate-700 hover:border-[#007A78] hover:text-[#007A78] shadow-2xs"
            >
              Cấu hình quy trình
            </Button>
          )}
          <Button
            intent="outline"
            scale="compact"
            icon={<HistoryOutlined />}
            onClick={onOpenAuditLog}
            className="h-9 text-xs font-semibold text-slate-700 hover:border-[#007A78] hover:text-[#007A78] shadow-2xs"
          >
            Nhật ký thay đổi
          </Button>
        </div>
      </div>

      {/* 2. Dải thông tin dự án (4 cột đều tăm tắp có đường phân tách) */}
      {currentProject && (
        <div className="grid grid-cols-2 divide-y divide-slate-200/60 border-b border-slate-200/80 bg-slate-50/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {/* Cột 1: Loại công trình */}
          <div className="flex flex-col justify-center px-4 py-2.5">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <AppstoreOutlined className="text-cyan-600" />
              Loại công trình
            </span>
            <div className="flex items-center">
              <Tag intent="info" scale="md" className="font-medium">
                {currentProject.projectType}
              </Tag>
            </div>
          </div>

          {/* Cột 2: Tổng mức đầu tư */}
          <div className="flex flex-col justify-center px-4 py-2.5">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <DollarCircleOutlined className="text-emerald-600" />
              Tổng mức đầu tư
            </span>
            <span className="text-sm font-bold text-slate-900">
              {currentProject.totalInvestment}{" "}
              <span className="text-xs font-normal text-slate-500">tỷ VNĐ</span>
            </span>
          </div>

          {/* Cột 3: Phụ trách / Giám sát */}
          <div className="flex flex-col justify-center px-4 py-2.5">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <TeamOutlined className="text-blue-600" />
              Phụ trách / Giám sát
            </span>
            <span
              className="truncate text-xs font-medium text-slate-800"
              title={`${currentProject.managerName} · ${currentProject.supervisorName}`}
            >
              <span className="font-semibold">{currentProject.managerName}</span>
              <span className="mx-1 text-slate-400">·</span>
              <span>{currentProject.supervisorName}</span>
            </span>
          </div>

          {/* Cột 4: Kế hoạch hoàn thành */}
          <div className="flex flex-col justify-center px-4 py-2.5">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <CalendarOutlined className="text-amber-600" />
              Kế hoạch hoàn thành
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {new Date(currentProject.expectedFinishDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      )}

      {/* 3. Toolbar tìm kiếm, lọc & chuyển đổi chế độ xem */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-white">
        {/* Nhóm tìm kiếm & Bộ lọc trạng thái */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="w-full sm:w-[300px] md:w-[340px]">
            <Input
              placeholder="Tìm mã bước, tên hoặc đơn vị thực hiện..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              allowClear
              className="h-8.5 w-full rounded-lg text-xs"
            />
          </div>

          <div className="w-full sm:w-[210px]">
            <Select
              className="h-8.5 w-full text-xs"
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Chuyển đổi chế độ xem */}
        <div className="flex shrink-0 items-center rounded-lg border border-slate-200/80 bg-slate-100 p-0.5 shadow-2xs">
          {viewModes.map((mode) => {
            const isActive = viewMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onViewModeChange(mode.value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
