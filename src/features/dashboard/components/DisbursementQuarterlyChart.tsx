"use client";

import React, { useMemo, useState } from "react";
import { DownOutlined } from "@ant-design/icons";
import { Card, Dropdown, Flex, Text, type MenuProps } from "@/components/ui";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import type { QuarterlyData } from "../constants/dashboard-mock-data";

export type DisbursementTimeFilter = "week" | "month" | "quarter";

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
  const { selectedYear } = useFiscalYearStore();
  const currentFiscalYear = Number(selectedYear) || 2026;

  const [timeFilter, setTimeFilter] = useState<DisbursementTimeFilter>(initialTimeFilter);
  const [selectedWeek, setSelectedWeek] = useState<number>(41);
  const [selectedMonthBlock, setSelectedMonthBlock] = useState<string>("9-12");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("4");

  // Danh sách các khối 5 tuần cho Dropdown (Tuần 1 - 5, Tuần 6 - 10, ... Tuần 46 - 50, Tuần 51 - 52)
  const weekMenuItems: MenuProps["items"] = useMemo(() => {
    const items: MenuProps["items"] = [];

    // Các khoảng 5 tuần: 1-5, 6-10, 11-15, ..., 51-52
    for (let start = 1; start <= 52; start += 5) {
      const end = Math.min(52, start + 4);
      const rangeKey = `${start}-${end}`;
      const isSelected = selectedWeek >= start && selectedWeek <= end;
      const isCurrent = currentFiscalYear === 2026 && 41 >= start && 41 <= end;

      items.push({
        key: rangeKey,
        label: (
          <div className="flex items-center justify-between gap-3 text-xs py-0.5 min-w-[125px]">
            <span className={isSelected ? "font-bold text-red-600" : ""}>
              Tuần {start} - {end}
            </span>
            {isCurrent && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                Hiện tại
              </span>
            )}
          </div>
        ),
      });
    }

    return items;
  }, [currentFiscalYear, selectedWeek]);

  // Danh sách các khối 4 tháng cho Dropdown (Tháng 1 - 4, Tháng 5 - 8, Tháng 9 - 12)
  const monthMenuItems: MenuProps["items"] = useMemo(() => {
    const blocks = [
      { key: "1-4", label: "Tháng 1 - 4" },
      { key: "5-8", label: "Tháng 5 - 8" },
      { key: "9-12", label: "Tháng 9 - 12" },
    ];

    return blocks.map((b) => {
      const isSelected = selectedMonthBlock === b.key;
      const isCurrent = currentFiscalYear === 2026 && b.key === "9-12";
      return {
        key: b.key,
        label: (
          <div className="flex items-center justify-between gap-3 text-xs py-0.5 min-w-[125px]">
            <span className={isSelected ? "font-bold text-red-600" : ""}>{b.label}</span>
            {isCurrent && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                Hiện tại
              </span>
            )}
          </div>
        ),
      };
    });
  }, [currentFiscalYear, selectedMonthBlock]);

  // Danh sách Quý cho Dropdown
  const quarterMenuItems: MenuProps["items"] = useMemo(() => [
    {
      key: "all",
      label: (
        <span className={`text-xs py-0.5 ${selectedQuarter === "all" ? "font-bold text-red-600" : ""}`}>
          Cả 4 Quý (Quý 1 - 4)
        </span>
      ),
    },
    { type: "divider" as const, key: "divider-quarter" },
    {
      key: "1",
      label: (
        <span className={`text-xs py-0.5 ${selectedQuarter === "1" ? "font-bold text-red-600" : ""}`}>
          Quý 1 (Tháng 1 - 3)
        </span>
      ),
    },
    {
      key: "2",
      label: (
        <span className={`text-xs py-0.5 ${selectedQuarter === "2" ? "font-bold text-red-600" : ""}`}>
          Quý 2 (Tháng 4 - 6)
        </span>
      ),
    },
    {
      key: "3",
      label: (
        <span className={`text-xs py-0.5 ${selectedQuarter === "3" ? "font-bold text-red-600" : ""}`}>
          Quý 3 (Tháng 7 - 9)
        </span>
      ),
    },
    {
      key: "4",
      label: (
        <div className="flex items-center justify-between gap-3 text-xs py-0.5 min-w-[125px]">
          <span className={selectedQuarter === "4" ? "font-bold text-red-600" : ""}>
            Quý 4 (Tháng 10 - 12)
          </span>
          {currentFiscalYear === 2026 && (
            <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded font-semibold">
              Hiện tại
            </span>
          )}
        </div>
      ),
    },
  ], [currentFiscalYear, selectedQuarter]);

  // Dataset động phụ thuộc vào: Niên độ (selectedYear), timeFilter, selectedWeek / selectedMonth / selectedQuarter
  const currentData: ChartDataset = useMemo(() => {
    const yr = currentFiscalYear;
    const yearRatio = yr === 2026 ? 1.0 : yr === 2025 ? 0.88 : yr === 2024 ? 0.75 : 1.12;

    // ─── 1. BỘ LỌC THEO TUẦN (Hiển thị 5 tuần) ──────────────────────
    if (timeFilter === "week") {
      // Xác định khối 5 tuần chứa selectedWeek: 1-5, 6-10, ..., 51-52
      const blockIndex = Math.floor((selectedWeek - 1) / 5);
      const startW = blockIndex * 5 + 1;
      const endW = Math.min(52, startW + 4);
      const weekNums: number[] = [];
      for (let w = startW; w <= endW; w++) {
        weekNums.push(w);
      }

      const items: ChartBarItem[] = weekNums.map((w) => {
        const isCurrent = (yr === 2026 && w === 41) || (yr !== 2026 && w === selectedWeek);
        const plan = Number(((18 + ((w * 7) % 8)) * yearRatio).toFixed(1));
        let actual = 0;

        if (yr < 2026 || (yr === 2026 && w < 41)) {
          actual = Number(((17 + ((w * 5) % 9)) * yearRatio).toFixed(1));
        } else if (yr === 2026 && w === 41) {
          actual = Number((11.5 * yearRatio).toFixed(1));
        }

        return {
          label: isCurrent ? `Tuần ${w} (HT)` : `Tuần ${w}`,
          plan,
          actual,
          isCurrent,
        };
      });

      const totalPlan = items.reduce((acc, it) => acc + it.plan, 0);
      const totalActual = items.reduce((acc, it) => acc + it.actual, 0);
      const activeCount = items.filter((it) => it.actual > 0).length || 1;
      const maxVal = Math.max(...items.flatMap((i) => [i.plan, i.actual]), 20);

      return {
        title: `BIỂU ĐỒ GIẢI NGÂN THEO TUẦN (NIÊN ĐỘ ${yr})`,
        subtitle: `Theo dõi tiến độ giải ngân Tuần ${startW} - ${endW} (Niên độ ${yr})`,
        unit: "ĐVT: Tỷ đồng",
        maxScale: Math.ceil(maxVal * 1.25),
        items,
        metrics: {
          m1Label: `Đã giải ngân T${startW}-T${endW}`,
          m1Value: `${totalActual.toFixed(1)} tỷ`,
          m1Sub: "VNĐ",
          m2Label: `Kế hoạch T${startW}-T${endW}`,
          m2Value: `${totalPlan.toFixed(1)} tỷ`,
          m2Sub: "VNĐ",
          m3Label: "Tốc độ trung bình",
          m3Value: `${(totalActual / activeCount).toFixed(1)} tỷ`,
          m3Sub: "/ tuần",
        },
      };
    }

    // ─── 2. BỘ LỌC THEO THÁNG (Hiển thị 4 tháng: 1-4, 5-8, 9-12) ─────
    if (timeFilter === "month") {
      const [startM, endM] = selectedMonthBlock.split("-").map(Number);
      const months: number[] = [];
      for (let m = startM; m <= endM; m++) {
        months.push(m);
      }

      const items: ChartBarItem[] = months.map((m) => {
        const isCurrent = yr === 2026 && m === 10;
        const plan = Number(((50 + ((m * 4) % 15)) * yearRatio).toFixed(1));
        let actual = 0;

        if (yr < 2026 || (yr === 2026 && m < 10)) {
          actual = Number(((48 + ((m * 6) % 12)) * yearRatio).toFixed(1));
        } else if (yr === 2026 && m === 10) {
          actual = Number((41.5 * yearRatio).toFixed(1));
        }

        return {
          label: isCurrent ? `Tháng ${m} (HT)` : `Tháng ${m}`,
          plan,
          actual,
          isCurrent,
        };
      });

      const totalPlan = items.reduce((acc, it) => acc + it.plan, 0);
      const totalActual = items.reduce((acc, it) => acc + it.actual, 0);
      const maxVal = Math.max(...items.flatMap((i) => [i.plan, i.actual]), 40);
      const rate = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : "0";

      return {
        title: `BIỂU ĐỒ GIẢI NGÂN THEO THÁNG (THÁNG ${startM} - ${endM} / NIÊN ĐỘ ${yr})`,
        subtitle: `Kế hoạch phân bổ & Thực tế giải ngân các tháng (Tháng ${startM} - ${endM}) niên độ ${yr}`,
        unit: "ĐVT: Tỷ đồng",
        maxScale: Math.ceil(maxVal * 1.25),
        items,
        metrics: {
          m1Label: `Đã giải ngân T${startM}-T${endM}`,
          m1Value: `${totalActual.toFixed(1)} tỷ`,
          m1Sub: "VNĐ",
          m2Label: `Kế hoạch T${startM}-T${endM}`,
          m2Value: `${totalPlan.toFixed(1)} tỷ`,
          m2Sub: "VNĐ",
          m3Label: `Tỷ lệ hoàn thành T${startM}-T${endM}`,
          m3Value: `${rate}%`,
          m3Sub: `Đạt KH ${totalActual.toFixed(1)}/${totalPlan.toFixed(1)} tỷ`,
        },
      };
    }

    // ─── 3. BỘ LỌC THEO QUÝ (Mặc định) ───────────────────────────────
    // 3.1 Nếu chọn cả năm 4 Quý
    if (selectedQuarter === "all") {
      let quarterItems: ChartBarItem[];

      if (yr === 2026 && quarters && quarters.length > 0) {
        quarterItems = quarters.map((q) => ({
          label: q.quarter,
          plan: q.plan,
          actual: q.actual,
          isCurrent: q.isCurrent,
        }));
      } else {
        quarterItems = [
          {
            label: "Quý 1",
            plan: Number((145 * yearRatio).toFixed(1)),
            actual: Number((yr <= 2026 ? 158 * yearRatio : 0).toFixed(1)),
          },
          {
            label: "Quý 2",
            plan: Number((180 * yearRatio).toFixed(1)),
            actual: Number((yr <= 2026 ? 175 * yearRatio : 0).toFixed(1)),
          },
          {
            label: "Quý 3",
            plan: Number((190 * yearRatio).toFixed(1)),
            actual: Number((yr <= 2026 ? 76.5 * yearRatio : 0).toFixed(1)),
          },
          {
            label: yr === 2026 ? "Quý 4 (HT)" : "Quý 4",
            plan: Number((150 * yearRatio).toFixed(1)),
            actual: Number((yr < 2026 ? 148 * yearRatio : yr === 2026 ? 8.5 : 0).toFixed(1)),
            isCurrent: yr === 2026,
          },
        ];
      }

      const maxVal = Math.max(...quarterItems.flatMap((i) => [i.plan, i.actual]), 100);

      return {
        title: `BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NIÊN ĐỘ ${yr})`,
        subtitle: `So sánh Kế hoạch phân bổ và Thực tế giải ngân qua các quý năm ${yr}`,
        unit: "ĐVT: Tỷ đồng",
        maxScale: Math.ceil(maxVal * 1.2),
        items: quarterItems,
        metrics: {
          m1Label: "Đã giải ngân lũy kế",
          m1Value: `${(accumulatedDisbursed * yearRatio).toFixed(1)} tỷ`,
          m1Sub: "VNĐ",
          m2Label: "Còn lại cần giải ngân",
          m2Value: `${(remainingAmount * yearRatio).toFixed(1)} tỷ`,
          m2Sub: "VNĐ",
          m3Label: "Tốc độ yêu cầu",
          m3Value: `${(requiredMonthlySpeed * yearRatio).toFixed(1)} tỷ`,
          m3Sub: "/ tháng",
        },
      };
    }

    // 3.2 Nếu chọn 1 Quý cụ thể (Quý 1, 2, 3, 4) -> Hiển thị 3 tháng của Quý đó
    const qNum = Number(selectedQuarter);
    const monthsOfQuarter = [(qNum - 1) * 3 + 1, (qNum - 1) * 3 + 2, (qNum - 1) * 3 + 3];

    const quarterMonthItems: ChartBarItem[] = monthsOfQuarter.map((m) => {
      const isCurrent = yr === 2026 && m === 10;
      const plan = Number(((50 + ((m * 4) % 15)) * yearRatio).toFixed(1));
      let actual = 0;

      if (yr < 2026 || (yr === 2026 && m < 10)) {
        actual = Number(((48 + ((m * 6) % 12)) * yearRatio).toFixed(1));
      } else if (yr === 2026 && m === 10) {
        actual = Number((41.5 * yearRatio).toFixed(1));
      }

      return {
        label: isCurrent ? `Tháng ${m} (HT)` : `Tháng ${m}`,
        plan,
        actual,
        isCurrent,
      };
    });

    const totalPlan = quarterMonthItems.reduce((acc, it) => acc + it.plan, 0);
    const totalActual = quarterMonthItems.reduce((acc, it) => acc + it.actual, 0);
    const maxVal = Math.max(...quarterMonthItems.flatMap((i) => [i.plan, i.actual]), 50);
    const rate = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : "0";

    return {
      title: `BIỂU ĐỒ GIẢI NGÂN CHI TIẾT QUÝ ${qNum} (NIÊN ĐỘ ${yr})`,
      subtitle: `Tiến độ giải ngân 3 tháng thuộc Quý ${qNum} niên độ ${yr}`,
      unit: "ĐVT: Tỷ đồng",
      maxScale: Math.ceil(maxVal * 1.25),
      items: quarterMonthItems,
      metrics: {
        m1Label: `Đã giải ngân Quý ${qNum}`,
        m1Value: `${totalActual.toFixed(1)} tỷ`,
        m1Sub: "VNĐ",
        m2Label: `Kế hoạch Quý ${qNum}`,
        m2Value: `${totalPlan.toFixed(1)} tỷ`,
        m2Sub: "VNĐ",
        m3Label: `Tỷ lệ hoàn thành Quý ${qNum}`,
        m3Value: `${rate}%`,
        m3Sub: `Đạt KH ${totalActual.toFixed(1)}/${totalPlan.toFixed(1)} tỷ`,
      },
    };
  }, [
    currentFiscalYear,
    timeFilter,
    selectedWeek,
    selectedMonthBlock,
    selectedQuarter,
    quarters,
    accumulatedDisbursed,
    remainingAmount,
    requiredMonthlySpeed,
  ]);

  const gridColsClass =
    currentData.items.length === 3
      ? "grid-cols-3"
      : currentData.items.length === 4
      ? "grid-cols-4"
      : "grid-cols-5";

  return (
    <Card
      surface="workspace"
      padding="comfortable"
      rounded="lg"
      className="w-full border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between rounded-2xl p-5"
    >
      <Flex vertical gap={16} className="w-full">
        {/* Header với Tiêu đề */}
        <Flex align="start" justify="space-between" wrap="wrap" gap={8} className="w-full">
          <Flex vertical gap={2} className="w-full">
            <Text strong className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
              {currentData.title}
            </Text>
            <Text className="text-xs text-slate-600 font-medium">
              {currentData.subtitle}
            </Text>
          </Flex>
        </Flex>

        {/* Hàng điều khiển tách 2 bên: Bộ lọc bên trái, Chú thích bên phải */}
        <div className="w-full flex items-center justify-between flex-wrap gap-3">
          {/* Bên trái: Bộ lọc gộp chung duy nhất: Tuần / Tháng / Quý */}
          <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/90 shadow-2xs gap-0.5">
              {/* 1. Nút Tuần - Chọn khối 5 tuần trực tiếp */}
              <Dropdown
                menu={{
                  items: weekMenuItems,
                  selectable: true,
                  selectedKeys: [`${Math.floor((selectedWeek - 1) / 5) * 5 + 1}-${Math.min(52, Math.floor((selectedWeek - 1) / 5) * 5 + 5)}`],
                  onClick: ({ key }) => {
                    const [start] = key.split("-").map(Number);
                    setSelectedWeek(start);
                    setTimeFilter("week");
                  },
                  style: { maxHeight: "280px", overflowY: "auto" },
                }}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <button
                  type="button"
                  onClick={() => setTimeFilter("week")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    timeFilter === "week"
                      ? "bg-white text-[#DC2626] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>
                    Tuần {Math.floor((selectedWeek - 1) / 5) * 5 + 1} - {Math.min(52, Math.floor((selectedWeek - 1) / 5) * 5 + 5)}
                  </span>
                  <DownOutlined className="text-[9px] opacity-70" />
                </button>
              </Dropdown>

              {/* 2. Nút Tháng - Chọn khối 4 tháng trực tiếp */}
              <Dropdown
                menu={{
                  items: monthMenuItems,
                  selectable: true,
                  selectedKeys: [selectedMonthBlock],
                  onClick: ({ key }) => {
                    setSelectedMonthBlock(key);
                    setTimeFilter("month");
                  },
                  style: { maxHeight: "280px", overflowY: "auto" },
                }}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <button
                  type="button"
                  onClick={() => setTimeFilter("month")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    timeFilter === "month"
                      ? "bg-white text-[#DC2626] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Tháng {selectedMonthBlock.replace("-", " - ")}</span>
                  <DownOutlined className="text-[9px] opacity-70" />
                </button>
              </Dropdown>

              {/* 3. Nút Quý - Chọn quý trực tiếp */}
              <Dropdown
                menu={{
                  items: quarterMenuItems,
                  selectable: true,
                  selectedKeys: [selectedQuarter],
                  onClick: ({ key }) => {
                    setSelectedQuarter(key);
                    setTimeFilter("quarter");
                  },
                }}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <button
                  type="button"
                  onClick={() => setTimeFilter("quarter")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    timeFilter === "quarter"
                      ? "bg-white text-[#DC2626] shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>
                    {selectedQuarter === "all"
                      ? "Quý 1 - 4"
                      : `Quý ${selectedQuarter}`}
                  </span>
                  <DownOutlined className="text-[9px] opacity-70" />
                </button>
              </Dropdown>
            </div>

            {/* Chú thích màu sắc */}
            <Flex align="center" gap={10} className="text-xs text-slate-600">
              <Flex align="center" gap={5}>
                <span className="w-3 h-3 rounded-xs bg-[#F59E0B] inline-block shadow-2xs" />
                <span className="text-xs font-semibold text-[#D97706]">Kế hoạch</span>
              </Flex>
              <Flex align="center" gap={5}>
                <span className="w-3 h-3 rounded-xs bg-[#DC2626] inline-block shadow-2xs" />
                <span className="text-xs font-semibold text-[#DC2626]">Thực tế</span>
              </Flex>
              <span className="text-xs text-slate-500 font-medium">{currentData.unit}</span>
            </Flex>
          </div>

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
            className={`grid ${gridColsClass} gap-2 sm:gap-6 items-end h-[190px] px-2 sm:px-4 border-b border-slate-200 relative z-10`}
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
          <div className={`grid ${gridColsClass} gap-2 sm:gap-6 pt-3 text-center`}>
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
