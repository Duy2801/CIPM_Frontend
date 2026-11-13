"use client";

import type React from "react";
import { cn } from "@/utils/cn";

const FIELD_GROUP_COLS = {
  2: "sm:grid-cols-2 xl:grid-cols-4",
  3: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  even3: "sm:grid-cols-3",
  even2: "sm:grid-cols-2",
} as const;

export default function ProjectInfoFieldGroup({
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
      <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">{title}</h3>
      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          "[&>*]:min-h-[52px] [&>*]:rounded-lg [&>*]:border [&>*]:border-slate-100 [&>*]:bg-slate-50/70 [&>*]:px-3 [&>*]:py-2",
          FIELD_GROUP_COLS[cols],
        )}
      >
        {children}
      </div>
    </section>
  );
}
