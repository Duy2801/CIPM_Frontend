import type { ApprovalEvent, Disbursement } from "../types/finance.types.ts";

export type ApprovalStageState = "done" | "rejected" | "current" | "waiting";

interface ApprovalStageViewModel {
  state: ApprovalStageState;
  event?: ApprovalEvent;
  note?: string;
}

export function getApprovalStageViewModel(
  disbursement: Pick<Disbursement, "status" | "approvals">,
  role: string,
): ApprovalStageViewModel {
  const events = disbursement.approvals.filter((item) => item.role === role);
  const event = events.at(-1);
  const isCurrent =
    (role === "Kế toán trưởng" && disbursement.status === "PENDING_CHIEF") ||
    (role === "Giám đốc" && disbursement.status === "PENDING_DIRECTOR");

  const state: ApprovalStageState = isCurrent
    ? "current"
    : event?.action === "Từ chối"
      ? "rejected"
      : event
        ? "done"
        : "waiting";

  return {
    state,
    event,
    note: state === "rejected" ? undefined : event?.note,
  };
}
