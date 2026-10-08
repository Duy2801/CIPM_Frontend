"use client";

import type { ReactNode } from "react";

interface ModuleTabLabelProps {
  icon: ReactNode;
  text: string;
  badge?: number;
  /** Màu huy hiệu: vàng = việc của bạn, đỏ = cảnh báo, xám = thông tin */
  badgeTone?: "warning" | "danger" | "neutral";
}

const BADGE_CLASSES = {
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
};

export default function ModuleTabLabel({ icon, text, badge, badgeTone = "neutral" }: ModuleTabLabelProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex shrink-0 items-center justify-center leading-none [&_.anticon]:!mr-0 [&_.anticon]:!m-0">
        {icon}
      </span>
      <span className="whitespace-nowrap">{text}</span>
      {badge ? (
        <span className={`rounded-full px-1.5 text-[11px] font-bold leading-4 text-white ${BADGE_CLASSES[badgeTone]}`}>
          {badge}
        </span>
      ) : null}
    </span>
  );
}
