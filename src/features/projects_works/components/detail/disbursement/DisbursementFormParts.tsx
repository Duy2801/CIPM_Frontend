"use client";

import type React from "react";

export function FormSection({
  icon,
  title,
  extra,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="m-0 flex items-center gap-2 text-xs font-bold text-[#DC2626]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[13px] text-[#DC2626]">
            {icon}
          </span>
          {title}
        </h4>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <div className="mb-1.5 text-xs font-medium text-slate-600">
      {text}
      {required && <span className="text-[#DC2626]"> *</span>}
    </div>
  );
}

export function ReadonlyField({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
        {label}
        {hint && (
          <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-normal text-slate-500">
            {hint}
          </span>
        )}
      </div>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
        <span className="text-slate-400">{icon}</span>
        <span className="truncate" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}
