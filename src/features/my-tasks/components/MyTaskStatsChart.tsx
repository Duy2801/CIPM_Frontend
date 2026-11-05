"use client";

import { useState, type ReactNode } from "react";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

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
  projectCount,
  toolbar,
}: {
  segments: MyTaskStatSegment[];
  /** Số dự án có các việc này */
  projectCount: number;
  /** Nội dung đặt dưới dãy thẻ trong cùng khung (VD: ô tìm kiếm) */
  toolbar?: ReactNode;
}) {
  // Thu gọn: ẩn biểu đồ + thẻ, chỉ còn một hàng số liệu nhỏ và ô tìm
  const [collapsed, setCollapsed] = useState(false);
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
      <div className={cn("flex flex-col gap-4 px-5", collapsed ? "py-3" : "py-5")}>
      {!collapsed && (
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
            {/* Số việc và chữ "việc" trên cùng một hàng */}
            <span className="flex items-baseline gap-1">
              <span className="text-2xl font-bold leading-none tracking-tight text-slate-900">{total}</span>
              <span className="text-[11px] leading-none text-slate-500">việc</span>
            </span>
            <span className="mt-1 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold leading-tight text-slate-600">
              {projectCount} dự án
            </span>
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
      )}
      {/* Hàng dưới: (thu gọn thì có số liệu nhỏ) · ô tìm · nút thu gọn / mở rộng */}
      <div className="flex flex-wrap items-center gap-3">
        {collapsed && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {total} việc · {projectCount} dự án
            </span>
            {segments.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                {s.label}
                <strong className="tabular-nums text-slate-900">{s.count}</strong>
              </span>
            ))}
          </div>
        )}
        <div className="min-w-[240px] flex-1">{toolbar}</div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          {collapsed ? <DownOutlined className="text-[10px]" /> : <UpOutlined className="text-[10px]" />}
          {collapsed ? "Mở rộng" : "Thu gọn"}
        </button>
      </div>
      </div>
    </Card>
  );
}
