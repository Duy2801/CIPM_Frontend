"use client";

import { useRef } from "react";
import { FolderAddOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";
import {
  ACTION_COL,
  ASSIGNEE_COL,
  DATE_COL,
  EMAIL_COL,
  STICKY_HEADER_TOP,
  SUPERVISOR_COL,
  TYPE_COL,
} from "../constants/step-table";
import type { StepInlineAdd } from "../hooks/useStepInlineAdd";
import type { StepRowEdit } from "../hooks/useStepRowEdit";
import type { StepStaff } from "../hooks/useStepStaff";
import type { StepTree } from "../hooks/useStepTree";
import { useStickyScrollbar } from "../hooks/useStickyScrollbar";
import type { ProcedureStep } from "../types/procedure.types";
import { buildDurationFields, getSpanDays } from "../utils/step-duration";
import StepInlineAddRow from "./StepInlineAddRow";
import StepTableRow from "./StepTableRow";

const TABLE_MIN_WIDTH = "min-w-[1080px]";

interface StepTableProps {
  steps: ProcedureStep[];
  tree: StepTree;
  edit: StepRowEdit;
  adding: StepInlineAdd;
  staff: StepStaff;
  emptyTitle?: string;
  addLockedReason?: string;
  stickyBottom: number;
  hidden?: boolean;
  onRemoveStep: (step: ProcedureStep) => void;
}

export default function StepTable({
  steps,
  tree,
  edit,
  adding,
  staff,
  emptyTitle,
  addLockedReason,
  stickyBottom,
  hidden,
  onRemoveStep,
}: StepTableProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const { bodyRef, barRef, scrollWidth, overflows, syncFromBody, syncFromBar } = useStickyScrollbar();

  // Số ngày tính theo cả số đang gõ (dòng đang sửa, dòng thêm bước con) để bước cha nhảy ngay, chưa cần lưu
  const previewSteps = adding.withDraftDays(
    edit.editingStepId
      ? steps.map((s) => (s.id === edit.editingStepId ? { ...s, ...buildDurationFields(edit.draft.days) } : s))
      : steps,
  );

  const lastCodeForActiveParent = adding.activeParent
    ? tree.visibleSteps.reduce(
        (last, s) => (s.code === adding.activeParent || s.code.startsWith(`${adding.activeParent}.`) ? s.code : last),
        adding.activeParent,
      )
    : null;

  return (
    <div className={`flex-1 flex flex-col rounded-lg border border-slate-200 bg-white min-h-0 ${hidden ? "hidden" : ""}`}>
      <div
        ref={headerScrollRef}
        className="sticky z-10 shrink-0 overflow-hidden rounded-t-lg border-b border-slate-200 bg-slate-100"
        style={{ top: STICKY_HEADER_TOP }}
      >
        <div
          className={`flex ${TABLE_MIN_WIDTH} items-center gap-3 border-l-[3px] border-l-transparent px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600`}
        >
          <div className="w-24 shrink-0 pl-1 text-left">Mã bước</div>
          <div className="min-w-0 flex-1">Tên bước / Bước con</div>
          <div className={ASSIGNEE_COL}>Người thực hiện</div>
          <div className={`${EMAIL_COL} pl-2`}>Email</div>
          <div className={SUPERVISOR_COL}>Người giám sát</div>
          <div className={`${DATE_COL} hidden sm:block text-center`}>Thời gian</div>
          <div className={`${TYPE_COL} text-center`}>Loại</div>
          <div className={`${ACTION_COL} text-center`}>Thao tác</div>
        </div>
      </div>

      <div
        ref={bodyRef}
        onScroll={(e) => {
          if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
          syncFromBody();
        }}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className={`flex h-full ${TABLE_MIN_WIDTH} flex-col`}>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin] min-h-0">
            {steps.length === 0 && emptyTitle ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626] mb-3 border border-red-100 shadow-2xs">
                  <FolderAddOutlined className="text-2xl" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{emptyTitle}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  Hãy thêm bước chính (I, II...) và bước con để hoàn thiện quy trình:
                </p>
                <Button
                  intent="outline"
                  scale="compact"
                  icon={<PlusOutlined />}
                  onClick={adding.toggleMain}
                  className="font-semibold h-8.5 px-4 text-slate-700 hover:text-[#DC2626] hover:border-[#DC2626]"
                >
                  Thêm bước chính
                </Button>
              </div>
            ) : (
              tree.visibleSteps.map((step) => (
                <div key={step.id}>
                  <StepTableRow
                    step={step}
                    flow={tree.getFlowProps(step)}
                    spanDays={getSpanDays(previewSteps, step)}
                    durationFromChildren={previewSteps.some((s) => s.code.startsWith(`${step.code}.`))}
                    edit={edit}
                    staff={staff}
                    isAddingChild={adding.activeParent === step.code}
                    onToggleExpanded={() => tree.toggleExpanded(step.code)}
                    onAddChild={() => adding.toggleSub(step.code)}
                    onRemove={() => onRemoveStep(step)}
                  />
                  {adding.activeParent && step.code === lastCodeForActiveParent && (
                    <StepInlineAddRow
                      parentCode={adding.activeParent}
                      draft={adding.subDraft}
                      staffOptions={staff.staffOptions}
                      email={staff.emailOf(adding.subDraft.assignee)}
                      onChange={adding.updateSub}
                      onSave={adding.saveSub}
                      onCancel={adding.closeSub}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {adding.isAddingMain && (
            <StepInlineAddRow
              draft={adding.mainDraft}
              staffOptions={staff.staffOptions}
              email={staff.emailOf(adding.mainDraft.assignee)}
              onChange={adding.updateMain}
              onSave={() => adding.saveMain()}
              onCancel={adding.closeMain}
            />
          )}
        </div>
      </div>

      {!adding.isAddingMain && (
        <div className="border-t border-slate-100 p-3">
          <Button
            type="dashed"
            block
            icon={<PlusOutlined className="text-xs" />}
            disabled={!!addLockedReason}
            onClick={adding.toggleMain}
            className={
              addLockedReason
                ? "!h-12 text-sm"
                : "!h-12 !border-red-200 !bg-red-50/30 text-sm font-semibold !text-[#DC2626] hover:!border-[#DC2626] hover:!bg-red-50/70"
            }
          >
            {addLockedReason ?? "Thêm bước chính"}
          </Button>
        </div>
      )}

      {overflows && (
        <div
          ref={barRef}
          onScroll={syncFromBar}
          className="sticky z-10 shrink-0 overflow-x-auto overflow-y-hidden rounded-b-lg border-t border-slate-200 bg-white"
          style={{ bottom: stickyBottom }}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}
    </div>
  );
}
