"use client";

import { Progress, Text } from "@/components/ui";
import type { KpiItem, KpiTone } from "./workspace.types";

const TONE_CLASSES: Record<
  KpiTone,
  { icon: string; value: string; stroke: string }
> = {
  neutral: {
    icon: "bg-slate-100 text-[#102A43]",
    value: "text-[#102A43]",
    stroke: "#102A43",
  },
  brand: {
    icon: "bg-teal-50 text-[#007A78]",
    value: "text-[#007A78]",
    stroke: "#007A78",
  },
  success: {
    icon: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    stroke: "#059669",
  },
  warning: {
    icon: "bg-amber-50 text-amber-700",
    value: "text-amber-700",
    stroke: "#D97706",
  },
  danger: {
    icon: "bg-rose-50 text-rose-700",
    value: "text-rose-700",
    stroke: "#E11D48",
  },
  info: {
    icon: "bg-sky-50 text-sky-700",
    value: "text-sky-700",
    stroke: "#0284C7",
  },
};

interface KpiCardGridProps {
  items: KpiItem[];
}

function getGridColsClass(count: number): string {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-1 sm:grid-cols-2";
    case 3:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case 4:
      return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";
    case 5:
      return "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5";
    case 6:
      return "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6";
    default:
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  }
}

export default function KpiCardGrid({ items }: KpiCardGridProps) {
  const gridColsClass = getGridColsClass(items.length);

  return (
    <div className={`grid ${gridColsClass} gap-3 w-full`}>
      {items.map((item) => {
        const tone = TONE_CLASSES[item.tone];
        return (
          <div
            key={item.key}
            className="flex h-full flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs shadow-slate-100/50 transition-all hover:border-slate-300"
          >
            <div>
              <div className="flex items-start justify-between gap-2.5">
                <Text className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug line-clamp-2 min-h-[30px]">
                  {item.label}
                </Text>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${tone.icon}`}
                >
                  {item.icon}
                </span>
              </div>
              <div className="mt-1.5">
                <Text
                  className={`block text-2xl font-black leading-tight tracking-tight ${tone.value}`}
                >
                  {item.value}
                </Text>
              </div>
            </div>

            <div className="mt-3">
              {item.progress !== undefined && (
                <div className="mb-2">
                  <Progress
                    percent={Math.min(100, Math.max(0, item.progress))}
                    showInfo={false}
                    size="small"
                    strokeColor={tone.stroke}
                    railColor="#F1F5F9"
                    aria-label={item.label}
                    className="!m-0 !h-1.5"
                  />
                </div>
              )}
              {item.note && (
                <Text
                  className="block text-xs leading-normal text-slate-500 truncate"
                  title={typeof item.note === "string" ? item.note : undefined}
                >
                  {item.note}
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
