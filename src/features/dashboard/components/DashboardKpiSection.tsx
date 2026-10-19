"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import type { KpiCardData } from "../constants/dashboard-mock-data";

interface DashboardKpiSectionProps {
  data: KpiCardData;
}

export default function DashboardKpiSection({ data }: DashboardKpiSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
      {/* 1. Tổng dự án */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs p-4 sm:p-5 rounded-2xl"
      >
        <Flex vertical align="center" gap={6} className="w-full text-center">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 whitespace-nowrap">
            {data.totalProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-700 font-semibold text-center">
            Tổng dự án
          </Text>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 w-fit mt-0.5">
            Đang quản lý
          </span>
        </Flex>
      </Card>

      {/* 2. Giải ngân 2026 */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs p-4 sm:p-5 rounded-2xl"
      >
        <Flex vertical align="center" gap={6} className="w-full text-center">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 whitespace-nowrap inline-flex items-baseline justify-center gap-1">
            {data.disbursedAmount}
            <span className="text-sm sm:text-base font-semibold text-slate-600">tỷ</span>
          </span>
          <Text className="text-xs sm:text-sm text-slate-700 font-semibold text-center">
            Giải ngân 2026
          </Text>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 w-fit mt-0.5">
            Kế hoạch
          </span>
        </Flex>
      </Card>

      {/* 3. Chậm tiến độ */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs p-4 sm:p-5 rounded-2xl"
      >
        <Flex vertical align="center" gap={6} className="w-full text-center">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 whitespace-nowrap">
            0{data.delayedProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-700 font-semibold text-center">
            Chậm tiến độ
          </Text>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 w-fit mt-0.5">
            Cần xử lý
          </span>
        </Flex>
      </Card>

      {/* 4. Hoàn thành */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs p-4 sm:p-5 rounded-2xl"
      >
        <Flex vertical align="center" gap={6} className="w-full text-center">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 whitespace-nowrap">
            {data.completedProjects}
          </span>
          <Text className="text-xs sm:text-sm text-slate-700 font-semibold text-center">
            Hoàn thành
          </Text>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 w-fit mt-0.5">
            Đã nghiệm thu
          </span>
        </Flex>
      </Card>

      {/* 5. Hộ dân GPMB */}
      <Card
        surface="workspace"
        padding="compact"
        rounded="lg"
        className="border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl"
      >
        <Flex vertical align="center" gap={6} className="w-full text-center">
          <span className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-slate-900 whitespace-nowrap">
            {data.gpmbRate}
          </span>
          <Text className="text-xs sm:text-sm text-slate-700 font-semibold text-center">
            Hộ dân GPMB
          </Text>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 w-fit mt-0.5">
            Đã bàn giao
          </span>
        </Flex>
      </Card>
    </div>
  );
}
