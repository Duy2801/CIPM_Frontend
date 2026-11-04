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
import { getSiblingSteps, getStageColumns } from "../../construction-procedures/utils/step-dependencies.ts";
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
  /** Đã tới lượt làm theo thứ tự quy trình (các lượt trước đã xong) */
  reached: boolean;
}

export type WorkerTab = "accept" | "todo" | "returned" | "submitted" | "done" | "incident";
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

/**
 * Các bước đã tới lượt làm của một quy trình (một phòng ban), theo thứ tự trên sơ đồ:
 * cùng cấp, các bước cùng lượt (flowStage) làm song song; lượt sau chỉ tới khi mọi bước của lượt trước đã xong.
 * Bước con tới lượt khi bước cha tới lượt. Bước có bước con xong khi mọi bước con đang áp dụng đã xong.
 */
export function reachedStepIds(steps: ProcedureStep[]): Set<string> {
  const active = steps.filter((s) => s.isEnabled && s.status !== "DISABLED").sort((a, b) => a.order - b.order);
  const isDone = (step: ProcedureStep): boolean => {
    const children = getSiblingSteps(active, step.code);
    if (children.length > 0) return children.every(isDone);
    const flow = getStepFlow(step);
    return flow === "COMPLETED" || flow === "SKIPPED";
  };
  const reached = new Set<string>();
  const walk = (parentCode: string | null) => {
    for (const column of getStageColumns(getSiblingSteps(active, parentCode))) {
      for (const step of column) {
        reached.add(step.id);
        walk(step.code);
      }
      if (!column.every(isDone)) break;
    }
  };
  walk(null);
  return reached;
}

/** Mọi bước việc (bỏ mục lớn có bước con, bỏ bước không áp dụng) của các dự án, kèm thông tin dự án */
export function collectTasks(projects: ProjectProcedureData[], today: string): MyTask[] {
  return projects.flatMap((project) => {
    // Mỗi phòng ban một quy trình riêng: tính lượt trong từng phòng ban
    const reached = new Set<string>();
    for (const dept of new Set(project.steps.map((s) => s.department ?? ""))) {
      reachedStepIds(project.steps.filter((s) => (s.department ?? "") === dept)).forEach((id) => reached.add(id));
    }
    return project.steps
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
          reached: reached.has(step.id),
        };
      });
  });
}

/** Đã bắt tay vào làm (ghi chú, hồ sơ, từng nộp / bị từ chối) thì coi như đã tiếp nhận — dữ liệu cũ chưa có `acceptedAt` */
const hasStartedWork = (step: ProcedureStep) =>
  Boolean(
    step.acceptedAt ||
      // Việc từng bị trả về rồi giao lại: người mới phải tiếp nhận, dù trên bước đã có ghi chú / hồ sơ của người trước
      (!step.handbackAt &&
        (step.submissionNote?.trim() || step.attachments.length || step.submittedAt || step.rejectedAt)),
  );

/** Bước đang có sự cố chưa xử lý */
export const hasIncident = (step: ProcedureStep) => Boolean(step.incidentReason);

/**
 * Loại việc (để xếp cột) của một việc không phải của mình — chỉ để xem dự án đang làm tới đâu.
 * Bước chưa làm (kể cả chưa tới lượt, chưa giao ai) nằm ở Chờ tiếp nhận.
 */
