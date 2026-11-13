"use client";

import { ReasonModal } from "@/components/workspace";
import { DECLINE_REASON_PRESETS, INCIDENT_REASON_PRESETS, REJECT_REASON_PRESETS } from "@/shared/my-tasks/constants/my-task-tabs";
import { useMyTaskActions } from "../hooks/useMyTaskActions";
import { useMyTask } from "@/shared/my-tasks/hooks/useMyTaskQueries";
import type { MyTaskReasonKind } from "@/shared/my-tasks/hooks/useMyTaskStore";

const REASON_TEXT: Record<
  MyTaskReasonKind,
  { title: string; label: string; confirmText: string; presets?: string[]; placeholder?: string; optional?: boolean }
> = {
  reject: { title: "Từ chối kết quả bước", label: "Lý do từ chối", confirmText: "Từ chối", presets: REJECT_REASON_PRESETS },
  incident: { title: "Báo cáo sự cố", label: "Mô tả sự cố", confirmText: "Gửi báo cáo", presets: INCIDENT_REASON_PRESETS },
  decline: { title: "Từ chối việc", label: "Lý do từ chối", confirmText: "Từ chối", presets: DECLINE_REASON_PRESETS },
  return: {
    title: "Hoàn trả việc",
    label: "Lý do hoàn trả",
    confirmText: "Hoàn trả",
    placeholder: "Nhập lý do hoàn trả...",
    optional: true,
  },
};

interface MyTaskReasonModalProps {
  open: boolean;
  kind?: MyTaskReasonKind;
  projectId?: string;
  stepId?: string;
  onClose: () => void;
}

export default function MyTaskReasonModal({ open, kind = "reject", projectId, stepId, onClose }: MyTaskReasonModalProps) {
  const ref = projectId && stepId ? { projectId, stepId } : null;
  const task = useMyTask(ref);
  const { confirmReason } = useMyTaskActions();
  const text = REASON_TEXT[kind];

  const summary = task && (
    <span>
      <strong>
        {task.step.code} · {task.step.name}
      </strong>
      {kind === "reject" && ` — ${task.step.assignedTo || "người thực hiện"} · ${task.projectName}`}
      {kind === "incident" && ` — ${task.projectName}`}
      {kind === "decline" && " — việc sẽ được trả về Tổ trưởng để giao người khác."}
    </span>
  );

  return (
    <ReasonModal
      open={open && Boolean(task)}
      title={text.title}
      summary={summary}
      label={text.label}
      placeholder={text.placeholder}
      confirmText={text.confirmText}
      presetReasons={text.presets}
      optional={text.optional}
      onClose={onClose}
      onConfirm={(reason) => (ref ? confirmReason(ref, kind, reason) : Promise.resolve(false))}
    />
  );
}
