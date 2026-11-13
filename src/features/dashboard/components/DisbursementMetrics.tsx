"use client";

import React from "react";
import { Flex, Text } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useDisbursementChart } from "../hooks/useDisbursementChart";

export default function DisbursementMetrics() {
  const { metrics } = useDisbursementChart();
  return (
    <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 w-full text-center">
      {metrics.map((metric, i) => (
        <Flex key={metric.label} vertical gap={2} className={cn(i === 1 && "border-x border-slate-200/80 px-2")}>
          <Text className="text-[11px] text-slate-700 font-semibold">{metric.label}</Text>
          <span
            className={cn(
              "text-base sm:text-xl font-bold font-sans tracking-tight",
              i === 0 ? "text-[#2a78d6]" : "text-slate-900",
            )}
          >
            {metric.value}
          </span>
          <span className="text-[10px] text-slate-600 font-semibold">{metric.sub}</span>
        </Flex>
      ))}
    </div>
  );
}
