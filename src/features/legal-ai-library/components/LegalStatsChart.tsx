"use client";

import { useMemo, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Select, Text, Tooltip } from "@/components/ui";
import {
  getCategoryLabel,
  STATUS_META,
  STATUS_ORDER,
} from "../constants/legal-mock-data";
import type {
  DocumentCategoryKey,
  LegalDocument,
  LegalDocumentStatus,
} from "../types/legal-ai.types";

type StatsDimension = "STATUS" | "CATEGORY";

interface LegalStatsChartProps {
  documents: LegalDocument[];
  selectedStatus: LegalDocumentStatus | "ALL";
  selectedCategory: DocumentCategoryKey | "ALL";
  onSelectStatus: (status: LegalDocumentStatus | "ALL") => void;
  onSelectCategory: (category: DocumentCategoryKey | "ALL") => void;
}

interface ChartItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

const DIMENSION_OPTIONS: { value: StatsDimension; label: string }[] = [
  { value: "STATUS", label: "Theo tình trạng" },
  { value: "CATEGORY", label: "Theo loại văn bản" },
];

/** Màu tình trạng — cùng tông với STATUS_META.dotClass để biểu đồ và danh sách đồng nhất */
const STATUS_COLOR: Record<LegalDocumentStatus, string> = {
  EFFECTIVE: "#10b981", // emerald-500
  EXPIRING: "#f43f5e", // rose-500
  PARTIAL: "#f59e0b", // amber-500
  EXPIRED: "#94a3b8", // slate-400
};

/** Thứ tự loại văn bản theo thứ bậc hiệu lực pháp lý; loại thêm mới xếp sau theo thứ tự xuất hiện */
const CATEGORY_ORDER: string[] = [
  "LAW",
  "RESOLUTION",
  "DECREE",
  "CIRCULAR",
  "DECISION",
  "LOCAL",
  "TEMPLATE",
];

/**
 * Bảng màu phân loại 8 ô (đã kiểm tra phân biệt được với người mù màu, theo thứ tự cố định).
 * Màu gắn theo vị trí của loại trong thứ tự trên — không theo số lượng — nên lọc/thêm văn bản không đổi màu.
 * Từ loại thứ 9 trở đi gộp vào "Khác".
 */
const CATEGORY_PALETTE = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];
const OTHER_KEY = "__OTHER__";
const OTHER_COLOR = "#94a3b8";

const DONUT_SIZE = 132;
const DONUT_STROKE = 16;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
/** Khoảng hở giữa các cung (px theo chu vi) */
const SEGMENT_GAP = 3;

function buildStatusItems(documents: LegalDocument[]): ChartItem[] {
  return STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].label,
    color: STATUS_COLOR[key],
    count: documents.filter((doc) => doc.status === key).length,
  }));
}

function buildCategoryItems(documents: LegalDocument[]): ChartItem[] {
  const counts = new Map<string, number>();
  documents.forEach((doc) =>
    counts.set(doc.category, (counts.get(doc.category) ?? 0) + 1),
  );

  const extraKeys = [...counts.keys()].filter(
    (key) => !CATEGORY_ORDER.includes(key),
  );
  const orderedKeys = [...CATEGORY_ORDER, ...extraKeys];
  const items: ChartItem[] = [];
  let otherCount = 0;

  orderedKeys.forEach((key, index) => {
    const count = counts.get(key) ?? 0;
    if (count === 0) return;
    if (index >= CATEGORY_PALETTE.length) {
      otherCount += count;
      return;
    }
    items.push({
      key,
      label: getCategoryLabel(key),
      color: CATEGORY_PALETTE[index],
      count,
    });
  });

  if (otherCount > 0)
    items.push({
      key: OTHER_KEY,
      label: "Khác",
      color: OTHER_COLOR,
      count: otherCount,
    });
  return items;
}

