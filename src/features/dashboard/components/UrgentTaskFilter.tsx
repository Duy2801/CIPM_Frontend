"use client";

import React from "react";
import { FilterOutlined } from "@ant-design/icons";
import { Button, Select } from "@/components/ui";
import { useDashboardStore } from "../hooks/useDashboardStore";
import type { UrgentFilter } from "../types/dashboard.types";

const FILTER_OPTIONS: { value: UrgentFilter; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "danger", label: "Khẩn cấp" },
  { value: "warning", label: "Quan trọng" },
  { value: "info", label: "Chú ý" },
  { value: "success", label: "Thông tin" },
];

export default function UrgentTaskFilter() {
  const filter = useDashboardStore((s) => s.urgentFilter);
  const setFilter = useDashboardStore((s) => s.setUrgentFilter);

  return (
    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
        <FilterOutlined className="text-slate-400 text-xs" />
        <span>Lọc trạng thái:</span>
      </div>
      <Select
        className="h-8 text-xs flex-1"
        value={filter}
        onChange={(val) => setFilter(val as UrgentFilter)}
        options={FILTER_OPTIONS}
      />
      {filter !== "all" && (
        <Button
          scale="compact"
          variant="text"
          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0"
          onClick={() => setFilter("all")}
          title="Đặt lại về Tất cả"
        >
          Đặt lại
        </Button>
      )}
    </div>
  );
}
