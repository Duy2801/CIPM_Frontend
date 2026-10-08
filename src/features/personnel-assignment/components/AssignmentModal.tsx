"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CrownOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Tag } from "@/components/ui";
import { addDays, todayIso } from "@/utils/date";
import { MASTER_PROCEDURE_STEPS } from "@/features/construction-procedures/constants/procedure-steps-master";
import {
  PROCEDURE_STAGE_GROUPS,
  normalizeStageGroup,
} from "../constants/personnel-labels";
import type {
  Assignment,
  AssignmentInput,
  AssignmentPriority,
  PersonnelDataset,
  TeamId,
} from "../types/personnel.types";
import { getWorkload } from "../utils/personnel-rules";

interface AssignmentModalProps {
  data: PersonnelDataset;
  editing?: Assignment;
  defaultProjectId?: string;
  allowedProjectIds?: string[];
  defaultStage?: string;
  defaultParentAssignmentId?: string;
  errorText?: string;
  onClose: () => void;
  onCreate: (input: AssignmentInput) => Promise<boolean>;
  onUpdate: (id: string, input: AssignmentInput) => Promise<boolean>;
  currentStaffId?: string;
  isProjectLeader?: boolean;
  isTeamLeader?: boolean;
  leadingTeamId?: TeamId;
  initialLevel?: "PHASE_LEAD" | "TASK_MEMBER";
  initialTeamId?: TeamId;
}

