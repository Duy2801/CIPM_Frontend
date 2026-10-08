"use client";

import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined } from "@ant-design/icons";
import { Tag, Text } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import type { BidPackage } from "../types/bidding.types";
import { getBidDeadlineStatus, getContractDeadlineStatus, getCurrentBidStep } from "../utils/bidding-rules";

/** Mốc thời gian quan trọng nhất của gói thầu: hạn nộp HSDT hoặc hạn ký hợp đồng */
export default function BidDeadlineTag({ pkg, today }: { pkg: BidPackage; today: string }) {
  const bid = getBidDeadlineStatus(pkg, today);
  const contract = getContractDeadlineStatus(pkg, today);
  const status = bid.state !== "NONE" ? bid : contract;
  const label = bid.state !== "NONE" ? "Hạn nộp HSDT" : "Hạn ký HĐ";

  if (status.state === "NONE") {
    return getCurrentBidStep(pkg) === null ? (
      <Tag intent="success" scale="sm" icon={<FileDoneOutlined />} className="m-0 font-medium text-xs whitespace-nowrap">
        Đã ký HĐ
      </Tag>
    ) : (
      <span className="text-xs text-slate-300">—</span>
    );
  }

  const days = status.daysLeft ?? 0;
  const intent = status.state === "OK" ? "success" : status.state === "WARNING" ? "warning" : "danger";
  const icon = status.state === "OK" ? <CheckCircleOutlined /> : status.state === "WARNING" ? <ClockCircleOutlined /> : <AlertOutlined />;

  return (
    <div className="py-0.5 text-center flex flex-col items-center">
      <div className="text-[11.5px] text-slate-500 font-medium leading-snug">
        <span>{label}: </span>
        <span className="font-semibold text-slate-700 whitespace-nowrap">{formatDateVi(status.date)}</span>
      </div>
      <Tag intent={intent} scale="sm" icon={icon} className="m-0 mt-1 font-semibold text-[11px] whitespace-nowrap">
        {status.state === "PASSED" ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
      </Tag>
    </div>
  );
}
