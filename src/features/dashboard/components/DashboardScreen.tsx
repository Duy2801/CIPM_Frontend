"use client";

import React, { useState } from "react";
import { Flex, Spin } from "@/components/ui";
import { useDashboardRefresh } from "../hooks/useDashboardRefresh";
import ActivityDetailPage from "./ActivityDetailPage";
import ActivityLogSection from "./ActivityLogSection";
import DashboardAlertPanel from "./DashboardAlertPanel";
import DashboardScheduleKpis from "./DashboardScheduleKpis";
import DisbursementQuarterlyChart from "./DisbursementQuarterlyChart";
import ScheduleStatsPage, { type ScheduleFilter } from "./ScheduleStatsPage";
import WeeklyProgressChart from "./WeeklyProgressChart";

const openAtTop = <T,>(setter: (value: T) => void) => (value: T) => {
  setter(value);
  window.scrollTo({ top: 0 });
};

export default function DashboardScreen() {
  const { loading } = useDashboardRefresh();
  const [activityId, setActivityId] = useState<string>();
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>();

  return (
    <>
      {activityId && (
        <div className="mx-auto w-full max-w-[2560px]">
          <ActivityDetailPage activityId={activityId} onBack={() => setActivityId(undefined)} />
        </div>
      )}
      {scheduleFilter && (
        <div className="mx-auto w-full max-w-[2560px]">
          <ScheduleStatsPage filter={scheduleFilter} onBack={() => setScheduleFilter(undefined)} />
        </div>
      )}
      <div hidden={Boolean(activityId) || Boolean(scheduleFilter)}>
        <Flex vertical gap={16} className="w-full max-w-[2560px] mx-auto select-none">
          <Spin spinning={loading} description="Đang làm mới dữ liệu Dashboard...">
            <Flex vertical gap={18} className="w-full">
              <DashboardScheduleKpis onOpen={openAtTop(setScheduleFilter)} />
              <WeeklyProgressChart />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
                <div className="lg:col-span-7 flex">
                  <DisbursementQuarterlyChart />
                </div>
                <div className="lg:col-span-5 flex">
                  <DashboardAlertPanel />
                </div>
              </div>

              <ActivityLogSection onOpen={openAtTop(setActivityId)} />
            </Flex>
          </Spin>
        </Flex>
      </div>
    </>
  );
}
