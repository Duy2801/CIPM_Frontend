"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import { hasMatrixPermission } from "@/access-control";
import {
  getDepartmentLead,
  isDirectorUser,
  isLeadOfDepartment,
} from "@/features/construction-procedures/constants/procedure-department-templates";
import {
  loadProjectProcedure,
  saveProjectProcedure,
} from "@/features/construction-procedures/utils/project-procedure-storage";
import type {
  DepartmentProcedureStatus,
  ProcedureDocument,
  ProcedureHistoryLog,
  ProcedureStep,
  ProjectProcedureData,
} from "@/features/construction-procedures/types/procedure.types";
import type { ProjectItem } from "../types/project.types";
import type {
  ProcedureChanges,
  ProjectProcedureSync,
  StepDraft,
} from "../types/project-procedure.types";
import {
  createEmptyProcedure,
  sameDepartmentKey,
  toDepartmentSteps,
  withProcedureAssignees,
} from "../utils/project-procedure-data";
import {
  getAppliedDepartments,
  getProcedureProgress,
  isReadyToStart,
  type StageSummary,
} from "../utils/project-procedure-flow";
import { withPlannedDates } from "../utils/step-schedule";
import { getProjectProcedure, saveProjectProcedures } from "../services/project.api";
import { projectKeys } from "./useProjectList";

