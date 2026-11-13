"use client";

import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import type { DisbursementKind } from "../../../utils/project-disbursement";

interface DisbursementCategoryBarProps {
  projectId: string;
  activeCategory?: string;
  onChange: (category: string) => void;
  onOpenForm: (kind: DisbursementKind, category: string) => void;
}

export default function DisbursementCategoryBar({
  projectId,
  activeCategory,
  onChange,
  onOpenForm,
}: DisbursementCategoryBarProps) {
  const { summary, canDisburse, byHeading, unit } = useProjectDisbursements(projectId);
  const categories = summary.byCategory;
  const current = categories.find((c) => c.category === activeCategory);

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div role="tablist" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
          {categories.map((c) => {
            const active = c.category === activeCategory;
            return (
              <button
                key={c.category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(c.category)}
                className={cn(
                  "inline-flex h-8 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-md border-0 px-3 text-xs leading-none transition-colors",
                  active
                    ? "bg-white font-semibold text-[#DC2626] shadow-xs"
                    : "bg-transparent font-medium text-slate-500 hover:text-slate-800",
                )}
              >
                {c.category}
              </button>
            );
          })}
        </div>
      </div>
      {canDisburse && !byHeading && (
        <button
          type="button"
          onClick={() => onOpenForm("disburse", "")}
          className="shrink-0 cursor-pointer rounded-md border border-dashed border-slate-300 bg-transparent px-2.5 py-1 text-xs font-semibold text-[#DC2626] hover:bg-red-50/60"
        >
          Thêm {unit}
        </button>
      )}
      {canDisburse && current && (
        <div className="flex shrink-0 items-center gap-2">
          <Button intent="primary" scale="sm" onClick={() => onOpenForm("disburse", current.category)}>
            Cấp giải ngân
          </Button>
          <Button
            intent="outline"
            scale="sm"
            disabled={current.total <= 0}
            onClick={() => onOpenForm("withdraw", current.category)}
            className="hover:!border-rose-400 hover:!text-rose-600"
          >
            Thu hồi vốn
          </Button>
        </div>
      )}
    </div>
  );
}
