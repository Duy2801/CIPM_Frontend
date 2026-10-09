"use client";

import React from "react";
import { Flex, Spin } from "@/components/ui";
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardKpiSection from "./DashboardKpiSection";
import DisbursementQuarterlyChart from "./DisbursementQuarterlyChart";
import DashboardAlertPanel from "./DashboardAlertPanel";
import ActivityLogSection from "./ActivityLogSection";

export default function DashboardOverview() {
  const {
    kpiData,
    tasks,
    quarterlyData,
    activities,
    loading,
    lastUpdated,
    countdown,
    refreshData,
    currentRole,
  } = useDashboardData();

  return (
    <Flex vertical gap={16} className="w-full max-w-[2560px] mx-auto select-none">
      <Spin spinning={loading} description="Đang làm mới dữ liệu Dashboard...">
        <Flex vertical gap={18} className="w-full">
          {/* 1. Hàng 4 Thẻ KPI trên cùng */}
          <DashboardKpiSection data={kpiData} />

          {/* 2. Hàng giữa: Biểu đồ giải ngân theo quý (Trái) & Việc cần xử lý ngay (Phải) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
            {/* Cột trái (~58% - 7/12): Biểu đồ giải ngân song song 4 Quý + 3 ô số liệu */}
            <div className="lg:col-span-7 flex">
              <DisbursementQuarterlyChart
                quarters={quarterlyData}
                accumulatedDisbursed={kpiData.disbursedAmount}
                remainingAmount={231.5}
                requiredMonthlySpeed={69.8}
              />
            </div>

            {/* Cột phải (~42% - 5/12): Việc cần xử lý ngay (4 vấn đề ưu tiên cao) */}
            <div className="lg:col-span-5 flex">
              <DashboardAlertPanel tasks={tasks} />
            </div>
          </div>

          {/* 3. Hàng dưới: Bảng Nhật ký điều hành gần nhất */}
          <ActivityLogSection activities={activities} />
        </Flex>
      </Spin>
    </Flex>
  );
}
