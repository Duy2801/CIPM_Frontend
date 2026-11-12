import { AppstoreOutlined, HistoryOutlined } from "@ant-design/icons";

export type ReportScreenTab = "list" | "history";

const TAB_ITEMS = [
  { key: "list", icon: <AppstoreOutlined />, label: "Danh sách báo cáo" },
  { key: "history", icon: <HistoryOutlined />, label: "Lịch sử thao tác" },
] as const;

interface ReportScreenTabsProps {
  value: ReportScreenTab;
  onChange: (tab: ReportScreenTab) => void;
}

export default function ReportScreenTabs({ value, onChange }: ReportScreenTabsProps) {
  return (
    <div role="tablist" className="inline-flex gap-1 self-start rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
      {TAB_ITEMS.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 py-1.5 text-xs transition-colors ${
              active ? "bg-white font-semibold text-slate-900 shadow-xs" : "bg-transparent font-medium text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className={active ? "text-[#DC2626]" : "text-slate-400"}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
