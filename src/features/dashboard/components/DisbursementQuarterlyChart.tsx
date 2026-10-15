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
      className="w-full border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between rounded-2xl p-5"
    >
      <Flex vertical gap={16} className="w-full">
        {/* Header */}
        <Flex align="start" justify="space-between" wrap="wrap" gap={8} className="w-full">
          <Flex vertical gap={2}>
            <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NĂM 2026)
            </Text>
            <Text className="text-xs text-slate-600 font-medium">
              So sánh Kế hoạch phân bổ và Thực tế giải ngân
            </Text>
          </Flex>

          {/* Legend */}
          <Flex align="center" gap={14} className="text-xs text-slate-600">
            <Flex align="center" gap={6}>
              <span className="w-3 h-3 rounded-xs bg-[#F59E0B] inline-block shadow-2xs" />
              <span className="text-xs font-semibold text-[#D97706]">Kế hoạch</span>
            </Flex>
            <Flex align="center" gap={6}>
              <span className="w-3 h-3 rounded-xs bg-[#DC2626] inline-block shadow-2xs" />
              <span className="text-xs font-semibold text-[#DC2626]">Thực tế</span>
            </Flex>
            <span className="text-xs text-slate-500 font-medium">ĐVT: Tỷ đồng</span>
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
                  <Flex align="end" justify="center" gap={5} className="w-full h-full pb-0.5">
                    {/* Plan Bar (Kế hoạch - Vàng Hổ Phách ấm áp, sang trọng) */}
                    <div className="flex flex-col items-center flex-1 max-w-[34px] sm:max-w-[42px] 2xl:max-w-[50px] h-full justify-end">
                      <span className="text-[10.5px] font-mono text-[#D97706] font-bold mb-1 whitespace-nowrap">
                        {q.plan} tỷ
                      </span>
                      <div
                        style={{ height: `${planPercent}%` }}
                        className="w-full rounded-t bg-[#F59E0B] hover:brightness-105 transition-all shadow-2xs"
                      />
                    </div>

                    {/* Actual Bar (Thực tế - Đỏ tươi thanh lịch; Chưa giải ngân - Slate) */}
                    <div className="flex flex-col items-center flex-1 max-w-[34px] sm:max-w-[42px] 2xl:max-w-[50px] h-full justify-end">
                      <span className={`text-[10.5px] font-mono font-bold mb-1 whitespace-nowrap ${
                        q.actual > 0 ? "text-[#DC2626]" : "text-slate-400 font-semibold"
                      }`}>
                        {q.actual > 0 ? `${q.actual} tỷ` : "Dự kiến"}
                      </span>
                      <div
                        style={{ height: q.actual > 0 ? `${actualPercent}%` : "6px" }}
                        className={`w-full rounded-t transition-all shadow-2xs ${
                          q.actual > 0 ? "bg-[#DC2626] hover:brightness-105" : "bg-slate-200"
                        }`}
                      />
                    </div>
                  </Flex>
                </Flex>
              );
            })}
          </div>

          {/* X-axis Labels */}
          <div className="grid grid-cols-4 gap-4 sm:gap-8 pt-3 text-center">
            {quarters.map((q) => (
              <div key={q.quarter} className="flex justify-center items-center">
                {q.isCurrent ? (
                  <span className="bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block">
                    {q.quarter}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-700">
                    {q.quarter}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 3-Metric Summary Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 w-full text-center">
          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-700 font-semibold">Đã giải ngân lũy kế</Text>
            <span className="text-lg sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              {accumulatedDisbursed} tỷ
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">VNĐ</span>
          </Flex>

          <Flex vertical gap={2} className="border-x border-slate-200/80 px-2">
            <Text className="text-[11px] text-slate-700 font-semibold">Còn lại cần giải ngân</Text>
            <span className="text-lg sm:text-xl font-bold text-red-600 font-sans tracking-tight">
              {remainingAmount} tỷ
            </span>
            <span className="text-[10px] text-red-700 font-semibold">VNĐ</span>
          </Flex>

          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-700 font-semibold">Tốc độ yêu cầu</Text>
            <span className="text-lg sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              {requiredMonthlySpeed} tỷ
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">/ tháng</span>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}
