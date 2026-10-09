"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertOutlined,
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
  CrownOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  FilterOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UsergroupAddOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { App, Radio } from "antd";
import { MASTER_PROCEDURE_STEPS } from "@/features/construction-procedures/constants/procedure-steps-master";
import GrantActingDirectorModal from "./GrantActingDirectorModal";
import ProjectPermissionsModal from "./ProjectPermissionsModal";
import ProjectTeamModal from "./ProjectTeamModal";
import UrgeMemberModal from "./UrgeMemberModal";
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { cn } from "@/utils/cn";
import { formatDateVi } from "@/utils/date";
import { getInitials } from "@/utils/initials";
import {
  ASSIGNMENT_FILTER_LABELS,
  ASSIGNMENT_STATUS_META,
  PRIORITY_META,
  PROJECT_STAGE_META,
  PROJECT_STAGES,
  normalizeStageGroup,
} from "../constants/personnel-labels";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type {
  Assignment,
  AssignmentFilter,
  PersonnelProject,
  TeamId,
} from "../types/personnel.types";
import { isDueSoon, isOverdue, matchesAssignmentFilter } from "../utils/personnel-rules";

interface AssignmentTabProps {
  controller: PersonnelController;
  filter: AssignmentFilter;
  onFilterChange: (filter: AssignmentFilter) => void;
  selectedProjectId?: string;
  onSelectProjectChange?: (projectId: string | undefined) => void;
  onAssignLeadership?: (project?: PersonnelProject) => void;
  onCreate: (
    defaultProjectId?: string,
    initialLevel?: "PHASE_LEAD" | "TASK_MEMBER",
    defaultStage?: string,
    parentAssignmentId?: string,
    initialTeamId?: TeamId,
  ) => void;
  onEdit: (assignment: Assignment) => void;
  onOpenDetail: (assignment: Assignment) => void;
  viewScope?: "ALL" | "MY_TASKS" | "PROJECT_LEAD" | "TEAM_LEAD" | "TEAM_DELEGATION";
}

const FILTER_ORDER: AssignmentFilter[] = [
  "ALL",
  "OVERDUE",
  "DUE_SOON",
  "PENDING_APPROVAL",
  "IN_PROGRESS",
  "DONE",
];

const PAGE_SIZE = 10;

/** Màu chỉ báo dot cho trạng thái dự án (đơn giản, chuyên nghiệp) */
function getProjectStatusDotColor(status?: string): string {
  switch (status) {
    case "Đã hoàn thành":
      return "bg-emerald-500";
    case "Đang thi công":
      return "bg-blue-500";
    case "Bồi thường GPMB":
      return "bg-amber-500";
    case "Thiết kế BVTC":
      return "bg-cyan-500";
    case "Đấu thầu XL":
      return "bg-indigo-500";
    case "Chuẩn bị ĐT":
    default:
      return "bg-slate-400";
  }
}

