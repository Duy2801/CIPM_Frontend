"use client";

import { useState, type ReactNode } from "react";
import { Checkbox, Select } from "@/components/ui";
import { getProcedureCategories } from "@/features/construction-procedures/constants/procedure-categories";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import { departmentName, procedureDepartment } from "../../utils/procedure-target";
import ProcedurePickerRow from "./ProcedurePickerRow";

export interface ProcedurePickerProps {
  library: ProcedureLibraryItem[];
  procedures: Record<string, string>;
  onToggle: (procedure: ProcedureLibraryItem, checked: boolean) => void;
  onUncheckMany?: (procedures: ProcedureLibraryItem[]) => void;
  disabled?: boolean;
  hint?: string;
  leading?: { label: string; control: ReactNode };
  appliedNames?: Record<string, string>;
  tabLabels?: Record<string, string>;
  onTabLabelChange?: (procedureId: string, label: string) => void;
}

export default function ProjectProcedurePicker({
  library,
  procedures,
  onToggle,
  onUncheckMany,
  disabled,
  leading,
  hint,
  appliedNames,
  tabLabels,
  onTabLabelChange,
}: ProcedurePickerProps) {
  const appliedTo = new Map(Object.entries(procedures).map(([dept, id]) => [id, dept]));

  const missing: ProcedureLibraryItem[] = [...appliedTo.keys()]
    .filter((id) => !library.some((p) => p.id === id))
    .map((id) => ({ id, name: appliedNames?.[id] ?? "Quy trình đã gỡ khỏi thư viện", category: "" }) as ProcedureLibraryItem);
  const all = [...library, ...missing];
  const selected = all.filter((p) => appliedTo.has(p.id));

  const [categories, setCategories] = useState<string[]>(() => [
    ...new Set(selected.map((p) => p.category).filter(Boolean)),
  ]);
  const categoryOptions = getProcedureCategories()
    .filter((c) => library.some((p) => p.category === c))
    .map((c) => ({ value: c, label: c }));
  const shown = all.filter((p) => categories.includes(p.category) || (!p.category && appliedTo.has(p.id)));

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
          Quy trình dự án <span className="text-rose-500">*</span>
        </h3>
        <span className="text-[11px] text-slate-500">
          Đã chọn <strong className="text-[#DC2626]">{selected.length}</strong> quy trình
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
      {leading && (
        <label className="block w-full min-w-0 shrink-0 md:w-[320px]">
          <span className="mb-1 block text-[11px] font-medium text-slate-500">{leading.label}</span>
          {leading.control}
        </label>
      )}

      <div className="min-w-0 flex-1">
        <span className="mb-1 block text-[11px] font-medium text-slate-500">Loại quy trình</span>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Select
            aria-label="Loại quy trình"
            mode="multiple"
            placeholder="Chọn loại quy trình"
            value={categories}
            onChange={(v: string[]) => {
              const removed = categories.filter((c) => !v.includes(c));
              const dropped = selected.filter((p) => removed.includes(p.category));
              if (dropped.length > 0) {
                if (onUncheckMany) onUncheckMany(dropped);
                else dropped.forEach((p) => onToggle(p, false));
              }
              setCategories(v);
            }}
            options={categoryOptions}
            menuItemSelectedIcon={null}
            popupMatchSelectWidth
            tagRender={({ value }) =>
              value === categories[0] ? (
                <span className="px-1 text-xs text-slate-700">Đã chọn {categories.length} loại quy trình</span>
              ) : (
                <></>
              )
            }
            optionRender={(option) => (
              <div className="flex items-center gap-2.5 py-0.5">
                <Checkbox checked={categories.includes(String(option.value))} className="pointer-events-none" />
                <span className="truncate text-xs font-medium text-slate-800">{option.label}</span>
              </div>
            )}
            classNames={{
              popup: {
                root: "[&_.ant-select-item-option-selected]:!bg-transparent [&_.ant-select-item-option-active]:!bg-slate-50 [&_.ant-select-item]:!rounded-md",
              },
            }}
            className="w-full shrink-0 text-xs md:w-[320px]"
          />
        </div>
      </div>
      </div>

      {library.length === 0 && missing.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
          Chưa có quy trình nào đang bật trong phân hệ Quy trình.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            <span className="pl-[30px]">Quy trình</span>
            <span>Tên đầu mục (hiện trên tab)</span>
          </div>
          {shown.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              {categories.length === 0
                ? "Chọn loại quy trình để xem các quy trình thuộc loại đó."
                : "Không có quy trình thuộc loại đã chọn."}
            </div>
          ) : (
            <ul role="group" aria-label="Quy trình áp dụng" className="m-0 list-none divide-y divide-slate-100 p-0">
              {shown.map((p) => (
                <ProcedurePickerRow
                  key={p.id}
                  procedure={p}
                  checked={appliedTo.has(p.id)}
                  dept={departmentName(appliedTo.get(p.id) ?? (p.category ? procedureDepartment(p) : undefined) ?? "") || undefined}
                  label={tabLabels?.[p.id]}
                  disabled={disabled}
                  onToggle={(checked) => onToggle(p, checked)}
                  onRename={onTabLabelChange && ((label) => onTabLabelChange(p.id, label))}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {hint && <p className="m-0 mt-2 text-[11px] text-slate-400">{hint}</p>}
    </section>
  );
}
