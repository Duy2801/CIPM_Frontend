"use client";

import { Select } from "@/components/ui";
import { DropdownAddOption } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { useCustomOptions } from "../../hooks/useCustomOptions";
import { DROPDOWN_LIST_HEIGHT, sameText } from "../../utils/custom-options";

type Option = { value: string; label: string };

interface CustomOptionSelectProps {
  storageKey: string;
  baseOptions: readonly Option[];
  value?: string;
  onChange: (value: string) => void;
  addPlaceholder: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function CustomOptionSelect({
  storageKey,
  baseOptions,
  value,
  onChange,
  addPlaceholder,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CustomOptionSelectProps) {
  const { custom, add } = useCustomOptions(storageKey);
  const options: Option[] = [
    ...baseOptions,
    ...custom.filter((c) => !baseOptions.some((o) => sameText(o.label, c))).map((c) => ({ value: c, label: c })),
  ];
  if (value && !options.some((o) => o.value === value)) options.push({ value, label: value });

  return (
    <Select
      aria-label={ariaLabel}
      showSearch
      optionFilterProp="label"
      placeholder={placeholder}
      value={value || undefined}
      disabled={disabled}
      onChange={(v) => onChange(v as string)}
      options={options}
      listHeight={DROPDOWN_LIST_HEIGHT}
      className={cn("w-full text-xs", className)}
      popupRender={(menu) => (
        <>
          {menu}
          <DropdownAddOption
            placeholder={addPlaceholder}
            isDuplicate={(name) => options.some((o) => sameText(o.label, name))}
            onAdd={async (name) => {
              const label = name.trim();
              add(label);
              onChange(label);
              return true;
            }}
          />
        </>
      )}
    />
  );
}
