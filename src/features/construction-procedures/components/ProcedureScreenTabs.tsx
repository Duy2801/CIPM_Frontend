"use client";

import { BranchesOutlined, HistoryOutlined } from "@ant-design/icons";

export type ProcedureScreenTab = "procedures" | "history";

const OPTIONS = [
  { value: "procedures" as const, icon: <BranchesOutlined />, label: "Quy trình" },
  { value: "history" as const, icon: <HistoryOutlined />, label: "Lịch sử thay đổi" },
];

/** 2 tab trên cùng màn Quy trình — cùng kiểu với tab của Thư viện Pháp lý */
export default function ProcedureScreenTabs({
  value,
  onChange,
}: {
  value: ProcedureScreenTab;
  onChange: (tab: ProcedureScreenTab) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5"
    >
      {OPTIONS.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs leading-none transition-colors ${
              active ? "bg-white font-semibold text-slate-900 shadow-xs" : "font-medium text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className={`inline-flex items-center text-[13px] ${active ? "text-[#DC2626]" : "text-slate-400"}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
