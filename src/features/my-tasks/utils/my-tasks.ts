/**
 * my-tasks.ts — Gom "Việc cần xử lý" của người đang đăng nhập từ quy trình của mọi dự án.
 *
 * Người thực hiện: việc được giao → nộp kết quả → chờ duyệt → hoàn thành / bị từ chối (nộp lại).
 * Người duyệt (Tổ trưởng / quyền duyệt M3): chờ duyệt → đã duyệt / đã từ chối.
 * Hàm thuần, không phụ thuộc trình duyệt (test được bằng node --test).
 */

import type {
  ProcedureDocument,
  ProcedureHistoryLog,
  ProcedureStep,
  ProjectProcedureData,
} from "../../construction-procedures/types/procedure.types.ts";
import { isHeadingStep } from "../../construction-procedures/utils/procedure-rules.ts";
import { getStepFlow, type StepFlowKey } from "../../projects_works/utils/project-procedure-flow.ts";

export interface MyTask {
  projectId: string;
  projectCode: string;
  projectName: string;
  department: string;
  procedureName: string;
  step: ProcedureStep;
  flow: StepFlowKey;
  /** Hạn kết thúc kế hoạch đã qua mà bước chưa xong */
  overdue: boolean;
}

export type WorkerTab = "todo" | "returned" | "submitted" | "done";
export type ReviewerTab = "review" | "approved" | "rejected";
export type MyTaskTab = WorkerTab | ReviewerTab;

export interface TaskIdentity {
  id?: string;
  name: string;
}

const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

/** Bước được giao cho người này (theo mã cán bộ hoặc họ tên) */
export function isMine(step: ProcedureStep, me: TaskIdentity): boolean {
  if (me.id && step.assignedToId && step.assignedToId === me.id) return true;
  return Boolean(step.assignedTo && normalize(step.assignedTo) === normalize(me.name));
}

const isMe = (name: string | undefined, me: TaskIdentity) => Boolean(name && normalize(name) === normalize(me.name));

/** Mọi bước việc (bỏ mục lớn có bước con, bỏ bước không áp dụng) của các dự án, kèm thông tin dự án */
export function collectTasks(projects: ProjectProcedureData[], today: string): MyTask[] {
  return projects.flatMap((project) =>
    project.steps
      .filter((step) => step.department && step.isEnabled && !isHeadingStep(step, project.steps))
      .map((step) => {
        const flow = getStepFlow(step);
        const department = step.department ?? "";
        const finished = flow === "COMPLETED" || flow === "SKIPPED" || flow === "DISABLED";
        return {
          projectId: project.projectId,
          projectCode: project.projectCode,
          projectName: project.projectName,
          department,
          procedureName: project.departmentStatuses?.[department]?.procedureName ?? department,
          step,
          flow,
          overdue: !finished && Boolean(step.endDatePlanned && step.endDatePlanned < today),
        };
      }),
  );
}

/** Người từ chối bước: lấy trên bước, dữ liệu cũ thì tra nhật ký */
function rejectedByName(task: MyTask, history: ProcedureHistoryLog[]): string | undefined {
  if (task.step.rejectedBy) return task.step.rejectedBy;
  return history.find((log) => log.stepId === task.step.id && log.actionLabel === "Từ chối kết quả bước")?.performedBy;
}

/**
 * Chia việc theo tab. `canReview(department)` cho biết người này có duyệt được bước của phòng ban đó không.
 * Mỗi tab sắp theo việc cần làm trước: quá hạn → hạn gần nhất.
 */
export function groupTasks(
  tasks: MyTask[],
  projects: ProjectProcedureData[],
  me: TaskIdentity,
  canReview: (department: string) => boolean,
): Record<MyTaskTab, MyTask[]> {
  const historyOf = new Map(projects.map((p) => [p.projectId, p.history ?? []]));
  const groups: Record<MyTaskTab, MyTask[]> = {
    todo: [],
    returned: [],
    submitted: [],
    done: [],
    review: [],
    approved: [],
    rejected: [],
  };
  for (const task of tasks) {
    if (isMine(task.step, me)) {
      if (task.flow === "IN_PROGRESS") groups.todo.push(task);
      else if (task.flow === "RETURNED") groups.returned.push(task);
      else if (task.flow === "AWAITING_APPROVAL") groups.submitted.push(task);
      else if (task.flow === "COMPLETED") groups.done.push(task);
    }
    if (task.flow === "AWAITING_APPROVAL" && canReview(task.department)) groups.review.push(task);
    if (task.step.submissionStatus === "APPROVED" && isMe(task.step.approvedBy, me)) groups.approved.push(task);
    if (task.flow === "RETURNED" && isMe(rejectedByName(task, historyOf.get(task.projectId) ?? []), me)) {
      groups.rejected.push(task);
    }
  }
  const byDeadline = (a: MyTask, b: MyTask) =>
    Number(b.overdue) - Number(a.overdue) ||
    (a.step.endDatePlanned || "9999").localeCompare(b.step.endDatePlanned || "9999");
  const byRecent = (field: "approvedAt" | "submittedAt" | "rejectedAt") => (a: MyTask, b: MyTask) =>
    (b.step[field] || "").localeCompare(a.step[field] || "");
  groups.todo.sort(byDeadline);
  groups.returned.sort(byDeadline);
  groups.review.sort(byRecent("submittedAt")).reverse(); // nộp trước duyệt trước
  groups.submitted.sort(byRecent("submittedAt"));
  groups.done.sort(byRecent("approvedAt"));
  groups.approved.sort(byRecent("approvedAt"));
  groups.rejected.sort(byRecent("rejectedAt"));
  return groups;
}

