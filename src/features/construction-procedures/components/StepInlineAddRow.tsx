"use client";

import { Input, Select } from "@/components/ui";
import { FLOW_GUTTER, FLOW_INDENT, STEP_TYPE_OPTIONS, TYPE_COL } from "../constants/step-table";
import type { NewStepDraft } from "../hooks/useStepInlineAdd";
import type { StepType } from "../types/procedure.types";
import { getStepDepth } from "../utils/step-tree";
import { InlineRowActions, StepAssigneeCells, StepDurationInput, StepSupervisorCell } from "./StepTableCells";

const TONES = {
  main: {
    row: "bg-indigo-50/60 border-y border-indigo-300 border-l-[3px] border-l-indigo-500",
    code: "w-14 border-indigo-300",
    name: "font-semibold border-indigo-400 focus:border-indigo-600",
  },
  sub: {
    row: "bg-red-50/70 border-y border-red-200 border-l-[3px] border-l-[#DC2626] transition-all",
    code: "w-[76px] shrink-0 border-red-200",
    name: "border-red-300 focus:border-[#DC2626]",
  },
};

interface StepInlineAddRowProps {
  parentCode?: string;
  draft: NewStepDraft;
  staffOptions: { value: string; label: string }[];
  email?: string;
  onChange: (patch: Partial<NewStepDraft>) => void;
  onSave: (keepOpen?: boolean) => void;
  onCancel: () => void;
}

export default function StepInlineAddRow({
  parentCode,
  draft,
  staffOptions,
  email,
  onChange,
  onSave,
  onCancel,
}: StepInlineAddRowProps) {
  const isSub = !!parentCode;
  const tone = TONES[isSub ? "sub" : "main"];
  const indent = FLOW_GUTTER + (parentCode ? FLOW_INDENT * (getStepDepth(parentCode) + 1) : 0);
  const codeWidth = Math.max(96, indent + (isSub ? 92 : 64));
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave(isSub);
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className={`flex flex-col gap-1 px-3.5 py-2 shadow-2xs ${tone.row}`}>
      <div className="flex items-center gap-3 w-full">
        <div
          className={`shrink-0 flex items-center ${isSub ? "gap-0.5" : "gap-1.5 text-left"}`}
          style={{ paddingLeft: indent, width: codeWidth }}
        >
          {isSub && <span className="shrink-0 text-[#DC2626] font-mono text-xs select-none">└</span>}
          <Input
            value={draft.code}
            onChange={(e) => onChange({ code: e.target.value })}
            className={`h-7 text-center font-mono font-bold text-[11px] bg-white p-0.5 ${tone.code}`}
            placeholder="Mã"
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <Input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={
              isSub
                ? `Nhập tên bước con thuộc [${parentCode}] (nhấn Enter để thêm)...`
                : "Nhập tên bước chính (nhấn Enter để thêm)..."
            }
            autoFocus
            className={`h-7 text-xs bg-white w-full ${draft.missing.includes("name") ? "border-rose-500 ring-1 ring-rose-200" : tone.name}`}
            onKeyDown={onKeyDown}
          />
        </div>

        <StepAssigneeCells
          value={draft.assignee}
          options={staffOptions}
          email={email}
          onChange={(assignee) => onChange({ assignee })}
          invalid={draft.missing.includes("assignee")}
        />

        <StepSupervisorCell
          value={draft.supervisor}
          options={staffOptions}
          onChange={(supervisor) => onChange({ supervisor })}
        />

        <StepDurationInput
          days={draft.days}
          onChange={(days) => onChange({ days })}
          invalid={draft.missing.includes("days")}
        />

        <div className={`${TYPE_COL} flex items-center justify-center`}>
          <Select
            value={draft.type}
            onChange={(type) => onChange({ type: type as StepType })}
            size="small"
            className="w-24 text-xs"
            options={STEP_TYPE_OPTIONS}
          />
        </div>

        <InlineRowActions hasValue={!!draft.name.trim()} onSave={() => onSave(false)} onCancel={onCancel} />
      </div>

      {draft.error && (
        <div className="flex items-center gap-3 w-full">
          <div className="w-16 shrink-0" />
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[11px] text-rose-500 font-medium m-0 pt-0.5 leading-normal">{draft.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
