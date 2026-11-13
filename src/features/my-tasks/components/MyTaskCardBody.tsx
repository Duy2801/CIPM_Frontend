"use client";

import type { ReactNode } from "react";
import {
  ApartmentOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  LockOutlined,
  ProjectOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { useMyTask } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import type { MyTask, MyTaskTab } from "@/shared/my-tasks/utils/my-tasks";

const date = (value?: string) => (value ? formatDateVi(value) : "—");

function timeInfo(kind: MyTaskTab, task: MyTask): { label: string; value: string } {
  const { step } = task;
  switch (kind) {
    case "submitted":
    case "review":
      return { label: "Nộp", value: date(step.submittedAt) };
    case "done":
    case "approved":
      return { label: "Duyệt", value: date(step.approvedAt) };
    case "rejected":
      return { label: "Từ chối", value: date(step.rejectedAt) };
    case "incident":
      return { label: "Báo", value: date(step.incidentReportedAt) };
    default:
      return { label: "Hạn", value: date(step.endDatePlanned) };
  }
}

interface MyTaskCardBodyProps {
  kind: MyTaskTab;
  projectId: string;
  stepId: string;
}

export default function MyTaskCardBody({ kind, projectId, stepId }: MyTaskCardBodyProps) {
  const task = useMyTask({ projectId, stepId });
  if (!task) return null;
  const { step } = task;
  const time = timeInfo(kind, task);

  return (
    <>
      <div className="flex items-start gap-1.5">
        <dl className="m-0 min-w-0 flex-1 space-y-1 text-xs">
          <InfoRow icon={<ProjectOutlined />} label="Dự án" value={task.projectName} strong />
          <InfoRow icon={<ApartmentOutlined />} label="Quy trình" value={task.procedureName} />
        </dl>
        {!task.reached && (
          <Tooltip title="Chưa tới lượt — chờ bước trước hoàn thành">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <LockOutlined className="text-xs" />
            </span>
          </Tooltip>
        )}
      </div>

      <div className="mt-2 flex items-start gap-1.5 border-t border-slate-100 pt-2">
        <p className="m-0 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-900 group-hover:text-[#DC2626]">
          <span className="mr-1.5 font-mono text-[12px] font-semibold text-slate-500">{step.code}</span>
          {step.name}
        </p>
        {kind === "returned" && step.rejectionReason && (
          <Tooltip title={`Lý do từ chối: ${step.rejectionReason}`}>
            <ExclamationCircleOutlined className="mt-0.5 shrink-0 cursor-help text-rose-500" />
          </Tooltip>
        )}
        {kind === "incident" && step.incidentReason && (
          <Tooltip title={`Sự cố: ${step.incidentReason}`}>
            <WarningOutlined className="mt-0.5 shrink-0 cursor-help text-orange-500" />
          </Tooltip>
        )}
      </div>

      <dl className="m-0 mt-2 space-y-1 text-xs">
        <InfoRow icon={<FlagOutlined />} label="Giai đoạn" value={step.groupCode} />
        <InfoRow icon={<UserOutlined />} label="Người thực hiện" value={step.assignedTo || "Chưa giao"} />
      </dl>

      {kind === "incident" && step.incidentReason && (
        <p className="m-0 mt-2 line-clamp-2 rounded bg-orange-50 px-2 py-1 text-[11px] text-orange-700" title={step.incidentReason}>
          {step.incidentReason}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 text-[11px]">
        {kind === "accept" && <TurnBadge reached={task.reached} />}
        <span className="ml-auto shrink-0 tabular-nums text-slate-500">
          {time.label} {time.value}
        </span>
      </div>
    </>
  );
}

function TurnBadge({ reached }: { reached: boolean }) {
  return reached ? (
    <span className="inline-block rounded-full bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
      Đang tới lượt
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-500">
      <LockOutlined className="text-[9px]" />
      Chưa tới lượt
    </span>
  );
}

function InfoRow({ icon, label, value, strong }: { icon: ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[11px] text-slate-400" aria-hidden>
        {icon}
      </span>
      <dt className="w-[92px] shrink-0 text-slate-400">{label}</dt>
      <dd className={cn("m-0 min-w-0 flex-1 truncate", strong ? "font-semibold text-slate-800" : "text-slate-600")} title={value}>
        {value}
      </dd>
    </div>
  );
}
