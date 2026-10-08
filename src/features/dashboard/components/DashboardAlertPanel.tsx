"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircleFilled,
  FilterOutlined,
  InboxOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { Button, Card, Flex, Select, Text, Tooltip } from "@/components/ui";
import { canAccessPath } from "@/access-control";
import { useAuthStore } from "@/stores/auth.store";
import type { UrgentTask } from "../constants/dashboard-mock-data";

interface DashboardAlertPanelProps {
  tasks: UrgentTask[];
}

type FilterCategory = "all" | "danger" | "warning" | "info" | "success";

const badgeColorStyles: Record<string, string> = {
  danger: "text-[#DC2626] font-semibold text-[11px]",
  warning: "text-[#D97706] font-semibold text-[11px]",
  info: "text-[#2563EB] font-semibold text-[11px]",
  success: "text-[#059669] font-semibold text-[11px]",
};

const dotColorStyles: Record<string, string> = {
  danger: "bg-[#DC2626]",
  warning: "bg-[#D97706]",
  info: "bg-[#2563EB]",
  success: "bg-[#059669]",
};

const buttonVariantStyles: Record<string, string> = {
  danger: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white",
  warning: "!bg-[#D97706] !border-[#D97706] hover:!bg-[#B45309] !text-white",
  info: "!bg-[#2563EB] !border-[#2563EB] hover:!bg-[#1D4ED8] !text-white",
  brand: "!bg-[#007A78] !border-[#007A78] hover:!bg-[#005F5D] !text-white",
};

export default function DashboardAlertPanel({ tasks }: DashboardAlertPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  // Bộ lọc danh sách theo trạng thái đã chọn
  const filteredTasks = useMemo(() => {
    if (activeFilter === "all") return tasks;
    return tasks.filter((t) => t.badgeColor === activeFilter);
  }, [tasks, activeFilter]);

  // Các tùy chọn trong Dropdown lọc trạng thái: Tinh tế, trung tính, không màu mè, không hiện số
  const statusFilterOptions = [
    {
      value: "all",
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span className="text-slate-700 text-xs font-medium">Tất cả trạng thái</span>
        </div>
      ),
    },
    {
      value: "danger",
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-700 text-xs font-medium">Khẩn cấp</span>
        </div>
      ),
    },
    {
      value: "warning",
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-700 text-xs font-medium">Quan trọng</span>
        </div>
      ),
    },
    {
      value: "info",
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span className="text-slate-700 text-xs font-medium">Chú ý</span>
        </div>
      ),
    },
    {
      value: "success",
      label: (
        <div className="flex items-center gap-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-700 text-xs font-medium">Thông tin</span>
        </div>
      ),
    },
  ];

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <Flex vertical gap={12} className="w-full">
        {/* 1. Header: Tiêu đề & Tổng số vấn đề */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <ThunderboltFilled className="text-[#DC2626] text-base shrink-0" />
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">
              VIỆC CẦN XỬ LÝ NGAY
            </span>
          </div>

          <span className="text-[10.5px] font-bold text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] px-2.5 py-0.5 rounded-full shrink-0">
            {filteredTasks.length} {filteredTasks.length === tasks.length ? "VẤN ĐỀ" : `/ ${tasks.length} VẤN ĐỀ`}
          </span>
        </div>

        {/* 2. Dòng Bộ lọc theo Trạng thái (Xuống dòng riêng biệt, thoáng đẹp) */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
            <FilterOutlined className="text-[#007A78] text-xs" />
            <span>Lọc trạng thái:</span>
          </div>
          <Select
            className="h-8 text-xs flex-1"
            value={activeFilter}
            onChange={(val) => setActiveFilter(val as FilterCategory)}
            options={statusFilterOptions}
          />
          {activeFilter !== "all" && (
            <Button
              scale="compact"
              variant="text"
              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0"
              onClick={() => setActiveFilter("all")}
              title="Đặt lại về Tất cả"
            >
              Đặt lại
            </Button>
          )}
        </div>

        {/* 2. Danh sách công việc có thanh cuộn */}
        <div className="w-full max-h-[385px] overflow-y-auto pr-1.5 flex flex-col gap-2.5 select-none [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {filteredTasks.length === 0 ? (
            <Flex align="center" justify="center" vertical gap={8} className="py-12 text-center text-slate-500">
              <InboxOutlined className="text-3xl text-slate-300" />
              <div className="space-y-0.5">
                <Text strong className="text-xs text-slate-700 block">
                  Không có công việc nào trong mục này
                </Text>
                <span className="text-[11px] text-slate-400 block">
                  Chọn trạng thái khác để xem công việc
                </span>
              </div>
              <Button
                scale="compact"
                variant="text"
                className="text-xs text-[#007A78] hover:underline mt-1"
                onClick={() => setActiveFilter("all")}
              >
                Hiển thị tất cả {tasks.length} vấn đề
              </Button>
            </Flex>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs shrink-0"
              >
                <Flex vertical gap={6}>
                  {/* Title and Top Right Badge */}
                  <Flex align="start" justify="space-between" gap={8}>
                    <Flex align="center" gap={6} className="min-w-0 flex-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColorStyles[task.badgeColor]}`} />
                      <Text strong className="text-xs sm:text-sm text-slate-900 truncate">
                        {task.title}
                      </Text>
                    </Flex>
                    <span className={`shrink-0 ${badgeColorStyles[task.badgeColor]}`}>
                      {task.badge}
                    </span>
                  </Flex>

                  {/* Description */}
                  <Text className="text-xs text-slate-600 leading-relaxed pl-3.5">
                    {task.description}
                  </Text>

                  {/* Footer: Department & Action Button */}
                  <Flex align="center" justify="space-between" className="pt-2 pl-3.5 mt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {task.department}
                    </span>

                    {canAccessPath(permissions, task.targetUrl) ? (
                      <Link href={task.targetUrl}>
                        <Button
                          scale="xs"
                          className={`!px-3 !py-1 !text-xs !font-medium !rounded-md ${buttonVariantStyles[task.actionColor]}`}
                        >
                          {task.actionText}
                        </Button>
                      </Link>
                    ) : (
                      <Tooltip title="Thẩm quyền thuộc bộ phận chuyên trách">
                        <span>
                          <Button
                            scale="xs"
                            disabled
                            className="!px-3 !py-1 !text-xs !font-medium !rounded-md opacity-60 cursor-not-allowed"
                          >
                            {task.actionText}
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Flex>
                </Flex>
              </div>
            ))
          )}
        </div>
      </Flex>
    </Card>
  );
}
