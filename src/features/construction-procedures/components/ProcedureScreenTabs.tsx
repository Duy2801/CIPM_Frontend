"use client";

import { BranchesOutlined, HistoryOutlined } from "@ant-design/icons";
import { Segmented } from "@/components/ui";

export type ProcedureScreenTab = "procedures" | "history";

const OPTIONS = [
  { value: "procedures" as const, icon: <BranchesOutlined />, label: "Quy trình" },
  { value: "history" as const, icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
];

export default function ProcedureScreenTabs({
  value,
  onChange,
}: {
  value: ProcedureScreenTab;
  onChange: (tab: ProcedureScreenTab) => void;
}) {
  return <Segmented<ProcedureScreenTab> options={OPTIONS} value={value} onChange={onChange} />;
}
