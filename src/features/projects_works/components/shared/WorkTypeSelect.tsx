"use client";

import { useState } from "react";
import { Select } from "@/components/ui";
import StaffFormAddOption from "@/features/personnel-assignment/components/StaffFormAddOption";
import { cn } from "@/utils/cn";
import { WORK_TYPE_OPTIONS } from "../../constants/project-enums";
import type { ProjectWorkType } from "../../types/project.types";

const WORK_TYPE_STORAGE_KEY = "cipm_custom_work_types";

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function loadCustomWorkTypes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(WORK_TYPE_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveCustomWorkTypes(list: string[]) {
  try {
    localStorage.setItem(WORK_TYPE_STORAGE_KEY, JSON.stringify(list));
  } catch {
  }
  return list;
}

export default function WorkTypeSelect({
  value,
  onChange,
  disabled,
  placeholder = "— Chọn loại công trình —",
  className,
}: {
  value?: string;
  onChange: (value: ProjectWorkType) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [custom, setCustom] = useState(loadCustomWorkTypes);
  const all = [...WORK_TYPE_OPTIONS, ...custom.filter((c) => !WORK_TYPE_OPTIONS.some((t) => sameText(t, c)))];
  if (value && !all.some((t) => sameText(t, value))) all.push(value);
  const options = all.map((t) => ({ value: t, label: t }));

  return (
    <Select
      aria-label="Loại dự án"
      showSearch
      optionFilterProp="label"
      placeholder={placeholder}
      value={value || undefined}
      disabled={disabled}
      onChange={(v) => onChange(v as ProjectWorkType)}
      options={options}
      listHeight={5 * 32}
      className={cn("w-full text-xs", className)}
      popupRender={(menu) => (
        <>
          {menu}
          <StaffFormAddOption
            placeholder="Nhập loại dự án mới..."
            isDuplicate={(name) => options.some((o) => sameText(o.label, name))}
            onAdd={async (name) => {
              const label = name.trim();
              setCustom((prev) => saveCustomWorkTypes([...prev, label]));
              onChange(label as ProjectWorkType);
              return true;
            }}
          />
        </>
      )}
    />
  );
}
