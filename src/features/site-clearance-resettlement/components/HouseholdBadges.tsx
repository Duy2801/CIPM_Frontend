"use client";

import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Tag, Tooltip } from "@/components/ui";
import { SPECIAL_STATUS_META } from "../constants/gpmb-steps";
import type { LegalStatus, SpecialStatus } from "../types/gpmb.types";

export function LegalDeadlineTag({ status }: { status: LegalStatus }) {
  if (status.state === "NONE") {
    return <span className="text-xs text-slate-400">Không quy định</span>;
  }
  const days = status.daysLeft ?? 0;
  if (status.state === "OVERDUE") {
    return (
      <Tag intent="danger" scale="sm" icon={<AlertOutlined />} className="m-0 font-semibold text-xs">
        Quá hạn {Math.abs(days)} ngày
      </Tag>
    );
  }
  if (status.state === "SOON") {
    return (
      <Tag intent="warning" scale="sm" icon={<ClockCircleOutlined />} className="m-0 font-semibold text-xs">
        Còn {days} ngày
      </Tag>
    );
  }
  return (
    <Tag intent="success" scale="sm" icon={<CheckCircleOutlined />} className="m-0 text-xs">
      Còn {days}/{status.limitDays} ngày
    </Tag>
  );
}

export function SpecialStatusTag({ status }: { status: SpecialStatus }) {
  const meta = SPECIAL_STATUS_META[status];
  return (
    <Tooltip title={meta.hint}>
      <Tag intent={meta.intent} scale="sm" className="m-0 font-medium text-xs">
        {meta.label}
      </Tag>
    </Tooltip>
  );
}
