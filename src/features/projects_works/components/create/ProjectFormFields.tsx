"use client";

import type React from "react";
import { cn } from "@/utils/cn";

const FIELD_GROUP_COLS = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
} as const;

export function FormFieldGroup({
  title,
  cols = 3,
  children,
}: {
  title: string;
  cols?: keyof typeof FIELD_GROUP_COLS;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="m-0 mb-3 border-b border-slate-100 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
        {title}
      </h3>
      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-3.5", FIELD_GROUP_COLS[cols])}>{children}</div>
    </section>
  );
}

export function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="mb-1 block text-[11px] font-medium text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </div>
  );
}
