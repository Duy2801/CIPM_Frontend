"use client";

import { useState } from "react";
import { useReportTypes } from "../hooks/useReportQueries";
import ReportAddTypeModal from "./ReportAddTypeModal";
import ReportTypeCard from "./ReportTypeCard";

export default function ReportTypeGrid({ onOpen }: { onOpen: (typeId: string) => void }) {
  const types = useReportTypes();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {types.map((type) => (
          <ReportTypeCard key={type.id} typeId={type.id} onOpen={onOpen} />
        ))}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 text-sm font-semibold text-slate-500 transition-colors hover:border-[#DC2626]/50 hover:text-[#DC2626]"
        >
          Thêm loại báo cáo
        </button>
      </div>
      <ReportAddTypeModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
