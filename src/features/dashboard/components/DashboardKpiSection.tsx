"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import type { KpiCardData } from "../constants/dashboard-mock-data";

interface DashboardKpiSectionProps {
  data: KpiCardData;
}

export default function DashboardKpiSection({ data }: DashboardKpiSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full">
      {/* 1. Tổng dự án — Xanh teal */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs"
      >
        <Flex vertical gap={6} className="w-full">
          <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-[#00897B]">
            {data.totalProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-500 font-medium">
            Tổng dự án
          </Text>
          <span className="text-xs font-semibold text-[#00897B] flex items-center gap-1 mt-0.5">
            ▲ Đang quản lý
          </span>
        </Flex>
      </Card>

      {/* 2. Giải ngân 2026 — Vàng gold */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs"
      >
        <Flex vertical gap={6} className="w-full">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-[#D97706] truncate">
            {data.disbursedAmount} tỷ
          </span>
          <Text className="text-xs sm:text-sm text-slate-500 font-medium">
            Giải ngân 2026
          </Text>
          <span className="text-xs font-semibold text-[#D97706] flex items-center gap-1 mt-0.5">
            ▲ {data.disbursementRate}% kế hoạch
          </span>
        </Flex>
      </Card>

      {/* 3. Chậm tiến độ — Đỏ cảnh báo */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs"
      >
        <Flex vertical gap={6} className="w-full">
          <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-[#DC2626]">
            0{data.delayedProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-500 font-medium">
            Chậm tiến độ
          </Text>
          <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1 mt-0.5">
            ▼ Cần xử lý
          </span>
        </Flex>
      </Card>

      {/* 4. Hoàn thành — Xanh lá */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs"
      >
        <Flex vertical gap={6} className="w-full">
          <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-[#059669]">
            {data.completedProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-500 font-medium">
            Hoàn thành
          </Text>
          <span className="text-xs font-semibold text-[#059669] flex items-center gap-1 mt-0.5">
            ▲ Đã nghiệm thu
          </span>
        </Flex>
      </Card>

      {/* 5. Giải phóng mặt bằng — Xanh dương */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs col-span-2 sm:col-span-1"
      >
        <Flex vertical gap={6} className="w-full">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-[#2563EB]">
            {data.gpmbRate}
          </span>
          <Text className="text-xs sm:text-sm text-slate-500 font-medium">
            Hộ dân GPMB
          </Text>
          <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1 mt-0.5">
            ▲ Đã bàn giao
          </span>
        </Flex>
      </Card>
    </div>
  );
}
