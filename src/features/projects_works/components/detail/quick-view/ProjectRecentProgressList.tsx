"use client";

import { HistoryOutlined } from "@ant-design/icons";
import { Flex, Tag, Text } from "@/components/ui";
import { STAGE_BADGE_CLASSES, STAGE_DISPLAY_NAMES } from "../../../constants/project-enums";
import type { ProjectItem } from "@/shared/projects_works/types/project.types";

export default function ProjectRecentProgressList({ project }: { project: ProjectItem }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <Flex align="center" gap={6} className="mb-2.5">
        <HistoryOutlined className="text-slate-500" />
        <Text strong className="text-xs text-slate-700">
          Lịch sử các tuần trước ({(project.progressHistory ?? []).length})
        </Text>
      </Flex>
      <div className="max-h-[180px] overflow-y-auto space-y-2 [scrollbar-width:thin] pr-1">
        {(project.progressHistory ?? []).map((hist) => (
          <div key={hist.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-0.5">
              <span className="font-semibold text-slate-700">{hist.updatedBy}</span>
              <span className="font-mono">{hist.updatedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#DC2626] text-[11px]">
                {hist.oldProgress}% → {hist.newProgress}%
              </span>
              {hist.stageRecorded && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                    STAGE_BADGE_CLASSES[hist.stageRecorded] || ""
                  }`}
                >
                  {STAGE_DISPLAY_NAMES[hist.stageRecorded] || hist.stageRecorded}
                </span>
              )}
            </div>
            <div className="text-slate-600 line-clamp-2 mt-0.5">{hist.note}</div>
            {hist.actualEndDateRecorded && (
              <div className="mt-1">
                <Tag intent="brand" scale="sm">
                  Ngày xong: {hist.actualEndDateRecorded}
                </Tag>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