export function useProjectProcedure(project: ProjectItem, onSync?: (sync: ProjectProcedureSync) => void) {
  const { user } = useAuth();
  const actorName = user?.displayName || user?.name || "Cán bộ quản lý";
  const actorRole = user?.roleName || "Cán bộ Ban QLDA";

  const isBackend = hasBackendSession();
  const queryClient = useQueryClient();
  const remote = useQuery({
    queryKey: projectKeys.procedure(project.id),
    queryFn: () => getProjectProcedure(project),
    enabled: isBackend,
  });
  const [localData, setData] = useState<ProjectProcedureData>(
    () => {
      if (isBackend) return createEmptyProcedure(project);
      const saved = loadProjectProcedure(project.id, project.code);
      if (!saved) return createEmptyProcedure(project);
      const withAssignees = withProcedureAssignees(saved);
      return { ...withAssignees, steps: withPlannedDates(withAssignees.steps, project.startDate) };
    },
  );
  const data = isBackend ? (remote.data ?? localData) : localData;

  const canConfigure =
    hasMatrixPermission(user, "procedure:assign_step");
  const canManageDepartment = (department: string) => canConfigure || isLeadOfDepartment(user, department);
  const canApproveSteps = (department?: string) =>
    Boolean(department && isLeadOfDepartment(user, department)) ||
    hasMatrixPermission(user, "procedure:approve_step");
  const userKey = actorName.trim().toLowerCase();
  const isAssignee = (step: ProcedureStep) => Boolean(step.assignedTo && step.assignedTo.trim().toLowerCase() === userKey);
  const canWorkOnStep = (step: ProcedureStep) =>
    isAssignee(step) || canApproveSteps(step.department) || hasMatrixPermission(user, "my_task:act_on_behalf");
  const canDecideStage = isDirectorUser(user);
  const departmentLead = (department: string) => getDepartmentLead(department)?.name;

  const commit = (
    next: Pick<ProjectProcedureData, "steps"> & Partial<ProjectProcedureData>,
    log: Omit<ProcedureHistoryLog, "id" | "timestamp" | "performedBy" | "role">,
  ) => {
    if (isBackend) {
      toast.error("Không thực hiện được ở đây", "Nộp, duyệt và phân công bước thực hiện ở màn Việc cần xử lý.");
      return;
    }
    const merged = { ...data, ...next, steps: withPlannedDates(next.steps, project.startDate) };
    const departments = getAppliedDepartments(merged.departmentStatuses, merged.steps);
    const updated: ProjectProcedureData = {
      ...merged,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      departments,
      history: [
        {
          ...log,
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          performedBy: actorName,
          role: actorRole,
        },
        ...(data.history ?? []),
      ],
    };
    saveProjectProcedure(updated);
    setData(updated);
    onSync?.({
      departments,
      actualProgress: getProcedureProgress(departments, updated.steps, updated.stageApprovals),
    });
  };

  const appliedDepartments = getAppliedDepartments(data.departmentStatuses, data.steps);
  const progress = getProcedureProgress(appliedDepartments, data.steps, data.stageApprovals);

  const departmentStatus = (department: string): DepartmentProcedureStatus | undefined =>
    Object.entries(data.departmentStatuses ?? {}).find(([key]) => sameDepartmentKey(key, department))?.[1];

  const saveProcedureChanges = (changes: ProcedureChanges) => {
    if (isBackend) {
      saveProjectProcedures(project.id, changes, data)
        .then(() =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: projectKeys.procedure(project.id) }),
            queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
          ]),
        )
        .catch((e: Error) => toast.error("Không lưu được quy trình", e.message));
      return;
    }
    const removed = new Set(changes.remove);
    const keep = (dept?: string) => !dept || ![...removed].some((r) => sameDepartmentKey(dept, r));
    let steps = data.steps.filter((s) => keep(s.department));
    const statuses: Record<string, DepartmentProcedureStatus> = Object.fromEntries(
      Object.entries(data.departmentStatuses ?? {}).filter(([key]) => keep(key)),
    );
    for (const { department, procedure } of changes.add) {
      steps = [...steps.filter((s) => !s.department || !sameDepartmentKey(s.department, department)), ...toDepartmentSteps(project.id, department, procedure)];
      statuses[department] = { department, isCompletedByLead: false, procedureId: procedure.id, procedureName: procedure.name };
    }
    for (const [department, label] of Object.entries(changes.labels)) {
      if (statuses[department]) statuses[department] = { ...statuses[department], tabLabel: label.trim() || undefined };
    }
    const parts = [
      ...changes.add.map(({ procedure }) => `áp dụng "${procedure.name}"`),
      ...changes.remove.map((dept) => `gỡ "${data.departmentStatuses?.[dept]?.procedureName ?? dept}"`),
      ...Object.entries(changes.labels).map(([dept, label]) => `đổi tên tab "${statuses[dept]?.procedureName ?? dept}" thành "${label.trim() || "mặc định"}"`),
    ];
    commit(
      { steps, departmentStatuses: statuses },
      {
        stepId: "DEPT-CONFIG",
        stepCode: "THIET-LAP",
        stepName: "Quy trình dự án",
        action: "TOGGLE_STEP",
        actionLabel: "Cập nhật quy trình dự án",
        details: `Cập nhật quy trình dự án: ${parts.join("; ")}.`,
      },
    );
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const patchStep = (
    step: ProcedureStep,
    patch: Partial<ProcedureStep>,
    log: Pick<ProcedureHistoryLog, "action" | "actionLabel" | "details"> & Partial<ProcedureHistoryLog>,
    extra: Partial<ProjectProcedureData> = {},
  ) =>
    commit(
      { ...extra, steps: data.steps.map((s) => (s.id === step.id ? { ...s, ...patch } : s)) },
      {
        stepId: step.id,
        stepCode: step.code,
        stepName: step.name,
        previousStatus: step.status,
        newStatus: patch.status ?? step.status,
        ...log,
      },
    );

  const [drafts, setDrafts] = useState<Record<string, StepDraft>>({});
  const draftCount = Object.keys(drafts).length;
  const withDraft = (step: ProcedureStep): ProcedureStep => ({ ...step, ...drafts[step.id] });

  const setStepDraft = (step: ProcedureStep, patch: StepDraft) =>
    setDrafts((prev) => {
      const next: StepDraft = { ...prev[step.id], ...patch };
      if ("assignedToId" in next && (next.assignedToId ?? "") === (step.assignedToId ?? "")) {
        delete next.assignedTo;
        delete next.assignedToId;
        delete next.assignedBy;
        delete next.assignedAt;
      }
      for (const field of ["startDatePlanned", "endDatePlanned"] as const) {
        if (field in next && (next[field] ?? "") === (step[field] ?? "")) delete next[field];
      }
      const rest = { ...prev };
      if (Object.keys(next).length === 0) delete rest[step.id];
      else rest[step.id] = next;
      return rest;
    });

  const discardDrafts = (stepIds?: string[]) =>
    setDrafts((prev) =>
      stepIds ? Object.fromEntries(Object.entries(prev).filter(([id]) => !stepIds.includes(id))) : {},
    );

  const saveDrafts = (stepIds?: string[]) => {
    const ids = Object.keys(drafts).filter((id) => !stepIds || stepIds.includes(id));
    if (ids.length === 0) return { saved: 0, started: 0 };
    if (isBackend) {
      toast.error("Không thực hiện được ở đây", "Phân công bước thực hiện ở màn Việc cần xử lý.");
      return { saved: 0, started: 0 };
    }
    const date = today();
    const codes: string[] = [];
    let started = 0;
    const steps = data.steps.map((s) => {
      if (!ids.includes(s.id)) return s;
      const merged = { ...s, ...drafts[s.id] };
      codes.push(s.code);
      if (!isReadyToStart(merged)) return merged;
      started += 1;
      return { ...merged, status: "IN_PROGRESS" as const, actualStartDate: s.actualStartDate || date };
    });
    commit(
      { steps },
      {
        stepId: "ASSIGNMENT",
        stepCode: "PHAN-CONG",
        stepName: `Phân công ${codes.length} bước`,
        action: "CONFIG_DURATION",
        actionLabel: "Lưu phân công & thời gian",
        details:
          `Lưu người thực hiện và thời gian kế hoạch các bước ${codes.join(", ")}.` +
          (started ? ` ${started} bước đủ thông tin đã chuyển sang đang thực hiện.` : ""),
      },
    );
    discardDrafts(ids);
    return { saved: codes.length, started };
  };

  const submitStep = (step: ProcedureStep, input: { note?: string; documents?: ProcedureDocument[] }) => {
    const isResubmission = step.submissionStatus === "REJECTED";
    const date = today();
    patchStep(
      step,
      {
        status: "IN_PROGRESS",
        submissionStatus: "SUBMITTED",
        attachments: [...step.attachments, ...(input.documents ?? [])],
        actualStartDate: step.actualStartDate || date,
        actualEndDate: date,
        submittedBy: actorName,
        submittedAt: date,
        submissionNote: input.note || step.submissionNote,
        approvedBy: undefined,
        approvedAt: undefined,
      },
      {
        action: "START_STEP",
        actionLabel: isResubmission ? "Nộp lại sau khi bị từ chối" : "Nộp kết quả chờ duyệt",
        documentReference: input.documents?.[0]?.fileName,
        details: `${actorName} nộp kết quả bước [${step.code}] ${step.name}, chờ Tổ trưởng duyệt.`,
      },
    );
  };

  const withoutStageDecision = (step: ProcedureStep) => {
    const key = `${step.department}::${step.groupCode}`;
    return Object.fromEntries(
      Object.entries(data.stageApprovals ?? {}).filter(([k]) => k !== key && k !== step.groupTitle),
    );
  };

  const approveStep = (step: ProcedureStep) =>
    patchStep(
      step,
      {
        status: "COMPLETED",
        submissionStatus: "APPROVED",
        approvedBy: actorName,
        approvedAt: today(),
        actualEndDate: step.actualEndDate || today(),
        rejectionReason: undefined,
      },
      {
        action: "COMPLETE_STEP",
        actionLabel: "Tổ trưởng duyệt bước",
        details: `${actorName} duyệt hoàn thành bước [${step.code}] ${step.name} của ${step.assignedTo || "cán bộ"}.`,
      },
    );

  const returnStep = (step: ProcedureStep, reason: string) =>
    patchStep(
      step,
      {
        status: "IN_PROGRESS",
        submissionStatus: "REJECTED",
        rejectionReason: reason,
        rejectedBy: actorName,
        rejectedAt: today(),
        approvedBy: undefined,
        approvedAt: undefined,
      },
      {
        action: "START_STEP",
        actionLabel: "Từ chối kết quả bước",
        reason,
        details: `${actorName} từ chối bước [${step.code}] ${step.name} cho ${step.assignedTo || "người thực hiện"}: ${reason}`,
      },
      { stageApprovals: withoutStageDecision(step) },
    );

  const decideStage = (department: string, stage: StageSummary, approved: boolean, reason?: string) => {
    const decision = approved
      ? { status: "APPROVED" as const, decidedBy: actorName, decidedAt: today(), note: `Đã nghiệm thu giai đoạn: ${stage.title}` }
      : {
          status: "REJECTED" as const,
          decidedBy: actorName,
          decidedAt: today(),
          rejectionReason: reason,
          note: `Yêu cầu rà soát: ${reason}`,
        };
    commit(
      {
        steps: data.steps,
        stageApprovals: { ...(data.stageApprovals ?? {}), [stage.approvalKey]: decision, [stage.title]: decision },
      },
      {
        stepId: `DIRECTOR-${stage.approvalKey}`,
        stepCode: "BGĐ-DUYET",
        stepName: `Giai đoạn ${stage.code}. ${stage.title}`,
        action: "COMPLETE_STEP",
        actionLabel: approved ? "BGĐ nghiệm thu giai đoạn" : "BGĐ yêu cầu rà soát giai đoạn",
        reason,
        details: approved
          ? `${actorName} nghiệm thu giai đoạn [${stage.title}] của ${department}.`
          : `${actorName} yêu cầu ${department} rà soát giai đoạn [${stage.title}]: ${reason}`,
      },
    );
  };

  return {
    data,
    actorName,
    canConfigure,
    canManageDepartment,
    canApproveSteps,
    canWorkOnStep,
    canDecideStage,
    departmentLead,
    departmentStatus,
    appliedDepartments,
    progress,
    saveProcedureChanges,
    drafts,
    draftCount,
    withDraft,
    setStepDraft,
    discardDrafts,
    saveDrafts,
    submitStep,
    approveStep,
    returnStep,
    decideStage,
  };
}

export type ProjectProcedureController = ReturnType<typeof useProjectProcedure>;
