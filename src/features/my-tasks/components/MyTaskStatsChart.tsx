"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export interface MyTaskStatSegment {
  key: string;
  label: string;
  count: number;
  /** Màu cung / chấm (mã màu) */
  color: string;
}

const DONUT_SIZE = 104;
const DONUT_STROKE = 12;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
/** Khoảng hở giữa các cung (px theo chu vi) */
const SEGMENT_GAP = 3;

/** Thống kê việc của tôi theo tình trạng: vành khuyên (tổng ở giữa) + thẻ số lượng — cùng kiểu thư viện pháp lý */
export default function MyTaskStatsChart({
  segments,
  toolbar,
}: {
  segments: MyTaskStatSegment[];
  /** Nội dung đặt dưới dãy thẻ trong cùng khung (VD: ô tìm kiếm) */
  toolbar?: ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const gap = segments.filter((s) => s.count > 0).length > 1 ? SEGMENT_GAP : 0;
  const arcLength = (count: number) => (total > 0 ? (count / total) * DONUT_CIRCUMFERENCE : 0);
  // Mỗi cung nối tiếp cung trước, bắt đầu từ 12 giờ theo chiều kim đồng hồ
  const arcs = segments.map((s, i) => ({
    ...s,
    dash: Math.max(arcLength(s.count) - gap, 0),
    offset: segments.slice(0, i).reduce((sum, x) => sum + arcLength(x.count), 0),
  }));

  return (
    <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            role="img"
            aria-label={`Tình trạng ${total} việc: ${segments.map((s) => `${s.label} ${s.count}`).join(", ")}`}
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
            {arcs.map((a) =>
              a.count === 0 ? null : (
                <circle
                  key={a.key}
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={`${a.dash} ${DONUT_CIRCUMFERENCE - a.dash}`}
                  strokeDashoffset={-a.offset}
                />
              ),
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold leading-none tracking-tight text-slate-900">{total}</span>
            <span className="mt-0.5 text-[10px] leading-tight text-slate-500">việc</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 xl:grid-cols-6">
            {segments.map((s) => (
              <li key={s.key} className="flex min-w-0 flex-col justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="text-xl font-bold leading-none tabular-nums text-slate-900">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Ô tìm: hàng riêng, trải hết bề ngang dưới biểu đồ */}
      {toolbar}
      </div>
    </Card>
  );
}
