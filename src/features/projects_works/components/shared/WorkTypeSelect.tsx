"use client";

import { WORK_TYPE_OPTIONS } from "../../constants/project-enums";
import type { ProjectWorkType } from "../../types/project.types";
import { WORK_TYPE_STORAGE_KEY } from "../../utils/custom-options";
import CustomOptionSelect from "./CustomOptionSelect";

const BASE_OPTIONS = WORK_TYPE_OPTIONS.map((t) => ({ value: t, label: t }));

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
  return (
    <CustomOptionSelect
      aria-label="Loại dự án"
      storageKey={WORK_TYPE_STORAGE_KEY}
      baseOptions={BASE_OPTIONS}
      value={value}
      onChange={(v) => onChange(v as ProjectWorkType)}
      addPlaceholder="Nhập loại dự án mới..."
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
