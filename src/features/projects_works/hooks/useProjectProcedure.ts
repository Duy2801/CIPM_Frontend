"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth";
import { canUserDo, hasMatrixPermission } from "@/access-control";
import {
  getDepartmentLead,
  isDirectorUser,
  isLeadOfDepartment,
  isSameDepartment,
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
import { isReadyToStart, type StageSummary } from "../utils/project-procedure-flow";

/** Phần phân công đang sửa trên bảng nhưng chưa bấm "Lưu" */
export type StepDraft = Partial<
  Pick<ProcedureStep, "assignedTo" | "assignedToId" | "assignedBy" | "assignedAt" | "startDatePlanned" | "endDatePlanned">
>;

/** Dự án chưa có dữ liệu quy trình: dựng khung rỗng từ thông tin dự án */
function createEmptyProcedure(project: ProjectItem): ProjectProcedureData {
  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    projectType: project.type,
    totalInvestment: project.totalInvestment,
    managerName: project.managerName,
    supervisorName: project.supervisorName,
    startDate: project.startDate,
    expectedFinishDate: project.endDatePlanned || project.startDate,
    departments: project.departments ?? [],
    departmentStatuses: {},
    directorApproval: { status: "PENDING" },
    stageApprovals: {},
    steps: [],
    history: [],
  };
}

/**
 * Quy trình đang áp dụng cho một dự án (dùng chung dữ liệu với phân hệ "Quy trình dự án").
 * Mỗi phòng ban của dự án áp dụng một quy trình riêng; các bước gắn `department` của phòng ban đó.
 */