export default function AssignmentModal({
  data,
  editing,
  defaultProjectId,
  allowedProjectIds,
  defaultStage,
  defaultParentAssignmentId,
  errorText,
  onClose,
  onCreate,
  onUpdate,
  currentStaffId,
  isProjectLeader,
  isTeamLeader,
  leadingTeamId,
  initialLevel,
  initialTeamId,
}: AssignmentModalProps) {
  const [form] = Form.useForm<AssignmentInput>();
  const [submitting, setSubmitting] = useState(false);

  // Xác định cán bộ hiện tại và tổ chuyên môn của Lead tổ
  const resolvedCurrentStaff = useMemo(() => {
    if (!currentStaffId) return undefined;
    return data.staff.find(
      (s) =>
        s.id === currentStaffId ||
        (s.email && s.email.toLowerCase() === currentStaffId.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === currentStaffId.toLowerCase()),
    );
  }, [currentStaffId, data.staff]);

  const effectiveStaffId = resolvedCurrentStaff?.id || currentStaffId;

  const effectiveLeadingTeamId = useMemo<TeamId | undefined>(() => {
    if (leadingTeamId) return leadingTeamId;
    if (initialTeamId) return initialTeamId;
    if (effectiveStaffId) {
      const team = data.teams.find((t) => t.leaderId === effectiveStaffId && t.id !== "BGD");
      if (team) return team.id;
      if (resolvedCurrentStaff?.teamId && resolvedCurrentStaff.teamId !== "BGD") {
        return resolvedCurrentStaff.teamId;
      }
    }
    return undefined;
  }, [leadingTeamId, initialTeamId, effectiveStaffId, data.teams, resolvedCurrentStaff]);

  const effectiveTeamLeaderId = useMemo<string | undefined>(() => {
    if (effectiveStaffId && isTeamLeader) return effectiveStaffId;
    if (effectiveLeadingTeamId) {
      const team = data.teams.find((t) => t.id === effectiveLeadingTeamId);
      if (team) return team.leaderId;
    }
    return effectiveStaffId;
  }, [effectiveStaffId, isTeamLeader, effectiveLeadingTeamId, data.teams]);

  // Xác định cấp phân công:
  // Nếu đang edit: dùng editing.assignmentLevel
  // Nếu tạo mới: dùng initialLevel hoặc nếu là Team Leader không phải CNDA thì là TASK_MEMBER, ngược lại PHASE_LEAD
  const assignmentLevel = useMemo<"PHASE_LEAD" | "TASK_MEMBER">(() => {
    if (editing?.assignmentLevel) {
      return editing.assignmentLevel;
    }
    if (initialLevel) return initialLevel;
    if (isTeamLeader && !isProjectLeader) {
      return "TASK_MEMBER";
    }
    return "PHASE_LEAD";
  }, [editing, initialLevel, isTeamLeader, isProjectLeader]);

  const availableProjects = useMemo(() => {
    if (allowedProjectIds && allowedProjectIds.length > 0) {
      const allowedSet = new Set(allowedProjectIds);
      return data.projects.filter((p) => allowedSet.has(p.id));
    }
    return data.projects;
  }, [data.projects, allowedProjectIds]);

  const initialProjectId =
    editing?.projectId ??
    (defaultProjectId && (!allowedProjectIds || allowedProjectIds.includes(defaultProjectId))
      ? defaultProjectId
      : availableProjects[0]?.id);

  const [modalProjectId, setModalProjectId] = useState<string | undefined>(initialProjectId);

  // Lấy dự án hiện tại đang được chọn
  const currentProject = data.projects.find((p) => p.id === modalProjectId);

  /**
   * Danh sách cán bộ trong tổ công tác thuộc về dự án này:
   * Bao gồm các thành viên trong teamMembers, Chủ nhiệm dự án (mainExecutorId), và Giám sát chính (mainSupervisorId)
   */
  const projectMemberIds = useMemo(() => {
    if (!currentProject) return new Set<string>();
    const ids = [
      ...(currentProject.teamMembers || []),
      currentProject.mainExecutorId,
      currentProject.mainSupervisorId,
      currentProject.actingDirectorId,
    ].filter(Boolean) as string[];
    return new Set(ids);
  }, [currentProject]);

  // 1. Danh sách các Tổ trưởng (Lead tổ) để Chủ nhiệm dự án giao giai đoạn
  const teamLeaderOptions = useMemo(() => {
    return data.teams
      .filter((t) => t.id !== "BGD")
      .map((team) => {
        const leader = data.staff.find((s) => s.id === team.leaderId);
        const workload = leader ? getWorkload(leader.id, data.assignments) : 0;
        return {
          value: leader?.id || team.id,
          teamId: team.id,
          leaderId: leader?.id,
          leaderName: leader?.name ?? "Chưa bổ nhiệm",
          leaderTitle: leader?.title ?? "Tổ trưởng",
          teamName: team.name,
          label: `👑 ${team.name} · Tổ trưởng: ${leader?.name ?? "Chưa bổ nhiệm"} (${workload} việc)`,
        };
      });
  }, [data.teams, data.staff, data.assignments]);

  const [filterMemberTeamId, setFilterMemberTeamId] = useState<TeamId | "ALL">(
    initialTeamId || leadingTeamId || "ALL",
  );

  // Danh sách các giai đoạn được CNDA giao cho Tổ trưởng / Tổ này trong dự án đang chọn
  const phaseAssignmentsForTeam = useMemo(() => {
    if (!modalProjectId) return [];

    return data.assignments.filter((a) => {
      if (a.projectId !== modalProjectId) return false;

      // Phải là phân công cấp giai đoạn từ CNDA
      const isPhaseLevel =
        a.assignmentLevel === "PHASE_LEAD" ||
        a.assignedByRole === "PROJECT_LEAD" ||
        (!a.assignmentLevel && !a.stepCode && Boolean(a.stage));
      if (!isPhaseLevel) return false;

      // Nếu là Lead tổ (Tổ trưởng): phải giao cho tổ của mình hoặc chính mình là Leader/Assignee
      if (isTeamLeader || !isProjectLeader) {
        if (effectiveLeadingTeamId && a.teamId === effectiveLeadingTeamId) return true;
        if (effectiveTeamLeaderId && (a.assigneeId === effectiveTeamLeaderId || a.teamLeaderId === effectiveTeamLeaderId)) return true;
        if (effectiveStaffId && (a.assigneeId === effectiveStaffId || a.teamLeaderId === effectiveStaffId)) return true;
        return false;
      }

      // Nếu là CNDA / Admin lọc theo tổ:
      if (filterMemberTeamId && filterMemberTeamId !== "ALL") {
        return a.teamId === filterMemberTeamId;
      }

      return true;
    });
  }, [
    data.assignments,
    modalProjectId,
    isTeamLeader,
    isProjectLeader,
    effectiveLeadingTeamId,
    effectiveTeamLeaderId,
    effectiveStaffId,
    filterMemberTeamId,
  ]);

  // Tập hợp các giai đoạn đã được CNDA giao trong dự án này (toàn dự án)
  const projectAssignedPhaseKeys = useMemo(() => {
    const set = new Set<string>();
    if (!modalProjectId) return set;
    data.assignments.forEach((a) => {
      if (a.projectId === modalProjectId) {
        const isPhaseLevel =
          a.assignmentLevel === "PHASE_LEAD" ||
          a.assignedByRole === "PROJECT_LEAD" ||
          (!a.assignmentLevel && !a.stepCode && Boolean(a.stage));
        if (isPhaseLevel && a.stage) {
          set.add(normalizeStageGroup(a.stage, a.stepCode));
        }
      }
    });
    return set;
  }, [data.assignments, modalProjectId]);

  // Tập hợp các giai đoạn (chuẩn hóa I, II, ..., VII) được CNDA giao cho tổ hiện tại
  const assignedStageKeys = useMemo(() => {
    const set = new Set<string>();
    phaseAssignmentsForTeam.forEach((a) => {
      if (a.stage) {
        set.add(normalizeStageGroup(a.stage, a.stepCode));
      }
    });
    return set;
  }, [phaseAssignmentsForTeam]);

  // Danh sách các giai đoạn được phép hiển thị trong dropdown:
  // - Khi CNDA giao giai đoạn cho Tổ trưởng (PHASE_LEAD):
  //   Nếu đang edit: hiển thị tất cả
  //   Nếu tạo mới: lọc bỏ các giai đoạn ĐÃ được giao cho dự án này để tránh trùng lặp!
  // - Khi Tổ trưởng phân công cho thành viên (TASK_MEMBER): BẮT BUỘC CHỈ hiển thị đúng các giai đoạn mà được Lead dự án giao cho mình
  //   KHÔNG CÓ hiện dư giai đoạn nào khác!
  const availableStageGroups = useMemo(() => {
    if (assignmentLevel === "PHASE_LEAD") {
      if (editing) {
        return PROCEDURE_STAGE_GROUPS;
      }
      // Chỉ cho phép chọn những giai đoạn chưa được phân công trong dự án này
      const unassignedStages = PROCEDURE_STAGE_GROUPS.filter(
        (g) => !projectAssignedPhaseKeys.has(g.value)
      );
      return unassignedStages.length > 0 ? unassignedStages : PROCEDURE_STAGE_GROUPS;
    }

    if (isTeamLeader || !isProjectLeader) {
      return PROCEDURE_STAGE_GROUPS.filter((g) => {
        if (assignedStageKeys.has(g.value)) return true;
        if (editing?.stage && normalizeStageGroup(editing.stage, editing.stepCode) === g.value) return true;
        return false;
      });
    }

    if (filterMemberTeamId && filterMemberTeamId !== "ALL") {
      const filtered = PROCEDURE_STAGE_GROUPS.filter((g) => assignedStageKeys.has(g.value));
      if (filtered.length > 0) return filtered;
    }

    return PROCEDURE_STAGE_GROUPS;
  }, [
    assignmentLevel,
    isTeamLeader,
    isProjectLeader,
    assignedStageKeys,
    projectAssignedPhaseKeys,
    editing,
    filterMemberTeamId,
  ]);

  // Xác định Giai đoạn ban đầu
  const initialStage = useMemo(() => {
    if (editing?.stage || editing?.stepCode) {
      return normalizeStageGroup(editing.stage, editing.stepCode);
    }
    if (defaultStage) {
      const normalized = normalizeStageGroup(defaultStage);
      if (availableStageGroups.some((g) => g.value === normalized)) {
        return normalized;
      }
    }
    if (availableStageGroups.length > 0) {
      return availableStageGroups[0].value;
    }
    return assignmentLevel === "PHASE_LEAD" ? "VI" : undefined;
  }, [editing, defaultStage, availableStageGroups, assignmentLevel]);

  const [selectedStage, setSelectedStage] = useState<string | undefined>(initialStage);

  // Group code hiện tại của giai đoạn (I, II, III, IV, V, VI, VII)
  const currentGroupCode = useMemo(() => {
    return selectedStage ? normalizeStageGroup(selectedStage) : undefined;
  }, [selectedStage]);

  // Phân công giai đoạn cha từ CNDA tương ứng với giai đoạn đang chọn
  const selectedParentPhaseAssignment = useMemo(() => {
    if (!currentGroupCode) return undefined;
    return phaseAssignmentsForTeam.find(
      (a) => a.stage && normalizeStageGroup(a.stage, a.stepCode) === currentGroupCode,
    );
  }, [currentGroupCode, phaseAssignmentsForTeam]);

  // Tổ chuyên môn phụ trách nhiệm vụ này:
  // Ưu tiên: editing.teamId -> teamId từ giai đoạn cha được CNDA giao -> initialTeamId -> effectiveLeadingTeamId
  const targetMemberTeamId = useMemo<TeamId | undefined>(() => {
    if (editing?.teamId) return editing.teamId;
    if (selectedParentPhaseAssignment?.teamId) return selectedParentPhaseAssignment.teamId;
    if (initialTeamId) return initialTeamId;
    if (effectiveLeadingTeamId) return effectiveLeadingTeamId;
    return undefined;
  }, [editing?.teamId, selectedParentPhaseAssignment?.teamId, initialTeamId, effectiveLeadingTeamId]);

  const targetMemberTeam = useMemo(() => {
    if (!targetMemberTeamId) return undefined;
    return data.teams.find((t) => t.id === targetMemberTeamId);
  }, [targetMemberTeamId, data.teams]);

  useEffect(() => {
    if (targetMemberTeamId) {
      setFilterMemberTeamId(targetMemberTeamId);
    }
  }, [targetMemberTeamId]);

  // Danh sách cán bộ thành viên để Tổ trưởng chọn 01 người trong tổ thực hiện
  const memberStaffOptions = useMemo(() => {
    if (!currentProject) return [];
    const activeTeamId = targetMemberTeamId || (filterMemberTeamId !== "ALL" ? filterMemberTeamId : undefined);

    // Nếu đã xác định được tổ chuyên môn cụ thể: hiển thị trực tiếp danh sách các cán bộ thuộc đúng tổ đó
    if (activeTeamId) {
      const team = data.teams.find((t) => t.id === activeTeamId);
      const teamStaff = data.staff.filter((person) => person.teamId === activeTeamId);

      const sortedStaff = [...teamStaff].sort((a, b) => {
        if (currentStaffId && a.id === currentStaffId) return -1;
        if (currentStaffId && b.id === currentStaffId) return 1;
        if (team && a.id === team.leaderId) return -1;
        if (team && b.id === team.leaderId) return 1;
        return a.name.localeCompare(b.name, "vi");
      });

      return sortedStaff.map((person) => {
        const workload = getWorkload(person.id, data.assignments);
        const isMe = currentStaffId && person.id === currentStaffId;
        const isLeader = team && person.id === team.leaderId;
        const roleBadge = isMe
          ? " · (Chính tôi)"
          : isLeader
          ? " · [Tổ trưởng]"
          : "";
        const inProjectBadge = projectMemberIds.has(person.id)
          ? " · [Đã trong dự án]"
          : "";

        return {
          value: person.id,
          teamId: person.teamId,
          disabled: !person.accountActive,
          label: `${person.name} – ${person.title}${roleBadge}${inProjectBadge} · ${workload} việc đang làm`,
        };
      });
    }

    // Trường hợp chưa lọc tổ cụ thể (ví dụ Admin tạo): gom nhóm theo tổ
    return data.teams
      .filter((t) => t.id !== "BGD")
      .map((team) => {
        const teamStaff = data.staff.filter((person) => person.teamId === team.id);
        if (teamStaff.length === 0) return null;

        const sortedStaff = [...teamStaff].sort((a, b) => {
          if (currentStaffId && a.id === currentStaffId) return -1;
          if (currentStaffId && b.id === currentStaffId) return 1;
          if (a.id === team.leaderId) return -1;
          if (b.id === team.leaderId) return 1;
          return a.name.localeCompare(b.name, "vi");
        });

        return {
          label: `${team.name} (${teamStaff.length} cán bộ trong tổ)`,
          options: sortedStaff.map((person) => {
            const workload = getWorkload(person.id, data.assignments);
            const isMe = currentStaffId && person.id === currentStaffId;
            const isLeader = person.id === team.leaderId;
            const roleBadge = isMe
              ? " · (Chính tôi)"
              : isLeader
              ? " · [Tổ trưởng]"
              : "";
            const inProjectBadge = projectMemberIds.has(person.id)
              ? " · [Đã trong dự án]"
              : "";

            return {
              value: person.id,
              teamId: team.id,
              disabled: !person.accountActive,
              label: `${person.name} – ${person.title}${roleBadge}${inProjectBadge} · ${workload} việc đang làm`,
            };
          }),
        };
      })
      .filter((group): group is { label: string; options: any[] } => group !== null);
  }, [
    currentProject,
    targetMemberTeamId,
    filterMemberTeamId,
    data.teams,
    data.staff,
    data.assignments,
    projectMemberIds,
    currentStaffId,
  ]);

  // Danh sách các bước thủ tục chi tiết thuộc giai đoạn được chọn
  const procedureStepOptions = useMemo(() => {
    if (!currentGroupCode) return [];
    return MASTER_PROCEDURE_STEPS
      .filter((s) => s.groupCode === currentGroupCode)
      .map((s) => ({
        value: s.code,
        label: `[Bước ${s.code}] ${s.name} (${s.responsibleUnit})`,
        step: s,
      }));
  }, [currentGroupCode]);

  // Bước thủ tục mặc định ban đầu
  const initialStep = useMemo(() => {
    if (editing?.stepCode) {
      return MASTER_PROCEDURE_STEPS.find((s) => s.code === editing.stepCode);
    }
    if (assignmentLevel === "TASK_MEMBER" && initialStage) {
      return MASTER_PROCEDURE_STEPS.find((s) => s.groupCode === initialStage);
    }
    return undefined;
  }, [editing, assignmentLevel, initialStage]);

  const hasNoAssignedStage =
    assignmentLevel === "TASK_MEMBER" &&
    (isTeamLeader || !isProjectLeader) &&
    availableStageGroups.length === 0;

  // Tự động đồng bộ stage & step khi chọn dự án khác
  useEffect(() => {
    if (!editing) {
      if (assignmentLevel === "TASK_MEMBER" && (isTeamLeader || !isProjectLeader)) {
        if (availableStageGroups.length > 0) {
          if (!selectedStage || !availableStageGroups.some((g) => g.value === selectedStage)) {
            const nextStage = availableStageGroups[0].value;
            setSelectedStage(nextStage);
            form.setFieldValue("stage", nextStage);

            const stepsInGroup = MASTER_PROCEDURE_STEPS.filter((s) => s.groupCode === nextStage);
            if (stepsInGroup.length > 0) {
              const firstStep = stepsInGroup[0];
              form.setFieldValue("stepCode", firstStep.code);
              form.setFieldValue("title", `Thực hiện [Bước ${firstStep.code}] ${firstStep.name}`);
            } else {
              form.setFieldValue("stepCode", undefined);
            }
          }
        } else {
          setSelectedStage(undefined);
          form.setFieldValue("stage", undefined);
          form.setFieldValue("stepCode", undefined);
          form.setFieldValue("title", "");
        }
      }
    }
  }, [
    modalProjectId,
    availableStageGroups,
    selectedStage,
    editing,
    assignmentLevel,
    isTeamLeader,
    isProjectLeader,
    form,
  ]);

  // Theo dõi khi đổi level để cập nhật form
  useEffect(() => {
    if (!editing) {
      if (assignmentLevel === "PHASE_LEAD") {
        const firstLeader = teamLeaderOptions[0];
        if (firstLeader?.leaderId) {
          form.setFieldValue("assigneeId", firstLeader.leaderId);
          form.setFieldValue("teamId", firstLeader.teamId);
          form.setFieldValue("teamLeaderId", firstLeader.leaderId);
        }
        form.setFieldValue("stepCode", undefined);
        const stageObj = PROCEDURE_STAGE_GROUPS.find((g) => g.value === (selectedStage || "VI"));
        form.setFieldValue(
          "title",
          `Chỉ đạo và thực hiện [${stageObj?.label || "Giai đoạn VI"}] ${stageObj?.fullName || ""}`.trim(),
        );
      } else {
        form.setFieldValue("assigneeId", undefined);
        if (selectedStage) {
          const stepsInGroup = MASTER_PROCEDURE_STEPS.filter((s) => s.groupCode === selectedStage);
          const currentStepCode = form.getFieldValue("stepCode");
          const isCurrentStepInGroup = stepsInGroup.some((s) => s.code === currentStepCode);
          if (!isCurrentStepInGroup && stepsInGroup.length > 0) {
            const nextStep = stepsInGroup[0];
            form.setFieldValue("stepCode", nextStep.code);
            form.setFieldValue("title", `Thực hiện [Bước ${nextStep.code}] ${nextStep.name}`);
          }
        }
      }
    }
  }, [editing, assignmentLevel, teamLeaderOptions, form, selectedStage]);

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        ...editing,
        stage: initialStage,
        dueDate: editing.dueDate ? editing.dueDate.slice(0, 10) : undefined,
      });
      if (editing.stage) {
        setSelectedStage(normalizeStageGroup(editing.stage, editing.stepCode));
      }
    }
  }, [editing, form, initialStage]);

  const handleFinish = async (values: AssignmentInput) => {
    if (hasNoAssignedStage) return;
    setSubmitting(true);
    try {
      const stepDef = values.stepCode
        ? MASTER_PROCEDURE_STEPS.find((s) => s.code === values.stepCode)
        : undefined;

      // Xác định teamId và teamLeaderId phù hợp
      let assignedTeamId = values.teamId;
      let assignedLeaderId = values.teamLeaderId;

      if (assignmentLevel === "PHASE_LEAD") {
        const leaderOpt = teamLeaderOptions.find((opt) => opt.value === values.assigneeId);
        if (leaderOpt) {
          assignedTeamId = leaderOpt.teamId;
          assignedLeaderId = leaderOpt.leaderId;
        }
      } else {
        const parentObj = editing?.parentAssignmentId
          ? data.assignments.find((a) => a.id === editing.parentAssignmentId)
          : selectedParentPhaseAssignment;
        const staffObj = data.staff.find((s) => s.id === values.assigneeId);
        assignedTeamId = parentObj?.teamId || targetMemberTeamId || staffObj?.teamId;
        const staffTeam = data.teams.find((t) => t.id === assignedTeamId);
        assignedLeaderId = staffTeam?.leaderId;
      }

      const stageObj = PROCEDURE_STAGE_GROUPS.find((g) => g.value === values.stage);

      const payload: AssignmentInput = {
        ...values,
        stepCode: assignmentLevel === "PHASE_LEAD" ? undefined : values.stepCode,
        stepName: assignmentLevel === "PHASE_LEAD"
          ? (stageObj ? stageObj.fullName : undefined)
          : (stepDef ? stepDef.name : values.stepName),
        coAssigneeIds: undefined,
        teamId: assignedTeamId,
        teamLeaderId: assignedLeaderId,
        parentAssignmentId:
          assignmentLevel === "TASK_MEMBER"
            ? (editing?.parentAssignmentId || defaultParentAssignmentId || selectedParentPhaseAssignment?.id)
            : undefined,
        assignmentLevel,
        assignedByRole: assignmentLevel === "PHASE_LEAD" ? "PROJECT_LEAD" : "TEAM_LEAD",
        priority: values.priority || editing?.priority || "NORMAL",
        dueDate: values.dueDate || editing?.dueDate || addDays(todayIso(), 30),
      };

      const success = editing
        ? await onUpdate(editing.id, payload)
        : await onCreate(payload);
      if (success) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open
      destroyOnClose
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-3 px-1 py-1">
          <Button
            intent="primary"
            onClick={() => form.submit()}
            loading={submitting}
            disabled={hasNoAssignedStage}
          >
            {editing
              ? "Lưu thay đổi"
              : assignmentLevel === "PHASE_LEAD"
              ? "Giao giai đoạn cho Tổ trưởng"
              : "Giao việc cho thành viên"}
          </Button>
          <Button intent="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex flex-wrap items-center gap-2">
            <SafetyCertificateOutlined className="text-[#0F4C81]" />
            <span className="text-base font-bold text-[#102A43]">
              {editing
                ? "Điều chỉnh phân công nhiệm vụ"
                : assignmentLevel === "PHASE_LEAD"
                ? "Giao việc giai đoạn cho Tổ trưởng (Lead tổ)"
                : "Phân công nhiệm vụ cho Thành viên trong tổ"}
            </span>
          </span>
          <span className="mt-0.5 block text-xs font-normal text-slate-500">
            {currentProject
              ? `${currentProject.code} · ${currentProject.name}`
              : "Phân công nhiệm vụ giai đoạn công trình"}
          </span>
        </span>
      }
    >
      {errorText && (
        <aside
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-800"
        >
          <ExclamationCircleFilled className="mt-0.5 shrink-0 text-rose-500" />
          <span>
            <strong>Chưa thể lưu:</strong> {errorText}
          </span>
        </aside>
      )}

      {/* Thông tin lãnh đạo dự án */}
      {currentProject && (
        <dl className="m-0 mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <dt className="text-xs font-medium text-slate-500">Chủ nhiệm dự án (Chính)</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-teal-800">
              {data.staff.find((s) => s.id === currentProject.mainExecutorId)?.name ?? "Chưa phân công"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Giám sát chính</dt>
            <dd className="m-0 mt-0.5 text-[13px] font-semibold text-blue-800">
              {data.staff.find((s) => s.id === currentProject.mainSupervisorId)?.name ?? "Chưa phân công"}
            </dd>
          </div>
        </dl>
      )}

      {/* Banner hướng dẫn nghiệp vụ theo từng cấp */}
      {assignmentLevel === "PHASE_LEAD" ? (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <CrownOutlined className="text-blue-700" />
            <span>Chủ nhiệm dự án giao giai đoạn cho Tổ trưởng</span>
          </div>
          <p className="mt-1 text-blue-900/90 m-0">
            Chủ nhiệm dự án giao toàn bộ giai đoạn công trình cho <strong>Tổ trưởng (Lead tổ)</strong> chuyên môn phụ trách. Tổ trưởng sẽ chịu trách nhiệm phân công chi tiết và đôn đốc các thành viên trong tổ thực hiện.
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-teal-900">
            <TeamOutlined className="text-[#007A78]" />
            <span>Tổ trưởng phân công nhiệm vụ cho Thành viên</span>
          </div>
          <p className="mt-1 text-teal-900/90 m-0">
            Tổ trưởng phân công các nhiệm vụ chi tiết theo từng bước quy trình cho <strong>Cán bộ thành viên trong tổ</strong> của mình. Tổ trưởng sẽ trực tiếp theo dõi, đôn đốc và <strong>duyệt chấp nhận / từ chối hồ sơ</strong> khi thành viên hoàn thành.
          </p>
        </div>
      )}

      {/* Cảnh báo khi Tổ trưởng chưa được giao giai đoạn nào trong dự án này */}
      {hasNoAssignedStage && (
        <aside
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-2xs"
        >
          <ExclamationCircleFilled className="mt-0.5 shrink-0 text-amber-600 text-sm" />
          <div>
            <div className="font-bold text-amber-950">Chưa được giao giai đoạn trong dự án này</div>
            <div className="mt-1 leading-relaxed text-amber-900/90">
              Chủ nhiệm dự án chưa phân công giai đoạn nào cho Tổ của bạn trong dự án này.
              Tổ trưởng chỉ được phân công nhiệm vụ cho thành viên thuộc các giai đoạn đã được Chủ nhiệm dự án giao.
            </div>
          </div>
        </aside>
      )}

      <Form<AssignmentInput>
        form={form}
        layout="vertical"
        initialValues={
          editing
            ? {
                ...editing,
                stage: initialStage,
              }
            : {
                projectId: initialProjectId,
                stage: initialStage,
                stepCode: assignmentLevel === "PHASE_LEAD" ? undefined : initialStep?.code,
                title:
                  assignmentLevel === "PHASE_LEAD"
                    ? `Chỉ đạo và thực hiện [${PROCEDURE_STAGE_GROUPS.find((g) => g.value === (initialStage || "VI"))?.label || "Giai đoạn VI"}] ${PROCEDURE_STAGE_GROUPS.find((g) => g.value === (initialStage || "VI"))?.fullName || ""}`.trim()
                    : initialStep
                    ? `Thực hiện [Bước ${initialStep.code}] ${initialStep.name}`
                    : "",
                assigneeId:
                  assignmentLevel === "PHASE_LEAD"
                    ? teamLeaderOptions[0]?.leaderId
                    : undefined,
              }
        }
        onFinish={handleFinish}
      >
        <Form.Item
          name="projectId"
          label="Thuộc dự án"
          rules={[{ required: true, message: "Vui lòng chọn dự án." }]}
        >
          <Select
            placeholder="Chọn dự án"
            showSearch={{ optionFilterProp: "label" }}
            onChange={(val) => {
              setModalProjectId(val);
              form.setFieldValue("assigneeId", undefined);
            }}
            options={availableProjects.map((project) => ({
              value: project.id,
              label: `${project.code} · ${project.name}`,
            }))}
          />
        </Form.Item>

        {/* Giai đoạn dự án: Nếu là CNDA giao giai đoạn (PHASE_LEAD) -> CHỈ CẦN CHỌN GIAI ĐOẠN LỚN (không cần bước nhỏ) */}
        {assignmentLevel === "PHASE_LEAD" ? (
          <Form.Item
            name="stage"
            label="Giai đoạn dự án"
            rules={[{ required: true, message: "Vui lòng chọn giai đoạn dự án." }]}
          >
            <Select
              placeholder="Chọn giai đoạn thực hiện"
              onChange={(val) => {
                setSelectedStage(val);
                const stageObj = PROCEDURE_STAGE_GROUPS.find((g) => g.value === val);
                form.setFieldValue(
                  "title",
                  `Chỉ đạo và thực hiện [${stageObj?.label || val}] ${stageObj?.fullName || ""}`.trim(),
                );
              }}
              options={PROCEDURE_STAGE_GROUPS.map((s) => {
                const isAlreadyAssigned =
                  !editing && projectAssignedPhaseKeys.has(s.value);
                return {
                  value: s.value,
                  disabled: isAlreadyAssigned,
                  label: (
                    <div className="flex items-center justify-between gap-2 py-0.5">
                      <div className="flex items-center gap-2">
                        <Tag color={s.color} className="m-0 text-xs px-1.5 py-0.2 font-medium shrink-0">
                          {s.label}
                        </Tag>
                        <span className={`text-xs ${isAlreadyAssigned ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {s.fullName}
                        </span>
                      </div>
                      {isAlreadyAssigned && (
                        <Tag color="default" className="m-0 text-[10px] px-1 text-slate-400 shrink-0">
                          Đã phân công
                        </Tag>
                      )}
                    </div>
                  ),
                };
              })}
            />
          </Form.Item>
        ) : (
          /* Nếu là Tổ trưởng giao việc cho thành viên -> Có cả Giai đoạn & Bước thủ tục chi tiết: CHỈ HIỂN THỊ CÁC GIAI ĐOẠN ĐƯỢC GIAO */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="stage"
              label={
                <span className="flex items-center gap-1.5">
                  <span>Giai đoạn dự án</span>
                  {(isTeamLeader || !isProjectLeader) && availableStageGroups.length > 0 && (
                    <span className="text-[11px] font-normal text-emerald-700">
                      (Được CNDA giao)
                    </span>
                  )}
                </span>
              }
              extra={
                (isTeamLeader || !isProjectLeader) && availableStageGroups.length > 0
                  ? `Chỉ hiển thị ${availableStageGroups.length} giai đoạn do Chủ nhiệm dự án giao cho Tổ.`
                  : undefined
              }
              rules={[{ required: true, message: "Vui lòng chọn giai đoạn." }]}
            >
              <Select
                placeholder={
                  hasNoAssignedStage
                    ? "Tổ chưa được CNDA giao giai đoạn nào trong dự án này"
                    : "Chọn giai đoạn thực hiện"
                }
                disabled={hasNoAssignedStage}
                onChange={(val) => {
                  setSelectedStage(val);
                  const groupCode = normalizeStageGroup(val);
                  const stepsInGroup = MASTER_PROCEDURE_STEPS.filter((s) => s.groupCode === groupCode);
                  const currentStepCode = form.getFieldValue("stepCode");
                  const isCurrentStepInGroup = stepsInGroup.some((s) => s.code === currentStepCode);

                  if (!isCurrentStepInGroup && stepsInGroup.length > 0) {
                    const nextStep = stepsInGroup[0];
                    form.setFieldValue("stepCode", nextStep.code);
                    form.setFieldValue("title", `Thực hiện [Bước ${nextStep.code}] ${nextStep.name}`);
                  }
                }}
                options={availableStageGroups.map((s) => ({
                  value: s.value,
                  label: (
                    <div className="flex items-center gap-2 py-0.5">
                      <Tag color={s.color} className="m-0 text-xs px-1.5 py-0.2 font-medium shrink-0">
                        {s.label}
                      </Tag>
                      <span className="text-xs text-slate-700">{s.fullName}</span>
                    </div>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item
              name="stepCode"
              label="Bước thủ tục chi tiết"
              rules={[{ required: true, message: "Vui lòng chọn bước thủ tục chi tiết." }]}
            >
              <Select
                placeholder={
                  !selectedStage
                    ? "Vui lòng chọn giai đoạn trước"
                    : `Chọn bước thủ tục thuộc ${PROCEDURE_STAGE_GROUPS.find((g) => g.value === currentGroupCode)?.label || "giai đoạn"}`
                }
                disabled={hasNoAssignedStage || !selectedStage}
                showSearch={{ optionFilterProp: "label" }}
                options={procedureStepOptions}
                onChange={(val) => {
                  const step = MASTER_PROCEDURE_STEPS.find((s) => s.code === val);
                  if (step) {
                    form.setFieldValue("title", `Thực hiện [Bước ${step.code}] ${step.name}`);
                  }
                }}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          name="title"
          label={
            assignmentLevel === "PHASE_LEAD"
              ? "Nội dung giai đoạn giao cho Tổ trưởng"
              : "Nội dung nhiệm vụ cụ thể cho thành viên"
          }
          rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung nhiệm vụ." }]}
        >
          <Input
            placeholder={
              assignmentLevel === "PHASE_LEAD"
                ? "Ví dụ: Chỉ đạo tổ chức thi công và giám sát kỹ thuật kè biển Giai đoạn VI"
                : "Ví dụ: Giám sát kỹ thuật thi công móng kè và nghiệm thu thép đợt 1"
            }
          />
        </Form.Item>

        {/* Khối chọn Cán bộ phụ trách: PHÂN BIỆT RÕ THEO CẤP ĐỘ GIAO VIỆC */}
        {assignmentLevel === "PHASE_LEAD" ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 mb-4">
            <Form.Item
              name="assigneeId"
              label={
                <span className="flex items-center gap-1.5 font-bold text-blue-900">
                  <CrownOutlined className="text-blue-600" />
                  <span>Tổ chuyên môn & Tổ trưởng (Lead tổ) phụ trách</span>
                  <Tag color="blue" className="m-0 text-[11px] font-semibold">
                    Chỉ định Tổ trưởng
                  </Tag>
                </span>
              }
              extra="Chủ nhiệm dự án giao toàn quyền điều phối giai đoạn này cho Tổ trưởng của tổ chuyên môn."
              rules={[{ required: true, message: "Vui lòng chọn Tổ trưởng phụ trách." }]}
              className="mb-0"
            >
              <Select
                placeholder="Chọn Tổ trưởng phụ trách giai đoạn..."
                showSearch={{ optionFilterProp: "label" }}
                options={teamLeaderOptions}
                onChange={(val) => {
                  const opt = teamLeaderOptions.find((o) => o.value === val);
                  if (opt) {
                    form.setFieldValue("teamId", opt.teamId);
                    form.setFieldValue("teamLeaderId", opt.leaderId);
                  }
                }}
              />
            </Form.Item>
          </div>
        ) : (
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 mb-4">
            {/* Nếu là Admin/CNDA giao việc thành viên mà chưa xác định được tổ: cho phép lọc theo phòng ban */}
            {!targetMemberTeamId && (!isTeamLeader || !leadingTeamId) && (
              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lọc theo tổ chuyên môn của thành viên:
                </label>
                <Select
                  value={filterMemberTeamId}
                  onChange={(val) => {
                    setFilterMemberTeamId(val);
                    form.setFieldValue("assigneeId", undefined);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "ALL", label: "Tất cả tổ chuyên môn" },
                    ...data.teams
                      .filter((t) => t.id !== "BGD")
                      .map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>
            )}

            <Form.Item
              name="assigneeId"
              label={
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <UserOutlined className="text-[#007A78]" />
                  <span>
                    {targetMemberTeam
                      ? `Cán bộ thành viên phụ trách (${targetMemberTeam.name})`
                      : isTeamLeader
                      ? "Cán bộ thành viên phụ trách (Trong tổ của mình)"
                      : "Cán bộ thành viên phụ trách (Trong tổ chuyên môn)"}
                  </span>
                </span>
              }
              extra={
                targetMemberTeam
                  ? `Chỉ định cán bộ trong ${targetMemberTeam.name} để thực hiện nhiệm vụ chi tiết này.`
                  : "Tổ trưởng chỉ định cán bộ trong tổ của mình để thực hiện nhiệm vụ chi tiết này."
              }
              rules={[{ required: true, message: "Vui lòng chọn cán bộ thành viên thực hiện." }]}
              className="mb-0"
            >
              <Select
                placeholder={
                  targetMemberTeam
                    ? `Chọn thành viên trong ${targetMemberTeam.name}...`
                    : "Chọn thành viên thực hiện..."
                }
                showSearch={{ optionFilterProp: "label" }}
                options={memberStaffOptions}
              />
            </Form.Item>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item name="dueDate" label="Hạn hoàn thành">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select
              options={[
                { value: "NORMAL", label: "Bình thường" },
                { value: "HIGH", label: "Ưu tiên cao / Khẩn cấp" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="note"
          label={
            assignmentLevel === "PHASE_LEAD"
              ? "Chỉ đạo / Hướng dẫn của CNDA gửi Tổ trưởng"
              : "Ghi chú hướng dẫn cho cán bộ thành viên"
          }
        >
          <Input.TextArea
            rows={2}
            placeholder={
              assignmentLevel === "PHASE_LEAD"
                ? "Ví dụ: Đề nghị Tổ trưởng phân công cán bộ kỹ thuật bám sát hiện trường và báo cáo trước thứ 6 hàng tuần"
                : "Ví dụ: Phối hợp tư vấn giám sát nghiệm thu tại hiện trường, gửi biên bản trước 16h"
            }
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
