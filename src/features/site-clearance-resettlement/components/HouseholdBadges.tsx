"use client";

import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Tag, Tooltip } from "@/components/ui";
import { SPECIAL_STATUS_META } from "../constants/gpmb-steps";
import type { LegalStatus, SpecialStatus } from "../types/gpmb.types";

const SPECIAL_STATUS_CLASS_MAP: Record<SpecialStatus, string> = {
  NORMAL: "!border-blue-200 !bg-blue-50 !text-blue-700",
  UNCOOPERATIVE: "!border-amber-200 !bg-amber-50 !text-amber-800",
  COMPLAINT: "!border-indigo-200 !bg-indigo-50 !text-indigo-700",
  ENFORCEMENT: "!border-rose-200 !bg-rose-50 !text-rose-700",
};

export function LegalDeadlineTag({ status }: { status: LegalStatus }) {
  if (status.state === "NONE") {
    return <span className="text-xs text-slate-400">Không quy định</span>;
  }
  const days = status.daysLeft ?? 0;
  if (status.state === "OVERDUE") {
    return (
      <Tag scale="sm" icon={<AlertOutlined />} className="m-0 font-semibold text-xs !border-rose-200 !bg-rose-50 !text-rose-700">
        Quá hạn {Math.abs(days)} ngày
      </Tag>
    );
  }
  if (status.state === "SOON") {
    return (
      <Tag scale="sm" icon={<ClockCircleOutlined />} className="m-0 font-semibold text-xs !border-amber-200 !bg-amber-50 !text-amber-800">
        Còn {days} ngày
      </Tag>
    );
  }
  return (
    <Tag scale="sm" icon={<CheckCircleOutlined />} className="m-0 text-xs !border-blue-200 !bg-blue-50 !text-blue-700">
      Còn {days}/{status.limitDays} ngày
    </Tag>
  );
}

export function SpecialStatusTag({ status }: { status: SpecialStatus }) {
  const meta = SPECIAL_STATUS_META[status];
  const colorClass = SPECIAL_STATUS_CLASS_MAP[status] || "!border-blue-200 !bg-blue-50 !text-blue-700";
  return (
    <Tooltip title={meta.hint}>
      <Tag
        scale="sm"
        className={`m-0 font-medium text-xs ${colorClass}`}
      >
        {meta.label}
      </Tag>
    </Tooltip>
  );
}
