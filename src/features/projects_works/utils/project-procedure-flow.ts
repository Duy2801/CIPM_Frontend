/**
 * project-procedure-flow.ts — Luồng xử lý quy trình của dự án (cùng quy tắc với phân hệ Quy trình dự án)
 *
 * Cấp bước:      Tổ trưởng giao việc → Người thực hiện làm → Nộp kết quả (kèm hồ sơ, Quy tắc 10)
 *                → Tổ trưởng duyệt (Hoàn thành) hoặc Từ chối (kèm lý do) → nộp lại.
 * Cấp giai đoạn: Khi mọi bước của giai đoạn đã xong → Ban Giám đốc nghiệm thu hoặc yêu cầu rà soát.
 */

import type {
  ProcedureStep,
  StageApprovalStatus,
} from "../../construction-procedures/types/procedure.types.ts";
import { isHeadingStep } from "../../construction-procedures/utils/procedure-rules.ts";

export type StepFlowKey =
  | "DISABLED"
  | "SKIPPED"
  | "UNASSIGNED"
  | "IN_PROGRESS"
  | "RETURNED"
  | "AWAITING_APPROVAL"
  | "COMPLETED";

/** Vị trí của một bước trong luồng xử lý — đã giao người thực hiện là đang xử lý, không có bước "bắt đầu" riêng */
export function getStepFlow(step: ProcedureStep): StepFlowKey {
  if (!step.isEnabled || step.status === "DISABLED") return "DISABLED";
  if (step.status === "SKIPPED") return "SKIPPED";
  if (step.status === "COMPLETED") return "COMPLETED";
  if (step.submissionStatus === "SUBMITTED") return "AWAITING_APPROVAL";
  if (step.submissionStatus === "REJECTED") return "RETURNED";
  return step.assignedTo || step.status === "IN_PROGRESS" ? "IN_PROGRESS" : "UNASSIGNED";
}

/** Bước chưa bắt đầu đã đủ thông tin (người thực hiện, ngày bắt đầu và kết thúc kế hoạch) thì tự chuyển sang thực hiện */
export function isReadyToStart(step: ProcedureStep): boolean {
  return (
    step.status === "NOT_STARTED" &&
    step.isEnabled &&
    Boolean(step.assignedTo && step.startDatePlanned && step.endDatePlanned)
  );
}

export type StageState = "IN_PROGRESS" | "AWAITING_DIRECTOR" | "APPROVED" | "RETURNED";

export interface StageSummary {
  code: string;
  title: string;
  /** Khóa lưu quyết định của BGĐ: tách theo phòng ban vì mã giai đoạn (I, II...) trùng giữa các quy trình */
  approvalKey: string;
  /** Các bước việc của giai đoạn (bỏ mục lớn đã có bước con), theo thứ tự quy trình */
  steps: ProcedureStep[];
  total: number;
  done: number;
  awaitingApproval: number;
  returned: number;
  state: StageState;
  approval?: StageApprovalStatus;
}

export const stageApprovalKey = (department: string, groupCode: string) => `${department}::${groupCode}`;

/**
 * Gom các bước của một phòng ban theo giai đoạn.
 * Bước tắt (không áp dụng) vẫn liệt kê nhưng không tính vào tiến độ giai đoạn.
 */
export function groupStepsByStage(
  department: string,
  deptSteps: ProcedureStep[],
  stageApprovals: Record<string, StageApprovalStatus> = {},
): StageSummary[] {
  const ordered = [...deptSteps].sort((a, b) => a.order - b.order);
  const stages = new Map<string, { title: string; steps: ProcedureStep[] }>();
  for (const step of ordered) {
    const stage = stages.get(step.groupCode) ?? { title: step.groupTitle, steps: [] };
    if (!isHeadingStep(step, ordered)) stage.steps.push(step);
    stages.set(step.groupCode, stage);
  }

  return [...stages.entries()].map(([code, { title, steps }]) => {
    const flows = steps.map(getStepFlow);
    const active = flows.filter((f) => f !== "DISABLED");
    const done = active.filter((f) => f === "COMPLETED" || f === "SKIPPED").length;
    const approvalKey = stageApprovalKey(department, code);
    const approval = stageApprovals[approvalKey] ?? stageApprovals[title];
    const allDone = active.length > 0 && done === active.length;

    let state: StageState = "IN_PROGRESS";
    if (approval?.status === "REJECTED") state = "RETURNED";
    else if (allDone) state = approval?.status === "APPROVED" ? "APPROVED" : "AWAITING_DIRECTOR";

    return {
      code,
      title,
      approvalKey,
      steps,
      total: active.length,
      done,
      awaitingApproval: flows.filter((f) => f === "AWAITING_APPROVAL").length,
      returned: flows.filter((f) => f === "RETURNED").length,
      state,
      approval,
    };
  });
}
