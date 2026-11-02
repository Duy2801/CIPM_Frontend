"use client";

import { CheckCircleFilled } from "@ant-design/icons";
import { Segmented } from "@/components/ui";

export type ProcedureEditorView = "flow" | "table" | "history";

const CREATE_OPTIONS = [
  { value: "table" as const, label: "1. Danh sách các bước" },
  { value: "flow" as const, label: "2. Sơ đồ quy trình" },
];

const DETAIL_OPTIONS = [
  { value: "flow" as const, label: "Sơ đồ quy trình" },
  { value: "table" as const, label: "Danh sách các bước" },
  { value: "history" as const, label: "Lịch sử thay đổi" },
];

interface ProcedureEditorTabsProps {
  isCreate: boolean;
  value: ProcedureEditorView;
  onChange: (view: ProcedureEditorView) => void;
  autoSave?: { savedAt: Date | null };
}

export default function ProcedureEditorTabs({ isCreate, value, onChange, autoSave }: ProcedureEditorTabsProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <Segmented<ProcedureEditorView>
        options={isCreate ? CREATE_OPTIONS : DETAIL_OPTIONS}
        value={value}
        onChange={onChange}
      />
      {autoSave && (
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircleFilled className={autoSave.savedAt ? "text-emerald-500" : "text-slate-300"} />
          {autoSave.savedAt
            ? `Đã tự lưu lúc ${autoSave.savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
            : "Thay đổi được tự lưu"}
        </span>
      )}
    </div>
  );
}
