"use client";

import type { ProcedureStep, StepChange } from "../types/procedure.types";
import type { ProcedureLibraryItem } from "../utils/procedure-library";
import ProcedurePageHeader from "./ProcedurePageHeader";
import ProcedureReviewAction from "./ProcedureReviewAction";
import ProcedureStepEditor from "./ProcedureStepEditor";

interface ProcedureDetailPageProps {
  procedure: ProcedureLibraryItem;
  actorName: string;
  canApprove: boolean;
  onBack: () => void;
  onChanged: () => void;
  onAutoSave: (steps: ProcedureStep[], changes: StepChange[]) => void;
}

export default function ProcedureDetailPage({
  procedure,
  actorName,
  canApprove,
  onBack,
  onChanged,
  onAutoSave,
}: ProcedureDetailPageProps) {
  return (
    <div className="space-y-3">
      <ProcedurePageHeader
        title={
          <>
            Chi tiết quy trình <span className="text-[#DC2626]">{procedure.name}</span>
          </>
        }
        subtitle={procedure.department}
        onBack={onBack}
        actions={
          <>
            {procedure.category && (
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Loại quy trình</div>
                <div className="text-[13px] font-semibold text-slate-700">{procedure.category}</div>
              </div>
            )}
            <ProcedureReviewAction
              procedure={procedure}
              actorName={actorName}
              canApprove={canApprove}
              onChanged={onChanged}
            />
          </>
        }
      />

      <ProcedureStepEditor
        key={procedure.id}
        steps={procedure.steps}
        procedureId={procedure.id}
        procedureName={procedure.name}
        onAutoSave={onAutoSave}
      />
    </div>
  );
}
