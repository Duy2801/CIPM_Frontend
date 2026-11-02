"use client";

import { Input } from "@/components/ui";

interface ProcedureVersionInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ProcedureVersionInput({ value, onChange, className }: ProcedureVersionInputProps) {
  return (
    <Input
      aria-label="Version quy trình"
      placeholder="VD: 1.0"
      value={value}
      maxLength={20}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "h-9 w-32 text-xs"}
    />
  );
}
