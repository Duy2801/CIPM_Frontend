"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, MoneyInput, Select, Tooltip } from "@/components/ui";
import { DropdownAddOption } from "@/components/workspace";
import { formatMoneyString, parseMoney } from "@/utils/format-money";
import { FUNDING_SOURCE_OPTIONS } from "../../constants/project-enums";
import { useCustomOptions } from "../../hooks/useCustomOptions";
import type { FundingSourceType } from "../../types/project.types";
import { DROPDOWN_LIST_HEIGHT, FUNDING_STORAGE_KEY, sameText } from "../../utils/custom-options";
import type { FundingLine } from "../../utils/create-project-form";

interface FundingSourceRowsProps {
  value: FundingLine[];
  onChange: (lines: FundingLine[]) => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export default function FundingSourceRows({
  value,
  onChange,
  disabled,
  highlighted,
}: FundingSourceRowsProps) {
  const { custom, add } = useCustomOptions(FUNDING_STORAGE_KEY);
  const options = [...new Set([...FUNDING_SOURCE_OPTIONS, ...custom])].map((v) => ({ value: v, label: v }));
  const selectClass = highlighted ? "[&_.ant-select-selector]:!border-amber-400 [&_.ant-select-selector]:!bg-amber-50/60" : "";
  const inputClass = highlighted ? "!border-amber-400 !bg-amber-50/60" : "";
  const total = value.reduce((sum, line) => sum + (line.amount === "" ? 0 : line.amount), 0);
  const patch = (index: number, change: Partial<FundingLine>) =>
    onChange(value.map((line, i) => (i === index ? { ...line, ...change } : line)));
  const used = new Set<string>(value.map((line) => line.source).filter(Boolean));
  const firstFree = options.find((o) => !used.has(o.value))?.value ?? "";

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-3 sm:grid">
        <span className="text-[11px] font-medium text-slate-500">Nguồn vốn</span>
        <span className="text-[11px] font-medium text-slate-500">Số vốn đầu tư (VNĐ)</span>
        <span />
      </div>

      {value.map((line, index) => (
        <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_32px] gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px]">
          <Select
            showSearch
            disabled={disabled}
            optionFilterProp="label"
            placeholder="Chọn nguồn vốn"
            value={line.source || undefined}
            onChange={(val) => patch(index, { source: val as FundingSourceType })}
            options={options.map((o) => ({ ...o, disabled: o.value !== line.source && used.has(o.value) }))}
            listHeight={DROPDOWN_LIST_HEIGHT}
            className={`w-full text-xs ${selectClass}`}
            popupRender={(menu) => (
              <>
                {menu}
                <DropdownAddOption
                  placeholder="Nhập nguồn vốn mới..."
                  isDuplicate={(name) => options.some((o) => sameText(o.label, name))}
                  onAdd={async (name) => {
                    const label = name.trim();
                    add(label);
                    patch(index, { source: label as FundingSourceType });
                    return true;
                  }}
                />
              </>
            )}
          />
          <MoneyInput
            placeholder="VD: 1.000.000.000"
            disabled={disabled}
            value={line.amount}
            onChange={(e) => patch(index, { amount: e.target.value === "" ? "" : parseMoney(e.target.value) })}
            className={`col-start-1 w-full font-mono text-xs sm:col-start-auto ${inputClass}`}
          />
          {index === 0 || disabled ? (
            <span className="row-start-1 col-start-2 sm:row-start-auto sm:col-start-3" />
          ) : (
            <Tooltip title="Xóa nguồn vốn">
              <Button
                intent="ghost"
                scale="compact"
                aria-label="Xóa nguồn vốn"
                icon={<DeleteOutlined />}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="row-start-1 h-8! w-8! p-0! text-slate-400 hover:text-rose-600! sm:row-start-auto col-start-2 sm:col-start-3"
              />
            </Tooltip>
          )}
        </div>
      ))}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5">
        {disabled ? <span /> : <Button
          intent="outline"
          scale="compact"
          disabled={!firstFree}
          onClick={() =>
            onChange([...value, { id: `FUND-${Date.now()}`, source: firstFree as FundingSourceType, amount: "" }])
          }
          className="border-dashed! text-xs text-[#0F4C81]!"
        >
          Thêm nguồn vốn
        </Button>}
        <div className="text-xs text-slate-500">
          Tổng mức đầu tư:{" "}
          <span className="font-mono text-sm font-bold text-slate-900">{formatMoneyString(total) || "0"}</span> VNĐ
        </div>
      </div>
    </div>
  );
}
