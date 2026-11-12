"use client";

import { HistoryOutlined } from "@ant-design/icons";
import { Flex, Tag, Text } from "@/components/ui";
import type { ProjectItem } from "../../../types/project.types";

export function ProjectHistorySection({ project }: { project: ProjectItem }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <Flex align="center" gap={6} className="mb-3">
        <HistoryOutlined className="text-slate-500" />
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Nhật ký tiến độ tuần ({(project.progressHistory ?? []).length})
        </Text>
      </Flex>

      <div className="space-y-2 max-h-[240px] overflow-y-auto [scrollbar-width:thin] pr-1">
        {(project.progressHistory ?? []).length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Chưa có lịch sử cập nhật tiến độ
          </div>
        ) : (
          (project.progressHistory ?? []).map((hist) => (
            <div
              key={hist.id}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
            >
              <Flex justify="space-between" align="center" gap={8} className="mb-1">
                <Text strong className="text-slate-900 text-xs">
                  {hist.updatedBy}
                </Text>
                <Text className="text-slate-400 font-mono text-[11px]">
                  {hist.updatedAt}
                </Text>
              </Flex>
              <div className="text-xs font-mono font-bold text-[#DC2626] mb-1">
                {hist.oldProgress}% → {hist.newProgress}%
              </div>
              <Text className="block text-xs text-slate-600 leading-relaxed">
                {hist.note}
              </Text>
              {hist.actualEndDateRecorded && (
                <div className="mt-1.5">
                  <Tag intent="brand" scale="sm">
                    Hoàn thành thực tế: {hist.actualEndDateRecorded}
                  </Tag>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
