"use client";

import { useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { App } from "antd";
import { Button, toast } from "@/components/ui";
import { STICKY_FOOTER_HEIGHT } from "../constants/step-table";
import { useAutoSavedSteps } from "../hooks/useAutoSavedSteps";
import { useStepInlineAdd } from "../hooks/useStepInlineAdd";
import { useStepRowEdit } from "../hooks/useStepRowEdit";
import { useStepStaff } from "../hooks/useStepStaff";
import { useStepTree } from "../hooks/useStepTree";
import type { ProcedureStep, StepChange } from "@/shared/construction-procedures/types/procedure.types";
import { moveProcedureStepStage } from "@/shared/construction-procedures/services/procedure.service";
import { applyStageOrder } from "@/shared/construction-procedures/utils/step-dependencies";
import { diffSteps } from "../utils/step-diff";
import { withParentRollups } from "@/shared/construction-procedures/utils/step-duration";
import { isDescendantOf } from "../utils/step-tree";
import ProcedureChangeHistory from "./ProcedureChangeHistory";
import ProcedureEditorTabs, { type ProcedureEditorView } from "./ProcedureEditorTabs";
import ProcedureRoadmap from "@/shared/construction-procedures/components/ProcedureRoadmap";
import type { StageMove } from "@/shared/construction-procedures/components/RoadmapStepFlow";
import StepTable from "./StepTable";

interface ProcedureStepEditorProps {
  steps: ProcedureStep[];
  procedureId?: string;
  procedureName?: string;
  /** Loại quy trình (hiện bên phải hàng tab) */
  category?: string;
  onAutoSave?: (steps: ProcedureStep[], changes: StepChange[]) => void;
  onCreate?: (steps: ProcedureStep[]) => void;
  addLockedReason?: string;
}

export default function ProcedureStepEditor({
  steps,
  procedureId,
  procedureName,
  category,
  onAutoSave,
  onCreate,
  addLockedReason,
}: ProcedureStepEditorProps) {
  const { modal } = App.useApp();
  const isCreate = !!onCreate;
  const autoSave = !isCreate && !!procedureId;
  const [view, setView] = useState<ProcedureEditorView>(isCreate ? "table" : "flow");
  const { localSteps, setLocalSteps, hasPendingChanges, acceptSaved } = useAutoSavedSteps(steps, {
    procedureId: autoSave ? procedureId : undefined,
    onAutoSave,
  });

  const confirmChange = (title: string, content: string, onOk: () => void, onCancel?: () => void) => {
    if (!autoSave) {
      onOk();
      return;
    }
    modal.confirm({ title, content, okText: "Đồng ý", cancelText: "Hủy", onOk, onCancel });
  };

  const tree = useStepTree(localSteps);
  const staff = useStepStaff();
  const adding = useStepInlineAdd({ steps: localSteps, setSteps: setLocalSteps, staff, confirmChange, expandTo: tree.expandTo });
  const edit = useStepRowEdit({
    steps: localSteps,
    staff,
    confirmChange,
    onStart: adding.closeSub,
    onUpdate: (stepId, updates) => setLocalSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))),
  });

  const handleChangeStages = async (stages: Map<string, number>, move?: StageMove) => {
    adding.closeSub();
    // Tài khoản thật, không còn phần sửa chờ lưu: đổi lượt bằng API riêng (2.4), backend đánh lại mã
    if (autoSave && procedureId && move && !hasPendingChanges()) {
      try {
        const saved = await moveProcedureStepStage(procedureId, move.stepId, move.drop);
        if (saved) {
          acceptSaved(saved, diffSteps(localSteps, saved));
          return;
        }
      } catch (error) {
        toast.error("Chưa đổi được thứ tự làm", error instanceof Error ? error.message : "Vui lòng thử lại.");
        return;
      }
    }
    setLocalSteps((prev) => applyStageOrder(prev, stages));
  };

  const removeStep = (target: ProcedureStep) => {
    setLocalSteps(
      localSteps
        .filter((s) => s.id !== target.id && !isDescendantOf(s.code, target.code))
        .map((s, idx) => ({ ...s, order: idx + 1 })),
    );
    adding.onStepRemoved(target.code);
  };

  const confirmRemoveStep = (step: ProcedureStep) => {
    const childCount = localSteps.filter((s) => isDescendantOf(s.code, step.code)).length;
    modal.confirm({
      centered: true,
      width: 440,
      icon: null,
      zIndex: 1400,
      title: `Xóa bước [${step.code}] ${step.name}?`,
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          {childCount > 0 && (
            <>
              Bước này có <strong>{childCount}</strong> bước con bên dưới, tất cả sẽ bị xóa cùng.{" "}
            </>
          )}
          {isCreate ? 'Quy trình chỉ được lưu khi bạn bấm "Tạo quy trình".' : "Thay đổi được tự lưu vào quy trình."}
        </p>
      ),
      okText: "Xóa bước",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => removeStep(step),
    });
  };

  const goToFlowStep = () => {
    if (addLockedReason) {
      toast.warning("Chưa nhập tên quy trình", addLockedReason);
      return;
    }
    if (localSteps.length === 0 && !adding.hasPendingMain) {
      toast.warning("Chưa có bước nào", "Thêm ít nhất một bước chính trước khi cấu hình sơ đồ quy trình.");
      return;
    }
    setView("flow");
  };

  const handleCreate = () => {
    const pending = adding.withPending(localSteps);
    adding.closeAll();
    setLocalSteps(pending);
    onCreate?.(withParentRollups(pending));
  };

  const stickyBottom = isCreate ? STICKY_FOOTER_HEIGHT : 0;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className={`flex flex-col px-4 pt-4 ${isCreate ? "" : "pb-4"}`}>
        <div className="flex-1 min-h-0 flex flex-col gap-3 pr-1 pb-2 text-xs">
          <ProcedureEditorTabs
            isCreate={isCreate}
            value={view}
            onChange={(next) => (isCreate && next === "flow" ? goToFlowStep() : setView(next))}
            category={category}
          />

          {view === "flow" && (
            <ProcedureRoadmap
              steps={localSteps}
              stickyBottom={stickyBottom}
              onChangeStages={(stages, description, move) =>
                confirmChange(
                  "Lưu thay đổi thứ tự?",
                  description ?? "Cập nhật thứ tự thực hiện (song song / lần lượt) của các bước.",
                  () => void handleChangeStages(stages, move),
                )
              }
            />
          )}
          {view === "history" && <ProcedureChangeHistory procedureId={procedureId} steps={localSteps} />}

          <StepTable
            hidden={view !== "table"}
            steps={localSteps}
            tree={tree}
            edit={edit}
            adding={adding}
            staff={staff}
            emptyTitle={isCreate ? undefined : `Quy trình "${procedureName ?? ""}" hiện chưa có bước nào`}
            addLockedReason={addLockedReason}
            stickyBottom={stickyBottom}
            onRemoveStep={confirmRemoveStep}
          />
        </div>
      </div>

      {isCreate && (
        <div
          className="sticky bottom-0 z-10 flex items-center justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4"
          style={{ height: STICKY_FOOTER_HEIGHT }}
        >
          {view === "flow" && (
            <Button scale="compact" onClick={() => setView("table")}>
              Quay lại
            </Button>
          )}
          {view === "table" ? (
            <Button intent="primary" scale="compact" className="bg-[#DC2626] border-[#DC2626] text-white" disabled={!!addLockedReason} onClick={goToFlowStep}>
              Cấu hình quy trình
            </Button>
          ) : (
            <Button
              intent="primary"
              scale="compact"
              icon={<SaveOutlined />}
              className="bg-[#DC2626] border-[#DC2626] text-white"
              onClick={handleCreate}
            >
              Tạo quy trình
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
