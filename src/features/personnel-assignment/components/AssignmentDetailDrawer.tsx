"use client";

import React, { useState } from "react";
import {
  AlertOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TeamOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import {
  Avatar,
  Button,
  Drawer,
  Input,
  Modal,
  Tag,
  Tooltip,
} from "@/components/ui";
import { daysBetween, formatDateVi } from "@/utils/date";
import AssignmentModal from "./AssignmentModal";
import {
  PROJECT_STAGE_META,
} from "../constants/personnel-labels";
import type { PersonnelController } from "../hooks/usePersonnelAssignment";
import type {
  Assignment,
  ProjectDocumentSubmission,
} from "../types/personnel.types";
import { isOverdue } from "../utils/personnel-rules";

interface AssignmentDetailDrawerProps {
  assignment: Assignment;
  controller: PersonnelController;
  onClose: () => void;
  onComplete: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
}

export default function AssignmentDetailDrawer({
  assignment,
  controller,
  onClose,
  onEdit,
}: AssignmentDetailDrawerProps) {
  const { data, today, permissions } = controller;
  const liveAssignment = data.assignments.find((a) => a.id === assignment.id) || assignment;
  const project = data.projects.find((p) => p.id === liveAssignment.projectId);
  const assignee = data.staff.find((s) => s.id === liveAssignment.assigneeId);
  const team = assignee
    ? data.teams.find((t) => t.id === assignee.teamId)
    : undefined;
  const coAssignees = (liveAssignment.coAssigneeIds || [])
    .map((id) => data.staff.find((s) => s.id === id))
    .filter(Boolean);

  const currentStaff = React.useMemo(() => {
    if (!controller.currentUser) return undefined;
    const name = (controller.currentUser.displayName || controller.currentUser.name || "").trim().toLowerCase();
    const email = (controller.currentUser.email || "").trim().toLowerCase();
    return data.staff.find(
      (s) =>
        s.id === controller.currentUser?.id ||
        (email && s.email.toLowerCase() === email) ||
        (name && s.name.toLowerCase() === name)
    );
  }, [controller.currentUser, data.staff]);
  const currentStaffId = currentStaff?.id;

  const isDirector = Boolean(permissions.canAssignProjectLeaders || permissions.canGrantRole);
  const isLeadOnThisProject =
    isDirector ||
    project?.actingDirectorId === currentStaffId ||
    project?.mainExecutorId === currentStaffId ||
    (permissions.actingProjectIds || []).includes(liveAssignment.projectId);

  const myLeadingTeam = React.useMemo(() => {
    if (!currentStaffId) return undefined;
    return data.teams.find((t) => t.leaderId === currentStaffId && t.id !== "BGD");
  }, [currentStaffId, data.teams]);
  const isTeamLeader = Boolean(myLeadingTeam || permissions.isTeamLeader);
  const myLeadingTeamId = myLeadingTeam?.id || permissions.leadingTeamId;

  const isMyTask =
    liveAssignment.assigneeId === currentStaffId ||
    (liveAssignment.coAssigneeIds || []).includes(currentStaffId || "");

  const isTaskInMyTeam = Boolean(
    isTeamLeader &&
      myLeadingTeamId &&
      (liveAssignment.teamId === myLeadingTeamId || assignee?.teamId === myLeadingTeamId)
  );

  const canManageThisTask =
    (isLeadOnThisProject && !isMyTask) ||
    (isTaskInMyTeam && !isMyTask && liveAssignment.assignmentLevel !== "PHASE_LEAD");

  const canEditThisTask =
    liveAssignment.status !== "DONE" &&
    ((liveAssignment.assignmentLevel === "PHASE_LEAD" && isLeadOnThisProject) ||
      (liveAssignment.assignmentLevel === "TASK_MEMBER" && (isLeadOnThisProject || isTaskInMyTeam)));

  const isPendingApproval = liveAssignment.status === "PENDING_APPROVAL";
  const childAssignments = liveAssignment.assignmentLevel === "PHASE_LEAD"
    ? data.assignments.filter((item) => item.parentAssignmentId === liveAssignment.id)
    : [];
  const canSubmitPhase = liveAssignment.assignmentLevel !== "PHASE_LEAD" ||
    (childAssignments.length > 0 && childAssignments.every((item) => item.approvalStage === "PROJECT_APPROVED"));
  const canReview = canManageThisTask && isPendingApproval && (
    liveAssignment.assignmentLevel !== "TASK_MEMBER" || !liveAssignment.parentAssignmentId ||
    (isLeadOnThisProject && liveAssignment.approvalStage === "LEAD_APPROVED") ||
    (isTaskInMyTeam && !isLeadOnThisProject && !liveAssignment.approvalStage)
  );

  const overdue = isOverdue(liveAssignment, today);
  const stageMeta = liveAssignment.stage
    ? PROJECT_STAGE_META[liveAssignment.stage]
    : undefined;

  const { modal } = App.useApp();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State cho Modal Chỉnh sửa phân công (Lead tổ / CNDA)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const handleOpenEdit = (target: Assignment) => {
    if (onEdit) {
      onEdit(target);
    } else {
      setEditingAssignment(target);
    }
  };

  // State cho Modal Từ chối nghiệm thu
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [rejectChildId, setRejectChildId] = useState<string | null>(null);
  const [busyChildId, setBusyChildId] = useState<string | null>(null);

  // Danh sách tệp đính kèm hiện tại của nhiệm vụ
  const submissions = liveAssignment.submissions || [];

  // Icon loại file
  const renderFileIcon = (fileType?: string, fileName?: string) => {
    const ext = (fileType || fileName?.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
          <FilePdfOutlined className="text-rose-600 text-base" />
        </div>
      );
    }
    if (ext === "doc" || ext === "docx") {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <FileWordOutlined className="text-blue-600 text-base" />
        </div>
      );
    }
    if (ext === "xls" || ext === "xlsx") {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <FileExcelOutlined className="text-emerald-600 text-base" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <FileTextOutlined className="text-slate-500 text-base" />
      </div>
    );
  };

  // Xử lý tải nhiều tệp đính kèm trực tiếp cùng lúc (không cần form popup)
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newSubs: Partial<ProjectDocumentSubmission>[] = fileList.map((file, idx) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr =
        file.size > 1024 * 1024
          ? `${sizeMb} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        documentCode: `TL-${Date.now().toString().slice(-4)}-${idx + 1}`,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: ext as ProjectDocumentSubmission["fileType"],
        submittedAt: `${today} ${timeStr}`,
        submittedByStaffId: liveAssignment.assigneeId || "ST-001",
        submittedByName: assignee?.name || "Cán bộ thực hiện",
        leadApprovalStatus: "PENDING_LEAD",
      };
    });

    await controller.addAssignmentSubmissions(liveAssignment.id, newSubs);
    e.target.value = "";
  };

  const handleRemoveFile = async (submissionId: string) => {
    await controller.removeAssignmentSubmission(liveAssignment.id, submissionId);
  };

  // Xử lý gửi báo cáo hoàn thành & yêu cầu nghiệm thu từ phía cán bộ
  const handleConfirmCompletion = () => {
    const isPhase = liveAssignment.assignmentLevel === "PHASE_LEAD";
    const approverText =
      isPhase || liveAssignment.assignedByRole === "PROJECT_LEAD"
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
            <div className="font-bold text-slate-900">{liveAssignment.title}</div>
            <div className="text-[11px] text-slate-500">
              Dự án: {project?.name} · Hạn: {formatDateVi(liveAssignment.dueDate)}
            </div>
            {submissions.length > 0 && (
              <div className="text-[11px] text-emerald-700 font-medium">
                Đã đính kèm {submissions.length} hồ sơ/tài liệu
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
        await controller.requestCompletion(liveAssignment.id);
        onClose();
      },
    });
  };

  // Xử lý chấp nhận nghiệm thu từ phía lãnh đạo
  const handleAccept = async () => {
    await controller.acceptAssignment(liveAssignment.id);
    onClose();
  };

  // Xử lý từ chối nghiệm thu từ phía lãnh đạo
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    setRejectSubmitting(true);
    try {
      const targetId = rejectChildId || liveAssignment.id;
      const success = await controller.rejectAssignment(targetId, rejectReason);
      if (!success) return;
      setRejectModalOpen(false);
      setRejectReason("");
      setRejectChildId(null);
      if (!rejectChildId) onClose();
    } finally {
      setRejectSubmitting(false);
    }
  };


  return (
    <>
      <Drawer
        open
        width="min(660px, 100vw)"
        onClose={onClose}
        className="[&_.ant-drawer-body]:!p-0 [&_.ant-drawer-body]:!overflow-hidden flex flex-col h-full"
        title={
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 truncate max-w-[420px]">
                {liveAssignment.title}
              </span>
              {liveAssignment.status === "DONE" ? (
                <Tag color="success" scale="sm" className="font-semibold !m-0">
                  Hoàn thành
                </Tag>
              ) : liveAssignment.status === "IN_PROGRESS" ? (
                <Tag color="processing" scale="sm" className="font-semibold !m-0">
                  Đang thực hiện
                </Tag>
              ) : (
                <Tag color="default" scale="sm" className="font-medium !m-0">
                  Chưa bắt đầu
                </Tag>
              )}
              {liveAssignment.priority === "HIGH" ? (
                <Tag color="error" scale="sm" className="font-semibold !m-0">
                  Ưu tiên cao
                </Tag>
              ) : (
                <Tag color="blue" scale="sm" className="font-medium !m-0">
                  Bình thường
                </Tag>
              )}
            </div>
            <div className="text-xs text-slate-500 font-normal flex items-center gap-1.5 flex-wrap">
              <span>Dự án:</span>
              <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {project?.code}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-700 font-medium">{project?.name}</span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between px-3 py-2 bg-white w-full border-t border-slate-200">
            <div className="flex items-center gap-2">
              {liveAssignment.approvalStage === "RETURNED_TO_LEAD" && isTaskInMyTeam && !isMyTask && (
                <Button intent="primary" onClick={async () => { await controller.returnToMember(liveAssignment.id); onClose(); }}>
                  Chuyển thành viên chỉnh sửa
                </Button>
              )}
              {/* QUẢN LÝ / NGƯỜI DUYỆT (CNDA, Giám đốc, Tổ trưởng quản lý thành viên) */}
              {canManageThisTask && (
                <>
                  {canReview ? (
                    <>
                      <Button
                        intent="primary"
                        icon={<CheckOutlined />}
                        onClick={handleAccept}
                        className="text-xs font-semibold px-3.5 h-8 rounded-lg !bg-[#007A78] hover:!bg-[#006361] !border-[#007A78] !text-white"
                      >
                        {liveAssignment.assignmentLevel === "PHASE_LEAD" ? "Hoàn thành giai đoạn" : liveAssignment.parentAssignmentId && !liveAssignment.approvalStage ? "Duyệt chuyển CNDA" : "Chấp nhận bước con"}
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setRejectReason("");
                          setRejectModalOpen(true);
                        }}
                        className="text-xs font-semibold px-3.5 h-8 rounded-lg !bg-rose-50 hover:!bg-rose-100 !text-rose-600 !border-rose-300"
                      >
                        Từ chối
                      </Button>
                    </>
                  ) : isPendingApproval ? (
                    <span className="text-xs text-amber-700">
                      {liveAssignment.approvalStage === "PROJECT_APPROVED" ? "CNDA đã duyệt bước, chờ chốt giai đoạn" : "Đang chờ cấp duyệt tiếp theo"}
                    </span>
                  ) : liveAssignment.status !== "DONE" ? (
                    canEditThisTask ? (
                      <Button
                        intent="outline"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(liveAssignment)}
                        className="text-xs font-semibold px-3.5 h-8 rounded-lg !border-slate-300 !text-slate-700 hover:!border-[#007A78] hover:!text-[#007A78]"
                      >
                        Sửa phân công
                      </Button>
                    ) : null
                  ) : null}
                </>
              )}

              {/* DÀNH CHO CÁN BỘ THỰC HIỆN KHI ĐANG LÀM HOẶC CHỜ DUYỆT */}
              {isMyTask && liveAssignment.status !== "DONE" && (
                <>
                  {isPendingApproval ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                      <ClockCircleOutlined className="text-amber-600" />
                      Đã gửi báo cáo · Đang chờ phê duyệt
                    </span>
                  ) : liveAssignment.approvalStage === "RETURNED_TO_LEAD" ? (
                    <span className="text-xs text-amber-700">Chờ tổ trưởng chuyển lại để chỉnh sửa</span>
                  ) : (
                    <Button
                      intent="primary"
                      icon={<CheckOutlined />}
                      onClick={handleConfirmCompletion}
                      disabled={!canSubmitPhase}
                      title={!canSubmitPhase ? "Cần CNDA duyệt tất cả bước con trước khi gửi giai đoạn" : undefined}
                      className={canSubmitPhase
                        ? "text-xs font-semibold px-3.5 h-8 rounded-lg !bg-[#007A78] hover:!bg-[#006361] !border-[#007A78] !text-white"
                        : "text-xs font-semibold px-3.5 h-8 rounded-lg !bg-slate-200 !border-slate-200 !text-slate-500 cursor-not-allowed"}
                    >
                      {liveAssignment.assignedByRole === "PROJECT_LEAD" || liveAssignment.assignmentLevel === "PHASE_LEAD"
                        ? "Gửi CNDA duyệt"
                        : "Gửi duyệt nghiệm thu"}
                    </Button>
                  )}
                </>
              )}

              <Button
                intent="outline"
                onClick={onClose}
                className="text-xs font-medium px-3.5 h-8 rounded-lg"
              >
                Đóng
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {liveAssignment.rejectionNote && liveAssignment.status === "IN_PROGRESS" && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <strong>Yêu cầu chỉnh sửa:</strong> {liveAssignment.rejectionNote}
              </div>
            )}
            {/* Cảnh báo quá hạn */}
            {overdue && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                <AlertOutlined className="shrink-0 text-rose-600 text-sm" />
                <span>
                  <strong>Đã quá hạn hoàn thành:</strong> Quá hạn {daysBetween(liveAssignment.dueDate, today)} ngày (Hạn chót: {formatDateVi(liveAssignment.dueDate)}).
                </span>
              </div>
            )}

            {/* 1. Nhân sự phụ trách */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <TeamOutlined className="text-slate-600 text-sm" />
                <span>Nhân sự phụ trách</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cán bộ thực hiện chính */}
                <div className="space-y-2 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-700 block">Cán bộ thực hiện chính</span>
                  {assignee ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        variant="brand"
                        shape="circle"
                        size={38}
                        className="font-bold shrink-0 bg-[#007A78] text-white shadow-xs"
                      >
                        {assignee.name
                          .split(" ")
                          .slice(-2)
                          .map((w) => w[0])
                          .join("")}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {assignee.name}
                          </span>
                          <Tag color="cyan" className="!text-[10px] !m-0 !px-1 font-bold">Chính</Tag>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                          {assignee.title} · {team?.name || "Tổ chuyên môn"}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                          {assignee.email} · {assignee.phone}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Chưa chỉ định cán bộ</div>
                  )}
                </div>

                {/* Cán bộ phối hợp */}
                <div className="space-y-2 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Cán bộ phối hợp ({coAssignees.length})
                  </span>
                  {coAssignees.length > 0 ? (
                    <div className="space-y-2">
                      {coAssignees.map((person) => (
                        <div
                          key={person?.id}
                          className="flex items-center gap-2 p-1.5 rounded-md bg-white border border-slate-200 text-xs shadow-2xs"
                        >
                          <Avatar size={22} className="!bg-slate-600 !text-white !text-[10px] shrink-0 font-bold">
                            {person?.name.split(" ").slice(-1)[0][0]}
                          </Avatar>
                          <span className="font-semibold text-slate-800">{person?.name}</span>
                          <span className="text-[11px] text-slate-500">({person?.title})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Không có cán bộ phối hợp</div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Thông tin nhiệm vụ & Tiến độ */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="text-xs font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <ClockCircleOutlined className="text-slate-600 text-sm" />
                <span>Thông tin nhiệm vụ & Tiến độ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-1.5">Giai đoạn dự án</span>
                  {stageMeta ? (
                    <span className="text-slate-800 font-semibold text-xs">
                      {stageMeta.label} – {stageMeta.fullName}
                    </span>
                  ) : (
                    <span className="text-slate-800 font-medium">Giai đoạn VI</span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-1.5">Bước quy trình</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {liveAssignment.assignmentLevel !== "PHASE_LEAD" && liveAssignment.stepCode && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Bước {liveAssignment.stepCode}
                      </span>
                    )}
                  <span className="text-slate-800 font-semibold text-xs">
                      {liveAssignment.assignmentLevel === "PHASE_LEAD" ? "Toàn bộ giai đoạn" : liveAssignment.stepName || "Chưa xác định bước"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 rounded-md bg-slate-50/60 border border-slate-100/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Người giao việc</span>
                  <span className="text-slate-800 font-semibold mt-0.5 block truncate">
                    {liveAssignment.assignedBy}
                  </span>
                </div>
                <div className="p-2 rounded-md bg-slate-50/60 border border-slate-100/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Ngày giao</span>
                  <span className="text-slate-700 font-mono text-xs mt-0.5 block">
                    {formatDateVi(liveAssignment.assignedAt)}
                  </span>
                </div>
                <div className="p-2 rounded-md bg-slate-50/60 border border-slate-100/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Hạn hoàn thành</span>
                  {overdue ? (
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                      {formatDateVi(liveAssignment.dueDate)}
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                      {formatDateVi(liveAssignment.dueDate)}
                    </span>
                  )}
                </div>
                <div className="p-2 rounded-md bg-slate-50/60 border border-slate-100/80">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Ngày hoàn thành</span>
                  {liveAssignment.completedAt ? (
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                      {formatDateVi(liveAssignment.completedAt)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-xs mt-0.5 block">—</span>
                  )}
                </div>
              </div>
            </div>

            {liveAssignment.assignmentLevel === "PHASE_LEAD" && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Các bước con của giai đoạn</h3>
                {childAssignments.length === 0 ? (
                  <p className="text-xs text-slate-500">Tổ trưởng chưa giao bước con cho thành viên.</p>
                ) : (
                  <div className="space-y-2">
                    {childAssignments.map((child) => {
                      const childAssignee = data.staff.find((person) => person.id === child.assigneeId);
                      const isExpanded = expandedChildId === child.id;

                      // Quyền hạn đối với bước con:
                      // Chủ nhiệm dự án (CNDA) KHÔNG sửa, KHÔNG đôn đốc, KHÔNG duyệt bước con (chỉ xem chi tiết để kiểm tra bình thường)
                      // Chỉ có Lead tổ (Tổ trưởng) phụ trách giai đoạn này mới có quyền phân công lại, đôn đốc, duyệt bước con của tổ mình
                      const isLeadOfThisPhaseOrTeam = !isLeadOnThisProject && (
                        (currentStaffId && (currentStaffId === liveAssignment.assigneeId || currentStaffId === liveAssignment.teamLeaderId)) ||
                        Boolean(isTeamLeader && myLeadingTeamId && (liveAssignment.teamId === myLeadingTeamId || child.teamId === myLeadingTeamId || childAssignee?.teamId === myLeadingTeamId))
                      );

                      const isChildApproved = Boolean(
                        child.approvalStage === "LEAD_APPROVED" ||
                        child.approvalStage === "PROJECT_APPROVED" ||
                        child.status === "DONE"
                      );

                      const canReviewChild = !isLeadOnThisProject &&
                        isLeadOfThisPhaseOrTeam &&
                        !isChildApproved &&
                        (child.status === "PENDING_APPROVAL" || Boolean(child.rejectionNote)) &&
                        child.assigneeId !== currentStaffId;

                      const canUndoChild = !isLeadOnThisProject &&
                        isLeadOfThisPhaseOrTeam &&
                        isChildApproved &&
                        child.status !== "DONE";

                      const canEditChild = !isLeadOnThisProject &&
                        isLeadOfThisPhaseOrTeam &&
                        !isChildApproved;

                      const childStatus = child.status === "DONE" ? "Hoàn thành" :
                        child.approvalStage === "PROJECT_APPROVED" ? "CNDA đã duyệt, chờ chốt giai đoạn" :
                        child.approvalStage === "LEAD_APPROVED" ? "Chờ CNDA duyệt" :
                        child.approvalStage === "RETURNED_TO_LEAD" ? "CNDA từ chối, chờ tổ trưởng chuyển lại" :
                        child.status === "PENDING_APPROVAL" ? "Chờ tổ trưởng duyệt" :
                        child.rejectionNote ? "Cần chỉnh sửa" : child.status === "TODO" ? "Chưa bắt đầu" : "Đang thực hiện";

                      return (
                        <article key={child.id} className="rounded-lg border border-slate-200 bg-white">
                          <header className="flex min-h-16 items-center justify-between gap-4 px-3 py-2.5">
                            <div className="min-w-0 flex-1 text-left">
                              <p className="m-0 text-xs font-semibold leading-5 text-slate-900">{child.stepCode ? `Bước ${child.stepCode} · ` : ""}{child.title}</p>
                              <div className="m-0 mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-4 text-slate-600">
                                <span className="font-medium text-slate-700">{childAssignee?.name || "Chưa giao"}</span>
                                <span className="text-slate-300">·</span>
                                <Tag
                                  color={
                                    child.status === "DONE"
                                      ? "success"
                                      : child.status === "PENDING_APPROVAL"
                                      ? "warning"
                                      : child.status === "IN_PROGRESS"
                                      ? "processing"
                                      : "default"
                                  }
                                  className="m-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                >
                                  {childStatus}
                                </Tag>
                                {child.submissions && child.submissions.length > 0 && (
                                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    📎 Đã nộp {child.submissions.length} tài liệu
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {canEditChild && !isExpanded && (
                                <Button
                                  intent="outline"
                                  scale="compact"
                                  icon={<EditOutlined />}
                                  onClick={() => handleOpenEdit(child)}
                                  className="!border-slate-300 !text-slate-700 hover:!border-[#007A78] hover:!text-[#007A78]"
                                >
                                  Sửa
                                </Button>
                              )}
                              <Button
                                intent="outline"
                                scale="compact"
                                aria-expanded={isExpanded}
                                onClick={() => setExpandedChildId(isExpanded ? null : child.id)}
                              >
                                {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                              </Button>
                            </div>
                          </header>

                          {isExpanded && (
                            <div className="space-y-3 border-t border-slate-100 px-3 py-3 text-xs">
                              {/* Thông báo nổi bật khi bước con đang chờ duyệt */}
                              {child.status === "PENDING_APPROVAL" && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                                  <ClockCircleOutlined className="text-amber-600 mt-0.5 shrink-0 text-sm" />
                                  <div>
                                    <strong className="text-amber-950 font-semibold">Thành viên đã gửi báo cáo hoàn thành:</strong> Đã đính kèm {child.submissions?.length || 0} hồ sơ/tài liệu kiểm tra{child.confirmRequestedAt ? ` vào ngày ${formatDateVi(child.confirmRequestedAt)}` : ""}.
                                    {canReviewChild ? " Tổ trưởng chuyên môn vui lòng kiểm tra hồ sơ và phê duyệt hoặc yêu cầu bổ sung." : " Đang chờ Tổ trưởng chuyên môn thẩm tra & phê duyệt."}
                                  </div>
                                </div>
                              )}

                              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div><dt className="text-slate-500">Người phụ trách</dt><dd className="mt-0.5 font-semibold text-slate-900">{childAssignee?.name || "Chưa giao"}{childAssignee?.title ? ` · ${childAssignee.title}` : ""}</dd></div>
                                <div><dt className="text-slate-500">Trạng thái</dt><dd className="mt-0.5 font-semibold text-slate-900 flex items-center gap-1.5"><Tag color={child.status === "DONE" ? "success" : child.status === "PENDING_APPROVAL" ? "warning" : "default"} className="m-0 text-[11px] font-semibold px-2 py-0.5 rounded-full">{childStatus}</Tag></dd></div>
                                <div><dt className="text-slate-500">Ngày giao</dt><dd className="mt-0.5 font-medium text-slate-800">{formatDateVi(child.assignedAt)}</dd></div>
                                <div><dt className="text-slate-500">Hạn hoàn thành</dt><dd className="mt-0.5 font-medium text-slate-800">{formatDateVi(child.dueDate)}</dd></div>
                                {child.confirmRequestedAt && <div><dt className="text-slate-500">Ngày gửi nghiệm thu</dt><dd className="mt-0.5 font-semibold text-amber-700">{formatDateVi(child.confirmRequestedAt)}</dd></div>}
                                {child.completedAt && <div><dt className="text-slate-500">Ngày hoàn thành</dt><dd className="mt-0.5 font-medium text-emerald-700">{formatDateVi(child.completedAt)}</dd></div>}
                              </dl>
                              {child.rejectionNote && <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-800"><strong>Yêu cầu sửa:</strong> {child.rejectionNote}</p>}
                              <div>
                                <h4 className="mb-1.5 font-semibold text-slate-900 flex items-center justify-between">
                                  <span>Tài liệu đính kèm ({child.submissions?.length || 0})</span>
                                  {child.status === "PENDING_APPROVAL" && (
                                    <span className="text-[11px] font-normal text-amber-700">Chờ Tổ trưởng thẩm tra</span>
                                  )}
                                </h4>
                                {child.submissions?.length ? (
                                  <ul className="space-y-1.5">
                                    {child.submissions.map((file) => (
                                      <li key={file.id} className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                                            <span className="text-rose-500">📄</span>
                                            <span className="truncate">{file.fileName}</span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            {file.title && <span className="text-slate-700 font-medium">{file.title} · </span>}
                                            <span>{file.fileSize} · Nộp: {file.submittedAt} · Bởi: {file.submittedByName}</span>
                                          </div>
                                          {file.leadFeedbackNote && <p className="mt-1 text-slate-600 italic">Ý kiến: {file.leadFeedbackNote}</p>}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Button
                                            scale="compact"
                                            intent="subtle"
                                            icon={<DownloadOutlined />}
                                            onClick={() => {
                                              const blob = new Blob(["CIPM Mock Document Content"], { type: "text/plain" });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement("a");
                                              a.href = url;
                                              a.download = file.fileName;
                                              a.click();
                                            }}
                                            className="!text-slate-600 hover:!text-[#007A78] !h-6 !px-2 !text-[11px]"
                                          >
                                            Xem tệp
                                          </Button>
                                          <Tag color={file.leadApprovalStatus === "LEAD_APPROVED" ? "success" : file.leadApprovalStatus === "LEAD_REJECTED" ? "error" : "warning"} className="text-[10px] shrink-0 font-semibold m-0">
                                            {file.leadApprovalStatus === "LEAD_APPROVED" ? "Đã duyệt" : file.leadApprovalStatus === "LEAD_REJECTED" ? "Từ chối" : "Chờ duyệt"}
                                          </Tag>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : <p className="text-slate-500">Chưa có tài liệu.</p>}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                                {isChildApproved ? (
                                  <>
                                    {canUndoChild && (
                                      <Button
                                        intent="outline"
                                        scale="compact"
                                        icon={<UndoOutlined />}
                                        loading={busyChildId === child.id}
                                        className="!border-amber-300 !text-amber-700 hover:!bg-amber-50 font-medium"
                                        onClick={async () => {
                                          setBusyChildId(child.id);
                                          try {
                                            await controller.undoAcceptAssignment(child.id);
                                          } finally {
                                            setBusyChildId(null);
                                          }
                                        }}
                                      >
                                        Hoàn tác
                                      </Button>
                                    )}
                                    <Button
                                      intent="subtle"
                                      scale="compact"
                                      onClick={() => setExpandedChildId(null)}
                                      className="!text-slate-600 hover:!bg-slate-100 font-medium"
                                    >
                                      Đóng
                                    </Button>
                                  </>
                                ) : canReviewChild ? (
                                  <>
                                    <Button
                                      intent="primary"
                                      scale="compact"
                                      loading={busyChildId === child.id}
                                      className="!bg-[#007A78] hover:!bg-[#006361] !text-white !font-semibold shadow-2xs"
                                      onClick={async () => {
                                        setBusyChildId(child.id);
                                        try {
                                          await controller.acceptAssignment(child.id);
                                        } finally {
                                          setBusyChildId(null);
                                        }
                                      }}
                                    >
                                      Tổ trưởng chấp nhận
                                    </Button>
                                    <Button
                                      intent="outline"
                                      scale="compact"
                                      danger
                                      className="!border-rose-300 !text-rose-600 hover:!bg-rose-50 font-medium"
                                      onClick={() => {
                                        setRejectChildId(child.id);
                                        setRejectReason(child.rejectionNote || "");
                                        setRejectModalOpen(true);
                                      }}
                                    >
                                      Từ chối / Yêu cầu sửa
                                    </Button>
                                    <Button
                                      intent="subtle"
                                      scale="compact"
                                      onClick={() => setExpandedChildId(null)}
                                      className="!text-slate-600 hover:!bg-slate-100 font-medium"
                                    >
                                      Đóng
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {child.approvalStage === "RETURNED_TO_LEAD" && isLeadOfThisPhaseOrTeam && (
                                      <Button intent="primary" scale="compact" onClick={() => controller.returnToMember(child.id)}>
                                        Chuyển thành viên chỉnh sửa
                                      </Button>
                                    )}
                                    <Button
                                      intent="subtle"
                                      scale="compact"
                                      onClick={() => setExpandedChildId(null)}
                                      className="!text-slate-600 hover:!bg-slate-100 font-medium"
                                    >
                                      Đóng
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Hồ sơ & Tài liệu đính kèm */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleMultipleFilesUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip,.rar"
              />
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <PaperClipOutlined className="text-emerald-600 text-sm" />
                  <span className="text-xs font-semibold text-slate-900">
                    Tài liệu & Hồ sơ đính kèm
                  </span>
                  <span className="text-xs font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {submissions.length}
                  </span>
                </div>

                <Button
                  scale="compact"
                  intent="outline"
                  icon={<PlusOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={liveAssignment.approvalStage === "RETURNED_TO_LEAD"}
                  className="text-xs h-7 px-2.5 rounded-md border-emerald-300 text-emerald-700 hover:!bg-emerald-50 cursor-pointer"
                >
                  Đính kèm tệp
                </Button>
              </div>

              {submissions.length > 0 ? (
                <div className="space-y-2.5">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {renderFileIcon(sub.fileType, sub.fileName)}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {sub.fileName}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-slate-700 font-semibold px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px]">
                                [{sub.documentCode}]
                              </span>
                              <span>{sub.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              {sub.fileSize} · Nộp lúc: {sub.submittedAt} · Bởi: <strong className="text-slate-600 font-sans">{sub.submittedByName}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {sub.leadApprovalStatus === "LEAD_APPROVED" ? (
                            <Tag color="success" scale="sm" className="font-semibold !m-0">
                              Đã duyệt
                            </Tag>
                          ) : sub.leadApprovalStatus === "LEAD_REJECTED" ? (
                            <Tag color="error" scale="sm" className="font-semibold !m-0">
                              Cần sửa
                            </Tag>
                          ) : (
                            <Tag color="warning" scale="sm" className="font-semibold !m-0">
                              Chờ duyệt
                            </Tag>
                          )}

                          <Tooltip title="Tải xuống tệp">
                            <Button
                              type="text"
                              scale="compact"
                              icon={<DownloadOutlined className="text-slate-600 hover:text-emerald-600" />}
                              className="h-7 w-7 !p-0"
                              onClick={() => {
                                window.alert(
                                  `Đang tải xuống tệp: ${sub.fileName} (${sub.fileSize})`
                                );
                              }}
                            />
                          </Tooltip>

                          {sub.leadApprovalStatus !== "LEAD_APPROVED" && liveAssignment.approvalStage !== "RETURNED_TO_LEAD" && (
                            <Tooltip title="Xóa tệp đính kèm này">
                              <Button
                                type="text"
                                scale="compact"
                                danger
                                icon={<DeleteOutlined className="text-slate-400 hover:text-rose-600" />}
                                className="h-7 w-7 !p-0 cursor-pointer"
                                onClick={() => handleRemoveFile(sub.id)}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {sub.leadFeedbackNote && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50/80 px-2.5 py-1.5 rounded-md border border-emerald-200/80">
                          <strong className="text-emerald-800">Ý kiến nghiệm thu:</strong> {sub.leadFeedbackNote}
                          {sub.leadApprovedBy && (
                            <span className="text-emerald-700 italic"> (Bởi: {sub.leadApprovedBy})</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 space-y-1.5 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all"
                  title="Nhấn để chọn và tải lên nhiều tài liệu cùng lúc"
                >
                  <PaperClipOutlined className="text-emerald-600 text-lg block mx-auto" />
                  <div className="font-semibold text-slate-700">Chưa có tài liệu hoặc biên bản nghiệm thu đính kèm</div>
                  <div className="text-[11px] text-slate-500">
                    Nhấn vào đây hoặc nút <strong className="text-emerald-700">+ Đính kèm tệp</strong> để chọn nhiều tài liệu cùng lúc.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Drawer>
      {/* Modal Từ chối nghiệm thu */}
      <Modal
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
          setRejectChildId(null);
        }}
        onOk={handleConfirmReject}
        confirmLoading={rejectSubmitting}
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
        <div className="py-2 space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-1">
            <div className="font-bold text-slate-900">{data.assignments.find((item) => item.id === rejectChildId)?.title || liveAssignment.title}</div>
            <div className="text-slate-500">
              Người thực hiện: <strong className="text-slate-700">{data.staff.find((person) => person.id === data.assignments.find((item) => item.id === rejectChildId)?.assigneeId)?.name || assignee?.name || "Chưa rõ"}</strong>
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
      </Modal>


      {/* Modal Phân công / Chỉnh sửa nhiệm vụ (Lead tổ & Lãnh đạo) */}
      {editingAssignment && (
        <AssignmentModal
          data={data}
          editing={editingAssignment}
          defaultProjectId={editingAssignment.projectId}
          allowedProjectIds={permissions.actingProjectIds}
          initialLevel={editingAssignment.assignmentLevel}
          initialTeamId={editingAssignment.teamId || myLeadingTeamId}
          defaultStage={editingAssignment.stage}
          defaultParentAssignmentId={editingAssignment.parentAssignmentId || liveAssignment.id}
          errorText={controller.feedback?.type === "error" ? controller.feedback.text : undefined}
          onClose={() => setEditingAssignment(null)}
          onCreate={controller.createAssignment}
          onUpdate={async (id, input) => {
            const ok = await controller.updateAssignment(id, input);
            if (ok) {
              setEditingAssignment(null);
            }
            return ok;
          }}
          currentStaffId={currentStaffId || controller.currentUser?.id}
          isProjectLeader={isLeadOnThisProject || permissions.isProjectLeader}
          isTeamLeader={isTeamLeader || permissions.isTeamLeader}
          leadingTeamId={myLeadingTeamId || permissions.leadingTeamId}
        />
      )}
    </>
  );
}