/** Tìm theo mã / tên bước, tên dự án, phòng ban, người thực hiện */
export function matchesSearch(task: MyTask, keyword: string): boolean {
  const q = normalize(keyword);
  if (!q) return true;
  return [task.step.code, task.step.name, task.projectName, task.projectCode, task.procedureName, task.step.assignedTo]
    .some((v) => normalize(v).includes(q));
}

// ── Thao tác trên bước (cùng quy tắc với trang chi tiết dự án) ──

export interface TaskActor {
  name: string;
  role: string;
}

type StepLog = Pick<ProcedureHistoryLog, "action" | "actionLabel" | "details"> & Partial<ProcedureHistoryLog>;

function patchStep(
  data: ProjectProcedureData,
  stepId: string,
  patch: (step: ProcedureStep) => Partial<ProcedureStep>,
  log: (step: ProcedureStep) => StepLog,
  actor: TaskActor,
  now: Date,
  extra: Partial<ProjectProcedureData> = {},
): ProjectProcedureData {
  const step = data.steps.find((s) => s.id === stepId);
  if (!step) return data;
  const changes = patch(step);
  return {
    ...data,
    ...extra,
    steps: data.steps.map((s) => (s.id === stepId ? { ...s, ...changes } : s)),
    history: [
      {
        stepId: step.id,
        stepCode: step.code,
        stepName: step.name,
        previousStatus: step.status,
        newStatus: changes.status ?? step.status,
        ...log(step),
        id: `LOG-${now.getTime()}`,
        timestamp: now.toISOString().slice(0, 16).replace("T", " "),
        performedBy: actor.name,
        role: actor.role,
      },
      ...(data.history ?? []),
    ],
  };
}

/** Người thực hiện nộp kết quả (kèm hồ sơ), chờ Tổ trưởng duyệt */
export function submitTask(
  data: ProjectProcedureData,
  stepId: string,
  input: { note?: string; documents?: ProcedureDocument[] },
  actor: TaskActor,
  now = new Date(),
): ProjectProcedureData {
  const date = now.toISOString().slice(0, 10);
  return patchStep(
    data,
    stepId,
    (step) => ({
      status: "IN_PROGRESS",
      submissionStatus: "SUBMITTED",
      attachments: [...step.attachments, ...(input.documents ?? [])],
      actualStartDate: step.actualStartDate || date,
      actualEndDate: date,
      submittedBy: actor.name,
      submittedAt: date,
      submissionNote: input.note || step.submissionNote,
    }),
    (step) => ({
      action: "START_STEP",
      actionLabel: step.submissionStatus === "REJECTED" ? "Nộp lại sau khi bị từ chối" : "Nộp kết quả chờ duyệt",
      documentReference: input.documents?.[0]?.fileName,
      details: `${actor.name} nộp kết quả bước [${step.code}] ${step.name}, chờ Tổ trưởng duyệt.`,
    }),
    actor,
    now,
  );
}

/** Tổ trưởng duyệt hoàn thành bước */
export function approveTask(data: ProjectProcedureData, stepId: string, actor: TaskActor, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return patchStep(
    data,
    stepId,
    (step) => ({
      status: "COMPLETED",
      submissionStatus: "APPROVED",
      approvedBy: actor.name,
      approvedAt: date,
      actualEndDate: step.actualEndDate || date,
      rejectionReason: undefined,
    }),
    (step) => ({
      action: "COMPLETE_STEP",
      actionLabel: "Tổ trưởng duyệt bước",
      details: `${actor.name} duyệt hoàn thành bước [${step.code}] ${step.name} của ${step.assignedTo || "cán bộ"}.`,
    }),
    actor,
    now,
  );
}

/** Tổ trưởng từ chối kết quả, yêu cầu làm lại; giai đoạn chứa bước phải nghiệm thu lại */
export function rejectTask(
  data: ProjectProcedureData,
  stepId: string,
  reason: string,
  actor: TaskActor,
  now = new Date(),
) {
  const step = data.steps.find((s) => s.id === stepId);
  const stageKey = step ? `${step.department}::${step.groupCode}` : "";
  const stageApprovals = Object.fromEntries(
    Object.entries(data.stageApprovals ?? {}).filter(([k]) => k !== stageKey && k !== step?.groupTitle),
  );
  return patchStep(
    data,
    stepId,
    () => ({
      status: "IN_PROGRESS",
      submissionStatus: "REJECTED",
      rejectionReason: reason,
      rejectedBy: actor.name,
      rejectedAt: now.toISOString().slice(0, 10),
    }),
    (s) => ({
      action: "START_STEP",
      actionLabel: "Từ chối kết quả bước",
      reason,
      details: `${actor.name} từ chối bước [${s.code}] ${s.name} cho ${s.assignedTo || "người thực hiện"}: ${reason}`,
    }),
    actor,
    now,
    { stageApprovals },
  );
}
