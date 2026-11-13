"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import { useDisbursementChart } from "../hooks/useDisbursementChart";
import DisbursementBars from "./DisbursementBars";
import DisbursementMetrics from "./DisbursementMetrics";
import DisbursementPeriodFilter from "./DisbursementPeriodFilter";

export default function DisbursementQuarterlyChart() {
  const { title, unit } = useDisbursementChart();

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between rounded-2xl p-5"
    >
      <Flex vertical gap={16} className="w-full">
        <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
          {title}
        </Text>

        <div className="w-full flex items-center justify-between flex-wrap gap-3">
          <DisbursementPeriodFilter />
          <Flex align="center" gap={10} className="text-xs text-slate-600">
            <Flex align="center" gap={5}>
              <span className="w-3 h-3 rounded-xs bg-[#cbd5e1] inline-block" />
              <span className="text-xs font-semibold text-slate-600">Kế hoạch</span>
            </Flex>
            <Flex align="center" gap={5}>
              <span className="w-3 h-3 rounded-xs bg-[#2a78d6] inline-block" />
              <span className="text-xs font-semibold text-slate-600">Thực tế</span>
            </Flex>
            <span className="text-xs text-slate-500 font-medium">{unit}</span>
          </Flex>
        </div>

        <DisbursementBars />
        <DisbursementMetrics />
      </Flex>
    </Card>
  );
}
