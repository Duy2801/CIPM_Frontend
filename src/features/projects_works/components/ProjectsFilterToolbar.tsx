"use client";

import React from "react";
import { App } from "antd";
import { DownloadOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Select } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import { useAuthStore } from "@/stores/auth.store";
import { getProjectExportScope } from "../utils/project-permissions";
import { WORK_TYPE_OPTIONS } from "../constants/project-enums";
import type { ProjectItem, ProjectWorkType } from "../types/project.types";

interface ProjectsFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedType: ProjectWorkType | "ALL";
  onTypeChange: (val: ProjectWorkType | "ALL") => void;
  statusFilter?: "ALL" | "active" | "closed";
  onStatusFilterChange?: (val: "ALL" | "active" | "closed") => void;
  totalFilteredCount: number;
  filteredProjects: ProjectItem[];
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
  totalFilteredCount,
  filteredProjects,
  canCreateProject = false,
  onOpenCreateModal,
}: ProjectsFilterToolbarProps) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const exportScope = getProjectExportScope(user);

  // Hàm xuất CSV chuẩn UTF-8 BOM cho Excel tiếng Việt theo phân quyền BRD Mục 5
  const handleExportCSV = () => {
    if (!exportScope.canExport) {
      message.warning(exportScope.reason || "Bạn không có quyền xuất báo cáo danh mục dự án.");
      return;
    }

    let targetProjects = [...filteredProjects];

    // Tổ KT: DA mình -> Chỉ xuất các dự án do kỹ sư này phụ trách chính hoặc giám sát kỹ thuật
    if (exportScope.scope === "OWN_PROJECTS") {
      const userDisplayName = (user?.displayName || user?.name || "").trim().toLowerCase();
      targetProjects = targetProjects.filter((p) => {
        const mgr = (p.managerName || "").trim().toLowerCase();
        const sup = (p.supervisorName || "").trim().toLowerCase();
        return mgr.includes(userDisplayName) || sup.includes(userDisplayName) || !userDisplayName;
      });

      if (targetProjects.length === 0) {
        message.info("Không có dự án nào thuộc phạm vi bạn phụ trách/giám sát kỹ thuật (DA mình) để xuất.");
        return;
      }
    }

    const headers = [
      "Mã dự án",
      "Tên công trình",
      "Loại công trình",
      "Nguồn vốn",
      "Tổng mức ĐT (VNĐ)",
      "KH vốn 2026 (VNĐ)",
      "Đã giải ngân (VNĐ)",
      "Người phụ trách",
      "Giám sát KT",
      "Giai đoạn",
      "Tiến độ thực tế (%)",
      "Tiến độ KH (%)",
      "Ngày bắt đầu",
      "Ngày KT kế hoạch",
    ];

    const rows = targetProjects.map((p) => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.type}"`,
      `"${p.fundingSource}"`,
      formatMoneyString(p.totalInvestment),
      formatMoneyString(p.plan2026),
      formatMoneyString(p.disbursedAmount),
      `"${p.managerName}"`,
      `"${p.supervisorName}"`,
      `"${p.currentStage}"`,
      p.actualProgress,
      p.plannedProgress,
      p.startDate,
      p.endDatePlanned,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Danh_sach_du_an_BQL_HaTien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (exportScope.scope === "OWN_PROJECTS") {
      message.success(`Đã xuất báo cáo ${targetProjects.length} dự án bạn phụ trách/giám sát kỹ thuật (DA mình).`);
    } else {
      message.success(`Đã xuất báo cáo toàn bộ ${targetProjects.length} dự án thành công (Ban Giám đốc).`);
    }
  };

  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="w-full border border-slate-200/80 shadow-xs select-none"
    >
      <div className="w-full p-3 sm:p-3.5">
        {/* Thanh tìm kiếm, bộ lọc & nút hành động - NẰM GỌN TRÊN 1 HÀNG NGANG */}
        <div className="w-full flex items-center gap-2.5">
          {/* Ô tìm kiếm co giãn linh hoạt */}
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

          {/* Lọc loại công trình */}
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

          {/* Lọc trạng thái vận hành (Quy tắc 5: Đang hoạt động / Đã đóng) */}
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

          {/* Các nút hành động chính */}
          <div className="flex items-center gap-2 shrink-0">
            {exportScope.canExport && (
              <Button
                scale="compact"
                intent="default"
                className="h-8 rounded-lg px-3 text-slate-700 hover:border-[#DC2626]/50 hover:text-[#DC2626] text-xs font-medium"
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
              >
                Xuất CSV
              </Button>
            )}

            {canCreateProject && (
              <Button
                intent="primary"
                scale="compact"
                className="h-8 rounded-lg border-[#DC2626] bg-[#DC2626] px-3.5 font-semibold text-white shadow-xs hover:bg-[#B91C1C] text-xs"
                icon={<PlusOutlined />}
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