export function useProjectProcedure(project: ProjectItem) {
  const { user } = useAuth();
  const actorName = user?.displayName || user?.name || "Cán bộ quản lý";
  const actorRole = user?.roleName || "Cán bộ Ban QLDA";

  const [data, setData] = useState<ProjectProcedureData>(
    () => loadProjectProcedure(project.id, project.code) ?? createEmptyProcedure(project),
  );

  // Cấu hình quy trình (chọn / đổi quy trình áp dụng) — quyền cấu hình M3
  const canConfigure =
    canUserDo(user, "m3_construction_procedures", "configure") || hasMatrixPermission(user, "m3.config_template");
  // Giao việc, đặt hạn, bật / tắt bước điều kiện — người cấu hình hoặc Lead của chính phòng ban
  const canManageDepartment = (department: string) => canConfigure || isLeadOfDepartment(user, department);
  // Duyệt / từ chối kết quả bước — Tổ trưởng của phòng ban hoặc người có quyền duyệt M3
  const canApproveSteps = (department?: string) =>
    Boolean(department && isLeadOfDepartment(user, department)) ||
    canUserDo(user, "m3_construction_procedures", "approve") ||
    hasMatrixPermission(user, "m3.approve_step");
  const userKey = actorName.trim().toLowerCase();
  const isAssignee = (step: ProcedureStep) => Boolean(step.assignedTo && step.assignedTo.trim().toLowerCase() === userKey);
  // Bắt đầu / nộp kết quả — người được giao, Tổ trưởng, hoặc người có quyền nhập liệu M3
  const canWorkOnStep = (step: ProcedureStep) =>
    isAssignee(step) || canApproveSteps(step.department) || canUserDo(user, "m3_construction_procedures", "input");
  // Nghiệm thu / yêu cầu rà soát giai đoạn — Ban Giám đốc
  const canDecideStage = isDirectorUser(user);
  const departmentLead = (department: string) => getDepartmentLead(department)?.name;

  const commit = (
    next: Pick<ProjectProcedureData, "steps"> & Partial<ProjectProcedureData>,
    log: Omit<ProcedureHistoryLog, "id" | "timestamp" | "performedBy" | "role">,
  ) => {
    const updated: ProjectProcedureData = {
      ...data,
      ...next,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      departments: project.departments ?? data.departments,
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
  };

  const departmentStatus = (department: string): DepartmentProcedureStatus | undefined =>
    Object.entries(data.departmentStatuses ?? {}).find(([key]) => isSameDepartment(key, department))?.[1];

  /** Áp dụng (hoặc đổi) quy trình cho một phòng ban: thay toàn bộ bước cũ của phòng ban đó */
  const applyProcedure = (department: string, procedure: { id: string; name: string; steps: ProcedureStep[] }) => {
    const prefix = `${project.id}-${department}`.replace(/\s+/g, "_");
    const deptSteps = procedure.steps.map<ProcedureStep>((s) => ({
      ...s,
      id: `${prefix}-${s.id}`,
      department,
      responsibleUnit: s.responsibleUnit && s.responsibleUnit !== "Chủ đầu tư" ? s.responsibleUnit : department,
      status: s.isEnabled ? "NOT_STARTED" : "DISABLED",
      assignedTo: undefined,
      assignedToId: undefined,
      submissionStatus: undefined,
      attachments: [],
    }));
    const otherSteps = data.steps.filter((s) => !s.department || !isSameDepartment(s.department, department));
    const statuses = Object.fromEntries(
      Object.entries(data.departmentStatuses ?? {}).filter(([key]) => !isSameDepartment(key, department)),
    );
    commit(
      {
        steps: [...otherSteps, ...deptSteps],
        departmentStatuses: {
          ...statuses,
          [department]: { department, isCompletedByLead: false, procedureId: procedure.id, procedureName: procedure.name },
        },
      },
      {
        stepId: "DEPT-CONFIG",
        stepCode: "THIET-LAP",
        stepName: `Quy trình ${department}`,
        action: "TOGGLE_STEP",
        actionLabel: "Cấu hình quy trình phòng ban",
        details: `Áp dụng "${procedure.name}" (${deptSteps.length} bước) cho ${department}.`,
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

  // Người thực hiện / ngày kế hoạch đang sửa trên bảng, theo mã bước — chỉ ghi xuống khi bấm "Lưu"
  const [drafts, setDrafts] = useState<Record<string, StepDraft>>({});
  const draftCount = Object.keys(drafts).length;
  const withDraft = (step: ProcedureStep): ProcedureStep => ({ ...step, ...drafts[step.id] });

  /** Ghi nhận phần sửa của một bước; sửa về đúng giá trị đã lưu thì bỏ khỏi danh sách chờ lưu */
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

  /** Bỏ phần đang sửa (của các bước chỉ định, hoặc tất cả) */
  const discardDrafts = (stepIds?: string[]) =>
    setDrafts((prev) =>
      stepIds ? Object.fromEntries(Object.entries(prev).filter(([id]) => !stepIds.includes(id))) : {},
    );

  /**
   * Lưu phần đang sửa của một giai đoạn (truyền mã các bước) hoặc toàn bộ quy trình.
   * Bước vừa đủ người thực hiện + ngày bắt đầu + ngày kết thúc kế hoạch thì bắt đầu luôn.
   */
  const saveDrafts = (stepIds?: string[]) => {
    const ids = Object.keys(drafts).filter((id) => !stepIds || stepIds.includes(id));
    if (ids.length === 0) return { saved: 0, started: 0 };
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

  /** Nộp kết quả bước (kèm hồ sơ): luôn chờ Tổ trưởng duyệt hoặc từ chối */
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
      },
      {
        action: "START_STEP",
        actionLabel: isResubmission ? "Nộp lại sau khi bị từ chối" : "Nộp kết quả chờ duyệt",
        documentReference: input.documents?.[0]?.fileName,
        details: `${actorName} nộp kết quả bước [${step.code}] ${step.name}, chờ Tổ trưởng duyệt.`,
      },
    );
  };

  /** Bỏ quyết định nghiệm thu của giai đoạn chứa bước (giai đoạn phải được nghiệm thu lại) */
  const withoutStageDecision = (step: ProcedureStep) => {
    const key = `${step.department}::${step.groupCode}`;
    return Object.fromEntries(
      Object.entries(data.stageApprovals ?? {}).filter(([k]) => k !== key && k !== step.groupTitle),
    );
  };

  /** Tổ trưởng duyệt kết quả bước */
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

  /** Tổ trưởng từ chối kết quả bước, yêu cầu làm lại */
  const returnStep = (step: ProcedureStep, reason: string) =>
    patchStep(
      step,
      { status: "IN_PROGRESS", submissionStatus: "REJECTED", rejectionReason: reason },
      {
        action: "START_STEP",
        actionLabel: "Từ chối kết quả bước",
        reason,
        details: `${actorName} từ chối bước [${step.code}] ${step.name} cho ${step.assignedTo || "người thực hiện"}: ${reason}`,
      },
      { stageApprovals: withoutStageDecision(step) },
    );

  /** Ban Giám đốc nghiệm thu (hoặc yêu cầu rà soát) một giai đoạn của phòng ban */
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
        // Ghi thêm theo tên giai đoạn để phân hệ Quy trình dự án cũng đọc được
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
    applyProcedure,
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
