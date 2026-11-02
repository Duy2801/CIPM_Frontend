"use client";

import { useState } from "react";
import { Checkbox, Select, Tag } from "@/components/ui";
import { getProcedureCategories } from "@/features/construction-procedures/constants/procedure-categories";
import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import { DEPARTMENT_OPTIONS } from "../constants/project-enums";

/** Phòng ban (theo danh mục dự án) của quy trình; quy trình tự tạo không gắn phòng ban → undefined */
export const procedureDepartment = (procedure: ProcedureLibraryItem) =>
  procedure.department
    ? (DEPARTMENT_OPTIONS.find((d) => isSameDepartment(d.value, procedure.department))?.value ?? procedure.department)
    : undefined;

/** Phòng ban sẽ áp dụng quy trình vừa chọn: phòng ban của quy trình, không có thì phòng ban đầu tiên còn trống */
export const procedureTarget = (procedure: ProcedureLibraryItem, procedures: Record<string, string>) =>
  procedureDepartment(procedure) ??
  DEPARTMENT_OPTIONS.find((d) => !procedures[d.value])?.value ??
  DEPARTMENT_OPTIONS[0].value;

export interface ProcedurePickerProps {
  library: ProcedureLibraryItem[];
  procedures: Record<string, string>;
  onToggle: (procedure: ProcedureLibraryItem, checked: boolean) => void;
  onRetarget: (procedureId: string, department: string) => void;
  disabled?: boolean;
  hint?: string;
}

/** Chọn nhiều quy trình cho dự án (ô chọn có tick); mỗi phòng ban áp dụng một quy trình */
export default function ProjectProcedurePicker({
  library,
  procedures,
  onToggle,
  onRetarget,
  disabled,
  hint = "Mỗi phòng ban áp dụng một quy trình: chọn quy trình khác cùng phòng ban sẽ thay quy trình cũ. Phòng ban phụ trách của dự án lấy theo các quy trình được chọn.",
}: ProcedurePickerProps) {
  // Quy trình đang tích → phòng ban áp dụng
  const appliedTo = new Map(Object.entries(procedures).map(([dept, id]) => [id, dept]));
  // Chọn loại quy trình trước, danh sách tên quy trình lọc theo loại đó
  const [category, setCategory] = useState<string>();
  const categoryOptions = getProcedureCategories()
    .filter((c) => library.some((p) => p.category === c))
    .map((c) => ({ value: c, label: c }));
  const shown = category ? library.filter((p) => p.category === category) : [];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-1.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Quy trình dự án <span className="text-rose-500">*</span>
        </h3>
        <span className="text-[11px] text-slate-500">
          Đã chọn: <strong className="text-[#DC2626]">{appliedTo.size}</strong> quy trình
        </span>
      </div>

      {library.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
          Chưa có quy trình nào đang bật trong phân hệ Quy trình.
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            aria-label="Loại quy trình"
            placeholder="Chọn loại quy trình"
            value={category}
            onChange={(v) => setCategory(v as string)}
            options={categoryOptions}
            disabled={disabled}
            popupMatchSelectWidth
            className="w-full text-xs sm:w-64 sm:shrink-0"
          />
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            placeholder={category ? "Chọn quy trình áp dụng cho dự án..." : "Chọn loại quy trình trước"}
            notFoundContent={
              <span className="text-xs text-slate-400">
                {category ? "Không có quy trình nào thuộc loại này" : "Chọn loại quy trình ở ô bên cạnh trước"}
              </span>
            }
            disabled={disabled}
            value={[...appliedTo.keys()]}
            onChange={(next: string[]) => {
              const current = [...appliedTo.keys()];
              const added = next.find((id) => !current.includes(id));
              const removed = current.find((id) => !next.includes(id));
              const changed = library.find((p) => p.id === (added ?? removed));
              if (changed) onToggle(changed, Boolean(added));
            }}
            menuItemSelectedIcon={null}
            popupMatchSelectWidth
            options={shown.map((procedure) => ({ value: procedure.id, label: procedure.name }))}
            optionRender={(option) => {
              const procedure = library.find((p) => p.id === option.value);
              if (!procedure) return option.label;
              return (
                <div className="flex items-center gap-3 py-1">
                  <Checkbox checked={appliedTo.has(procedure.id)} className="pointer-events-none" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{procedure.name}</span>
                </div>
              );
            }}
            tagRender={({ value, closable, onClose }) => {
              const procedure = library.find((p) => p.id === value);
              return (
                <Tag
                  closable={closable}
                  onClose={onClose}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="!my-0.5 !me-1 !rounded-md !border-red-200 !bg-red-50 !px-2 !py-0.5 text-xs !text-slate-800"
                >
                  {procedure?.name ?? value}
                </Tag>
              );
            }}
            classNames={{
              popup: {
                root: "[&_.ant-select-item-option-selected]:!bg-transparent [&_.ant-select-item-option-active]:!bg-slate-50 [&_.ant-select-item]:!rounded-md",
              },
            }}
            className="min-w-0 flex-1 text-xs"
          />
        </div>
      )}

      {library.length > 0 && (
        <>
          {/* Quy trình không gắn phòng ban: chọn phòng ban áp dụng */}
          {library
            .filter((procedure) => appliedTo.has(procedure.id) && !procedureDepartment(procedure))
            .map((procedure) => (
              <div key={procedure.id} className="mt-2 flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700" title={procedure.name}>
                  {procedure.name}
                </span>
                <Select
                  size="small"
                  aria-label={`Phòng ban áp dụng ${procedure.name}`}
                  value={appliedTo.get(procedure.id)}
                  disabled={disabled}
                  onChange={(v) => onRetarget(procedure.id, v as string)}
                  options={DEPARTMENT_OPTIONS.map((d) => ({ value: d.value, label: `Áp dụng cho: ${d.value}` }))}
                  className="w-72 text-xs"
                />
              </div>
            ))}
        </>
      )}
      {hint && <p className="m-0 mt-1.5 text-[11px] text-slate-400">{hint}</p>}
    </section>
  );
}
