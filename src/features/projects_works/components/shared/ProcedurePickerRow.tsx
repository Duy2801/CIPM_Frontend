"use client";

import { useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import { Input } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { ProcedureLibraryItem } from "@/shared/construction-procedures/utils/procedure-library";
import { shortProcedureLabel } from "../../utils/procedure-target";

export default function ProcedurePickerRow({
  procedure,
  checked,
  dept,
  label,
  disabled,
  onToggle,
  onRename,
}: {
  procedure: ProcedureLibraryItem;
  checked: boolean;
  dept?: string;
  label?: string;
  disabled?: boolean;
  onToggle: (checked: boolean) => void;
  onRename?: (label: string) => void;
}) {
  const fallback = shortProcedureLabel(procedure.name);
  const current = label || fallback;
  const [draft, setDraft] = useState(current);
  const [synced, setSynced] = useState(current);
  if (synced !== current) {
    setSynced(current);
    setDraft(current);
  }
  const save = () => {
    const next = draft.trim();
    if (!next || next === fallback) {
      setDraft(fallback);
      if (label) onRename?.("");
      return;
    }
    if (next !== current) onRename?.(next);
  };

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-3 py-2 transition-colors",
        checked ? "bg-red-50/40" : "bg-white hover:bg-slate-50",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        title={procedure.name}
        onClick={() => onToggle(!checked)}
        className={cn(
          "flex min-w-0 items-center gap-3 border-0 bg-transparent p-0 py-0.5 text-left",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        )}
      >
        <TickBox checked={checked} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-xs font-semibold", checked ? "text-slate-900" : "text-slate-700")}>
            {procedure.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
            {[procedure.category, dept].filter(Boolean).join(" · ") || "—"}
          </span>
        </span>
      </button>

      <div className="min-w-0">
        {!checked ? (
          <span className="text-[11px] text-slate-300">Tích quy trình để đặt tên đầu mục</span>
        ) : onRename ? (
          <Input
            value={draft}
            maxLength={40}
            disabled={disabled}
            placeholder={fallback}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
            aria-label={`Tên đầu mục của ${procedure.name}`}
            className="h-8 text-xs"
          />
        ) : (
          <span className="block truncate text-xs font-semibold text-slate-800">{label || fallback}</span>
        )}
      </div>
    </li>
  );
}

function TickBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border text-[10px] transition-colors",
        checked ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-slate-300 bg-white text-transparent",
      )}
    >
      <CheckOutlined />
    </span>
  );
}
