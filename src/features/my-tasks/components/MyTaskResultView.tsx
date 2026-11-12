"use client";

import { useMyTask } from "../hooks/useMyTaskQueries";
import MyTaskAttachmentList from "./MyTaskAttachmentList";
import { MyTaskEmpty, MyTaskHeading } from "./MyTaskSection";

interface MyTaskResultViewProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskResultView({ projectId, stepId }: MyTaskResultViewProps) {
  const step = useMyTask({ projectId, stepId })?.step;
  if (!step) return null;

  return (
    <>
      <section>
        <MyTaskHeading>Ghi chú</MyTaskHeading>
        {step.submissionNote ? (
          <p className="m-0 whitespace-pre-line rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700">
            {step.submissionNote}
          </p>
        ) : (
          <MyTaskEmpty>Chưa có ghi chú</MyTaskEmpty>
        )}
      </section>
      <section>
        <MyTaskHeading>Hồ sơ đính kèm{step.attachments.length > 0 && ` (${step.attachments.length})`}</MyTaskHeading>
        {step.attachments.length > 0 ? (
          <MyTaskAttachmentList projectId={projectId} stepId={stepId} />
        ) : (
          <MyTaskEmpty>Chưa có hồ sơ</MyTaskEmpty>
        )}
      </section>
    </>
  );
}
