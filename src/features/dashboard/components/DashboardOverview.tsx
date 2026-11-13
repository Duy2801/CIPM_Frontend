"use client";

import React, { useState } from "react";
import { Flex, Spin } from "@/components/ui";
import { useDashboardData } from "../hooks/useDashboardData";
import DashboardScheduleKpis from "./DashboardScheduleKpis";
import WeeklyProgressChart from "./WeeklyProgressChart";
import DisbursementQuarterlyChart from "./DisbursementQuarterlyChart";
import DashboardAlertPanel from "./DashboardAlertPanel";
import ActivityLogSection from "./ActivityLogSection";
import ActivityDetailPage from "./ActivityDetailPage";
import ScheduleStatsPage, { type ScheduleFilter } from "./ScheduleStatsPage";

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
  const [activityId, setActivityId] = useState<string>();
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>();
  const openedActivity = activities.find((a) => a.id === activityId);

  return (
    <>
    {openedActivity && (
      <div className="mx-auto w-full max-w-[2560px]">
        <ActivityDetailPage activity={openedActivity} onBack={() => setActivityId(undefined)} />
      </div>
    )}
    {scheduleFilter && (
      <div className="mx-auto w-full max-w-[2560px]">
        <ScheduleStatsPage filter={scheduleFilter} onBack={() => setScheduleFilter(undefined)} />
      </div>
    )}
    <div hidden={Boolean(openedActivity) || Boolean(scheduleFilter)}>
    <Flex vertical gap={16} className="w-full max-w-[2560px] mx-auto select-none">
      <Spin spinning={loading} description="Đang làm mới dữ liệu Dashboard...">
        <Flex vertical gap={18} className="w-full">
          {/* 1. Hàng 4 Thẻ KPI trên cùng */}
          <DashboardScheduleKpis
            onOpen={(filter) => {
              setScheduleFilter(filter);
              window.scrollTo({ top: 0 });
            }}
          />
          <WeeklyProgressChart />

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

          {/* 4. Hàng dưới cùng: Bảng Nhật ký điều hành gần nhất */}
          <ActivityLogSection
            activities={activities}
            onOpen={(id) => {
              setActivityId(id);
              window.scrollTo({ top: 0 });
            }}
          />
        </Flex>
      </Spin>
    </Flex>
    </div>
    </>
  );
}
