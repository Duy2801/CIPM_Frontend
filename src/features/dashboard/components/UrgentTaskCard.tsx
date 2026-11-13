"use client";

import React from "react";
import Link from "next/link";
import { Button, Flex, Text, Tooltip } from "@/components/ui";
import { canAccessPath } from "@/access-control";
import { useAuthStore } from "@/stores/auth.store";
import { useUrgentTask } from "../hooks/useDashboardQueries";
import type { UrgentTask } from "../types/dashboard.types";

const BADGE_STYLES: Record<UrgentTask["badgeColor"], string> = {
  danger: "bg-red-50 text-red-700 border-red-200/80",
  warning: "bg-slate-100 text-slate-800 border-slate-200/80",
  info: "bg-red-50 text-red-700 border-red-200/80",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
};

export default function UrgentTaskCard({ taskId }: { taskId: string }) {
  const task = useUrgentTask(taskId);
  const permissions = useAuthStore((state) => state.user?.permissions);
  if (!task) return null;
  const allowed = canAccessPath(permissions ?? [], task.targetUrl.split("?")[0]);

  return (
    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all hover:shadow-xs shrink-0">
      <Flex vertical gap={6}>
        <Flex align="start" justify="space-between" gap={8}>
          <Text strong className="min-w-0 flex-1 text-xs sm:text-sm text-slate-900 truncate">
            {task.title}
          </Text>
          <span
            className={`shrink-0 border font-semibold text-xs px-2 py-0.5 rounded-md ${BADGE_STYLES[task.badgeColor]}`}
          >
            {task.badge}
          </span>
        </Flex>

        <Text className="text-xs text-slate-600 leading-relaxed">{task.description}</Text>

        <Flex align="center" justify="end" className="pt-2 mt-1 border-t border-slate-100">
          {allowed ? (
            <Link href={task.targetUrl}>
              <Button
                scale="xs"
                className="!px-3.5 !py-1.5 !text-xs !font-semibold !rounded-lg !bg-red-600 hover:!bg-red-700 !text-white !border-transparent shadow-2xs transition-colors"
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
  );
}
