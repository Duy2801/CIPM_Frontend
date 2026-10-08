"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import type { ProjectItem } from "../types/project.types";

interface ProjectsKpiSectionProps {
  projects: ProjectItem[];
}

export default function ProjectsKpiSection({ projects }: ProjectsKpiSectionProps) {
  // Tính toán nhanh chỉ số từ danh sách
  const totalProjects = 48; // Toàn cơ quan
  const underConstruction = projects.filter((p) => p.currentStage === "CONSTRUCTION").length || 18;
  const totalInvested = projects.reduce((acc, p) => acc + p.totalInvestment, 0) + 400; // Tổng quy mô
  const delayedProjects = 5;
  const completedProjects = 12;

  const kpis = [
    {
      id: "total",
      value: `${totalProjects}`,
      label: "Tổng số dự án",
      color: "#00897B",
      subtext: "▲ 16 dự án khởi công mới",
      subtextColor: "text-[#00897B]",
    },
    {
      id: "construction",
      value: `${underConstruction}`,
      label: "Đang thi công",
      color: "#D97706",
      subtext: "Chiếm 37.5% tổng dự án",
      subtextColor: "text-[#D97706]",
    },
    {
      id: "investment",
      value: `${totalInvested.toFixed(1)} tỷ`,
      label: "Tổng mức đầu tư",
      color: "#2563EB",
      subtext: "Kế hoạch 2026: 383.5 tỷ",
      subtextColor: "text-[#2563EB]",
    },
    {
      id: "delayed",
      value: `${delayedProjects}`,
      label: "Chậm tiến độ",
      color: "#DC2626",
      subtext: "▼ 2 dự án mức khẩn cấp",
      subtextColor: "text-[#DC2626]",
    },
    {
      id: "completed",
      value: `${completedProjects}`,
      label: "Đã hoàn thành",
      color: "#059669",
      subtext: "▲ 100% đạt chuẩn nghiệm thu",
      subtextColor: "text-[#059669]",
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
