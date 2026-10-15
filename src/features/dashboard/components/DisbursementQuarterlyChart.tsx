"use client";

import React, { useMemo, useState } from "react";
import { Card, Flex, Text } from "@/components/ui";
import type { QuarterlyData } from "../constants/dashboard-mock-data";

export type DisbursementTimeFilter = "week" | "quarter" | "year";

interface ChartBarItem {
  label: string;
  plan: number;
  actual: number;
  isCurrent?: boolean;
}

interface ChartMetrics {
  m1Label: string;
  m1Value: string;
  m1Sub: string;
  m2Label: string;
  m2Value: string;
  m2Sub: string;
  m3Label: string;
  m3Value: string;
  m3Sub: string;
}

interface ChartDataset {
  title: string;
  subtitle: string;
  unit: string;
  maxScale: number;
  items: ChartBarItem[];
  metrics: ChartMetrics;
}

interface DisbursementQuarterlyChartProps {
  quarters?: QuarterlyData[];
  accumulatedDisbursed?: number;
  remainingAmount?: number;
  requiredMonthlySpeed?: number;
  initialTimeFilter?: DisbursementTimeFilter;
}

export default function DisbursementQuarterlyChart({
  quarters,
  accumulatedDisbursed = 418.5,
  remainingAmount = 231.5,
  requiredMonthlySpeed = 69.8,
  initialTimeFilter = "quarter",
}: DisbursementQuarterlyChartProps) {
  const [timeFilter, setTimeFilter] = useState<DisbursementTimeFilter>(initialTimeFilter);

  const datasets: Record<DisbursementTimeFilter, ChartDataset> = useMemo(() => {
    // 1. Dữ liệu Quý
    const quarterItems: ChartBarItem[] =
      quarters && quarters.length > 0
        ? quarters.map((q) => ({
            label: q.quarter,
            plan: q.plan,
            actual: q.actual,
            isCurrent: q.isCurrent,
          }))
        : [
            { label: "Quý 1", plan: 145, actual: 158 },
            { label: "Quý 2 (HT)", plan: 180, actual: 175, isCurrent: true },
            { label: "Quý 3", plan: 190, actual: 76.5 },
            { label: "Quý 4", plan: 150, actual: 0 },
          ];

    const quarterDataset: ChartDataset = {
      title: "BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NĂM 2026)",
      subtitle: "So sánh Kế hoạch phân bổ và Thực tế giải ngân qua các quý",
      unit: "ĐVT: Tỷ đồng",
      maxScale: 220,
      items: quarterItems,
      metrics: {
        m1Label: "Đã giải ngân lũy kế",
        m1Value: `${accumulatedDisbursed} tỷ`,
        m1Sub: "VNĐ",
        m2Label: "Còn lại cần giải ngân",
        m2Value: `${remainingAmount} tỷ`,
        m2Sub: "VNĐ",
        m3Label: "Tốc độ yêu cầu",
        m3Value: `${requiredMonthlySpeed} tỷ`,
        m3Sub: "/ tháng",
      },
    };

    // 2. Dữ liệu Tuần (Chiến dịch cao điểm giải ngân tuần 37 - 41)
    const weekDataset: ChartDataset = {
      title: "BIỂU ĐỒ GIẢI NGÂN THEO TUẦN (THÁNG 09 - 10/2026)",
      subtitle: "Theo dõi tiến độ giải ngân từng tuần chiến dịch cao điểm",
      unit: "ĐVT: Tỷ đồng",
      maxScale: 32,
      items: [
        { label: "Tuần 37", plan: 18.5, actual: 19.2 },
        { label: "Tuần 38", plan: 22.0, actual: 20.8 },
        { label: "Tuần 39", plan: 25.0, actual: 24.5 },
        { label: "Tuần 40", plan: 20.5, actual: 21.0 },
        { label: "Tuần 41 (HT)", plan: 18.0, actual: 11.5, isCurrent: true },
      ],
      metrics: {
        m1Label: "Đã giải ngân 5 tuần",
        m1Value: "97.0 tỷ",
        m1Sub: "VNĐ",
        m2Label: "Kế hoạch 5 tuần",
        m2Value: "104.0 tỷ",
        m2Sub: "VNĐ",
        m3Label: "Tốc độ trung bình",
        m3Value: "19.4 tỷ",
        m3Sub: "/ tuần",
      },
    };

    // 3. Dữ liệu Năm (Giai đoạn trung hạn 2023 - 2027)
    const yearDataset: ChartDataset = {
      title: "BIỂU ĐỒ GIẢI NGÂN THEO NĂM (GIAI ĐOẠN 2023 - 2027)",
      subtitle: "Kế hoạch vốn đầu tư công trung hạn & Thực tế giải ngân qua các năm",
      unit: "ĐVT: Tỷ đồng",
      maxScale: 850,
      items: [
        { label: "Năm 2023", plan: 380, actual: 372 },
        { label: "Năm 2024", plan: 460, actual: 451.8 },
        { label: "Năm 2025", plan: 540, actual: 528.5 },
        { label: "Năm 2026 (HT)", plan: 650, actual: 418.5, isCurrent: true },
        { label: "Năm 2027", plan: 720, actual: 0 },
      ],
      metrics: {
        m1Label: "Lũy kế giải ngân",
        m1Value: "1,770.8 tỷ",
        m1Sub: "VNĐ (Giai đoạn 2023-2026)",
        m2Label: "Kế hoạch năm 2026",
        m2Value: "650.0 tỷ",
        m2Sub: "VNĐ",
        m3Label: "Tỷ lệ năm 2026",
        m3Value: "64.4%",
        m3Sub: "Đạt KH 418.5/650 tỷ",
      },
    };

    return {
      quarter: quarterDataset,
      week: weekDataset,
      year: yearDataset,
    };
  }, [quarters, accumulatedDisbursed, remainingAmount, requiredMonthlySpeed]);

  const currentData = datasets[timeFilter];

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between rounded-2xl p-5"
    >
      <Flex vertical gap={16} className="w-full">
        {/* Header với Tiêu đề, Bộ lọc Tuần/Quý/Năm và Chú thích */}
        <Flex align="start" justify="space-between" wrap="wrap" gap={12} className="w-full">
          <Flex vertical gap={2} className="min-w-[260px]">
            <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              {currentData.title}
            </Text>
            <Text className="text-xs text-slate-600 font-medium">
              {currentData.subtitle}
            </Text>
          </Flex>

          {/* Time Filter Tabs & Legend */}
          <Flex align="center" gap={14} wrap="wrap" className="justify-end">
            {/* Bộ lọc theo Tuần / Quý / Năm */}
            <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimeFilter("week")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === "week"
                    ? "bg-white text-[#DC2626] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tuần
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("quarter")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === "quarter"
                    ? "bg-white text-[#DC2626] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quý
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("year")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === "year"
                    ? "bg-white text-[#DC2626] shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Năm
              </button>
            </div>

            {/* Chú thích màu sắc */}
            <Flex align="center" gap={12} className="text-xs text-slate-600">
              <Flex align="center" gap={6}>
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] inline-block shadow-2xs" />
                <span className="text-xs font-semibold text-[#D97706]">Kế hoạch</span>
              </Flex>
              <Flex align="center" gap={6}>
                <span className="w-3 h-3 rounded-xs bg-[#DC2626] inline-block shadow-2xs" />
                <span className="text-xs font-semibold text-[#DC2626]">Thực tế</span>
              </Flex>
              <span className="text-xs text-slate-500 font-medium">{currentData.unit}</span>
            </Flex>
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

          {/* Dynamic Columns Group */}
          <div
            className={`grid ${
              currentData.items.length === 4 ? "grid-cols-4" : "grid-cols-5"
            } gap-2 sm:gap-6 items-end h-[190px] px-2 sm:px-4 border-b border-slate-200 relative z-10`}
          >
            {currentData.items.map((item) => {
              const planPercent = Math.min(100, Math.round((item.plan / currentData.maxScale) * 100));
              const actualPercent =
                item.actual > 0 ? Math.min(100, Math.round((item.actual / currentData.maxScale) * 100)) : 0;

              return (
                <Flex key={item.label} vertical align="center" justify="end" className="h-full">
                  <Flex align="end" justify="center" gap={4} className="w-full h-full pb-0.5">
                    {/* Plan Bar (Kế hoạch - Vàng Hổ Phách ấm áp, sang trọng) */}
                    <div className="flex flex-col items-center flex-1 max-w-[30px] sm:max-w-[40px] 2xl:max-w-[48px] h-full justify-end">
                      <span className="text-[10px] sm:text-[10.5px] font-mono text-[#D97706] font-bold mb-1 whitespace-nowrap">
                        {item.plan} tỷ
                      </span>
                      <div
                        style={{ height: `${planPercent}%` }}
                        className="w-full rounded-t bg-[#F59E0B] hover:brightness-105 transition-all shadow-2xs"
                      />
                    </div>

                    {/* Actual Bar (Thực tế - Đỏ tươi thanh lịch; Chưa giải ngân - Slate) */}
                    <div className="flex flex-col items-center flex-1 max-w-[30px] sm:max-w-[40px] 2xl:max-w-[48px] h-full justify-end">
                      <span
                        className={`text-[10px] sm:text-[10.5px] font-mono font-bold mb-1 whitespace-nowrap ${
                          item.actual > 0 ? "text-[#DC2626]" : "text-slate-400 font-semibold"
                        }`}
                      >
                        {item.actual > 0 ? `${item.actual} tỷ` : "Dự kiến"}
                      </span>
                      <div
                        style={{ height: item.actual > 0 ? `${actualPercent}%` : "6px" }}
                        className={`w-full rounded-t transition-all shadow-2xs ${
                          item.actual > 0 ? "bg-[#DC2626] hover:brightness-105" : "bg-slate-200"
                        }`}
                      />
                    </div>
                  </Flex>
                </Flex>
              );
            })}
          </div>

          {/* X-axis Labels */}
          <div
            className={`grid ${
              currentData.items.length === 4 ? "grid-cols-4" : "grid-cols-5"
            } gap-2 sm:gap-6 pt-3 text-center`}
          >
            {currentData.items.map((item) => (
              <div key={item.label} className="flex justify-center items-center">
                {item.isCurrent ? (
                  <span className="bg-red-50 text-red-700 border border-red-200/80 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold inline-block">
                    {item.label}
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 3-Metric Summary Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 w-full text-center">
          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-700 font-semibold">{currentData.metrics.m1Label}</Text>
            <span className="text-base sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              {currentData.metrics.m1Value}
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">{currentData.metrics.m1Sub}</span>
          </Flex>

          <Flex vertical gap={2} className="border-x border-slate-200/80 px-2">
            <Text className="text-[11px] text-slate-700 font-semibold">{currentData.metrics.m2Label}</Text>
            <span className="text-base sm:text-xl font-bold text-red-600 font-sans tracking-tight">
              {currentData.metrics.m2Value}
            </span>
            <span className="text-[10px] text-red-700 font-semibold">{currentData.metrics.m2Sub}</span>
          </Flex>

          <Flex vertical gap={2}>
            <Text className="text-[11px] text-slate-700 font-semibold">{currentData.metrics.m3Label}</Text>
            <span className="text-base sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              {currentData.metrics.m3Value}
            </span>
            <span className="text-[10px] text-slate-600 font-semibold">{currentData.metrics.m3Sub}</span>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}
