"use client";

import React from "react";
import { Select } from "@/components/ui";
import { useActivityFilterOptions } from "../hooks/useActivityLog";
import { useDashboardStore } from "../hooks/useDashboardStore";
import type { ActivityFilterMethod } from "../types/dashboard.types";

const SELECT_CLASS =
  "w-full text-xs [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-300 hover:[&_.ant-select-selector]:!border-[#DC2626] [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!shadow-xs [&_.ant-select-selector]:!h-9 [&_.ant-select-selection-search-input]:!h-9";

const METHOD_OPTIONS: { value: ActivityFilterMethod; label: string }[] = [
  { value: "ALL", label: "Tất cả nhật ký" },
  { value: "PROJECT", label: "Lọc theo dự án" },
  { value: "ACTOR", label: "Lọc theo người thực hiện" },
];

export default function ActivityLogFilters() {
  const method = useDashboardStore((s) => s.activityMethod);
  const project = useDashboardStore((s) => s.activityProject);
  const actor = useDashboardStore((s) => s.activityActor);
  const setMethod = useDashboardStore((s) => s.setActivityMethod);
  const setProject = useDashboardStore((s) => s.setActivityProject);
  const setActor = useDashboardStore((s) => s.setActivityActor);
  const { projectOptions, actorOptions } = useActivityFilterOptions();
  const byProject = method === "PROJECT";

  return (
    <>
      <div className="w-full sm:w-[195px]">
        <Select
          value={method}
          onChange={(val) => setMethod(val as ActivityFilterMethod)}
          options={METHOD_OPTIONS}
          className={`${SELECT_CLASS} [&_.ant-select-selection-item]:!text-slate-800 [&_.ant-select-selection-item]:!font-semibold`}
        />
      </div>

      {method !== "ALL" && (
        <div className="w-full sm:w-[280px]">
          <Select
            key={method}
            placeholder={byProject ? "Chọn dự án để lọc..." : "Chọn người thực hiện để lọc..."}
            allowClear
            showSearch
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: byProject ? 320 : 290 }}
            optionFilterProp="label"
            value={byProject ? project : actor}
            onChange={(val) => (byProject ? setProject : setActor)(val as string | undefined)}
            options={byProject ? projectOptions : actorOptions}
            className={`${SELECT_CLASS} [&_.ant-select-selection-placeholder]:!text-slate-500`}
          />
        </div>
      )}
    </>
  );
}
