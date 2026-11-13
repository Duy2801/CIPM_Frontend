"use client";

import React from "react";
import { HistoryOutlined } from "@ant-design/icons";
import { Card, Flex, Pagination, Text } from "@/components/ui";
import { ACTIVITY_PAGE_SIZE, useActivityLog } from "../hooks/useActivityLog";
import { useDashboardStore } from "../hooks/useDashboardStore";
import ActivityLogFilters from "./ActivityLogFilters";
import ActivityLogTable from "./ActivityLogTable";

export default function ActivityLogSection({ onOpen }: { onOpen: (activityId: string) => void }) {
  const { page, total } = useActivityLog();
  const setPage = useDashboardStore((s) => s.setActivityPage);

  return (
    <Card
      surface="workspace"
      padding="compact"
      rounded="lg"
      className="w-full border border-slate-200/80 bg-white shadow-xs rounded-2xl p-5"
    >
      <Flex vertical gap={10} className="w-full">
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap={12}
          className="min-h-14 border-b border-slate-100 py-2.5"
        >
          <Flex align="center" gap={12} wrap="wrap" className="flex-1 justify-start">
            <Flex align="center" gap={8} className="shrink-0 mr-1">
              <HistoryOutlined className="text-[#DC2626] text-base" />
              <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                NHẬT KÝ ĐIỀU HÀNH GẦN NHẤT
              </Text>
            </Flex>
            <ActivityLogFilters />
          </Flex>

          <div className="shrink-0 ml-auto">
            <Pagination
              size="small"
              current={page}
              pageSize={ACTIVITY_PAGE_SIZE}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </Flex>

        <ActivityLogTable onOpen={onOpen} />
      </Flex>
    </Card>
  );
}
