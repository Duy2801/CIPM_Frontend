"use client";

import { useState, type ReactNode } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Checkbox, Input, Select, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { getProcedureCategories } from "@/features/construction-procedures/constants/procedure-categories";
import { isSameDepartment } from "@/features/construction-procedures/constants/procedure-department-templates";
import type { ProcedureLibraryItem } from "@/features/construction-procedures/utils/procedure-library";
import { DEPARTMENT_OPTIONS } from "../constants/project-enums";

/** Số loại quy trình hiện thành thẻ bên phải ô chọn; nhiều hơn thì gộp "+N" */
const MAX_VISIBLE_CATEGORIES = 3;

/** Phòng ban (theo danh mục dự án) của quy trình; quy trình tự tạo không gắn phòng ban → undefined */
export const procedureDepartment = (procedure: ProcedureLibraryItem) =>
  procedure.department
    ? (DEPARTMENT_OPTIONS.find((d) => isSameDepartment(d.value, procedure.department))?.value ?? procedure.department)
    : undefined;

/**
 * Chỗ áp dụng quy trình vừa chọn (khóa theo phòng ban): phòng ban của quy trình, không có thì phòng ban đầu tiên còn trống.
 * Một phòng ban áp dụng được nhiều quy trình: phòng ban đã có quy trình khác thì dùng "Tên phòng ban (2)", "(3)"...
 */
export const procedureTarget = (procedure: ProcedureLibraryItem, procedures: Record<string, string>) => {
  const dept =
    procedureDepartment(procedure) ??
    DEPARTMENT_OPTIONS.find((d) => !procedures[d.value])?.value ??
    DEPARTMENT_OPTIONS[0].value;
  if (!procedures[dept] || procedures[dept] === procedure.id) return dept;
  for (let n = 2; ; n++) {
    const key = `${dept} (${n})`;
    if (!procedures[key] || procedures[key] === procedure.id) return key;
  }
};

/** Tên phòng ban để hiển thị (bỏ hậu tố "(2)" của quy trình thứ hai trở đi) */
export const departmentName = (key: string) => key.replace(/\s\(\d+\)$/, "");

/** Tên tab mặc định: bỏ chữ "Quy trình" ở đầu ("Quy trình giám sát" → "Giám sát") */
export function shortProcedureLabel(name: string): string {
  const rest = name.replace(/^\s*quy\s+trình\s*/i, "").trim();
  return rest ? rest.charAt(0).toLocaleUpperCase("vi") + rest.slice(1) : name;
}

