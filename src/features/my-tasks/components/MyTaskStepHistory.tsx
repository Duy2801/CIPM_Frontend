"use client";

import ActivityTimeline from "@/features/personnel-assignment/components/ActivityTimeline";
import { useMyTaskHistory } from "../hooks/useMyTaskQueries";
import { MyTaskHeading } from "./MyTaskSection";

interface MyTaskStepHistoryProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskStepHistory({ projectId, stepId }: MyTaskStepHistoryProps) {
  const { data: entries = [] } = useMyTaskHistory({ projectId, stepId });

  return (
    <section>
      <MyTaskHeading>Nhật ký bước</MyTaskHeading>
      <ActivityTimeline entries={entries} pageSize={8} emptyText="Chưa có thao tác nào" />
    </section>
  );
}
