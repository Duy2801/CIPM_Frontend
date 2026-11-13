"use client";

import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import { sourceBalance } from "@/shared/projects_works/utils/project-disbursement";
import { money, percent } from "../../../utils/disbursement-format";
import DisbursementStat, { DisbursementRateStat, DisbursementSummaryBox } from "./DisbursementStat";

export default function DisbursementCategorySummary({
  projectId,
  category,
  className,
}: {
  projectId: string;
  category: string;
  className?: string;
}) {
  const { entries, summary, unit, totalInvestment, budgets, perSource } = useProjectDisbursements(projectId);
  const row = summary.byCategory.find((c) => c.category === category);
  const inCategory = entries.filter((e) => e.category === category);
  const granted = inCategory.filter((e) => e.kind !== "withdraw").reduce((sum, e) => sum + e.amount, 0);
  const withdrawn = inCategory.filter((e) => e.kind === "withdraw").reduce((sum, e) => sum + e.amount, 0);
  const total = row?.total ?? 0;

  return (
    <>
      <DisbursementSummaryBox title={`${unit[0].toUpperCase()}${unit.slice(1)}: ${category}`} className={className}>
        <DisbursementStat label="Đã cấp" value={money(granted)} />
        <DisbursementStat label="Đã thu hồi" value={money(withdrawn)} className="border-l border-slate-200" />
        <DisbursementStat
          label="Thực giải ngân"
          value={money(total)}
          hint={`${row?.count ?? 0} đợt`}
          accent
          className="border-t border-slate-200 lg:border-t-0 lg:border-l"
        />
        <DisbursementRateStat label="Tỷ lệ so với tổng mức đầu tư" rate={percent(total, totalInvestment)} />
      </DisbursementSummaryBox>

      {perSource && budgets.length > 1 && (
        <div className="mx-4 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          {budgets.map((b) => (
            <span key={b.source}>
              {b.source}: còn <span className="font-semibold text-slate-800">{money(sourceBalance(entries, b))}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
