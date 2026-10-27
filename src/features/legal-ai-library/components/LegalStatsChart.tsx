"use client";

import { useMemo } from "react";
import { Card, Text } from "@/components/ui";
import { STATUS_META, STATUS_ORDER } from "../constants/legal-labels";
import type { LegalDocument, LegalDocumentStatus } from "../types/legal-ai.types";

interface LegalStatsChartProps {
  documents: LegalDocument[];
}

/** Màu tình trạng — cùng tông với STATUS_META.dotClass để biểu đồ và danh sách đồng nhất */
const STATUS_COLOR: Record<LegalDocumentStatus, string> = {
  EFFECTIVE: "#10b981", // emerald-500
  EXPIRING: "#f43f5e", // rose-500
  PARTIAL: "#f59e0b", // amber-500
  EXPIRED: "#94a3b8", // slate-400
};

const DONUT_SIZE = 132;
const DONUT_STROKE = 16;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
/** Khoảng hở giữa các cung (px theo chu vi) */
const SEGMENT_GAP = 3;

/** Thống kê tình trạng hiệu lực của toàn thư viện — chỉ để xem, không bấm lọc */
export default function LegalStatsChart({ documents }: LegalStatsChartProps) {
  const segments = useMemo(() => {
    const total = documents.length;
    const counts = STATUS_ORDER.map((key) => documents.filter((doc) => doc.status === key).length);
    const gap = counts.filter((count) => count > 0).length > 1 ? SEGMENT_GAP : 0;
    const arcLength = (count: number) => (total > 0 ? (count / total) * DONUT_CIRCUMFERENCE : 0);

    // Mỗi cung nối tiếp cung trước, bắt đầu từ 12 giờ theo chiều kim đồng hồ
    return STATUS_ORDER.map((key, index) => ({
      key,
      count: counts[index],
      dash: Math.max(arcLength(counts[index]) - gap, 0),
      offset: counts.slice(0, index).reduce((sum, count) => sum + arcLength(count), 0),
    }));
  }, [documents]);

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200 shadow-xs bg-white"
    >
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Biểu đồ vành khuyên: tổng ở giữa, mỗi cung là một tình trạng */}
        <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            role="img"
            aria-label={`Tình trạng hiệu lực của ${documents.length} văn bản: ${segments
              .map(({ key, count }) => `${STATUS_META[key].label} ${count}`)
              .join(", ")}`}
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
            {segments.map(({ key, count, dash, offset }) =>
              count === 0 ? null : (
                <circle
                  key={key}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={STATUS_COLOR[key]}
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-offset}
                />
              ),
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[28px] font-bold leading-none tracking-tight text-slate-900">{documents.length}</span>
            <span className="mt-1 text-[11px] leading-tight text-slate-500">văn bản</span>
          </div>
        </div>

        {/* Tiêu đề + thẻ số lượng từng tình trạng */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-w-0">
            <Text className="text-sm font-bold text-slate-900">Tình trạng hiệu lực văn bản</Text>
          </div>

          {/* 4 thẻ chia đều toàn bộ chiều ngang */}
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
            {segments.map(({ key, count }) => (
              <li
                key={key}
                className="flex min-w-0 flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[key] }}
                    aria-hidden
                  />
                  <span className="truncate">{STATUS_META[key].label}</span>
                </span>
                <span className="text-2xl font-bold leading-none tabular-nums text-slate-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