export function classifyOtherTask(task: MyTask): MyTaskTab | null {
  const working = task.flow === "IN_PROGRESS" || task.flow === "RETURNED" || task.flow === "UNASSIGNED";
  if (working && !task.reached) return "accept";
  if (task.flow === "UNASSIGNED") return "accept";
  if (working && hasIncident(task.step)) return "incident";
  if (task.flow === "IN_PROGRESS") return hasStartedWork(task.step) ? "todo" : "accept";
  if (task.flow === "RETURNED") return "returned";
  if (task.flow === "AWAITING_APPROVAL") return "submitted";
  if (task.flow === "COMPLETED") return "done";
  return null;
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
    accept: [],
    incident: [],
    todo: [],
    returned: [],
    submitted: [],
    done: [],
    review: [],
    approved: [],
    rejected: [],
  };
  for (const task of tasks) {
    const working = task.flow === "IN_PROGRESS" || task.flow === "RETURNED";
    const mine = isMine(task.step, me);
    // Sự cố: người thực hiện và Tổ trưởng của phòng ban đều thấy, không nằm ở cột đang làm nữa
    if (working && hasIncident(task.step) && (mine || canReview(task.department))) {
      groups.incident.push(task);
      continue;
    }
    if (mine) {
      // Chưa tới lượt theo thứ tự quy trình: vẫn hiện ở Chờ tiếp nhận nhưng chưa nhận được
      if (task.flow === "IN_PROGRESS" && (!task.reached || !hasStartedWork(task.step))) groups.accept.push(task);
      else if (task.flow === "IN_PROGRESS") groups.todo.push(task);
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
  groups.accept.sort(byDeadline);
  groups.incident.sort((a, b) => (b.step.incidentReportedAt || "").localeCompare(a.step.incidentReportedAt || ""));
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

/** Người thực hiện lưu ghi chú công việc khi đang làm (chưa nộp) */
export function saveTaskNote(data: ProjectProcedureData, stepId: string, note: string): ProjectProcedureData {
  return {
    ...data,
    steps: data.steps.map((s) => (s.id === stepId ? { ...s, submissionNote: note.trim() || undefined } : s)),
  };
}

/** Người thực hiện thêm hồ sơ vào bước khi đang làm (chưa nộp) */
export function addTaskDocuments(
  data: ProjectProcedureData,
  stepId: string,
  documents: ProcedureDocument[],
  actor: TaskActor,
  now = new Date(),
): ProjectProcedureData {
  if (documents.length === 0) return data;
  const date = now.toISOString().slice(0, 10);
  return patchStep(
    data,
    stepId,
    (step) => ({ attachments: [...step.attachments, ...documents], actualStartDate: step.actualStartDate || date }),
    (step) => ({
      action: "ADD_DOCUMENT",
      actionLabel: "Thêm hồ sơ",
      documentReference: documents[0].fileName,
      details: `${actor.name} thêm ${documents.map((d) => d.fileName).join(", ")} vào bước [${step.code}].`,
    }),
    actor,
    now,
  );
}

/** Người thực hiện gỡ một hồ sơ đã thêm */
export function removeTaskDocument(
  data: ProjectProcedureData,
  stepId: string,
  documentId: string,
  actor: TaskActor,
  now = new Date(),
): ProjectProcedureData {
  const doc = data.steps.find((s) => s.id === stepId)?.attachments.find((d) => d.id === documentId);
  if (!doc) return data;
  return patchStep(
    data,
    stepId,
    (step) => ({ attachments: step.attachments.filter((d) => d.id !== documentId) }),
    (step) => ({
      action: "REMOVE_DOCUMENT",
      actionLabel: "Gỡ hồ sơ",
      documentReference: doc.fileName,
      details: `${actor.name} gỡ ${doc.fileName} khỏi bước [${step.code}].`,
    }),
    actor,
    now,
  );
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
      // Lần nộp mới chưa ai duyệt
      approvedBy: undefined,
      approvedAt: undefined,
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
      approvedBy: undefined,
      approvedAt: undefined,
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

/** Người thực hiện tiếp nhận việc mới được giao → chuyển sang đang xử lý */
export function acceptTask(data: ProjectProcedureData, stepId: string, actor: TaskActor, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return patchStep(
    data,
    stepId,
    (step) => ({
      status: "IN_PROGRESS",
      acceptedBy: actor.name,
      acceptedAt: date,
      actualStartDate: step.actualStartDate || date,
      handbackType: undefined,
      handbackReason: undefined,
      handbackBy: undefined,
      handbackAt: undefined,
    }),
    (step) => ({
      action: "START_STEP",
      actionLabel: "Tiếp nhận việc",
      details: `${actor.name} tiếp nhận bước [${step.code}] ${step.name}.`,
    }),
    actor,
    now,
  );
}

/** Người thực hiện báo sự cố khi đang làm (vướng mắc không tự xử lý được) */
export function reportTaskIncident(
  data: ProjectProcedureData,
  stepId: string,
  reason: string,
  actor: TaskActor,
  now = new Date(),
) {
  const date = now.toISOString().slice(0, 10);
  return patchStep(
    data,
    stepId,
    (step) => ({
      incidentReason: reason,
      incidentReportedBy: actor.name,
      incidentReportedAt: date,
      // Báo sự cố là đã nhận việc
      acceptedBy: step.acceptedBy || actor.name,
      acceptedAt: step.acceptedAt || date,
    }),
    (step) => ({
      action: "START_STEP",
      actionLabel: "Báo sự cố",
      reason,
      details: `${actor.name} báo sự cố ở bước [${step.code}] ${step.name}: ${reason}`,
    }),
    actor,
    now,
  );
}

/** Tổ trưởng xử lý xong sự cố → việc trở lại đang xử lý */
export function resolveTaskIncident(data: ProjectProcedureData, stepId: string, actor: TaskActor, now = new Date()) {
  return patchStep(
    data,
    stepId,
    () => ({ incidentReason: undefined, incidentReportedBy: undefined, incidentReportedAt: undefined }),
    (step) => ({
      action: "START_STEP",
      actionLabel: "Đã xử lý sự cố",
      reason: step.incidentReason,
      details: `${actor.name} xử lý xong sự cố ở bước [${step.code}] ${step.name}, ${step.assignedTo || "người thực hiện"} tiếp tục làm.`,
    }),
    actor,
    now,
  );
}

export type HandbackMode = "decline" | "return";

/**
 * Người thực hiện trả việc về Tổ trưởng để giao người khác:
 * - Từ chối: chưa tiếp nhận, không nhận việc này.
 * - Hoàn trả: đã tiếp nhận / đang làm nhưng không làm tiếp được; ghi chú, hồ sơ đã có giữ lại cho người sau.
 * Bước thành chưa có người thực hiện.
 */
export function handBackTask(
  data: ProjectProcedureData,
  stepId: string,
  mode: HandbackMode,
  reason: string,
  actor: TaskActor,
  now = new Date(),
) {
  const label = mode === "decline" ? "Từ chối nhận việc" : "Hoàn trả việc";
  return patchStep(
    data,
    stepId,
    // Từ chối (chưa nhận): trả việc về Tổ trưởng để giao người khác.
    // Hoàn trả (đã nộp, đang chờ duyệt): rút kết quả đã nộp, việc quay lại "Đang xử lý" để làm tiếp.
    () => ({
      ...(mode === "decline"
        ? {
            status: "NOT_STARTED" as const,
            assignedTo: undefined,
            assignedToId: undefined,
            acceptedBy: undefined,
            acceptedAt: undefined,
          }
        : { status: "IN_PROGRESS" as const, submissionStatus: undefined, submittedBy: undefined, submittedAt: undefined }),
      handbackType: mode === "decline" ? "DECLINED" : "RETURNED",
      handbackReason: reason,
      handbackBy: actor.name,
      handbackAt: now.toISOString().slice(0, 10),
    }),
    (step) => ({
      action: "START_STEP",
      actionLabel: label,
      reason,
      details:
        mode === "decline"
          ? `${actor.name} từ chối nhận bước [${step.code}] ${step.name}, trả về Tổ trưởng: ${reason}`
          : `${actor.name} rút kết quả đã nộp của bước [${step.code}] ${step.name}, quay lại đang xử lý: ${reason}`,
    }),
    actor,
    now,
  );
}
