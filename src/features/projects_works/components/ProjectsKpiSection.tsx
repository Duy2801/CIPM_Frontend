"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import { formatMoneyString } from "@/utils/format-money";
import type { ProjectItem } from "../types/project.types";

interface ProjectsKpiSectionProps {
  projects: ProjectItem[];
}

export default function ProjectsKpiSection({ projects }: ProjectsKpiSectionProps) {
  // Tính toán chỉ số thực tế từ danh sách dự án
  const totalProjects = projects.length;
  const underConstruction = projects.filter((p) => p.currentStage === "CONSTRUCTION").length;
  const totalInvested = projects.reduce((acc, p) => acc + (p.totalInvestment || 0), 0);
  const plan2026Total = projects.reduce((acc, p) => acc + (p.plan2026 || 0), 0);
  const newProjectsCount = projects.filter((p) => p.nature === "new" || p.actualProgress === 0).length;
  const delayedProjects = projects.filter((p) => (p.actualProgress ?? 0) < (p.plannedProgress ?? 0)).length;
  const completedProjects = projects.filter((p) => p.currentStage === "SETTLEMENT" || (p.actualProgress ?? 0) >= 100).length;

  const kpis = [
    {
      id: "total",
      value: `${totalProjects}`,
      label: "Tổng số dự án",
      color: "#DC2626",
      subtext: totalProjects > 0 ? `▲ ${newProjectsCount} dự án khởi công mới` : "Chưa có dự án",
      subtextColor: totalProjects > 0 ? "text-red-700 font-semibold" : "text-slate-400 font-normal",
    },
    {
      id: "construction",
      value: `${underConstruction}`,
      label: "Đang thi công",
      color: "#D97706",
      subtext: totalProjects > 0 ? `Chiếm ${((underConstruction / totalProjects) * 100).toFixed(1)}% tổng dự án` : "0% tổng dự án",
      subtextColor: underConstruction > 0 ? "text-amber-700 font-semibold" : "text-slate-400 font-normal",
    },
    {
      id: "investment",
      value: `${formatMoneyString(totalInvested)} VNĐ`,
      label: "Tổng mức đầu tư",
      color: "#B91C1C",
      subtext: `Kế hoạch 2026: ${formatMoneyString(plan2026Total)} VNĐ`,
      subtextColor: totalInvested > 0 ? "text-red-700 font-semibold" : "text-slate-400 font-normal",
    },
    {
      id: "delayed",
      value: `${delayedProjects}`,
      label: "Chậm tiến độ",
      color: "#DC2626",
      subtext: delayedProjects > 0 ? `▼ ${delayedProjects} dự án chậm tiến độ` : "Tiến độ đảm bảo",
      subtextColor: delayedProjects > 0 ? "text-rose-700 font-semibold" : "text-emerald-700 font-medium",
    },
    {
      id: "completed",
      value: `${completedProjects}`,
      label: "Đã hoàn thành",
      color: "#DC2626",
      subtext: completedProjects > 0 ? `▲ ${completedProjects} dự án nghiệm thu` : "Chưa có dự án hoàn thành",
      subtextColor: completedProjects > 0 ? "text-red-700 font-semibold" : "text-slate-400 font-normal",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full select-none">
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          surface="workspace"
          padding="comfortable"
          rounded="lg"
          className="border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-default"
        >
          <Flex vertical gap={4}>
            {/* Dòng 1: Số liệu lớn màu chuẩn */}
            <span
              style={{ color: kpi.color }}
              className="text-2xl sm:text-3xl font-bold font-sans tracking-tight leading-none"
            >
              {kpi.value}
            </span>

            {/* Dòng 2: Tiêu đề thẻ */}
            <Text strong className="text-xs sm:text-sm text-slate-800 font-semibold tracking-tight">
              {kpi.label}
            </Text>

            {/* Dòng 3: Dòng chú thích ngắn gọn */}
            <span className={`text-[11px] font-medium leading-tight ${kpi.subtextColor}`}>
              {kpi.subtext}
            </span>
          </Flex>
        </Card>
      ))}
    </div>
  );
}
