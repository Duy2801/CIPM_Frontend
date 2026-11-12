"use client";

import { useEffect, useState } from "react";
import { App } from "antd";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { ProjectItem } from "../../../types/project.types";
import { useProjectDisbursements } from "../../../hooks/useProjectDisbursements";
import { signedAmount, type DisbursementKind, type DisbursementEntry } from "../../../utils/project-disbursement";
import { GRID, money, percent } from "./disbursement-format";
import DisbursementCategoryRow from "./DisbursementCategoryRow";
import DisbursementFormDrawer from "./DisbursementFormDrawer";
import DisbursementRecordDrawer from "./DisbursementRecordDrawer";
import DisbursementStat from "./DisbursementStat";

type FormState = { kind: DisbursementKind; category: string };

interface ProjectDisbursementTabProps {
  project: ProjectItem;
  operatorName: string;
  canDisburse: boolean;
  headings?: string[];
  onTotalChange: (total: number) => void;
}

export default function ProjectDisbursementTab({
  project,
  operatorName,
  canDisburse,
  headings,
  onTotalChange,
}: ProjectDisbursementTabProps) {
  const { message } = App.useApp();
  const byHeading = (headings?.length ?? 0) > 0;
  const { isBackend, entries, summary, add, addCategory } =
    useProjectDisbursements(
      project.id,
      operatorName,
      byHeading ? [...new Set(headings)] : undefined,
    );
  const unit = byHeading ? "đầu mục" : "danh mục";

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [form, setForm] = useState<FormState>();

  const totalInvestment = project.totalInvestment || 0;
  const remaining =
    totalInvestment > 0
      ? Math.max(0, totalInvestment - summary.total)
      : undefined;
  const rate = percent(summary.total, totalInvestment);

  useEffect(() => {
    if (!isBackend && (project.disbursedAmount ?? 0) !== summary.total) onTotalChange(summary.total);
  }, [isBackend, project.disbursedAmount, summary.total, onTotalChange]);

  const toggle = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const [viewing, setViewing] = useState<DisbursementEntry>();

  return (
    <Card
      surface="workspace"
      padding="none"
      rounded="lg"
      className="overflow-hidden border border-slate-200/80 shadow-xs"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
        <div className="mr-auto min-w-0">
          <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Tình hình giải ngân
          </h3>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50/60 lg:grid-cols-4">
        <DisbursementStat
          label="Tổng mức đầu tư"
          value={totalInvestment > 0 ? money(totalInvestment) : "Chưa có"}
        />
        <DisbursementStat
          label="Đã giải ngân"
          value={money(summary.total)}
          hint={`${summary.count} đợt`}
          accent
          className="border-l border-slate-200"
        />
        <DisbursementStat
          label="Còn lại"
          value={remaining !== undefined ? money(remaining) : "—"}
          className="border-t border-slate-200 lg:border-t-0 lg:border-l"
        />
        <div className="border-t border-l border-slate-200 px-4 py-3 lg:border-t-0">
          <div className="text-[11px] font-medium text-slate-500">
            Tỷ lệ giải ngân
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-sm font-bold text-slate-900">
              {rate.toFixed(1)}%
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#DC2626] transition-all"
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[1100px]">
          <div
            className={cn(
              GRID,
              "border-y border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500",
            )}
          >
            <span className="pl-5">{byHeading ? "Đầu mục" : "Danh mục"}</span>
            <span className="text-center">Số đợt</span>
            <span className="text-center">Đã giải ngân</span>
            <span className="text-center">Tỷ lệ / TMĐT</span>
            <span className="text-center">Gần nhất</span>
            <span className="text-center">Thao tác</span>
          </div>

          {summary.byCategory.map((row) => (
            <DisbursementCategoryRow
              key={row.category}
              row={row}
              totalInvestment={totalInvestment}
              open={expanded.has(row.category)}
              onToggle={() => toggle(row.category)}
              entries={entries.filter((e) => e.category === row.category)}
              canDisburse={canDisburse}
              onDisburse={() =>
                setForm({ kind: "disburse", category: row.category })
              }
              onWithdraw={() =>
                setForm({ kind: "withdraw", category: row.category })
              }
              onView={setViewing}
            />
          ))}

          {canDisburse && (
            <button
              type="button"
              onClick={() => setForm({ kind: "disburse", category: "" })}
              className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left text-xs font-semibold text-[#DC2626] transition-colors hover:bg-red-50/60"
            >
              Thêm dòng giải ngân
            </button>
          )}
        </div>
      </div>

      {viewing && (
        <DisbursementRecordDrawer
          entry={viewing}
          projectName={project.name}
          unit={unit}
          onClose={() => setViewing(undefined)}
        />
      )}

      {form && (
        <DisbursementFormDrawer
          kind={form.kind}
          projectName={project.name}
          operatorName={operatorName}
          initialCategory={form.category}
          categories={summary.byCategory.map((row) => row.category)}
          unit={unit}
          remaining={remaining}
          categoryTotal={(c) =>
            summary.byCategory.find((row) => row.category === c)?.total ?? 0
          }
          onAddCategory={byHeading ? () => undefined : addCategory}
          onCancel={() => setForm(undefined)}
          onSubmit={async (input, files) => {
            try {
              await add(input, files);
            } catch (e) {
              message.error((e as Error).message);
              return false;
            }
            onTotalChange(summary.total + signedAmount(input));
            setExpanded((prev) => new Set(prev).add(input.category));
            setForm(undefined);
            message.success(
              input.kind === "withdraw"
                ? `Đã thu hồi ${money(input.amount)} của ${input.category}.`
                : `Đã giải ngân ${money(input.amount)} cho ${input.category}.`,
            );
          }}
        />
      )}
    </Card>
  );
}