export default function AssignmentTab({
  controller,
  filter,
  onFilterChange,
  selectedProjectId,
  onSelectProjectChange,
  onAssignLeadership,
  onCreate,
  onEdit,
  onOpenDetail,
  viewScope = "ALL",
}: AssignmentTabProps) {
  const { modal } = App.useApp();
  const { assignments, data, today, permissions } = controller;
  const canAssignLeaders = permissions.canAssignProjectLeaders;
  const canAssignTasks = permissions.canAssignStaffTasks;
  const isDirector = Boolean(canAssignLeaders || permissions.canGrantRole);
  const isMember = Boolean(permissions.isMember || (!canAssignLeaders && !canAssignTasks));

  // Xác định cán bộ hiện tại
  const currentStaff = useMemo(() => {
    if (!controller.currentUser) return undefined;
    const name = (controller.currentUser.displayName || controller.currentUser.name || "").trim().toLowerCase();
    const email = (controller.currentUser.email || "").trim().toLowerCase();
    return data.staff.find(
      (s) => s.id === controller.currentUser?.id || (email && s.email.toLowerCase() === email) || (name && s.name.toLowerCase() === name)
    );
  }, [controller.currentUser, data.staff]);
  const currentStaffId = currentStaff?.id;

  // Xác định xem cán bộ hiện tại có phải là Tổ trưởng (Lead tổ) không:
  const myLeadingTeam = useMemo(() => {
    if (!currentStaffId) return undefined;
    return data.teams.find((t) => t.leaderId === currentStaffId && t.id !== "BGD");
  }, [currentStaffId, data.teams]);
  const isTeamLeader = Boolean(myLeadingTeam || permissions.isTeamLeader);
  const myLeadingTeamId = myLeadingTeam?.id || permissions.leadingTeamId;

  // Xác định vai trò của cán bộ trong từng dự án cụ thể (linh động: có thể dự án này là Lead, dự án khác là Member)
  const getProjectRole = useCallback(
    (projectId: string): "LEAD" | "MEMBER" | "SUPERVISOR" | "ADMIN" => {
      if (isDirector) return "ADMIN";
      const proj = data.projects.find((p) => p.id === projectId);
      if (!proj) return "MEMBER";
      const isLead =
        ((proj.actingDirectorId === currentStaffId || proj.mainExecutorId === currentStaffId) && !proj.cndaRevoked) ||
        (permissions.actingProjectIds?.includes(projectId) ?? false);
      if (isLead) return "LEAD";
      if (proj.mainSupervisorId === currentStaffId) return "SUPERVISOR";
      return "MEMBER";
    },
    [isDirector, data.projects, currentStaffId, permissions.actingProjectIds],
  );

  const [assignmentMode, setAssignmentMode] = useState<"leaders" | "tasks">(() => {
    if (canAssignLeaders && !canAssignTasks) return "leaders";
    return "tasks";
  });

  useEffect(() => {
    if (canAssignLeaders && !canAssignTasks) {
      setAssignmentMode("leaders");
    } else {
      setAssignmentMode("tasks");
    }
  }, [canAssignLeaders, canAssignTasks]);

  // Gửi duyệt nghiệm thu nhiệm vụ từ phía Cán bộ thực hiện
  const handleConfirmMemberCompletion = (assignment: Assignment) => {
    const isPhase = assignment.assignmentLevel === "PHASE_LEAD";
    const approverText =
      isPhase || assignment.assignedByRole === "PROJECT_LEAD"
        ? "Chủ nhiệm dự án"
        : "Tổ trưởng chuyên môn";

    modal.confirm({
      width: 460,
      centered: true,
      title: "Gửi báo cáo hoàn thành & yêu cầu nghiệm thu?",
      icon: null,
      content: (
        <div className="space-y-2.5 pt-1 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 space-y-1">
            <div className="font-bold text-slate-900">{assignment.title}</div>
            <div className="text-[11px] text-slate-500">
              Dự án: {data.projects.find((p) => p.id === assignment.projectId)?.name} · Hạn: {formatDateVi(assignment.dueDate)}
            </div>
            {assignment.submissions && assignment.submissions.length > 0 && (
              <div className="text-[11px] text-emerald-700 font-medium">
                Đã đính kèm {assignment.submissions.length} hồ sơ/tài liệu
              </div>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            Bạn có chắc chắn đã hoàn thành toàn bộ nội dung công việc và muốn gửi hồ sơ trình <strong>{approverText}</strong> xem xét nghiệm thu?
          </p>
        </div>
      ),
      okText: "Gửi duyệt nghiệm thu",
      cancelText: "Hủy",
      okButtonProps: {
        className: "!bg-[#007A78] hover:!bg-[#006361] !border-[#007A78] !text-white text-xs font-semibold h-8 px-4",
      },
      cancelButtonProps: {
        className: "text-xs font-medium h-8 px-4",
      },
      onOk: async () => {
        await controller.requestCompletion(assignment.id);
      },
    });
  };

  const handleStartAssignment = async (assignment: Assignment) => {
    await controller.startAssignment(assignment.id);
  };

  // Modals for Acting Director and Project Team
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantProject, setGrantProject] = useState<PersonnelProject | undefined>();
  const [teamModalProject, setTeamModalProject] = useState<PersonnelProject | undefined>();
  const [projectPermissionsModalOpen, setProjectPermissionsModalOpen] = useState(false);
  const [projectPermissionsTargetProjectId, setProjectPermissionsTargetProjectId] = useState<string | undefined>();

  // Modal Đôn đốc thành viên
  const [urgeModalOpen, setUrgeModalOpen] = useState(false);
  const [urgeProject, setUrgeProject] = useState<PersonnelProject | undefined>();
  const [urgeAssignment, setUrgeAssignment] = useState<Assignment | undefined>();
  const [urgeStaff, setUrgeStaff] = useState<any | undefined>();

  // Modal Từ chối nghiệm thu
  const [rejectTarget, setRejectTarget] = useState<Assignment | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modal Trình Ban Giám đốc (dành cho CNDA)
  const [submitDirectorModalOpen, setSubmitDirectorModalOpen] = useState(false);
  const [submitTargetRole, setSubmitTargetRole] = useState<"GIAM_DOC" | "PHO_GIAM_DOC">("GIAM_DOC");
  const [submitTargetStaffId, setSubmitTargetStaffId] = useState<string>("ST-001");
  const [submitNote, setSubmitNote] = useState<string>(
    "Kính trình Ban Giám đốc xem xét phê duyệt hoàn thành toàn bộ các giai đoạn thực hiện của dự án, nghiệm thu toàn diện công trình và cho phép chuyển sang giai đoạn quyết toán theo quy định."
  );

  // Modal Ban Giám đốc Phê duyệt / Từ chối (Duyệt kết thúc dự án)
  const [directorReviewModalOpen, setDirectorReviewModalOpen] = useState(false);
  const [directorReviewAction, setDirectorReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [directorReviewNote, setDirectorReviewNote] = useState<string>("");
  const [reviewTargetProject, setReviewTargetProject] = useState<PersonnelProject | null>(null);

  const handleOpenUrge = (params: {
    project?: PersonnelProject;
    assignment?: Assignment;
    staff?: any;
  }) => {
    setUrgeProject(params.project);
    setUrgeAssignment(params.assignment);
    setUrgeStaff(params.staff);
    setUrgeModalOpen(true);
  };

  const canManageRole = permissions.canGrantRole ?? true;

  const confirmRevokeRole = (project: PersonnelProject) => {
    const actingPerson = data.staff.find(
      (s) => s.id === (project.actingDirectorId || project.mainExecutorId)
    );
    modal.confirm({
      width: 490,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-lg shadow-xs">
              <AlertOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Thu hồi quyền Chủ nhiệm dự án?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Xác nhận rút quyền điều hành dự án của cán bộ đương nhiệm
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium shrink-0">Dự án áp dụng:</span>
              <span className="font-semibold text-slate-800 text-right truncate" title={project.name}>
                {project.code} · {project.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
              <span className="text-slate-500 font-medium shrink-0">Cán bộ thu hồi:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                {actingPerson?.name ?? "Chưa xác định"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <InfoCircleOutlined className="text-amber-600 mt-0.5 shrink-0 text-sm" />
            <div>
              <strong className="font-semibold text-amber-950">Lưu ý:</strong> Sau khi thu hồi, đồng chí này sẽ không còn quyền điều hành, không thể quản lý tổ công tác, giao việc hay đôn đốc tiến độ dự án này.
            </div>
          </div>
        </div>
      ),
      okText: "Thu hồi quyền CNDA",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!border-slate-400",
      },
      onOk: () => controller.revokeActingDirector(project.id),
    });
  };

  const handleRestoreCnda = (project: PersonnelProject) => {
    const targetStaffId = project.mainExecutorId;
    if (!targetStaffId) return;
    const targetPerson = data.staff.find((s) => s.id === targetStaffId);
    modal.confirm({
      width: 490,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-[#0F4C81] text-lg shadow-xs">
              <SafetyCertificateOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Cấp lại quyền Chủ nhiệm dự án?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Khôi phục lại toàn quyền điều hành công trình cho cán bộ
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium shrink-0">Dự án áp dụng:</span>
              <span className="font-semibold text-slate-800 text-right truncate" title={project.name}>
                {project.code} · {project.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
              <span className="text-slate-500 font-medium shrink-0">Cán bộ cấp lại:</span>
              <span className="font-bold text-[#0F4C81] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {targetPerson?.name ?? "Chưa xác định"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <CheckOutlined className="text-emerald-600 mt-0.5 shrink-0 text-sm" />
            <div>
              <strong className="font-semibold text-emerald-950">Xác nhận:</strong> Cán bộ sẽ được kích hoạt lại toàn quyền quản lý tổ công tác, phân công nhiệm vụ và đôn đốc tiến độ dự án này.
            </div>
          </div>
        </div>
      ),
      okText: "Cấp lại quyền CNDA",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-[#0F4C81] hover:!bg-[#0D3F6C] !border-[#0F4C81] !text-white !shadow-xs",
      },
      cancelText: "Đóng",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!border-slate-400",
      },
      onOk: () =>
        controller.grantActingDirector({
          projectId: project.id,
          staffId: targetStaffId,
          assignedBy: permissions.roleTitle,
          note: "Ban Giám đốc khôi phục quyền Chủ nhiệm dự án.",
        }),
    });
  };

  // State for Director View
  const [projectSearch, setProjectSearch] = useState("");
  const [directorPage, setDirectorPage] = useState(1);

  // State for Supervisor View
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [assignmentSearch, setAssignmentSearch] = useState<string>("");
  const [supervisorPage, setSupervisorPage] = useState(1);


  /* =======================================================================
   * DIRECTOR VIEW LOGIC (Dự án & Phân công Lãnh đạo dự án)
   * ======================================================================= */
  const filteredProjects = useMemo(() => {
    let list = data.projects;
    if (permissions.isProjectLeader && permissions.actingProjectIds) {
      const allowed = new Set(permissions.actingProjectIds);
      list = list.filter((p) => allowed.has(p.id));
    }
    const q = projectSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.note && p.note.toLowerCase().includes(q)),
    );
  }, [data.projects, projectSearch, permissions.isProjectLeader, permissions.actingProjectIds]);

  const paginatedProjects = useMemo(() => {
    const start = (directorPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, directorPage]);

  const projectColumns: ColumnsType<PersonnelProject> = [
    {
      title: "Mã & Tên dự án",
      key: "code",
      width: "28%",
      render: (_, p) => {
        const taskCount = assignments.filter((a) => a.projectId === p.id).length;
        return (
          <span className="block pr-2">
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                {p.code}
              </span>
              {taskCount > 0 && (
                canAssignTasks ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProjectChange?.(p.id);
                      setAssignmentMode("tasks");
                    }}
                    className="cursor-pointer text-[11px] font-medium text-[#0F4C81] hover:underline"
                    title="Xem và phân công nhiệm vụ của dự án này"
                  >
                    · {taskCount} nhiệm vụ
                  </button>
                ) : (
                  <span
                    className="text-[11px] font-medium text-slate-500"
                    title="Số nhiệm vụ do Chủ nhiệm dự án phân công"
                  >
                    · {taskCount} nhiệm vụ
                  </span>
                )
              )}
            </span>
            <span className="mt-0.5 block text-[13px] font-semibold text-slate-900 leading-snug">
              {p.name}
            </span>
            {(p.startDate || p.endDate) && (
              <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <CalendarOutlined className="text-slate-400" />
                <span>
                  {p.startDate ? formatDateVi(p.startDate) : "—"} → {p.endDate ? formatDateVi(p.endDate) : "—"}
                </span>
              </span>
            )}
          </span>
        );
      },
    },
    {
      title: "Tình trạng dự án",
      key: "status",
      width: "14%",
      render: (_, p) => {
        const projectPhases = data.assignments.filter(
          (a) => a.projectId === p.id && a.assignmentLevel === "PHASE_LEAD"
        );
        const isAllPhasesDone = projectPhases.length > 0 && projectPhases.every((a) => a.status === "DONE");

        let statusText = p.status ?? "Đang thi công";
        if (p.directorApprovalStatus === "APPROVED") {
          statusText = "Đã hoàn thành";
        } else if (p.directorApprovalStatus === "REJECTED") {
          statusText = "Yêu cầu hoàn thiện";
        } else if (isAllPhasesDone || p.directorApprovalStatus === "PENDING") {
          statusText = "Chờ BGĐ phê duyệt";
        }

        const dotColor = getProjectStatusDotColor(statusText);
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span>{statusText}</span>
          </span>
        );
      },
    },
    {
      title: "Người thực hiện chính",
      key: "mainExecutor",
      width: "24%",
      render: (_, p) => {
        const person = p.mainExecutorId
          ? data.staff.find((s) => s.id === p.mainExecutorId)
          : undefined;
        if (!person) {
          return <span className="text-xs italic text-slate-400">Chưa phân công</span>;
        }
        const team = data.teams.find((t) => t.id === person.teamId);
        return (
          <div className="min-w-0 pr-2">
            <div className="text-[13px] font-semibold text-slate-800 leading-tight">
              {person.name}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 leading-snug" title={`${person.title} · ${team?.name}`}>
              {person.title} · {team?.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Người giám sát chính",
      key: "mainSupervisor",
      width: "18%",
      render: (_, p) => {
        const person = p.mainSupervisorId
          ? data.staff.find((s) => s.id === p.mainSupervisorId)
          : undefined;
        if (!person) {
          return <span className="text-xs italic text-slate-400">Chưa phân công</span>;
        }
        const team = data.teams.find((t) => t.id === person.teamId);
        return (
          <div className="min-w-0 pr-2">
            <div className="text-[13px] font-medium text-slate-800 leading-tight">{person.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-snug" title={`${person.title} · ${team?.name}`}>
              {person.title} · {team?.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: "22%",
      align: "center",
      render: (_, p) => {
        const isAssigned = Boolean(p.mainExecutorId || p.mainSupervisorId);
        const hasMainExecutor = Boolean(p.mainExecutorId);
        const isCndaRevoked = Boolean(p.cndaRevoked);

        // Kiểm tra xem tất cả các giai đoạn của dự án này đã hoàn thành chưa
        const projectPhases = data.assignments.filter(
          (a) => a.projectId === p.id && a.assignmentLevel === "PHASE_LEAD"
        );
        const isAllPhasesDone = projectPhases.length > 0 && projectPhases.every((a) => a.status === "DONE");

        return (
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {/* Khi Ban Giám đốc xem và toàn bộ giai đoạn đã hoàn thành xong (100%) hoặc có tờ trình PENDING */}
            {isDirector && (isAllPhasesDone || p.directorApprovalStatus === "PENDING" || p.directorApprovalStatus === "APPROVED" || p.directorApprovalStatus === "REJECTED") && (
              <>
                {p.directorApprovalStatus === "APPROVED" ? (
                  <Tag color="success" className="px-2.5 py-1 font-semibold text-xs rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 m-0">
                    <CheckCircleOutlined className="mr-1" /> Đã nghiệm thu DA
                  </Tag>
                ) : p.directorApprovalStatus === "REJECTED" ? (
                  <>
                    <Tag color="error" className="px-2 py-0.5 font-semibold text-[11px] rounded-full m-0">
                      Yêu cầu làm lại
                    </Tag>
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={<CheckCircleOutlined />}
                      className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold"
                      onClick={() => handleOpenDirectorReview("APPROVE", p)}
                    >
                      Duyệt lại DA
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={<CheckCircleOutlined />}
                      className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold shadow-2xs"
                      onClick={() => handleOpenDirectorReview("APPROVE", p)}
                    >
                      Phê duyệt DA
                    </Button>
                    <Button
                      intent="outline"
                      scale="compact"
                      danger
                      icon={<CloseCircleOutlined />}
                      className="!border-rose-300 !text-rose-600 hover:!bg-rose-50 font-medium"
                      onClick={() => handleOpenDirectorReview("REJECT", p)}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Các thao tác phân công / thu hồi nhân sự khi dự án chưa hoàn thành toàn bộ */}
            {(!isDirector || (!isAllPhasesDone && !p.directorApprovalStatus)) && (
              <>
                {/* Trường hợp 1: Chưa phân công cán bộ nào */}
                {!isAssigned && (
                  <Button
                    intent="primary"
                    scale="compact"
                    icon={<SafetyCertificateOutlined />}
                    className="!w-[126px] !inline-flex !items-center !justify-center"
                    onClick={() => onAssignLeadership?.(p)}
                  >
                    Phân công
                  </Button>
                )}

                {/* Trường hợp 2: Đang có Chủ nhiệm dự án hoạt động bình thường */}
                {canManageRole && hasMainExecutor && !isCndaRevoked && (
                  <Tooltip title="Thu hồi quyền Chủ nhiệm dự án (rút quyền điều hành của cán bộ đương nhiệm)">
                    <Button
                      intent="outline"
                      scale="compact"
                      icon={<UserDeleteOutlined />}
                      className="!w-[126px] !inline-flex !items-center !justify-center !border-rose-300 !text-rose-700 hover:!bg-rose-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmRevokeRole(p);
                      }}
                    >
                      Thu hồi CNDA
                    </Button>
                  </Tooltip>
                )}

                {/* Trường hợp 3: Đã thu hồi quyền CNDA -> HIỆN ĐIỀU CHỈNH THAY THẾ & CẤP LẠI */}
                {canManageRole && isCndaRevoked && (
                  <>
                    <Tooltip title="Chỉ định cán bộ mới thay thế vị trí Chủ nhiệm dự án vừa thu hồi">
                      <Button
                        intent="primary"
                        scale="compact"
                        icon={<EditOutlined />}
                        className="!w-[126px] !inline-flex !items-center !justify-center"
                        onClick={() => onAssignLeadership?.(p)}
                      >
                        Điều chỉnh
                      </Button>
                    </Tooltip>
                    <Tooltip title="Khôi phục lại quyền Chủ nhiệm dự án cho cán bộ cũ">
                      <Button
                        intent="outline"
                        scale="compact"
                        icon={<SafetyCertificateOutlined />}
                        className="!w-[126px] !inline-flex !items-center !justify-center !border-slate-300 !text-[#0F4C81] hover:!bg-slate-50"
                        onClick={() => handleRestoreCnda(p)}
                      >
                        Cấp lại CNDA
                      </Button>
                    </Tooltip>
                  </>
                )}

                {/* Trường hợp đặc biệt: Dự án có Giám sát nhưng chưa có CNDA */}
                {isAssigned && !hasMainExecutor && (
                  <Button
                    intent="primary"
                    scale="compact"
                    icon={<EditOutlined />}
                    className="!w-[126px] !inline-flex !items-center !justify-center"
                    onClick={() => onAssignLeadership?.(p)}
                  >
                    Điều chỉnh
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  /* =======================================================================
   * SUPERVISOR VIEW LOGIC (Giao việc giai đoạn)
   * ======================================================================= */
  const accessibleProjects = useMemo(() => {
    if (isDirector) {
      return data.projects;
    }

    if (!currentStaffId) {
      return data.projects;
    }

    const allowedSet = new Set<string>();

    if (viewScope === "MY_TASKS") {
      data.assignments.forEach((a) => {
        if (
          a.assignmentLevel !== "PHASE_LEAD" &&
          (a.assigneeId === currentStaffId || (a.coAssigneeIds || []).includes(currentStaffId))
        ) {
          allowedSet.add(a.projectId);
        }
      });
      (permissions.memberProjectIds || []).forEach((id) => allowedSet.add(id));
      return data.projects.filter((p) => allowedSet.has(p.id));
    }

    if (viewScope === "PROJECT_LEAD") {
      (permissions.actingProjectIds || []).forEach((id) => allowedSet.add(id));
      data.projects.forEach((p) => {
        if ((p.actingDirectorId === currentStaffId || p.mainExecutorId === currentStaffId) && !p.cndaRevoked) {
          allowedSet.add(p.id);
        }
      });
      return data.projects.filter((p) => allowedSet.has(p.id));
    }

    if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
      if (isTeamLeader && myLeadingTeamId) {
        data.assignments.forEach((a) => {
          const assigneeStaff = data.staff.find((s) => s.id === a.assigneeId);
          if (
            a.teamId === myLeadingTeamId ||
            a.teamLeaderId === currentStaffId ||
            assigneeStaff?.teamId === myLeadingTeamId ||
            (a.assignmentLevel === "PHASE_LEAD" && (a.assigneeId === currentStaffId || a.teamId === myLeadingTeamId))
          ) {
            allowedSet.add(a.projectId);
          }
        });
        const teamMemberIds = new Set(data.staff.filter((s) => s.teamId === myLeadingTeamId).map((s) => s.id));
        data.projects.forEach((p) => {
          if ((p.teamMembers || []).some((mId) => teamMemberIds.has(mId))) {
            allowedSet.add(p.id);
          }
        });
      }
      return data.projects.filter((p) => allowedSet.has(p.id));
    }

    // 1. Dự án mà user làm Lead
    (permissions.actingProjectIds || []).forEach((id) => allowedSet.add(id));

    // 2. Dự án mà user làm Member
    (permissions.memberProjectIds || []).forEach((id) => allowedSet.add(id));

    // 3. Dự án có nhiệm vụ được giao (chính hoặc phối hợp)
    data.assignments.forEach((a) => {
      if (a.assigneeId === currentStaffId || (a.coAssigneeIds || []).includes(currentStaffId)) {
        allowedSet.add(a.projectId);
      }
    });

    // 4. Dự án trong danh sách tổ công tác hoặc làm Giám sát
    data.projects.forEach((p) => {
      if (
        p.actingDirectorId === currentStaffId ||
        p.mainExecutorId === currentStaffId ||
        p.mainSupervisorId === currentStaffId ||
        (p.teamMembers || []).includes(currentStaffId)
      ) {
        allowedSet.add(p.id);
      }
    });

    return data.projects.filter((p) => allowedSet.has(p.id));
  }, [
    data.projects,
    data.assignments,
    data.staff,
    isDirector,
    currentStaffId,
    viewScope,
    isTeamLeader,
    myLeadingTeamId,
    permissions.actingProjectIds,
    permissions.memberProjectIds,
  ]);

  const leadProjects = useMemo(
    () => accessibleProjects.filter((p) => getProjectRole(p.id) === "LEAD"),
    [accessibleProjects, getProjectRole],
  );

  const memberProjects = useMemo(
    () =>
      accessibleProjects.filter(
        (p) => getProjectRole(p.id) === "MEMBER" || getProjectRole(p.id) === "SUPERVISOR",
      ),
    [accessibleProjects, getProjectRole],
  );

  const defaultProjectId = useMemo(() => {
    if (isDirector) return data.projects[0]?.id;
    if (viewScope === "PROJECT_LEAD") return leadProjects[0]?.id || accessibleProjects[0]?.id;
    return accessibleProjects[0]?.id;
  }, [isDirector, viewScope, data.projects, leadProjects, accessibleProjects]);

  const activeProjectId = useMemo(() => {
    if (selectedProjectId && selectedProjectId !== "ALL") {
      if (!isDirector) {
        const allowed = new Set(accessibleProjects.map((p) => p.id));
        if (allowed.has(selectedProjectId)) {
          return selectedProjectId;
        }
      } else {
        return selectedProjectId;
      }
    }
    return defaultProjectId || "";
  }, [selectedProjectId, isDirector, accessibleProjects, defaultProjectId]);

  useEffect(() => {
    if ((!selectedProjectId || selectedProjectId === "ALL") && defaultProjectId) {
      onSelectProjectChange?.(defaultProjectId);
    }
  }, [selectedProjectId, defaultProjectId, onSelectProjectChange]);

  const currentProjectRole = useMemo(() => {
    if (!activeProjectId || activeProjectId === "ALL") return "ALL";
    return getProjectRole(activeProjectId);
  }, [activeProjectId, getProjectRole]);

  const canCreateTaskInCurrentView = useMemo(() => {
    if (viewScope === "MY_TASKS") return false;
    if (viewScope === "PROJECT_LEAD") return true;
    if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") return true;
    if (isDirector) return true;
    if (isTeamLeader) return true;
    if (activeProjectId !== "ALL") {
      return getProjectRole(activeProjectId) === "LEAD";
    }
    return leadProjects.length > 0;
  }, [viewScope, isDirector, isTeamLeader, activeProjectId, getProjectRole, leadProjects.length]);

  const activeProject = useMemo(() => {
    if (!activeProjectId || activeProjectId === "ALL") return undefined;
    return data.projects.find((p) => p.id === activeProjectId);
  }, [data.projects, activeProjectId]);

  const activeProjectPhaseAssignments = useMemo(() => {
    if (!activeProjectId || activeProjectId === "ALL") return [];
    return data.assignments.filter(
      (a) => a.projectId === activeProjectId && a.assignmentLevel === "PHASE_LEAD"
    );
  }, [data.assignments, activeProjectId]);

  const isAllPhasesDone = useMemo(() => {
    if (activeProjectPhaseAssignments.length === 0) return false;
    return activeProjectPhaseAssignments.every((a) => a.status === "DONE");
  }, [activeProjectPhaseAssignments]);

  const isCndaOfActiveProject = useMemo(() => {
    if (!activeProject) return false;
    const isLeadOfProj =
      ((activeProject.actingDirectorId === currentStaffId || activeProject.mainExecutorId === currentStaffId) &&
        !activeProject.cndaRevoked) ||
      (permissions.actingProjectIds?.includes(activeProject.id) ?? false);
    return isLeadOfProj || viewScope === "PROJECT_LEAD" || currentProjectRole === "LEAD";
  }, [activeProject, currentStaffId, permissions.actingProjectIds, viewScope, currentProjectRole]);

  const directorStaffList = useMemo(() => {
    return data.staff.filter(
      (s) => s.teamId === "BGD" || s.roleCode === "ADMIN" || s.roleCode === "DEPUTY_DIRECTOR"
    );
  }, [data.staff]);

  const handleOpenSubmitToDirector = () => {
    if (!activeProject) return;
    setSubmitTargetRole(activeProject.directorTargetRole || "GIAM_DOC");
    const matchedDirector = directorStaffList.find((s) => s.roleCode === "ADMIN");
    setSubmitTargetStaffId(matchedDirector?.id || directorStaffList[0]?.id || "ST-001");
    setSubmitNote(
      activeProject.directorSubmissionNote ||
        "Kính trình Ban Giám đốc xem xét phê duyệt hoàn thành toàn bộ các giai đoạn thực hiện của dự án, nghiệm thu toàn diện công trình và cho phép chuyển sang giai đoạn quyết toán theo quy định."
    );
    setSubmitDirectorModalOpen(true);
  };

  const handleSubmitProjectToDirector = async () => {
    if (!activeProject) return;
    const targetStaff = directorStaffList.find((s) => s.id === submitTargetStaffId);
    await controller.submitProjectToDirector({
      projectId: activeProject.id,
      targetRole: submitTargetRole,
      targetStaffName: targetStaff
        ? `${targetStaff.name} (${targetStaff.title})`
        : submitTargetRole === "GIAM_DOC"
        ? "Giám đốc"
        : "Phó Giám đốc",
      note: submitNote.trim(),
      submittedBy: controller.currentUser?.name || "Chủ nhiệm dự án",
    });
    setSubmitDirectorModalOpen(false);
  };

  const handleOpenDirectorReview = (action: "APPROVE" | "REJECT", targetProject?: PersonnelProject) => {
    const proj = targetProject || activeProject;
    if (!proj) return;
    setReviewTargetProject(proj);
    setDirectorReviewAction(action);
    setDirectorReviewNote(
      action === "APPROVE"
        ? "Ban Giám đốc chấp thuận kết quả nghiệm thu toàn bộ các giai đoạn của dự án. Giao Chủ nhiệm dự án phối hợp Tổ HCTH lập hồ sơ quyết toán vốn và bảo hành công trình theo đúng quy định."
        : ""
    );
    setDirectorReviewModalOpen(true);
  };

  const handleConfirmDirectorReview = async () => {
    const proj = reviewTargetProject || activeProject;
    if (!proj) return;
    const isApprove = directorReviewAction === "APPROVE";
    if (!isApprove && !directorReviewNote.trim()) {
      return;
    }
    const currentUserName = controller.currentUser?.name || "Lãnh đạo";
    await controller.reviewProjectDirector({
      projectId: proj.id,
      approved: isApprove,
      note: directorReviewNote.trim(),
      reviewedBy: permissions.roleTitle
        ? `${currentUserName} (${permissions.roleTitle})`
        : `${currentUserName} (Ban Giám đốc)`,
    });
    setDirectorReviewModalOpen(false);
    setReviewTargetProject(null);
  };

  const visibleStageAssignments = useMemo(() => {
    const rawList = assignments.filter((item) => {
      // Danh sách CNDA chỉ hiển thị giai đoạn; các bước con nằm trong chi tiết giai đoạn.
      if (viewScope === "PROJECT_LEAD" && item.assignmentLevel !== "PHASE_LEAD") return false;
      if (viewScope === "TEAM_LEAD" && item.assignmentLevel === "TASK_MEMBER" && item.parentAssignmentId) return false;

      if (activeProjectId && item.projectId !== activeProjectId) {
        return false;
      }
      if (viewScope === "MY_TASKS") {
        // Tab "Nhiệm vụ của tôi" chỉ dành cho nhiệm vụ cá nhân khi làm member (TASK_MEMBER)
        // Không hiển thị nhiệm vụ/giai đoạn của lead tổ (PHASE_LEAD)
        if (item.assignmentLevel === "PHASE_LEAD") return false;
        const isMine =
          item.assigneeId === currentStaffId ||
          (item.coAssigneeIds || []).includes(currentStaffId || "");
        if (!isMine) return false;
      } else if (viewScope === "PROJECT_LEAD") {
        const isLeadOfProject = (permissions.actingProjectIds || []).includes(item.projectId) || getProjectRole(item.projectId) === "LEAD";
        if (!isLeadOfProject) return false;
        // Bảng CNDA hiển thị giai đoạn chính của dự án.
      } else if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
        const assigneeStaff = data.staff.find((s) => s.id === item.assigneeId);
        const isTeamTask = Boolean(
          isTeamLeader &&
            myLeadingTeamId &&
            (item.teamId === myLeadingTeamId ||
              item.teamLeaderId === currentStaffId ||
              assigneeStaff?.teamId === myLeadingTeamId)
        );
        if (!isTeamTask) return false;
      } else {
        const roleInThisProj = getProjectRole(item.projectId);
        if (roleInThisProj === "MEMBER") {
          if (!currentStaffId) return false;
          if (item.assignmentLevel === "PHASE_LEAD") return false;
          const isMine =
            item.assigneeId === currentStaffId ||
            (item.coAssigneeIds || []).includes(currentStaffId);
          if (!isMine) return false;
        }
      }
      return true;
    });

    // Khử trùng lặp đảm bảo giao diện luôn hiển thị duy nhất 1 hàng cho mỗi nhiệm vụ/giai đoạn
    const seenIds = new Set<string>();
    const seenPhaseKeys = new Set<string>();
    const result: Assignment[] = [];

    for (const item of rawList) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);

      // Nếu là PHASE_LEAD trong cùng dự án: mỗi giai đoạn chỉ hiển thị 1 hàng
      if (item.assignmentLevel === "PHASE_LEAD" || (!item.assignmentLevel && !item.stepCode && item.stage)) {
        const phaseKey = `${item.projectId}_${normalizeStageGroup(item.stage, item.stepCode)}`;
        if (seenPhaseKeys.has(phaseKey)) continue;
        seenPhaseKeys.add(phaseKey);
      }

      result.push(item);
    }

    return result;
  }, [
    assignments,
    activeProjectId,
    viewScope,
    currentStaffId,
    data.staff,
    isTeamLeader,
    myLeadingTeamId,
    permissions.actingProjectIds,
    getProjectRole,
  ]);

  // Danh sách các giai đoạn mà dự án hiện tại thực sự có nhiệm vụ phụ trách (count > 0)
  const projectActiveStages = useMemo(() => {
    return PROJECT_STAGES.map((s) => {
      const count = visibleStageAssignments.filter(
        (a) => a.stage === s.value || normalizeStageGroup(a.stage, a.stepCode) === s.value,
      ).length;
      return {
        stage: s,
        count,
      };
    }).filter((item) => item.count > 0);
  }, [visibleStageAssignments]);

  const effectiveStageFilter = useMemo(() => {
    if (projectActiveStages.length === 1) {
      return projectActiveStages[0].stage.value;
    }
    if (stageFilter !== "ALL" && !projectActiveStages.some((item) => item.stage.value === stageFilter)) {
      return "ALL";
    }
    return stageFilter;
  }, [projectActiveStages, stageFilter]);

  const stageOptions = useMemo(() => {
    if (projectActiveStages.length === 0) {
      return [
        {
          value: "ALL",
          label: "Chưa có giai đoạn phân công",
        },
      ];
    }

    if (projectActiveStages.length === 1) {
      const s = projectActiveStages[0];
      return [
        {
          value: s.stage.value,
          label: `${s.stage.label} – ${s.stage.fullName}`,
        },
      ];
    }

    return [
      {
        value: "ALL",
        label: `Tất cả giai đoạn (${visibleStageAssignments.length})`,
      },
      ...projectActiveStages.map(({ stage: s, count }) => ({
        value: s.value,
        label: `${s.label} – ${s.fullName} (${count})`,
      })),
    ];
  }, [projectActiveStages, visibleStageAssignments.length]);

  const projectFilteredAssignments = useMemo(() => {
    return visibleStageAssignments.filter((item) => {
      if (effectiveStageFilter !== "ALL") {
        const itemStage = normalizeStageGroup(item.stage, item.stepCode);
        if (item.stage !== effectiveStageFilter && itemStage !== effectiveStageFilter) {
          return false;
        }
      }

      if (assignmentSearch.trim()) {
        const q = assignmentSearch.toLowerCase().trim();
        const assignee = data.staff.find((s) => s.id === item.assigneeId);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNote = item.note?.toLowerCase().includes(q);
        const matchAssignee = assignee?.name.toLowerCase().includes(q);
        const matchStep =
          item.stepName?.toLowerCase().includes(q) || item.stepCode?.toLowerCase().includes(q);
        if (!matchTitle && !matchNote && !matchAssignee && !matchStep) {
          return false;
        }
      }

      return true;
    });
  }, [
    visibleStageAssignments,
    effectiveStageFilter,
    assignmentSearch,
    data.staff,
  ]);

  const projectSelectOptions = useMemo(() => {
    if (isDirector) {
      return data.projects.map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.name}`,
      }));
    }

    if (viewScope === "PROJECT_LEAD") {
      return accessibleProjects.map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.name} [Chủ nhiệm DA]`,
      }));
    }

    if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
      return accessibleProjects.map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.name}`,
      }));
    }

    if (leadProjects.length > 0 && memberProjects.length > 0) {
      return [
        {
          label: `👑 DỰ ÁN PHỤ TRÁCH / CHỦ NHIỆM (${leadProjects.length})`,
          options: leadProjects.map((p) => ({
            value: p.id,
            label: `${p.code} · ${p.name} [Chủ nhiệm DA]`,
          })),
        },
        {
          label: `👤 DỰ ÁN THAM GIA / THÀNH VIÊN (${memberProjects.length})`,
          options: memberProjects.map((p) => {
            const role = getProjectRole(p.id);
            const roleText = role === "SUPERVISOR" ? "Giám sát chính" : "Thành viên";
            return {
              value: p.id,
              label: `${p.code} · ${p.name} [${roleText}]`,
            };
          }),
        },
      ];
    }

    return accessibleProjects.map((p) => {
      const role = getProjectRole(p.id);
      const roleText =
        role === "LEAD"
          ? " [Chủ nhiệm DA]"
          : role === "SUPERVISOR"
          ? " [Giám sát chính]"
          : " [Thành viên]";
      return {
        value: p.id,
        label: `${p.code} · ${p.name}${roleText}`,
      };
    });
  }, [viewScope, isDirector, data.projects, accessibleProjects, leadProjects, memberProjects, getProjectRole]);

  const sectionTitle = useMemo(() => {
    if (viewScope === "MY_TASKS") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Nhiệm vụ của tôi · ${prj?.code || ""}`;
      }
      return "Nhiệm vụ của tôi";
    }

    if (viewScope === "PROJECT_LEAD") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Giao việc dự án · ${prj?.code || ""}`;
      }
      return "Giao việc dự án (CNDA)";
    }

    if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Giao việc tổ & Phê duyệt · ${prj?.code || ""}`;
      }
      return `Giao việc tổ & Phê duyệt · ${myLeadingTeam?.name || "Tổ chuyên môn"}`;
    }

    if (activeProjectId !== "ALL") {
      const prj = data.projects.find((p) => p.id === activeProjectId);
      if (currentProjectRole === "LEAD") {
        return `Giao việc giai đoạn · ${prj?.code || ""}`;
      }
      if (isTeamLeader) {
        return `Nhiệm vụ & Giao việc tổ · ${prj?.code || ""}`;
      }
      return `Nhiệm vụ của tôi · ${prj?.code || ""}`;
    }
    if (leadProjects.length > 0 && memberProjects.length > 0) {
      return "Nhiệm vụ & Giao việc giai đoạn";
    }
    if (leadProjects.length > 0) {
      return "Giao việc giai đoạn cho Tổ trưởng";
    }
    if (isTeamLeader) {
      return "Nhiệm vụ tổ & Phân công thành viên";
    }
    return "Nhiệm vụ của tôi theo giai đoạn";
  }, [
    viewScope,
    activeProjectId,
    currentProjectRole,
    data.projects,
    leadProjects.length,
    memberProjects.length,
    isTeamLeader,
    myLeadingTeam,
  ]);

  const sectionDesc = useMemo(() => {
    if (viewScope === "MY_TASKS") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Nhiệm vụ của bạn trong dự án ${prj?.name || ""}. Cập nhật tiến độ, tài liệu và gửi xác nhận hoàn thành.`;
      }
      return "Danh sách các nhiệm vụ được giao cho bạn thực hiện theo từng giai đoạn dự án, cập nhật hồ sơ và gửi xác nhận hoàn thành.";
    }

    if (viewScope === "PROJECT_LEAD") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Chủ nhiệm dự án (${prj?.name}): Phân công giai đoạn cho các Tổ trưởng và theo dõi các nhiệm vụ của cán bộ thực hiện trong dự án.`;
      }
      return "Chủ nhiệm dự án: Phân công giai đoạn cho các Tổ trưởng chuyên môn và theo dõi các nhiệm vụ của cán bộ thực hiện.";
    }

    if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
      if (activeProjectId !== "ALL") {
        const prj = data.projects.find((p) => p.id === activeProjectId);
        return `Tổ trưởng ${myLeadingTeam?.name || "chuyên môn"} trong dự án (${prj?.name}): Tiếp nhận giai đoạn từ CNDA, giao việc cho thành viên trong tổ và duyệt/từ chối kết quả của thành viên.`;
      }
      return `Tổ trưởng ${myLeadingTeam?.name || "chuyên môn"}: Tiếp nhận các giai đoạn được CNDA phân công, giao việc cho thành viên trong tổ, đôn đốc tiến độ và phê duyệt / từ chối các công việc của thành viên.`;
    }

    if (activeProjectId !== "ALL") {
      const prj = data.projects.find((p) => p.id === activeProjectId);
      if (currentProjectRole === "LEAD") {
        return `Bạn đang điều hành với vai trò Chủ nhiệm dự án (${prj?.name}). Giao giai đoạn cho các Tổ trưởng và đôn đốc tiến độ.`;
      }
      if (isTeamLeader) {
        return `Bạn là Tổ trưởng ${myLeadingTeam?.name || "chuyên môn"} trong dự án (${prj?.name}). Nhận giai đoạn từ CNDA, giao việc cho thành viên và duyệt nghiệm thu.`;
      }
      return `Bạn tham gia thực hiện nhiệm vụ trong dự án (${prj?.name}). Cập nhật hồ sơ và gửi xác nhận hoàn thành.`;
    }
    if (leadProjects.length > 0 && memberProjects.length > 0) {
      return `Tổng hợp các dự án bạn phụ trách điều hành (${leadProjects.length} DA) và các dự án bạn tham gia thực hiện (${memberProjects.length} DA).`;
    }
    if (leadProjects.length > 0) {
      return "Chủ nhiệm dự án giao giai đoạn/bước quy trình cho Tổ trưởng các tổ chuyên môn quản lý và thực hiện.";
    }
    if (isTeamLeader) {
      return `Tổ trưởng ${myLeadingTeam?.name || "chuyên môn"}: Tiếp nhận giai đoạn, phân công chi tiết cho thành viên trong tổ và duyệt nghiệm thu kết quả.`;
    }
    return "Danh sách các công việc được giao thực hiện theo từng giai đoạn dự án, cập nhật hồ sơ và gửi xác nhận hoàn thành.";
  }, [
    viewScope,
    activeProjectId,
    currentProjectRole,
    data.projects,
    leadProjects.length,
    memberProjects.length,
    isTeamLeader,
    myLeadingTeam,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      (projectActiveStages.length > 1 && effectiveStageFilter !== "ALL") ||
      Boolean(assignmentSearch.trim()) ||
      filter !== "ALL"
    );
  }, [projectActiveStages.length, effectiveStageFilter, assignmentSearch, filter]);

  const handleResetFilters = () => {
    setStageFilter("ALL");
    setAssignmentSearch("");
    onFilterChange("ALL");
    setSupervisorPage(1);
  };

  const rows = useMemo(() => {
    return projectFilteredAssignments
      .filter((item) => matchesAssignmentFilter(item, filter, today))
      .sort((a, b) => {
        const weight = (item: Assignment) => {
          if (isOverdue(item, today)) return 0;
          if (!item.assigneeId && item.status !== "DONE") return 1;
          if (isDueSoon(item, today)) return 2;
          return item.status === "DONE" ? 4 : 3;
        };
        return weight(a) - weight(b) || a.dueDate.localeCompare(b.dueDate);
      });
  }, [projectFilteredAssignments, filter, today]);

  const paginatedRows = useMemo(() => {
    const start = (supervisorPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, supervisorPage]);

  const handleAcceptCompletion = (assignment: Assignment) => {
    const executor = data.staff.find((s) => s.id === assignment.assigneeId);
    const approvalTitle = assignment.assignmentLevel === "PHASE_LEAD"
      ? "Xác nhận hoàn thành giai đoạn?"
      : assignment.parentAssignmentId && !assignment.approvalStage
      ? "Tổ trưởng duyệt và chuyển bước con lên CNDA?"
      : assignment.parentAssignmentId
      ? "CNDA chấp nhận bước con?"
      : "Chấp nhận kết quả hoàn thành nhiệm vụ?";
    modal.confirm({
      width: 480,
      centered: true,
      icon: null,
      title: null,
      className:
        "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl",
      content: (
        <div className="space-y-3.5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-lg shadow-xs">
              <CheckOutlined />
            </span>
            <div className="pt-0.5">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {approvalTitle}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Xác nhận nghiệm thu đạt yêu cầu cho nhiệm vụ này
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-800 space-y-1">
            <div className="font-bold text-slate-900">{assignment.title}</div>
            <div className="text-slate-500">
              Cán bộ thực hiện: <strong className="text-slate-700">{executor?.name || "Chưa rõ"}</strong> ({executor?.title || ""})
            </div>
            {assignment.submissions && assignment.submissions.length > 0 && (
              <div className="text-[11px] text-teal-700 pt-1">
                Tệp hồ sơ nộp: <strong>{assignment.submissions[assignment.submissions.length - 1].fileName}</strong>
              </div>
            )}
          </div>
        </div>
      ),
      okText: assignment.assignmentLevel === "PHASE_LEAD" ? "Hoàn thành giai đoạn" : "Chấp nhận",
      okButtonProps: {
        className:
          "!h-9 !px-5 !rounded-lg !font-semibold !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white !shadow-xs",
      },
      cancelText: "Hủy",
      cancelButtonProps: {
        className:
          "!h-9 !px-4 !rounded-lg !font-medium !text-slate-700 !border-slate-300 hover:!bg-slate-50",
      },
      onOk: () => controller.acceptAssignment(assignment.id),
    });
  };

  const handleOpenReject = (assignment: Assignment) => {
    setRejectTarget(assignment);
    setRejectReason("");
  };

  const assignmentColumns: ColumnsType<Assignment> = [
    {
      title: "Nhiệm vụ & Dự án",
      key: "title",
      width: "27%",
      render: (_, row) => {
        const project = data.projects.find((p) => p.id === row.projectId);

        return (
          <div className="py-0.5 min-w-0 pr-1">
            <span
              className="text-left text-xs font-semibold text-slate-900 group-hover:text-[#0F4C81] truncate max-w-full block"
              title={row.title}
            >
              {row.title}
            </span>
            <div className="mt-0.5 text-[11px] text-slate-500 truncate" title={`${project?.code} · ${project?.name}`}>
              {project?.code} · {project?.name}
              {row.note ? ` (${row.note})` : ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Giai đoạn & Bước thủ tục",
      key: "stage",
      width: "21%",
      render: (_, row) => {
        const stageGroup = normalizeStageGroup(row.stage, row.stepCode);
        const stageMeta =
          PROJECT_STAGE_META[stageGroup] ||
          (row.stage ? PROJECT_STAGE_META[row.stage] : undefined);
        const isPhaseLead = row.assignmentLevel === "PHASE_LEAD";
        const stepDef = row.stepCode
          ? MASTER_PROCEDURE_STEPS.find((s) => s.code === row.stepCode)
          : undefined;
        const stepCode = isPhaseLead
          ? undefined
          : (row.stepCode ||
             (stageGroup === "VI"
               ? "VI.1"
               : stageGroup === "V"
               ? "V.1"
               : stageGroup === "VII"
               ? "VII"
               : undefined));
        const stepName =
          row.stepName ||
          stepDef?.name ||
          (stepCode
            ? MASTER_PROCEDURE_STEPS.find((s) => s.code === stepCode)?.name
            : undefined);

        return (
          <div className="flex flex-col gap-1 py-1 min-w-0 pr-1">
            {/* Mục lớn: Giai đoạn */}
            <div
              className="flex items-center gap-1.5 flex-wrap text-left group/stage w-fit max-w-full"
              title={`Xem chi tiết ${stageMeta?.label || `Giai đoạn ${stageGroup}`}: ${stageMeta?.fullName || ""}`}
            >
              <Tag
                color={stageMeta?.color || "blue"}
                className="m-0 text-[11px] font-bold px-1.5 py-0 shrink-0 group-hover/stage:opacity-85 transition-opacity"
              >
                {stageMeta?.label || `Giai đoạn ${stageGroup}`}
              </Tag>
              <span className="text-xs font-semibold text-slate-800 group-hover/stage:text-[#007A78] truncate" title={stageMeta?.fullName || ""}>
                {stageMeta?.fullName || ""}
              </span>
            </div>

            {/* Mục nhỏ: Bước thủ tục chi tiết */}
            {isPhaseLead ? (
              <span className="text-[11px] text-blue-700 font-medium italic">
              </span>
            ) : stepCode ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-50 border border-slate-200/90 rounded px-1.5 py-0.5 w-fit max-w-full">
                <Tag color="cyan" className="m-0 text-[10px] leading-4 px-1 py-0 font-bold shrink-0">
                  Bước {stepCode}
                </Tag>
                <span className="truncate text-slate-700 font-medium" title={stepName || ""}>
                  {stepName || "Thực hiện thủ tục"}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Chưa gắn bước thủ tục</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Cán bộ phụ trách",
      key: "assignee",
      width: "16%",
      render: (_, row) => {
        const person = data.staff.find((item) => item.id === row.assigneeId);
        if (!person) {
          return <span className="text-xs text-amber-700 italic">Chưa giao</span>;
        }
        const team = data.teams.find((item) => item.id === (row.teamId || person.teamId));
        const isLeader = person.id === team?.leaderId;
        return (
          <div className="flex flex-col py-0.5 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="cursor-default text-xs font-semibold text-slate-800 truncate" title={person.name}>
                {person.name}
              </span>
              {isLeader ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded shrink-0 border border-blue-200/60">
                  Tổ trưởng
                </span>
              ) : (
                <span className="text-[10px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded shrink-0 border border-slate-200/60">
                  Thành viên
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 truncate" title={`${person.title} ${team ? `· ${team.name}` : ""}`}>
              {person.title} {team ? `· ${team.name}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      title: "Hạn hoàn thành",
      dataIndex: "dueDate",
      width: "12%",
      render: (value: string, row) => (
        <div className="text-xs leading-normal">
          <span className="font-medium text-slate-800">{formatDateVi(value)}</span>
          {isOverdue(row, today) && (
            <span className="ml-1 text-[10px] font-semibold text-rose-600 block">Quá hạn</span>
          )}
          {isDueSoon(row, today) && (
            <span className="ml-1 text-[10px] font-semibold text-amber-600 block">Sắp đến hạn</span>
          )}
          {row.status === "DONE" && (
            <span className="ml-1 text-[10px] text-emerald-600 block">Đã xong</span>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "12%",
      render: (value: Assignment["status"], row) => {
        const isPendingApproval = value === "PENDING_APPROVAL";

        if (isPendingApproval) {
          return (
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                <span>{row.assignmentLevel === "PHASE_LEAD" ? "Chờ CNDA duyệt giai đoạn" : row.approvalStage === "PROJECT_APPROVED" ? "Chờ chốt giai đoạn" : row.approvalStage === "LEAD_APPROVED" ? "Chờ CNDA duyệt" : "Chờ tổ trưởng duyệt"}</span>
              </span>
              <Tag color="warning" className="m-0 text-[10px] font-bold mt-1 block w-fit">
                {row.assignmentLevel === "PHASE_LEAD" ? "Chờ chốt giai đoạn" : row.approvalStage === "PROJECT_APPROVED" ? "CNDA đã duyệt" : row.approvalStage === "LEAD_APPROVED" ? "Tổ trưởng đã duyệt" : "Chờ tổ trưởng duyệt"}
              </Tag>
            </div>
          );
        }

        const statusMeta: Record<Assignment["status"], { label: string; dot: string }> = {
          TODO: { label: "Chưa bắt đầu", dot: "bg-slate-400" },
          IN_PROGRESS: { label: "Đang thực hiện", dot: "bg-blue-500" },
          PENDING_APPROVAL: { label: "Chờ nghiệm thu", dot: "bg-amber-500" },
          DONE: { label: "Đã hoàn thành", dot: "bg-emerald-500" },
        };
        const meta = statusMeta[value] || statusMeta.IN_PROGRESS;
        const approvalLabel = row.approvalStage === "RETURNED_TO_LEAD"
          ? "CNDA từ chối · chờ tổ trưởng chuyển lại"
          : row.approvalStage === "PROJECT_APPROVED"
          ? "CNDA đã duyệt · chờ chốt giai đoạn"
          : row.approvalStage === "LEAD_APPROVED"
          ? "Chờ CNDA duyệt bước con"
          : meta.label;
        return (
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
              <span>{approvalLabel}</span>
            </span>
            {row.rejectionNote && value === "IN_PROGRESS" && (
              <Tooltip title={`Yêu cầu làm lại: ${row.rejectionNote}`}>
                <Tag color="error" className="m-0 text-[10px] font-semibold mt-1 block w-fit">
                  Cần làm lại
                </Tag>
              </Tooltip>
            )}
            {row.urgeCount ? (
              <Tooltip
                title={
                  row.lastUrgedNote
                    ? `Chỉ đạo đôn đốc (${row.lastUrgedBy} - ${formatDateVi(row.lastUrgedAt!)}): "${row.lastUrgedNote}"`
                    : `Đã đôn đốc ${row.urgeCount} lần`
                }
              >
                <Tag color="volcano" className="m-0 text-[10px] font-bold mt-1 block w-fit">
                  <ClockCircleOutlined /> Đã đôn đốc ({row.urgeCount})
                </Tag>
              </Tooltip>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: "16%",
      align: "center",
      render: (_, row) => {
        const roleInThisProject = getProjectRole(row.projectId);
        const isLeadOnThisProject = roleInThisProject === "LEAD" || isDirector;
        const isMyTask =
          row.assigneeId === currentStaffId ||
          (row.coAssigneeIds || []).includes(currentStaffId || "");

        // Kiểm tra xem task này có thuộc tổ chuyên môn mà user làm Tổ trưởng không
        const assigneeStaff = data.staff.find((s) => s.id === row.assigneeId);
        const isTaskInMyTeam = Boolean(
          isTeamLeader &&
            myLeadingTeamId &&
            (row.teamId === myLeadingTeamId || assigneeStaff?.teamId === myLeadingTeamId)
        );

        // Quyền quản lý task (Sửa, Đôn đốc, Phê duyệt nghiệm thu):
        // 1. CNDA hoặc Giám đốc trong dự án (trừ khi là task cá nhân CNDA tự làm)
        // 2. Tổ trưởng đối với các nhiệm vụ của thành viên trong tổ mình (TASK_MEMBER)
        const canManageThisTask =
          viewScope === "MY_TASKS"
            ? false
            : viewScope === "PROJECT_LEAD"
            ? (isLeadOnThisProject && !isMyTask)
            : viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION"
            ? (isTaskInMyTeam && !isMyTask && row.assignmentLevel !== "PHASE_LEAD")
            : ((isLeadOnThisProject && !isMyTask) || (isTaskInMyTeam && !isMyTask && row.assignmentLevel !== "PHASE_LEAD"));

        const isPendingApproval =
          row.status === "PENDING_APPROVAL" ||
          Boolean(row.submissions && row.submissions.some((s) => s.leadApprovalStatus === "PENDING_LEAD"));

        // =====================================================================
        // TRƯỜNG HỢP 1: Ở TAB "GIAO VIỆC DỰ ÁN (CNDA)" (viewScope === "PROJECT_LEAD")
        // Người dùng ở vị thế Chủ nhiệm dự án (người giao Giai đoạn & phê duyệt Giai đoạn)
        // =====================================================================
        if (viewScope === "PROJECT_LEAD" || (viewScope === "ALL" && isLeadOnThisProject && row.assignmentLevel === "PHASE_LEAD" && !isTaskInMyTeam)) {
          if (row.status === "DONE") {
            return (
              <div className="flex flex-col items-center justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => onOpenDetail(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Xem hồ sơ nghiệm thu giai đoạn đã hoàn thành"
                >
                  Xem hồ sơ
                </button>
              </div>
            );
          }

          if (row.status === "PENDING_APPROVAL") {
            // Tổ trưởng đã gửi nghiệm thu giai đoạn -> CNDA có quyền Duyệt hoặc Từ chối
            return (
              <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleAcceptCompletion(row)}
                  className="w-[124px] h-6.5 rounded-md bg-[#007A78] hover:bg-[#006361] text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Chủ nhiệm dự án chấp nhận nghiệm thu giai đoạn"
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReject(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Từ chối nghiệm thu giai đoạn và yêu cầu Tổ hoàn thiện lại"
                >
                  Từ chối
                </button>
              </div>
            );
          }

          // Trạng thái TODO hoặc IN_PROGRESS -> CNDA chỉnh sửa phân công hoặc đôn đốc Tổ trưởng
          return (
            <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-[#007A78] border border-slate-300 hover:border-[#007A78] font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                title="Chỉnh sửa phân công giai đoạn cho Tổ trưởng"
              >
                Sửa phân công
              </button>
              <button
                type="button"
                onClick={() => {
                  const prj = data.projects.find((p) => p.id === row.projectId);
                  const stf = data.staff.find((s) => s.id === row.assigneeId);
                  handleOpenUrge({ assignment: row, project: prj, staff: stf });
                }}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap shadow-2xs"
                title="Đôn đốc Tổ trưởng phụ trách giai đoạn này"
              >
                Đôn đốc tiến độ
              </button>
            </div>
          );
        }

        // =====================================================================
        // TRƯỜNG HỢP 2: Ở TAB "GIAO VIỆC TỔ & PHÊ DUYỆT" (viewScope === "TEAM_LEAD")
        // Người dùng ở vị thế Tổ trưởng chuyên môn
        // =====================================================================
        if (viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION") {
          // Nhánh 2.1: Dòng là Giai đoạn do CNDA giao cho Tổ của mình (PHASE_LEAD)
          if (row.assignmentLevel === "PHASE_LEAD") {
            if (row.status === "DONE") {
              return (
                <div className="flex flex-col items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              );
            }

            if (row.status === "PENDING_APPROVAL") {
              return (
                <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                  <span className="w-[124px] h-6.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px] flex items-center justify-center whitespace-nowrap">
                    Chờ CNDA duyệt
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              );
            }

            if (row.status === "TODO") {
              // Giai đoạn chưa bắt đầu: tổ trưởng khởi động trước khi gửi duyệt.
              return (
                <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleStartAssignment(row)}
                    className="w-[124px] h-6.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Bắt đầu triển khai giai đoạn này"
                  >
                    ▶ Bắt đầu làm
                  </button>
                </div>
              );
            }

            // Giai đoạn đang thực hiện: gửi duyệt khi tất cả bước con đã được CNDA chấp nhận.
            return (
              <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleConfirmMemberCompletion(row)}
                  disabled={!(data.assignments.some((item) => item.parentAssignmentId === row.id) && data.assignments.filter((item) => item.parentAssignmentId === row.id).every((item) => item.approvalStage === "PROJECT_APPROVED"))}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-[#007A78] border border-slate-300 hover:border-[#007A78] font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Chỉ gửi khi tất cả bước con đã được CNDA duyệt"
                >
                  Gửi CNDA duyệt
                </button>
              </div>
            );
          }

          // Nhánh 2.2: Dòng là Nhiệm vụ thành viên trong tổ (TASK_MEMBER)
          // 2.2.1: Nếu chính Tổ trưởng tự nhận làm nhiệm vụ này
          if (isMyTask) {
            if (row.status === "DONE") {
              return (
                <div className="flex flex-col items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              );
            }

            if (row.status === "PENDING_APPROVAL") {
              return (
                <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                  <span className="w-[124px] h-6.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px] flex items-center justify-center whitespace-nowrap">
                    Chờ nghiệm thu
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              );
            }

            if (row.status === "TODO") {
              return (
                <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => handleStartAssignment(row)}
                    className="w-[124px] h-6.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    ▶ Bắt đầu làm
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    Chi tiết
                  </button>
                </div>
              );
            }

            // IN_PROGRESS
            return (
              <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => onOpenDetail(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Thêm/Sửa hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmMemberCompletion(row)}
                  className="w-[124px] h-6.5 rounded-md bg-[#007A78] hover:bg-[#006361] text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Xác nhận hoàn thành
                </button>
              </div>
            );
          }

          // 2.2.2: Nhiệm vụ của thành viên khác trong tổ (Tổ trưởng quản lý)
          if (row.status === "DONE") {
            return (
              <div className="flex flex-col items-center justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => onOpenDetail(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Xem chi tiết
                </button>
              </div>
            );
          }

          if (row.status === "PENDING_APPROVAL") {
            // Thành viên đã nộp bài -> Tổ trưởng DUYỆT hoặc TỪ CHỐI
            if (row.approvalStage) {
              return (
                <button type="button" onClick={() => onOpenDetail(row)} className="w-[124px] rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                  {row.approvalStage === "PROJECT_APPROVED" ? "Chờ chốt giai đoạn" : "Chờ CNDA duyệt"}
                </button>
              );
            }
            return (
              <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleAcceptCompletion(row)}
                  className="w-[124px] h-6.5 rounded-md bg-[#007A78] hover:bg-[#006361] text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Tổ trưởng phê duyệt hoàn thành nhiệm vụ cho thành viên"
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReject(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Yêu cầu thành viên chỉnh sửa lại hồ sơ"
                >
                  Từ chối
                </button>
              </div>
            );
          }

          if (row.approvalStage === "RETURNED_TO_LEAD") {
            return (
              <button type="button" onClick={() => controller.returnToMember(row.id)} className="w-[124px] rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white">
                Chuyển TV chỉnh sửa
              </button>
            );
          }

          // TODO hoặc IN_PROGRESS: Sửa nhiệm vụ & Đôn đốc tiến độ
          return (
            <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 hover:text-[#007A78] border border-slate-300 hover:border-[#007A78] font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Sửa nhiệm vụ
              </button>
              <button
                type="button"
                onClick={() => {
                  const prj = data.projects.find((p) => p.id === row.projectId);
                  const stf = data.staff.find((s) => s.id === row.assigneeId);
                  handleOpenUrge({ assignment: row, project: prj, staff: stf });
                }}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer whitespace-nowrap shadow-2xs"
              >
                Đôn đốc tiến độ
              </button>
            </div>
          );
        }

        // =====================================================================
        // TRƯỜNG HỢP 3: Ở TAB "NHIỆM VỤ CỦA TÔI" (viewScope === "MY_TASKS") HOẶC CÁ NHÂN
        // =====================================================================
        if (row.status === "DONE") {
          return (
            <div className="flex flex-col items-center justify-center py-0.5">
              <button
                type="button"
                onClick={() => onOpenDetail(row)}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Xem hồ sơ
              </button>
            </div>
          );
        }

        if (row.status === "PENDING_APPROVAL") {
          const approverRoleText =
            row.approvalStage === "PROJECT_APPROVED" ? "Chờ chốt giai đoạn" :
            row.approvalStage === "LEAD_APPROVED" ? "Chờ CNDA duyệt" :
            row.assignmentLevel === "TASK_MEMBER" || row.assignedByRole === "TEAM_LEAD"
              ? "Chờ Tổ trưởng duyệt"
              : "Chờ CNDA duyệt";
          return (
            <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
              <span className="w-[124px] h-6.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px] flex items-center justify-center whitespace-nowrap">
                {approverRoleText}
              </span>
              <button
                type="button"
                onClick={() => onOpenDetail(row)}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Xem hồ sơ
              </button>
            </div>
          );
        }

        if (isMyTask) {
          if (row.approvalStage === "RETURNED_TO_LEAD") {
            return <span className="text-xs font-medium text-amber-700">Chờ tổ trưởng chuyển lại để sửa</span>;
          }
          if (row.status === "TODO") {
            // Nhiệm vụ CHƯA BẮT ĐẦU: Bấm "Bắt đầu làm" (KHÔNG CÓ nút xác nhận hoàn thành!)
            return (
              <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleStartAssignment(row)}
                  className="w-[124px] h-6.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Bắt đầu thực hiện nhiệm vụ này"
                >
                  ▶ Bắt đầu làm
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetail(row)}
                  className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Chi tiết
                </button>
              </div>
            );
          }

          // Nhiệm vụ ĐANG THỰC HIỆN (IN_PROGRESS)
          const sendBtnText =
            row.assignmentLevel === "PHASE_LEAD"
              ? "Gửi CNDA duyệt"
              : "Xác nhận hoàn thành";
          return (
            <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onOpenDetail(row)}
                className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                title="Thêm và chỉnh sửa tài liệu, hồ sơ đính kèm"
              >
                Thêm/Sửa hồ sơ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmMemberCompletion(row)}
                className="w-[124px] h-6.5 rounded-md bg-[#007A78] hover:bg-[#006361] text-white font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
                title="Báo cáo hoàn thành và gửi hồ sơ đề nghị phê duyệt nghiệm thu"
              >
                {sendBtnText}
              </button>
            </div>
          );
        }

        // Mặc định khác: Xem chi tiết
        return (
          <div className="flex flex-col items-center justify-center py-0.5">
            <button
              type="button"
              onClick={() => onOpenDetail(row)}
              className="w-[124px] h-6.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Chi tiết
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {assignmentMode === "leaders" ? (
        <Card
          surface="flat"
          padding="none"
          rounded="lg"
          className="border-slate-200 shadow-sm shadow-slate-100"
        >
          <SectionIntro
            title="Phân công lãnh đạo dự án"
            description="Giám đốc và Phó Giám đốc chỉ định Người thực hiện chính (Chủ nhiệm dự án) và Người giám sát chính cho từng công trình."
            countLabel={`${filteredProjects.length} dự án`}
            readOnly={false}
            guide=""
            actions={
              <Button
                intent="primary"
                scale="sm"
                icon={<KeyOutlined />}
                onClick={() => {
                  setProjectPermissionsTargetProjectId(undefined);
                  setProjectPermissionsModalOpen(true);
                }}
              >
                Cấp quyền dự án
              </Button>
            }
            toolbar={
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <div className="w-full max-w-md">
                  <Input
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder="Tìm kiếm theo mã, tên công trình hoặc tình trạng dự án..."
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setDirectorPage(1);
                    }}
                    allowClear
                    className="w-full text-xs"
                  />
                </div>

                {/* Chuyển phần phân trang lên phía trên góc phải */}
                {filteredProjects.length > PAGE_SIZE && (
                  <div className="flex items-center gap-3">
                    <Text className="text-xs font-medium text-slate-500">
                      Hiển thị {(directorPage - 1) * PAGE_SIZE + 1} -{" "}
                      {Math.min(directorPage * PAGE_SIZE, filteredProjects.length)} trong tổng số{" "}
                      {filteredProjects.length} dự án
                    </Text>
                    <Pagination
                      current={directorPage}
                      pageSize={PAGE_SIZE}
                      total={filteredProjects.length}
                      onChange={(newPage) => setDirectorPage(newPage)}
                      showSizeChanger={false}
                      hideOnSinglePage={true}
                    />
                  </div>
                )}
              </div>
            }
          />
          <Table
            rowKey="id"
            columns={projectColumns}
            dataSource={paginatedProjects}
            size="middle"
            tableLayout="fixed"
            pagination={false}
            onRow={(record) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a") || target.closest(".ant-btn") || target.closest(".ant-tag")) {
                  return;
                }
                onAssignLeadership?.(record);
              },
              className: "cursor-pointer hover:bg-slate-50/70 transition-colors",
            })}
            className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-2.5 [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
            locale={{
              emptyText: (
                <Text className="block py-10 text-center text-[13px] text-slate-500">
                  Không tìm thấy dự án nào khớp với từ khóa tìm kiếm.
                </Text>
              ),
            }}
          />
        </Card>
      ) : (
        <Card
          surface="flat"
          padding="none"
          rounded="lg"
          className="border-slate-200 shadow-sm shadow-slate-100"
        >
          <SectionIntro
            title={sectionTitle}
            description={sectionDesc}
            countLabel={`${rows.length} nhiệm vụ`}
            readOnly={!canCreateTaskInCurrentView}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {/* Nút Trình Ban Giám đốc (dành cho CNDA khi tất cả giai đoạn đã hoàn thành) hoặc Phê duyệt / Từ chối (dành cho BGĐ) */}
                {isAllPhasesDone && activeProject && (
                  <>
                    {activeProject.directorApprovalStatus === "APPROVED" && (
                      <Tag color="success" className="px-3 py-1 font-semibold text-xs rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800">
                        <CheckCircleOutlined className="mr-1" /> BGĐ đã duyệt hoàn thành DA
                      </Tag>
                    )}

                    {activeProject.directorApprovalStatus === "PENDING" && (
                      <>
                        {isDirector ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              intent="primary"
                              scale="sm"
                              icon={<CheckCircleOutlined />}
                              className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-medium shadow-xs"
                              onClick={() => handleOpenDirectorReview("APPROVE")}
                            >
                              Phê duyệt kết thúc DA
                            </Button>
                            <Button
                              intent="outline"
                              scale="sm"
                              icon={<CloseCircleOutlined />}
                              className="!border-rose-300 !text-rose-600 hover:!bg-rose-50 font-medium"
                              onClick={() => handleOpenDirectorReview("REJECT")}
                            >
                              Từ chối / Hoàn thiện lại
                            </Button>
                            <Button
                              scale="sm"
                              intent="subtle"
                              icon={<AuditOutlined />}
                              onClick={handleOpenSubmitToDirector}
                            >
                              Xem tờ trình
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Tag color="processing" className="px-3 py-1 font-semibold text-xs rounded-full border border-blue-200 bg-blue-50 text-[#0F4C81]">
                              <ClockCircleOutlined className="mr-1" /> Đã trình BGĐ (Chờ duyệt)
                            </Tag>
                            <Button
                              scale="sm"
                              intent="outline"
                              icon={<AuditOutlined />}
                              onClick={handleOpenSubmitToDirector}
                            >
                              Xem tờ trình CNDA
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {activeProject.directorApprovalStatus === "REJECTED" && (
                      <>
                        {isCndaOfActiveProject ? (
                          <div className="flex items-center gap-1.5">
                            <Tag color="error" className="px-3 py-1 font-semibold text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700">
                              <CloseCircleFilled className="mr-1" /> BGĐ yêu cầu hoàn thiện lại
                            </Tag>
                            <Button
                              intent="primary"
                              scale="sm"
                              icon={<SendOutlined />}
                              className="!bg-[#0F4C81] hover:!bg-[#0D3F6C] !border-[#0F4C81] !text-white font-medium shadow-xs"
                              onClick={handleOpenSubmitToDirector}
                            >
                              Trình lại Ban Giám đốc
                            </Button>
                          </div>
                        ) : (
                          <Tag color="error" className="px-3 py-1 font-semibold text-xs rounded-full border border-rose-200 bg-rose-50 text-rose-700">
                            <CloseCircleFilled className="mr-1" /> BGĐ đã yêu cầu CNDA hoàn thiện lại
                          </Tag>
                        )}
                      </>
                    )}

                    {!activeProject.directorApprovalStatus && isCndaOfActiveProject && (
                      <Button
                        intent="primary"
                        scale="sm"
                        icon={<SendOutlined />}
                        className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold shadow-xs"
                        onClick={handleOpenSubmitToDirector}
                      >
                        Trình Ban Giám đốc
                      </Button>
                    )}
                  </>
                )}

                {canCreateTaskInCurrentView && (
                  <>
                    {(viewScope === "PROJECT_LEAD" || (viewScope === "ALL" && (currentProjectRole === "LEAD" || isDirector || (activeProjectId === "ALL" && leadProjects.length > 0)))) && (
                      <Button
                        intent="primary"
                        scale="sm"
                        icon={<CrownOutlined />}
                        onClick={() => {
                          const targetProj =
                            activeProjectId !== "ALL"
                              ? activeProjectId
                              : leadProjects[0]?.id || accessibleProjects[0]?.id;
                          onCreate(targetProj, "PHASE_LEAD");
                        }}
                      >
                        Giao giai đoạn cho Tổ trưởng
                      </Button>
                    )}
                    {(viewScope === "TEAM_LEAD" || viewScope === "TEAM_DELEGATION" || (viewScope === "ALL" && isTeamLeader)) && (
                      <Button
                        intent="primary"
                        scale="sm"
                        icon={<TeamOutlined />}
                        onClick={() => {
                          const targetProj =
                            activeProjectId !== "ALL"
                              ? activeProjectId
                              : accessibleProjects[0]?.id;
                          onCreate(targetProj, "TASK_MEMBER", undefined, undefined, permissions.leadingTeamId);
                        }}
                      >
                        Giao việc cho thành viên
                      </Button>
                    )}
                  </>
                )}
              </div>
            }
            toolbar={
              <div className="flex w-full flex-col gap-3">
                {/* Hàng 1: Bộ lọc đa tiêu chí (Dự án, Giai đoạn, Ô tìm kiếm và Đặt lại) */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Lọc Dự án */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <FilterOutlined className="text-slate-400" />
                    <span className="whitespace-nowrap text-slate-500">Dự án:</span>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase().trim())
                      }
                      value={activeProjectId}
                      onChange={(val) => {
                        onSelectProjectChange?.(val === "ALL" ? undefined : val);
                        setStageFilter("ALL");
                        setSupervisorPage(1);
                      }}
                      className="w-[360px] sm:w-[420px] text-xs"
                      popupMatchSelectWidth={false}
                      dropdownStyle={{ minWidth: 480 }}
                      placeholder="Chọn dự án..."
                      options={projectSelectOptions}
                    />
                  </div>

                  {/* Lọc Giai đoạn dự án (I đến VII) */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <span className="whitespace-nowrap text-slate-500">Giai đoạn:</span>
                    <Select
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase().trim())
                      }
                      value={effectiveStageFilter}
                      onChange={(val) => {
                        setStageFilter(val || "ALL");
                        setSupervisorPage(1);
                      }}
                      className="w-64 text-xs"
                      popupMatchSelectWidth={false}
                      styles={{ popup: { root: { minWidth: 360 } } }}
                      placeholder="Chọn giai đoạn..."
                      options={stageOptions}
                    />
                  </div>

                  {/* Nút đặt lại bộ lọc */}
                  {hasActiveFilters && (
                    <Button
                      scale="sm"
                      intent="subtle"
                      onClick={handleResetFilters}
                      className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
                    >
                      Đặt lại bộ lọc
                    </Button>
                  )}
                </div>

                {/* Hàng 2: Thanh Tab / Pills lọc Trạng thái và Phân trang CÙNG 1 HÀNG */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                  {/* Trạng thái (bên trái) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium mr-1 shrink-0">Trạng thái:</span>
                    {FILTER_ORDER.map((key) => {
                      const isActive = filter === key;
                      const label = ASSIGNMENT_FILTER_LABELS[key];

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onFilterChange(key);
                            setSupervisorPage(1);
                          }}
                          className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border",
                            isActive
                              ? "bg-[#0F4C81] text-white border-[#0F4C81] shadow-xs font-semibold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Phân trang (bên phải, cùng hàng với Trạng thái) */}
                  {rows.length > PAGE_SIZE && (
                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                      <Text className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        Hiển thị {(supervisorPage - 1) * PAGE_SIZE + 1} -{" "}
                        {Math.min(supervisorPage * PAGE_SIZE, rows.length)} / {rows.length} việc
                      </Text>
                      <Pagination
                        current={supervisorPage}
                        pageSize={PAGE_SIZE}
                        total={rows.length}
                        onChange={(newPage) => setSupervisorPage(newPage)}
                        showSizeChanger={false}
                        hideOnSinglePage={true}
                        className="!m-0"
                      />
                    </div>
                  )}
                </div>

              </div>
            }
          />

          {/* Banner thông báo tiến độ toàn bộ giai đoạn đã hoàn thành & Trình Ban Giám đốc */}
          {isAllPhasesDone && activeProject && (
            <div className="px-5 pt-3 pb-1">
              <div
                className={cn(
                  "rounded-xl border p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5",
                  activeProject.directorApprovalStatus === "APPROVED"
                    ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border-emerald-200"
                    : activeProject.directorApprovalStatus === "PENDING"
                    ? "bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-white border-blue-200"
                    : activeProject.directorApprovalStatus === "REJECTED"
                    ? "bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-white border-rose-200"
                    : "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border-emerald-300"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-xs mt-0.5",
                      activeProject.directorApprovalStatus === "APPROVED"
                        ? "bg-emerald-600 text-white"
                        : activeProject.directorApprovalStatus === "PENDING"
                        ? "bg-[#0F4C81] text-white"
                        : activeProject.directorApprovalStatus === "REJECTED"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                    )}
                  >
                    {activeProject.directorApprovalStatus === "APPROVED" ? (
                      <CheckCircleOutlined />
                    ) : activeProject.directorApprovalStatus === "PENDING" ? (
                      <ClockCircleOutlined />
                    ) : activeProject.directorApprovalStatus === "REJECTED" ? (
                      <AlertOutlined />
                    ) : (
                      <TrophyOutlined />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-slate-800">
                        {activeProject.directorApprovalStatus === "APPROVED"
                          ? "Dự án đã được Ban Giám đốc phê duyệt nghiệm thu toàn diện"
                          : activeProject.directorApprovalStatus === "PENDING"
                          ? "Hồ sơ dự án đang chờ Ban Giám đốc xem xét phê duyệt"
                          : activeProject.directorApprovalStatus === "REJECTED"
                          ? "Ban Giám đốc yêu cầu rà soát, hoàn thiện lại các giai đoạn"
                          : `Tất cả ${activeProjectPhaseAssignments.length} giai đoạn của dự án đã hoàn thành 100%!`}
                      </span>
                      <Tag
                        color={
                          activeProject.directorApprovalStatus === "APPROVED"
                            ? "success"
                            : activeProject.directorApprovalStatus === "PENDING"
                            ? "processing"
                            : activeProject.directorApprovalStatus === "REJECTED"
                            ? "error"
                            : "emerald"
                        }
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      >
                        {activeProject.directorApprovalStatus === "APPROVED"
                          ? "Đã hoàn thành dự án"
                          : activeProject.directorApprovalStatus === "PENDING"
                          ? "Chờ phê duyệt"
                          : activeProject.directorApprovalStatus === "REJECTED"
                          ? "Yêu cầu hoàn thiện"
                          : "Đủ điều kiện trình duyệt"}
                      </Tag>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed">
                      {activeProject.directorApprovalStatus === "APPROVED" ? (
                        <div>
                          Ban Giám đốc đã ký duyệt kết thúc dự án. Ý kiến chỉ đạo:{" "}
                          <span className="font-medium text-slate-800 italic">
                            "{activeProject.directorReviewNote || "Đồng ý nghiệm thu và kết thúc dự án."}"
                          </span>{" "}
                          ({activeProject.directorReviewedBy} · {formatDateVi(activeProject.directorReviewedAt)})
                        </div>
                      ) : activeProject.directorApprovalStatus === "PENDING" ? (
                        <div>
                          Chủ nhiệm dự án ({activeProject.directorSubmittedBy || "CNDA"}) đã gửi tờ trình lên{" "}
                          <strong>{activeProject.directorTargetStaffName || "Ban Giám đốc"}</strong> vào ngày{" "}
                          {formatDateVi(activeProject.directorSubmittedAt)}.
                          {activeProject.directorSubmissionNote && (
                            <span className="block italic text-slate-500 mt-0.5">
                              "{activeProject.directorSubmissionNote}"
                            </span>
                          )}
                        </div>
                      ) : activeProject.directorApprovalStatus === "REJECTED" ? (
                        <div>
                          Lý do yêu cầu làm lại:{" "}
                          <span className="font-semibold text-rose-700">
                            "{activeProject.directorReviewNote || "Chưa đạt yêu cầu chất lượng hồ sơ."}"
                          </span>{" "}
                          ({activeProject.directorReviewedBy} · {formatDateVi(activeProject.directorReviewedAt)}). Vui lòng kiểm tra và trình lại.
                        </div>
                      ) : (
                        <div>
                          Toàn bộ {activeProjectPhaseAssignments.length} giai đoạn thực hiện dự án ({activeProject.code}) đều đã đạt trạng thái{" "}
                          <strong className="text-emerald-700 font-semibold">Đã hoàn thành</strong>. Chủ nhiệm dự án hãy gửi tờ trình lên Ban Giám đốc (Giám đốc hoặc Phó Giám đốc) để nghiệm thu toàn diện công trình.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!activeProject.directorApprovalStatus && isCndaOfActiveProject && (
                    <Button
                      intent="primary"
                      scale="sm"
                      icon={<SendOutlined />}
                      className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold shadow-xs"
                      onClick={handleOpenSubmitToDirector}
                    >
                      Trình Ban Giám đốc
                    </Button>
                  )}

                  {activeProject.directorApprovalStatus === "PENDING" && isDirector && (
                    <>
                      <Button
                        intent="primary"
                        scale="sm"
                        icon={<CheckCircleOutlined />}
                        className="!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold shadow-xs"
                        onClick={() => handleOpenDirectorReview("APPROVE")}
                      >
                        Phê duyệt kết thúc DA
                      </Button>
                      <Button
                        intent="outline"
                        scale="sm"
                        icon={<CloseCircleOutlined />}
                        className="!border-rose-300 !text-rose-600 hover:!bg-rose-50 font-medium"
                        onClick={() => handleOpenDirectorReview("REJECT")}
                      >
                        Yêu cầu hoàn thiện
                      </Button>
                      <Button
                        scale="sm"
                        intent="subtle"
                        icon={<AuditOutlined />}
                        onClick={handleOpenSubmitToDirector}
                      >
                        Xem tờ trình
                      </Button>
                    </>
                  )}

                  {activeProject.directorApprovalStatus === "PENDING" && !isDirector && (
                    <Button
                      scale="sm"
                      intent="outline"
                      icon={<AuditOutlined />}
                      className="!border-slate-300 !text-slate-700 hover:!bg-slate-50"
                      onClick={handleOpenSubmitToDirector}
                    >
                      Xem chi tiết tờ trình
                    </Button>
                  )}

                  {activeProject.directorApprovalStatus === "REJECTED" && isCndaOfActiveProject && (
                    <Button
                      intent="primary"
                      scale="sm"
                      icon={<SendOutlined />}
                      className="!bg-[#0F4C81] hover:!bg-[#0D3F6C] !border-[#0F4C81] !text-white font-semibold shadow-xs"
                      onClick={handleOpenSubmitToDirector}
                    >
                      Trình lại Ban Giám đốc
                    </Button>
                  )}

                  {activeProject.directorApprovalStatus === "APPROVED" && (
                    <Button
                      scale="sm"
                      intent="subtle"
                      icon={<AuditOutlined />}
                      onClick={handleOpenSubmitToDirector}
                    >
                      Xem biên bản & tờ trình
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <Table
            rowKey="id"
            columns={assignmentColumns}
            dataSource={paginatedRows}
            size="middle"
            tableLayout="fixed"
            pagination={false}
            onRow={(record) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement;
                // Nếu bấm vào nút hành động hoặc select, popconfirm, dropdown thì không kích hoạt xem chi tiết
                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest("input") ||
                  target.closest(".ant-btn") ||
                  target.closest(".ant-dropdown") ||
                  target.closest(".ant-popconfirm") ||
                  target.closest(".ant-select")
                ) {
                  return;
                }
                onOpenDetail(record);
              },
              className: "cursor-pointer hover:bg-slate-50/80 transition-colors group",
            })}
            className="[&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-slate-700 [&_.ant-table-tbody>tr>td]:py-2.5 [&_.ant-table-thead_th::before]:!hidden [&_.ant-table-thead_th:before]:!content-none"
            locale={{
              emptyText: (
                <div className="py-10 text-center text-[13px] text-slate-500 space-y-1.5">
                  <div>Chưa có nhiệm vụ nào được phân công cho thành viên trong dự án này.</div>
                  {viewScope === "PROJECT_LEAD" && (
                    <div className="text-xs text-slate-400">
                      Giai đoạn phân công cho Tổ trưởng được dùng để Lead tổ giao việc cụ thể cho thành viên và thể hiện trên Sơ đồ phân cấp nhân sự.
                    </div>
                  )}
                </div>
              ),
            }}
          />
        </Card>
      )}

      {/* Modal Cấp role Quyền Chủ nhiệm dự án (chỉ cho Người thực hiện chính) */}
      {grantModalOpen && (
        <GrantActingDirectorModal
          project={grantProject}
          data={data}
          currentUser={controller.currentUser}
          onClose={() => {
            setGrantModalOpen(false);
            setGrantProject(undefined);
          }}
          onSubmit={controller.grantActingDirector}
          onOpenAssignLeaders={onAssignLeadership}
        />
      )}

      {/* Modal Cấp quyền & Ủy quyền điều hành dự án */}
      {projectPermissionsModalOpen && (
        <ProjectPermissionsModal
          open={projectPermissionsModalOpen}
          initialProjectId={projectPermissionsTargetProjectId}
          data={data}
          currentUser={controller.currentUser}
          canManageRole={canManageRole}
          onClose={() => {
            setProjectPermissionsModalOpen(false);
            setProjectPermissionsTargetProjectId(undefined);
          }}
          onUpdateProjectPermissions={controller.updateProjectPermissions}
        />
      )}

      {/* Drawer Tổ công tác dự án & Quản lý thành viên */}
      {teamModalProject && (
        <ProjectTeamModal
          project={teamModalProject}
          data={data}
          isManager={canManageRole || Boolean(teamModalProject.actingDirectorId)}
          canManageRole={canManageRole}
          onClose={() => setTeamModalProject(undefined)}
          onAddMember={controller.addProjectMember}
          onRemoveMember={controller.removeProjectMember}
          onRevokeRole={(projId) => {
            const p = data.projects.find((item) => item.id === projId);
            if (p) confirmRevokeRole(p);
          }}
          onOpenGrantModal={(p) => {
            setGrantProject(p);
            setGrantModalOpen(true);
          }}
          onUrgeMember={(staff, proj) => {
            handleOpenUrge({ staff, project: proj });
          }}
        />
      )}

      {/* Modal Đôn đốc tiến độ thành viên */}
      {urgeModalOpen && (
        <UrgeMemberModal
          project={urgeProject}
          assignment={urgeAssignment}
          targetStaff={urgeStaff}
          data={data}
          currentUser={controller.currentUser}
          onClose={() => {
            setUrgeModalOpen(false);
            setUrgeProject(undefined);
            setUrgeAssignment(undefined);
            setUrgeStaff(undefined);
          }}
          onSubmit={controller.urgeMember}
        />
      )}

      {/* Modal Từ chối nghiệm thu nhiệm vụ */}
      <Modal
        open={Boolean(rejectTarget)}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        onOk={async () => {
          if (!rejectTarget || !rejectReason.trim()) return;
          await controller.rejectAssignment(rejectTarget.id, rejectReason);
          setRejectTarget(null);
          setRejectReason("");
        }}
        okText="Từ chối & Yêu cầu làm lại"
        okButtonProps={{
          danger: true,
          disabled: !rejectReason.trim(),
          className: "!bg-rose-600 hover:!bg-rose-700 !border-rose-600",
        }}
        cancelText="Hủy"
        title={
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <CloseCircleFilled />
            <span>Từ chối nghiệm thu nhiệm vụ</span>
          </div>
        }
        width={480}
        destroyOnHidden
      >
        {rejectTarget && (
          <div className="py-2 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-1">
              <div className="font-bold text-slate-900">{rejectTarget.title}</div>
              <div className="text-slate-500">
                Người thực hiện: <strong className="text-slate-700">{data.staff.find((s) => s.id === rejectTarget.assigneeId)?.name || "Chưa rõ"}</strong>
              </div>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block mb-1">
                Lý do từ chối / Nội dung yêu cầu hoàn thiện <span className="text-rose-500">*</span>:
              </span>
              <Input.TextArea
                rows={3}
                placeholder="Nhập lý do chưa nghiệm thu (ví dụ: Thiếu biên bản đo đạc hiện trường, chưa đủ chữ ký TVGS...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Trình Ban Giám đốc phê duyệt dự án */}
      <Modal
        open={submitDirectorModalOpen}
        onCancel={() => setSubmitDirectorModalOpen(false)}
        onOk={handleSubmitProjectToDirector}
        okText={
          activeProject?.directorApprovalStatus === "APPROVED"
            ? "Đóng"
            : activeProject?.directorApprovalStatus === "PENDING"
            ? (isCndaOfActiveProject ? "Cập nhật tờ trình" : "Xác nhận")
            : "Gửi trình Ban Giám đốc"
        }
        okButtonProps={{
          disabled: activeProject?.directorApprovalStatus === "APPROVED" ? false : !submitNote.trim(),
          className:
            activeProject?.directorApprovalStatus === "APPROVED"
              ? "!bg-slate-700 hover:!bg-slate-800"
              : "!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold",
        }}
        cancelText="Đóng"
        cancelButtonProps={
          activeProject?.directorApprovalStatus === "APPROVED" ? { style: { display: "none" } } : undefined
        }
        title={
          <div className="flex items-center gap-2.5 text-[#0F4C81] font-bold text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0F4C81]">
              <SendOutlined />
            </span>
            <span>
              {activeProject?.directorApprovalStatus === "APPROVED"
                ? "Tờ trình nghiệm thu hoàn thành dự án (Đã duyệt)"
                : activeProject?.directorApprovalStatus === "PENDING"
                ? "Tờ trình Ban Giám đốc (Đang chờ duyệt)"
                : "Tờ trình Ban Giám đốc nghiệm thu hoàn thành toàn bộ dự án"}
            </span>
          </div>
        }
        width={680}
        destroyOnHidden
      >
        {activeProject && (
          <div className="py-2 space-y-4 text-xs">
            {/* Thông tin dự án tóm tắt */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium shrink-0">Dự án áp dụng:</span>
                <span className="font-bold text-slate-800 text-right truncate">
                  {activeProject.code} · {activeProject.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
                <span className="text-slate-500 font-medium shrink-0">Chủ nhiệm dự án (CNDA):</span>
                <span className="font-semibold text-[#0F4C81]">
                  {data.staff.find((s) => s.id === (activeProject.actingDirectorId || activeProject.mainExecutorId))?.name || controller.currentUser?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/70 pt-2">
                <span className="text-slate-500 font-medium shrink-0">Tiến độ nghiệm thu:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Hoàn thành 100% ({activeProjectPhaseAssignments.length}/{activeProjectPhaseAssignments.length} giai đoạn)
                </span>
              </div>
            </div>

            {/* Danh sách các giai đoạn đã nghiệm thu */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1.5">
                Các giai đoạn hoàn thành được tổng hợp trong tờ trình:
              </span>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                {activeProjectPhaseAssignments.map((phase) => {
                  const assignee = data.staff.find((s) => s.id === phase.assigneeId);
                  const meta = PROJECT_STAGE_META[phase.stage || ""] || { label: `Giai đoạn ${phase.stage || ""}`, fullName: phase.title };
                  return (
                    <div key={phase.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircleOutlined className="text-emerald-600 text-sm shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-800">{phase.title}</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">({meta.label})</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-[11px] text-slate-500">
                        Phụ trách: <strong className="text-slate-700">{assignee?.name || "Chưa rõ"}</strong>
                        {phase.completedAt && (
                          <span className="ml-1 text-emerald-600 font-medium">· Xong: {formatDateVi(phase.completedAt)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chọn Lãnh đạo trình */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1.5">
                Kính trình Lãnh đạo Ban Quản lý <span className="text-rose-500">*</span>:
              </span>
              {activeProject.directorApprovalStatus === "APPROVED" || (activeProject.directorApprovalStatus === "PENDING" && !isCndaOfActiveProject) ? (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                  {activeProject.directorTargetStaffName || "Ban Giám đốc"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {directorStaffList.map((director) => {
                    const isSelected = submitTargetStaffId === director.id;
                    const isChief = director.roleCode === "ADMIN";
                    return (
                      <div
                        key={director.id}
                        onClick={() => {
                          setSubmitTargetStaffId(director.id);
                          setSubmitTargetRole(isChief ? "GIAM_DOC" : "PHO_GIAM_DOC");
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-2.5",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                      >
                        <Radio checked={isSelected} className="mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800">{director.name}</div>
                          <div className="text-[11px] text-slate-500">{director.title} · Ban Giám đốc</div>
                          <Tag
                            color={isChief ? "gold" : "blue"}
                            className="text-[10px] px-1.5 py-0 mt-1 font-semibold rounded"
                          >
                            {isChief ? "Giám đốc BQL" : "Phó Giám đốc BQL"}
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nội dung tờ trình / Ý kiến đề xuất của CNDA */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1">
                Nội dung tờ trình / Ý kiến đề xuất của Chủ nhiệm dự án <span className="text-rose-500">*</span>:
              </span>
              <Input.TextArea
                rows={3}
                placeholder="Nhập nội dung tờ trình trình Ban Giám đốc..."
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                disabled={activeProject.directorApprovalStatus === "APPROVED" || (activeProject.directorApprovalStatus === "PENDING" && !isCndaOfActiveProject)}
                className="text-xs font-normal"
              />
            </div>

            {/* Hiển thị ý kiến chỉ đạo nếu đã có phản hồi từ BGĐ */}
            {activeProject.directorReviewNote && (
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs",
                  activeProject.directorApprovalStatus === "APPROVED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                )}
              >
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {activeProject.directorApprovalStatus === "APPROVED" ? (
                    <CheckCircleOutlined className="text-emerald-600" />
                  ) : (
                    <CloseCircleFilled className="text-rose-600" />
                  )}
                  <span>Ý kiến chỉ đạo của {activeProject.directorReviewedBy || "Ban Giám đốc"}:</span>
                </div>
                <div className="italic">{activeProject.directorReviewNote}</div>
                <div className="text-[11px] text-slate-500 mt-1 text-right">
                  Thời gian: {formatDateVi(activeProject.directorReviewedAt)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Ban Giám đốc Phê duyệt / Từ chối dự án */}
      <Modal
        open={directorReviewModalOpen}
        onCancel={() => {
          setDirectorReviewModalOpen(false);
          setDirectorReviewNote("");
        }}
        onOk={handleConfirmDirectorReview}
        okText={directorReviewAction === "APPROVE" ? "Phê duyệt hoàn thành dự án" : "Yêu cầu hoàn thiện lại"}
        okButtonProps={{
          disabled: directorReviewAction === "REJECT" && !directorReviewNote.trim(),
          className:
            directorReviewAction === "APPROVE"
              ? "!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white font-semibold"
              : "!bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white font-semibold",
        }}
        cancelText="Hủy"
        title={
          <div className="flex items-center gap-2.5 font-bold text-base">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                directorReviewAction === "APPROVE"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              )}
            >
              {directorReviewAction === "APPROVE" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            </span>
            <span className={directorReviewAction === "APPROVE" ? "text-emerald-700" : "text-rose-700"}>
              {directorReviewAction === "APPROVE"
                ? "Ban Giám đốc Phê duyệt kết thúc dự án"
                : "Ban Giám đốc Yêu cầu hoàn thiện lại"}
            </span>
          </div>
        }
        width={560}
        destroyOnHidden
      >
        {reviewTargetProject || activeProject ? (
          (() => {
            const currentReviewProject = (reviewTargetProject || activeProject)!;
            return (
              <div className="py-2 space-y-3.5 text-xs">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-1.5">
                  <div className="font-bold text-slate-800 text-[13px]">{currentReviewProject.code} · {currentReviewProject.name}</div>
                  <div className="text-slate-500">
                    Chủ nhiệm dự án: <strong className="text-slate-700">{currentReviewProject.directorSubmittedBy || data.staff.find((s) => s.id === currentReviewProject.mainExecutorId)?.name || "Chủ nhiệm dự án"}</strong>
                    {currentReviewProject.directorSubmittedAt && (
                      <span> · Ngày trình: {formatDateVi(currentReviewProject.directorSubmittedAt)}</span>
                    )}
                  </div>
                  {currentReviewProject.directorSubmissionNote ? (
                    <div className="pt-1 text-slate-600 italic border-t border-slate-200/60 mt-1">
                      "{currentReviewProject.directorSubmissionNote}"
                    </div>
                  ) : (
                    <div className="pt-1 text-slate-600 italic border-t border-slate-200/60 mt-1">
                      "Toàn bộ các giai đoạn thực hiện dự án đã hoàn thành nghiệm thu đạt yêu cầu. Kính trình Ban Giám đốc xem xét phê duyệt kết thúc dự án."
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    {directorReviewAction === "APPROVE"
                      ? "Ý kiến chỉ đạo / Kết luận của Ban Giám đốc:"
                      : "Lý do từ chối / Yêu cầu CNDA hoàn thiện lại (*):"}
                  </span>
                  <Input.TextArea
                    rows={3}
                    placeholder={
                      directorReviewAction === "APPROVE"
                        ? "Nhập ý kiến chỉ đạo kết luận nghiệm thu dự án..."
                        : "Nhập cụ thể các nội dung cần hoàn thiện trước khi trình lại..."
                    }
                    value={directorReviewNote}
                    onChange={(e) => setDirectorReviewNote(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            );
          })()
        ) : null}
      </Modal>
    </div>
  );
}
