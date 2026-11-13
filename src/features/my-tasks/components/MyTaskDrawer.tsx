"use client";

import { Drawer, STANDARD_DRAWER_WIDTH } from "@/components/ui";
import { StepHeading } from "@/components/workspace";
import { useMyTask, useMyTaskAccess } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import MyTaskDrawerFooter from "./MyTaskDrawerFooter";
import MyTaskOverview from "./MyTaskOverview";
import MyTaskResultView from "./MyTaskResultView";
import MyTaskStepHistory from "./MyTaskStepHistory";
import MyTaskWorkSection from "./MyTaskWorkSection";

interface MyTaskDrawerProps {
  open: boolean;
  projectId?: string;
  stepId?: string;
  onClose: () => void;
}

export default function MyTaskDrawer({ open, projectId, stepId, onClose }: MyTaskDrawerProps) {
  const ref = projectId && stepId ? { projectId, stepId } : null;
  const task = useMyTask(ref);
  const access = useMyTaskAccess(ref);
  const hasFooter =
    access.canSubmit ||
    access.canReview ||
    access.canAccept ||
    access.canResolveIncident ||
    access.canGiveBack ||
    access.canReportIncident ||
    access.canDecline;
  const shown = open && task && projectId && stepId ? { projectId, stepId } : null;

  return (
    <Drawer
      showBack
      open={Boolean(shown)}
      width={STANDARD_DRAWER_WIDTH}
      onClose={onClose}
      destroyOnHidden
      className="[&_.ant-drawer-body]:!p-0"
      title={
        shown &&
        task && (
          <StepHeading code={task.step.code} name={task.step.name} />
        )
      }
      footer={shown && hasFooter ? <MyTaskDrawerFooter {...shown} /> : null}
    >
      {shown && (
        <div className="space-y-4 p-5">
          {access.isProxy && task && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Bạn đang <strong>làm hộ</strong> việc của <strong>{task.step.assignedTo || "cán bộ khác"}</strong>. Thao tác sẽ
              được ghi nhận là làm hộ trong nhật ký bước.
            </div>
          )}
          <MyTaskOverview {...shown} />
          {access.canSubmit ? <MyTaskWorkSection key={shown.stepId} {...shown} /> : <MyTaskResultView {...shown} />}
          <MyTaskStepHistory {...shown} />
        </div>
      )}
    </Drawer>
  );
}
