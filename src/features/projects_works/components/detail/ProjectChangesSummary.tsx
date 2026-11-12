"use client";

import type { ProcedureDraft } from "../../hooks/useProcedureDraft";
import type { FieldChange } from "../../hooks/useProjectInfoDraft";

export default function ProjectChangesSummary({
  projectCode,
  fieldChanges,
  procedures,
}: {
  projectCode: string;
  fieldChanges: FieldChange[];
  procedures: ProcedureDraft;
}) {
  const total = fieldChanges.length + procedures.changeCount;
  return (
    <div className="space-y-2.5 text-xs">
      <p className="m-0 text-slate-600">
        Bạn có đồng ý cập nhật {total} thay đổi sau cho dự án <strong className="text-slate-900">{projectCode}</strong>?
      </p>
      <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
        {fieldChanges.map((c) => (
          <div key={c.label} className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-semibold text-slate-700">{c.label}:</span>
            <span className="text-slate-500 line-through">{c.from || "Trống"}</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-[#DC2626]">{c.to || "Trống"}</span>
          </div>
        ))}
        {procedures.added.map((id) => (
          <div key={`add-${id}`}>
            <span className="font-semibold text-slate-700">Áp dụng quy trình:</span>{" "}
            <span className="font-semibold text-emerald-700">{procedures.nameOf(id)}</span>
          </div>
        ))}
        {procedures.removed.map(([dept, id]) => (
          <div key={`rm-${dept}`}>
            <span className="font-semibold text-slate-700">Gỡ quy trình:</span>{" "}
            <span className="font-semibold text-[#DC2626]">{procedures.nameOf(id)}</span>{" "}
            <span className="text-slate-500">(xóa các bước và tiến độ)</span>
          </div>
        ))}
        {procedures.renamed.map(([id, label]) => (
          <div key={`rn-${id}`} className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-semibold text-slate-700">Tên tab {procedures.nameOf(id)}:</span>
            <span className="text-slate-500 line-through">{procedures.savedLabels[id] || "Mặc định"}</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-[#DC2626]">{label || "Mặc định"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
