"use client";

import React from "react";
import {
  CloseOutlined,
  EditOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { Button, Flex, Progress, Tag, Text } from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import {
  getProjectHealthStatus,
} from "../../constants/project-enums";
import type { ProjectItem } from "../../types/project.types";
import {
  isBoardOfDirectors,
} from "../../utils/project-permissions";

interface ProjectViewTabProps {
  project: ProjectItem;
  user: AuthUser | null;
  onEditClick: () => void;
  onProgressClick?: () => void;
  onReopenProject?: (project: ProjectItem) => void;
  onClose?: () => void;
}

export default function ProjectViewTab({
  project,
  user,
  onEditClick,
  onProgressClick,
  onReopenProject,
  onClose,
}: ProjectViewTabProps) {

  // Tính toán sức khỏe tiến độ & tỷ lệ giải ngân
  const health = getProjectHealthStatus(project.actualProgress, project.plannedProgress);
  const disbursedPercent =
    project.totalInvestment > 0
      ? Math.round((project.disbursedAmount / project.totalInvestment) * 100)
      : 0;

  const currentFiscalYear = new Date().getFullYear();
  const facts = [
    { label: "Loại dự án", value: project.type },
    { label: "Địa bàn xây dựng", value: project.location || "TP. Hà Tiên" },
    { label: "Nguồn vốn", value: project.fundingSource },
    { label: "Tổng mức đầu tư", value: `${project.totalInvestment.toFixed(2)} tỷ` },
    {
      label: `Kế hoạch vốn ${currentFiscalYear}`,
      value: project.plan2026 > 0 ? `${project.plan2026.toFixed(2)} tỷ` : "Chưa giao kế hoạch",
    },
    { label: "Cơ quan quản lý", value: "Ban QLDA ĐTXD Hà Tiên" },
    {
      label: "Người phụ trách",
      value: project.managerName === "Chưa phân công" ? "Chờ BQL phân công (M5)" : project.managerName,
    },
    {
      label: "Giám sát kỹ thuật",
      value: project.supervisorName === "Chưa phân công" ? "Chờ BQL phân công (M5)" : project.supervisorName,
    },
    { label: "Ngày bắt đầu", value: project.startDate, isMono: true },
    { label: "Kế hoạch hoàn thành", value: project.endDatePlanned, isMono: true },
    ...(project.actualEndDate
      ? [{ label: "Hoàn thành thực tế", value: project.actualEndDate, isMono: true }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Thông tin tổng quan (Fact grid) */}
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
            <dd className="m-0 mt-0.5">
              <span
                className={`text-[13px] font-semibold text-slate-800 ${fact.isMono ? "font-mono" : ""
                  }`}
              >
                {fact.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Mục tiêu / Quy mô tóm tắt nếu có */}
      {project.scale && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
          <span className="text-slate-500 font-medium block mb-1">Mục tiêu / Quy mô dự án:</span>
          <p className="text-slate-800 m-0 leading-relaxed font-normal">{project.scale}</p>
        </div>
      )}

      {/* Khối Tiến độ thực tế vs Kế hoạch */}
      <section className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" justify="space-between" gap="small">
          <Text className="text-[13px] font-semibold text-slate-800">Tiến độ thực hiện dự án</Text>
          <Tag
            intent={
              health.status === "normal"
                ? "success"
                : health.status === "warning"
                  ? "warning"
                  : "danger"
            }
            scale="sm"
          >
            {health.label}
          </Tag>
        </Flex>

        <div className="mt-3">
          <Flex align="center" justify="space-between" className="text-xs text-slate-600 mb-1">
            <span>
              Tiến độ thực tế:{" "}
              <strong className="text-slate-900 font-mono text-[13px]">
                {project.actualProgress}%
              </strong>
            </span>
            <span>
              Kế hoạch: <span className="font-mono text-slate-500">{project.plannedProgress}%</span>
            </span>
          </Flex>
          <Progress
            percent={project.actualProgress}
            showInfo={false}
            size="small"
            strokeColor={
              health.status === "normal"
                ? "#007A78"
                : health.status === "warning"
                  ? "#D97706"
                  : "#DC2626"
            }
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Tỷ lệ giải ngân vốn:</span>
          <span className="font-semibold text-slate-800">
            {project.disbursedAmount.toFixed(2)} / {project.totalInvestment.toFixed(2)} tỷ ({disbursedPercent}%)
          </span>
        </div>
      </section>

      {/* Khối Nhật ký tiến độ */}
      <section className="rounded-xl border border-slate-200 p-4">
        <Flex align="center" gap={6} className="mb-3">
          <HistoryOutlined className="text-slate-500" />
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Nhật ký tiến độ tuần ({(project.progressHistory ?? []).length})
          </Text>
        </Flex>

        <div className="space-y-2 max-h-[240px] overflow-y-auto [scrollbar-width:thin] pr-1">
          {(project.progressHistory ?? []).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Chưa có lịch sử cập nhật tiến độ
            </div>
          ) : (
            (project.progressHistory ?? []).map((hist) => (
              <div
                key={hist.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <Flex justify="space-between" align="center" gap={8} className="mb-1">
                  <Text strong className="text-slate-900 text-xs">
                    {hist.updatedBy}
                  </Text>
                  <Text className="text-slate-400 font-mono text-[11px]">
                    {hist.updatedAt}
                  </Text>
                </Flex>
                <div className="text-xs font-mono font-bold text-[#007A78] mb-1">
                  {hist.oldProgress}% → {hist.newProgress}%
                </div>
                <Text className="block text-xs text-slate-600 leading-relaxed">
                  {hist.note}
                </Text>
                {hist.actualEndDateRecorded && (
                  <div className="mt-1.5">
                    <Tag intent="success" scale="sm">
                      Hoàn thành thực tế: {hist.actualEndDateRecorded}
                    </Tag>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      </div>

      {/* Footer thao tác của màn hình Chi tiết (Cố định ở đáy, nút chức năng đứng TRƯỚC, Đóng đứng SAU) */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-start gap-2.5 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
        {isBoardOfDirectors(user) && (
          <Button
            intent="primary"
            scale="sm"
            className="bg-[#007A78] border-[#007A78] hover:bg-[#006361] text-white disabled:opacity-50"
            disabled={project.status === "closed"}
            title={project.status === "closed" ? "Dự án đã đóng, không thể sửa thông tin" : undefined}
            onClick={onEditClick}
          >
            <EditOutlined className="mr-1" />
            Cập nhật thông tin
          </Button>
        )}
        {onClose && (
          <Button scale="sm" onClick={onClose}>
            <CloseOutlined className="mr-1" />
            Đóng
          </Button>
        )}
      </footer>
    </div>
  );
}
