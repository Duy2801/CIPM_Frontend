"use client";

import { cn } from "@/utils/cn";

interface WorkbookSheetTabsProps {
  sheets: string[];
  active: string;
  onSelect: (sheet: string) => void;
}

export default function WorkbookSheetTabs({ sheets, active, onSelect }: WorkbookSheetTabsProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3">
      <div
        role="tablist"
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sheets.map((name) => {
          const selected = name === active;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(name)}
              className={cn(
                "-mb-px shrink-0 cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-3 py-3 text-[13px] transition-colors",
                selected
                  ? "border-[#DC2626] font-semibold text-[#DC2626]"
                  : "border-transparent font-medium text-slate-500 hover:text-slate-900",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
