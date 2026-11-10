"use client";

import { Segmented } from "@/components/ui";

export type ProcedureEditorView = "flow" | "table" | "history";

const CREATE_OPTIONS = [
  { value: "table" as const, label: "Danh sách các bước" },
  { value: "flow" as const, label: "Sơ đồ quy trình" },
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
  /** Loại quy trình hiện bên phải hàng tab */
  category?: string;
}

export default function ProcedureEditorTabs({ isCreate, value, onChange, category }: ProcedureEditorTabsProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <Segmented<ProcedureEditorView>
        options={isCreate ? CREATE_OPTIONS : DETAIL_OPTIONS}
        value={value}
        onChange={onChange}
      />
      {category && (
        <div className="ml-auto text-right leading-tight">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Loại quy trình</div>
          <div className="text-[13px] font-semibold text-slate-700">{category}</div>
        </div>
      )}
    </div>
  );
}
