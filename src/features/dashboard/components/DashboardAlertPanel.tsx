"use client";

import React, { useMemo } from "react";
import { InboxOutlined, ThunderboltFilled } from "@ant-design/icons";
import { Button, Card, Flex, Text } from "@/components/ui";
import { useUrgentTasks } from "../hooks/useDashboardQueries";
import { useDashboardStore } from "../hooks/useDashboardStore";
import UrgentTaskCard from "./UrgentTaskCard";
import UrgentTaskFilter from "./UrgentTaskFilter";

export default function DashboardAlertPanel() {
  const tasks = useUrgentTasks();
  const filter = useDashboardStore((s) => s.urgentFilter);
  const setFilter = useDashboardStore((s) => s.setUrgentFilter);
  const visibleIds = useMemo(
    () => tasks.filter((t) => filter === "all" || t.badgeColor === filter).map((t) => t.id),
    [tasks, filter],
  );

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between rounded-2xl p-5"
    >
      <Flex vertical gap={14} className="w-full">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <ThunderboltFilled className="text-red-600 text-base shrink-0" />
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">
              VIỆC CẦN XỬ LÝ NGAY
            </span>
          </div>
          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full shrink-0">
            {visibleIds.length} {visibleIds.length === tasks.length ? "VẤN ĐỀ" : `/ ${tasks.length} VẤN ĐỀ`}
          </span>
        </div>

        <UrgentTaskFilter />

        <div className="w-full max-h-[385px] overflow-y-auto pr-1.5 flex flex-col gap-2.5 select-none [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {visibleIds.length === 0 ? (
            <Flex align="center" justify="center" vertical gap={8} className="py-12 text-center text-slate-500">
              <InboxOutlined className="text-3xl text-slate-300" />
              <div className="space-y-0.5">
                <Text strong className="text-xs text-slate-700 block">
                  Không có công việc nào trong mục này
                </Text>
                <span className="text-[11px] text-slate-400 block">Chọn trạng thái khác để xem công việc</span>
              </div>
              <Button
                scale="compact"
                variant="text"
                className="text-xs text-red-600 hover:underline mt-1"
                onClick={() => setFilter("all")}
              >
                Hiển thị tất cả {tasks.length} vấn đề
              </Button>
            </Flex>
          ) : (
            visibleIds.map((id) => <UrgentTaskCard key={id} taskId={id} />)
          )}
        </div>
      </Flex>
    </Card>
  );
}
