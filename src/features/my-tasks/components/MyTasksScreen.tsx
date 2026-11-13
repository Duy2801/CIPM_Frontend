"use client";

import { useEffect } from "react";
import { useMyTaskStore } from "../hooks/useMyTaskStore";
import MyTaskBoard from "./MyTaskBoard";
import MyTaskDrawer from "./MyTaskDrawer";
import MyTaskReasonModal from "./MyTaskReasonModal";
import MyTaskStatsChart from "./MyTaskStatsChart";

export default function MyTasksScreen({ projectId, stepId }: { projectId?: string; stepId?: string }) {
  const opened = useMyTaskStore((s) => s.opened);
  const reason = useMyTaskStore((s) => s.reason);
  const openTask = useMyTaskStore((s) => s.openTask);
  const closeTask = useMyTaskStore((s) => s.closeTask);
  const closeReason = useMyTaskStore((s) => s.closeReason);
  const reset = useMyTaskStore((s) => s.reset);

  useEffect(() => reset, [reset]);

  useEffect(() => {
    if (projectId && stepId) openTask({ projectId, stepId });
  }, [projectId, stepId, openTask]);

  const handleClose = () => {
    closeTask();
    if (projectId || stepId) window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-60px-28px)] min-h-[560px] w-full max-w-[2560px] flex-col gap-4 sm:h-[calc(100dvh-60px-40px)] lg:h-[calc(100dvh-60px-48px)] 2xl:h-[calc(100dvh-60px-64px)]">
      <MyTaskStatsChart />
      <MyTaskBoard />
      <MyTaskDrawer open={Boolean(opened)} projectId={opened?.projectId} stepId={opened?.stepId} onClose={handleClose} />
      <MyTaskReasonModal
        open={Boolean(reason)}
        kind={reason?.kind}
        projectId={reason?.projectId}
        stepId={reason?.stepId}
        onClose={closeReason}
      />
    </div>
  );
}