export default function LegalStatsChart({
  documents,
  selectedStatus,
  selectedCategory,
  onSelectStatus,
  onSelectCategory,
}: LegalStatsChartProps) {
  const [dimension, setDimension] = useState<StatsDimension>("STATUS");

  const { items, segments } = useMemo(() => {
    const chartItems =
      dimension === "STATUS"
        ? buildStatusItems(documents)
        : buildCategoryItems(documents);
    const total = documents.length;
    const gap =
      chartItems.filter((item) => item.count > 0).length > 1 ? SEGMENT_GAP : 0;
    const arcLength = (count: number) =>
      total > 0 ? (count / total) * DONUT_CIRCUMFERENCE : 0;

    // Mỗi cung nối tiếp cung trước, bắt đầu từ 12 giờ theo chiều kim đồng hồ
    const chartSegments = chartItems.map((item, index) => ({
      ...item,
      dash: Math.max(arcLength(item.count) - gap, 0),
      offset: chartItems
        .slice(0, index)
        .reduce((sum, prev) => sum + arcLength(prev.count), 0),
    }));

    return { items: chartItems, segments: chartSegments };
  }, [documents, dimension]);

  const selectedKey =
    dimension === "STATUS" ? selectedStatus : selectedCategory;
  const hasSelection = selectedKey !== "ALL";
  const selectedItem = items.find((item) => item.key === selectedKey);

  // "Khác" gộp nhiều loại nên không dùng làm bộ lọc
  const isSelectable = (key: string) => key !== OTHER_KEY;
  const toggleItem = (key: string) => {
    if (!isSelectable(key)) return;
    if (dimension === "STATUS") {
      onSelectStatus(
        selectedStatus === key ? "ALL" : (key as LegalDocumentStatus),
      );
    } else {
      onSelectCategory(
        selectedCategory === key ? "ALL" : key,
      );
    }
  };
  const clearSelection = () =>
    dimension === "STATUS" ? onSelectStatus("ALL") : onSelectCategory("ALL");

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200 shadow-xs bg-white"
    >
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Biểu đồ vành khuyên: tổng ở giữa, mỗi cung là một nhóm */}
        <div
          className="relative mx-auto shrink-0 sm:mx-0"
          style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
        >
          <svg
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            role="img"
            aria-label={`Thống kê ${documents.length} văn bản ${
              dimension === "STATUS" ? "theo tình trạng" : "theo loại văn bản"
            }`}
            className="-rotate-90"
          >
            <circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={DONUT_STROKE}
            />
            {segments.map(({ key, label, color, count, dash, offset }) => {
              if (count === 0) return null;
              const dimmed = hasSelection && selectedKey !== key;
              return (
                <Tooltip key={key} title={`${label}: ${count} văn bản`}>
                  <circle
                    cx={DONUT_SIZE / 2}
                    cy={DONUT_SIZE / 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth={DONUT_STROKE}
                    strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
                    strokeDashoffset={-offset}
                    onClick={() => toggleItem(key)}
                    className={`transition-opacity ${isSelectable(key) ? "cursor-pointer" : ""} ${
                      dimmed ? "opacity-25" : "hover:opacity-80"
                    }`}
                  />
                </Tooltip>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[28px] font-bold leading-none tracking-tight text-slate-900">
              {selectedItem ? selectedItem.count : documents.length}
            </span>
            <span className="mt-1 max-w-21 text-[11px] leading-tight text-slate-500">
              {selectedItem ? selectedItem.label.toLowerCase() : "văn bản"}
            </span>
          </div>
        </div>

        {/* Tiêu đề · chọn cách thống kê · thẻ từng nhóm (bấm để lọc danh sách) */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Text className="text-sm font-bold text-slate-900">
                Thống kê văn bản
              </Text>
              <p className="m-0 text-[11px] text-slate-500">
                Toàn thư viện · bấm vào biểu đồ hoặc thẻ để lọc danh sách bên
                dưới
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasSelection && (
                <Button
                  intent="outline"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={clearSelection}
                  className="text-xs h-8! font-medium"
                >
                  Bỏ lọc
                </Button>
              )}
              <Select
                aria-label="Cách thống kê"
                value={dimension}
                onChange={(val) => setDimension(val as StatsDimension)}
                className="h-8 w-44"
                options={DIMENSION_OPTIONS}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <p className="m-0 text-xs text-slate-400">Chưa có văn bản.</p>
          ) : (
            // Lưới tự xuống dòng — số loại văn bản có thể tăng khi thêm loại mới
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 p-0">
              {items.map(({ key, label, color, count }) => {
                const isSelected = selectedKey === key;
                const dimmed = hasSelection && !isSelected;
                const selectable = isSelectable(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-pressed={selectable ? isSelected : undefined}
                      disabled={!selectable}
                      onClick={() => toggleItem(key)}
                      className={`flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        selectable ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelected
                          ? "border-slate-400 bg-slate-50 ring-1 ring-slate-300"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      } ${dimmed ? "opacity-60" : ""}`}
                    >
                      <span className="flex items-center gap-2 text-xs text-slate-600">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        <span className="truncate">{label}</span>
                      </span>
                      <span className="text-xl font-bold leading-none tabular-nums text-slate-900">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
