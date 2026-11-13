"use client";

import { formatDateVi } from "@/utils/date";
import { useMyTask } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import MyTaskSection, { MyTaskFact } from "./MyTaskSection";

const date = (value?: string) => (value ? formatDateVi(value) : "—");

interface MyTaskOverviewProps {
  projectId: string;
  stepId: string;
}

export default function MyTaskOverview({ projectId, stepId }: MyTaskOverviewProps) {
  const task = useMyTask({ projectId, stepId });
  if (!task) return null;
  const { step } = task;
  const approval =
    task.flow === "COMPLETED" && step.approvedBy
      ? `${step.approvedBy} · ${date(step.approvedAt)}`
      : task.flow === "AWAITING_APPROVAL"
        ? "Đang chờ duyệt"
        : "—";

  return (
    <>
      <MyTaskSection title="Công việc">
        <MyTaskFact label="Dự án" value={task.projectName} wide />
        <MyTaskFact label="Quy trình" value={task.procedureName} />
        <MyTaskFact label="Giai đoạn" value={`${step.groupCode}. ${step.groupTitle}`} />
        <MyTaskFact label="Người thực hiện" value={step.assignedTo || "—"} wide />
        <MyTaskFact label="Bắt đầu kế hoạch" value={date(step.startDatePlanned)} />
        <MyTaskFact label="Hạn hoàn thành" value={date(step.endDatePlanned)} />
      </MyTaskSection>

      <MyTaskSection title="Nộp & duyệt">
        <MyTaskFact
          label="Nộp kết quả"
          value={step.submittedBy ? `${step.submittedBy} · ${date(step.submittedAt)}` : "Chưa nộp"}
        />
        <MyTaskFact label="Duyệt" value={approval} />
        {step.rejectedBy && <MyTaskFact label="Từ chối" value={`${step.rejectedBy} · ${date(step.rejectedAt)}`} />}
      </MyTaskSection>

      {step.incidentReason && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <strong className="mb-0.5 block">
            Sự cố{step.incidentReportedBy ? ` · ${step.incidentReportedBy}` : ""}
            {step.incidentReportedAt ? ` · ${date(step.incidentReportedAt)}` : ""}
          </strong>
          {step.incidentReason}
        </div>
      )}

      {task.flow === "RETURNED" && step.rejectionReason && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <strong className="mb-0.5 block">Bị từ chối, yêu cầu làm lại:</strong>
          {step.rejectionReason}
        </div>
      )}
    </>
  );
}
