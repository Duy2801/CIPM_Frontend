"use client";

import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { Dropdown, type MenuProps } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useDashboardStore } from "../hooks/useDashboardStore";
import { useFiscalYear } from "../hooks/useDisbursementChart";
import type { DisbursementTimeFilter } from "../types/dashboard.types";
import { CURRENT_WEEK, CURRENT_YEAR, MONTH_BLOCKS, weekBlockOf, weekBlocks } from "../utils/disbursement-chart";

const QUARTER_LABELS: [string, string][] = [
  ["all", "Cả 4 Quý (Quý 1 - 4)"],
  ["1", "Quý 1 (Tháng 1 - 3)"],
  ["2", "Quý 2 (Tháng 4 - 6)"],
  ["3", "Quý 3 (Tháng 7 - 9)"],
  ["4", "Quý 4 (Tháng 10 - 12)"],
];

function MenuLabel({ text, selected, current }: { text: string; selected: boolean; current: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs py-0.5 min-w-[125px]">
      <span className={selected ? "font-bold text-red-600" : ""}>{text}</span>
      {current && (
        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Hiện tại</span>
      )}
    </div>
  );
}

interface PeriodButtonProps {
  filter: DisbursementTimeFilter;
  label: string;
  items: MenuProps["items"];
  selectedKey: string;
  onSelect: (key: string) => void;
}

function PeriodButton({ filter, label, items, selectedKey, onSelect }: PeriodButtonProps) {
  const active = useDashboardStore((s) => s.period.filter === filter);
  const setPeriod = useDashboardStore((s) => s.setPeriod);
  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [selectedKey],
        onClick: ({ key }) => onSelect(key),
        style: { maxHeight: "280px", overflowY: "auto" },
      }}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <button
        type="button"
        onClick={() => setPeriod({ filter })}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
          active ? "bg-white text-[#DC2626] shadow-xs font-bold" : "text-slate-600 hover:text-slate-900",
        )}
      >
        <span>{label}</span>
        <DownOutlined className="text-[9px] opacity-70" />
      </button>
    </Dropdown>
  );
}

export default function DisbursementPeriodFilter() {
  const year = useFiscalYear();
  const period = useDashboardStore((s) => s.period);
  const setPeriod = useDashboardStore((s) => s.setPeriod);
  const isCurrentYear = year === CURRENT_YEAR;
  const week = weekBlockOf(period.week);
  const currentWeek = weekBlockOf(CURRENT_WEEK);

  const weekItems: MenuProps["items"] = weekBlocks().map((b) => ({
    key: `${b.start}-${b.end}`,
    label: (
      <MenuLabel
        text={`Tuần ${b.start} - ${b.end}`}
        selected={b.start === week.start}
        current={isCurrentYear && b.start === currentWeek.start}
      />
    ),
  }));
  const monthItems: MenuProps["items"] = MONTH_BLOCKS.map((key) => ({
    key,
    label: (
      <MenuLabel
        text={`Tháng ${key.replace("-", " - ")}`}
        selected={period.monthBlock === key}
        current={isCurrentYear && key === "9-12"}
      />
    ),
  }));
  const quarterItems: MenuProps["items"] = QUARTER_LABELS.flatMap(([key, text]) => {
    const item = {
      key,
      label: <MenuLabel text={text} selected={period.quarter === key} current={isCurrentYear && key === "4"} />,
    };
    return key === "all" ? [item, { type: "divider" as const, key: "divider-quarter" }] : [item];
  });

  return (
    <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/90 shadow-2xs gap-0.5">
      <PeriodButton
        filter="week"
        label={`Tuần ${week.start} - ${week.end}`}
        items={weekItems}
        selectedKey={`${week.start}-${week.end}`}
        onSelect={(key) => setPeriod({ filter: "week", week: Number(key.split("-")[0]) })}
      />
      <PeriodButton
        filter="month"
        label={`Tháng ${period.monthBlock.replace("-", " - ")}`}
        items={monthItems}
        selectedKey={period.monthBlock}
        onSelect={(monthBlock) => setPeriod({ filter: "month", monthBlock })}
      />
      <PeriodButton
        filter="quarter"
        label={period.quarter === "all" ? "Quý 1 - 4" : `Quý ${period.quarter}`}
        items={quarterItems}
        selectedKey={period.quarter}
        onSelect={(quarter) => setPeriod({ filter: "quarter", quarter })}
      />
    </div>
  );
}