export interface ProcedurePickerProps {
  library: ProcedureLibraryItem[];
  procedures: Record<string, string>;
  onToggle: (procedure: ProcedureLibraryItem, checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
  /** Ô đặt đầu hàng lọc (VD: Loại dự án) */
  leading?: { label: string; control: ReactNode };
  /** Tên của quy trình đang áp dụng nhưng không còn trong thư viện (id → tên) */
  appliedNames?: Record<string, string>;
  /** Tên đầu mục (tên tab) đã đặt cho quy trình (id → tên) */
  tabLabels?: Record<string, string>;
  /** Đổi tên đầu mục; không truyền thì chỉ xem tên tab, không sửa được */
  onTabLabelChange?: (procedureId: string, label: string) => void;
}

/**
 * Chọn quy trình cho dự án, chia 2 bên:
 * - Trái: lọc loại quy trình (tích nhiều) + danh sách quy trình dọc để tích chọn.
 * - Phải: các quy trình đã tích, đặt tên đầu mục → hiện thành tab của dự án.
 */
export default function ProjectProcedurePicker({
  library,
  procedures,
  onToggle,
  disabled,
  leading,
  hint,
  appliedNames,
  tabLabels,
  onTabLabelChange,
}: ProcedurePickerProps) {
  // Quy trình đang tích → phòng ban áp dụng
  const appliedTo = new Map(Object.entries(procedures).map(([dept, id]) => [id, dept]));

  // Quy trình đang áp dụng nhưng không còn trong thư viện: vẫn hiện để bỏ tích được (không hiện mã)
  const missing: ProcedureLibraryItem[] = [...appliedTo.keys()]
    .filter((id) => !library.some((p) => p.id === id))
    .map((id) => ({ id, name: appliedNames?.[id] ?? "Quy trình đã gỡ khỏi thư viện", category: "" }) as ProcedureLibraryItem);
  const all = [...library, ...missing];
  const selected = all.filter((p) => appliedTo.has(p.id));

  // Loại quy trình: tích nhiều; phải chọn loại thì các quy trình thuộc loại đó mới hiện.
  // Mở lại dự án đã áp dụng quy trình: chọn sẵn loại của các quy trình đó để thấy ngay.
  const [categories, setCategories] = useState<string[]>(() => [
    ...new Set(selected.map((p) => p.category).filter(Boolean)),
  ]);
  const categoryOptions = getProcedureCategories()
    .filter((c) => library.some((p) => p.category === c))
    .map((c) => ({ value: c, label: c }));
  // Chỉ hiện quy trình thuộc loại đang chọn; quy trình đã gỡ khỏi thư viện (không có loại) vẫn hiện để bỏ tích được
  const shown = all.filter((p) => categories.includes(p.category) || (!p.category && appliedTo.has(p.id)));

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Quy trình dự án <span className="text-rose-500">*</span>
        </h3>
        <span className="text-[11px] text-slate-500">
          Đã chọn <strong className="text-[#DC2626]">{selected.length}</strong> quy trình
        </span>
      </div>

      {/* Loại dự án + Loại quy trình cùng một hàng; các loại đã tích hiện ngang bên phải ô chọn */}
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
            onChange={(v: string[]) => setCategories(v)}
            options={categoryOptions}
            menuItemSelectedIcon={null}
            popupMatchSelectWidth
            // Trong ô chỉ ghi số loại đã chọn (chữ thường, không thành thẻ); các loại hiện ở bên phải
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
          {categories.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {categories.slice(0, MAX_VISIBLE_CATEGORIES).map((c) => (
                <span
                  key={c}
                  className="inline-flex h-7 items-center gap-2 rounded-sm border border-red-200 bg-red-50 pl-2.5 pr-1.5 text-xs font-medium text-slate-800"
                >
                  {c}
                  <button
                    type="button"
                    aria-label={`Bỏ ${c}`}
                    onClick={() => setCategories((prev) => prev.filter((x) => x !== c))}
                    className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 text-slate-400 hover:bg-red-100 hover:text-[#DC2626]"
                  >
                    <CloseOutlined className="text-[9px]" />
                  </button>
                </span>
              ))}
              {categories.length > MAX_VISIBLE_CATEGORIES && (
                <Tooltip title={categories.slice(MAX_VISIBLE_CATEGORIES).join(", ")}>
                  <span className="inline-flex h-7 cursor-help items-center rounded-sm border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-600">
                    +{categories.length - MAX_VISIBLE_CATEGORIES}
                  </span>
                </Tooltip>
              )}
              <button
                type="button"
                onClick={() => setCategories([])}
                className="ml-1 cursor-pointer border-0 bg-transparent p-0 text-[11px] font-medium text-slate-500 hover:text-[#DC2626] hover:underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Danh sách quy trình: tích dòng nào thì điền tên đầu mục (tên tab) của dòng đó */}
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
                <ProcedureRow
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

/** Một dòng quy trình: [tích] tên quy trình | ô tên đầu mục (chỉ hiện khi đã tích) */
function ProcedureRow({
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
  // Tên tab đang dùng: tên đã đặt, chưa đặt thì tên quy trình rút gọn — hiện sẵn trong ô để sửa
  const current = label || fallback;
  const [draft, setDraft] = useState(current);
  const [synced, setSynced] = useState(current);
  if (synced !== current) {
    setSynced(current);
    setDraft(current);
  }
  const save = () => {
    const next = draft.trim();
    // Xóa trắng → quay về tên mặc định; gõ đúng tên mặc định → không lưu tên riêng
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
