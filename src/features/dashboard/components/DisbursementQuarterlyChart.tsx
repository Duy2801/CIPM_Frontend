"use client";

import React from "react";
import { Card, Flex, Text } from "@/components/ui";
import type { QuarterlyData } from "../constants/dashboard-mock-data";

interface DisbursementQuarterlyChartProps {
  quarters: QuarterlyData[];
  accumulatedDisbursed: number;
  remainingAmount: number;
  requiredMonthlySpeed: number;
}

export default function DisbursementQuarterlyChart({
  quarters,
  accumulatedDisbursed,
  remainingAmount,
  requiredMonthlySpeed,
}: DisbursementQuarterlyChartProps) {
  const maxScale = 220;

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 shadow-xs flex flex-col justify-between"
    >
      <Flex vertical gap={16} className="w-full">
        {/* Header */}
        <Flex align="start" justify="space-between" wrap="wrap" gap={8} className="w-full">
          <Flex vertical gap={2}>
            <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NĂM 2026)
            </Text>
            <Text className="text-xs text-slate-500">
              So sánh Kế hoạch phân bổ và Thực tế giải ngân
            </Text>
          </Flex>

          {/* Legend */}
          <Flex align="center" gap={14} className="text-xs text-slate-600">
            <Flex align="center" gap={6}>
              <span className="w-3 h-3 rounded-xs bg-[#0F2942] inline-block" />
              <span className="text-xs font-medium">Kế hoạch</span>
            </Flex>
            <Flex align="center" gap={6}>
              <span className="w-3 h-3 rounded-xs bg-[#007A78] inline-block" />
              <span className="text-xs font-medium">Thực tế</span>
            </Flex>
            <span className="text-xs text-slate-400 font-medium">ĐVT: Tỷ đồng</span>
          </Flex>
        </Flex>

        {/* Chart Canvas Area */}
        <div className="w-full pt-4 pb-2 select-none relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
          </div>

          {/* 4 Quarters Group */}
          <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-[190px] px-4 border-b border-slate-200 relative z-10">
            {quarters.map((q) => {
              const planPercent = Math.round((q.plan / maxScale) * 100);
              const actualPercent = q.actual > 0 ? Math.round((q.actual / maxScale) * 100) : 0;

              return (
                <Flex key={q.quarter} vertical align="center" justify="end" className="h-full">
                  <Flex align="end" justify="center" gap={4} className="w-full h-full pb-0.5">
                    {/* Plan Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[34px] h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold mb-1 whitespace-nowrap">
                        {q.plan} tỷ
                      </span>
                      <div
                        style={{ height: `${planPercent}%` }}
                        className="w-full rounded-t bg-[#0F2942] hover:brightness-110 transition-all shadow-xs"
                      />
                    </div>

                    {/* Actual Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[34px] h-full justify-end">
                      <span className="text-[10px] font-mono font-semibold mb-1 whitespace-nowrap text-[#007A78]">
                        {q.actual > 0 ? `${q.actual} tỷ` : "Dự kiến"}
                      </span>
                      <div
                        style={{ height: q.actual > 0 ? `${actualPercent}%` : "4px" }}
                        className={`w-full rounded-t transition-all shadow-xs ${q.actual > 0 ? "bg-[#007A78] hover:brightness-110" : "bg-slate-200"
                          }`}
                      />
                    </div>
                  </Flex>
                </Flex>
              );
            })}
          </div>

          {/* X-axis Labels */}
          <div className="grid grid-cols-4 gap-4 sm:gap-8 pt-2.5 text-center">
            {quarters.map((q) => (
              <span
                key={q.quarter}
                className={`text-xs font-semibold ${q.isCurrent ? "text-[#007A78] font-bold" : "text-slate-700"
                  }`}
              >
                {q.quarter}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom 3-Metric Summary Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F0F7FA] border border-[#D0E5ED] w-full text-center">
          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-600 font-medium">Đã giải ngân lũy kế</Text>
            <span className="text-lg sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              {accumulatedDisbursed} tỷ
            </span>
            <span className="text-[10px] text-slate-500 font-medium">VNĐ</span>
          </Flex>

          <Flex vertical gap={2} className="border-x border-slate-200/80 px-2">
            <Text className="text-[11px] text-slate-600 font-medium">Còn lại cần giải ngân</Text>
            <span className="text-lg sm:text-xl font-bold text-[#D97706] font-sans tracking-tight">
              {remainingAmount} tỷ
            </span>
            <span className="text-[10px] text-[#D97706] font-medium">VNĐ</span>
          </Flex>

          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-600 font-medium">Tốc độ yêu cầu</Text>
            <span className="text-lg sm:text-xl font-bold text-[#007A78] font-sans tracking-tight">
              {requiredMonthlySpeed} tỷ
            </span>
            <span className="text-[10px] text-[#007A78] font-medium">tháng</span>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}
