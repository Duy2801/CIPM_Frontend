"use client";

import { useState } from "react";
import { useProcedureAccess } from "../hooks/useProcedureAccess";
import { useProcedureHistory } from "../hooks/useProcedureHistory";
import ProcedureHistoryPanel from "./ProcedureHistoryPanel";
import ProcedureLibraryTab from "./ProcedureLibraryTab";
import ProcedureScreenTabs, { type ProcedureScreenTab } from "./ProcedureScreenTabs";

export default function ConstructionProceduresScreen() {
  const { canConfigureProcedure, canApproveProcedure, operatorName, operatorRole } = useProcedureAccess();
  const { historyProjects, recordAutoSave } = useProcedureHistory({ name: operatorName, role: operatorRole });
  const [tab, setTab] = useState<ProcedureScreenTab>("procedures");
  const [subPageOpen, setSubPageOpen] = useState(false);

  return (
    <section className="w-full max-w-[2560px] mx-auto space-y-3">
      {!subPageOpen && <ProcedureScreenTabs value={tab} onChange={setTab} />}

      {tab === "history" ? (
        <ProcedureHistoryPanel projects={historyProjects} />
      ) : !canConfigureProcedure ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <p className="m-0 text-sm font-semibold text-slate-700">Bạn chưa có quyền cấu hình quy trình</p>
          <p className="m-0 mt-1 text-xs text-slate-400">Liên hệ quản trị để được cấp quyền cấu hình quy trình thủ tục.</p>
        </div>
      ) : (
        <ProcedureLibraryTab
          actorName={operatorName}
          canApprove={canApproveProcedure}
          onAutoSaved={recordAutoSave}
          onSubPageChange={setSubPageOpen}
        />
      )}
    </section>
  );
}
