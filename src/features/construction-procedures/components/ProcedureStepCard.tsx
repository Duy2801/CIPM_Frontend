"use client";

import { useState } from "react";
import {
  CalendarOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  ClockCircleOutlined,
  CloseOutlined,
  DownOutlined,
  FilePdfOutlined,
  LockOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  TeamOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Tag, Text, Tooltip } from "@/components/ui";
import { getStepSequenceValidation } from "../utils/procedure-rules";
import type { ProcedureStep } from "../types/procedure.types";
import { useAuth } from "@/features/auth";
import {
  getDepartmentStaff,
  isDirectorUser,
  isLeadOfDepartment,
} from "../constants/procedure-department-templates";

interface ProcedureStepCardProps {
  step: ProcedureStep;
  allSteps: ProcedureStep[];
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onConfirmCompleteStep?: (stepId: string) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  onOpenDocsModal: (step: ProcedureStep) => void;
  onOpenDetail?: (step: ProcedureStep) => void;
  highlight?: boolean;
  canUpdateProcedure?: boolean;
  onAssignMember?: (stepId: string, memberName: string) => void;
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string, reason: string) => void;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa thiết lập";
}

export default function ProcedureStepCard({
  step,
  allSteps,
  onStartStep,
  onOpenCompleteModal,
  onConfirmCompleteStep,
  onOpenSkipModal,
  onOpenDocsModal,
  onOpenDetail,
  highlight = false,
  onAssignMember,
  onApproveStep,
  onRejectStep,
}: ProcedureStepCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const sequence = getStepSequenceValidation(step.id, allSteps);
  const detailsVisible = expanded || highlight;

  const isCompleted = step.status === "COMPLETED";
  const isSkipped = step.status === "SKIPPED";
  const isInProgress = step.status === "IN_PROGRESS";
  const isNotStarted = step.status === "NOT_STARTED";
  const isDisabled = !step.isEnabled;
  const documentsCount = step.attachments.length;

  // Xác định vai trò của người dùng đối với bước này
  const isDirector = isDirectorUser(user);
  const isLeadOfThisStep = isLeadOfDepartment(user, step.department);
  const userName = (user?.displayName || user?.name || "").trim().toLowerCase();
  const assignedName = (step.assignedTo || "").trim().toLowerCase();
  const isAssigned = Boolean(
    assignedName &&
      (assignedName === userName ||
        (step.assignedToId && step.assignedToId === user?.id))
  );

  // Danh sách nhân sự cùng phòng ban của bước này
  const departmentStaff = getDepartmentStaff(step.department);

  const appearance = isDisabled
    ? "border-slate-200 bg-slate-50/60 opacity-60"
    : "border-slate-200 bg-white hover:border-slate-300";

  // Hiển thị trạng thái hoàn thành & duyệt
  const renderStatusBadge = () => {
    if (isDisabled) return <Tag intent="muted">Đã tắt</Tag>;
    if (isCompleted) {
      return (
        <Tag
          className="!border-red-200 !bg-red-50 !text-[#DC2626] font-semibold"
          icon={<CheckCircleFilled className="text-[#DC2626]" />}
        >
          Hoàn thành
        </Tag>
      );
    }
    if (step.submissionStatus === "SUBMITTED") {
      return (
        <Tag
          className="!border-amber-200 !bg-amber-50 !text-amber-800 font-semibold animate-pulse"
          icon={<ClockCircleFilled className="text-amber-600" />}
        >
          Chờ Lead duyệt
        </Tag>
      );
    }
    if (step.submissionStatus === "REJECTED") {
      return (
        <Tooltip title={step.rejectionReason || "Lead yêu cầu chỉnh sửa, bổ sung"}>
          <Tag className="!border-rose-200 !bg-rose-50 !text-rose-700 font-semibold" icon={<CloseOutlined />}>
            Lead từ chối
          </Tag>
        </Tooltip>
      );
    }
    if (isSkipped) return <Tag intent="warning" icon={<StopOutlined />}>Đã bỏ qua</Tag>;
    if (isInProgress) return <Tag intent="info" icon={<ClockCircleFilled />}>Đang thực hiện</Tag>;
    if (!sequence.canOperate) {
      return (
        <Tooltip title={sequence.reasonMessage}>
          <Tag intent="default" icon={<LockOutlined />}>Bị khóa</Tag>
        </Tooltip>
      );
    }
    return <Tag intent="subtle">Chưa bắt đầu</Tag>;
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối để thành viên biết nội dung cần chỉnh sửa.");
      return;
    }
    onRejectStep?.(step.id, rejectReason.trim());
    setIsRejectModalOpen(false);
    setRejectReason("");
  };

  return (
    <>
      <div
        onClick={() => onOpenDetail?.(step)}
        className={`rounded-xl border p-3.5 transition-all shadow-2xs group cursor-pointer hover:border-[#DC2626]/60 hover:shadow-md hover:bg-slate-50/30 ${appearance} ${
          highlight ? "ring-2 ring-[#DC2626] ring-offset-1" : ""
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Hàng 1 (Top Bar): Mã bước + Loại bước + Phòng ban bên trái | Trạng thái + Thao tác bên phải */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold font-mono border shrink-0 ${
                  isCompleted
                    ? "bg-red-50 border-red-200 text-[#DC2626]"
                    : isInProgress
                    ? "bg-red-50 border-red-200 text-[#DC2626]"
                    : isSkipped
                    ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                {isCompleted && <CheckCircleFilled className="text-[#DC2626] text-xs" />}
                {isSkipped && <StopOutlined className="text-slate-400 text-xs" />}
                Bước {step.code}
              </span>

              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium border shrink-0 ${
                  step.type === "MANDATORY"
                    ? "bg-slate-50 border-slate-200 text-slate-600"
                    : "bg-amber-50/70 border-amber-200 text-amber-700"
                }`}
              >
                {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
              </span>

              {/* Tag Phòng ban phụ trách */}
              {step.department && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <TeamOutlined className="text-[10px]" />
                  {step.department}
                </span>
              )}

              {/* Tag người dùng được giao */}
              {isAssigned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                  ★ Nhiệm vụ của bạn
                </span>
              )}
            </div>

            {/* Cụm trạng thái & các nút hành động theo phân quyền */}
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {renderStatusBadge()}

              {/* HÀNH ĐỘNG DÀNH CHO LEAD: Duyệt / Từ chối khi thành viên đã nộp */}
              {isLeadOfThisStep && step.submissionStatus === "SUBMITTED" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    intent="primary"
                    scale="compact"
                    icon={<CheckOutlined />}
                    className="!bg-[#DC2626] hover:!bg-[#B91C1C] text-white font-semibold text-xs h-7 px-2.5"
                    onClick={() => onApproveStep?.(step.id)}
                  >
                    Duyệt bước
                  </Button>
                  <Button
                    intent="outline"
                    scale="compact"
                    icon={<CloseOutlined />}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-semibold text-xs h-7 px-2"
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    Từ chối
                  </Button>
                </div>
              )}

              {/* HÀNH ĐỘNG DÀNH CHO THÀNH VIÊN ĐƯỢC GIAO: Bắt đầu hoặc Xác nhận hoàn thành */}
              {isAssigned && !isCompleted && !isDisabled && sequence.canOperate && (
                <div className="flex items-center gap-1.5">
                  {isNotStarted && (
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={<PlayCircleOutlined />}
                      className="bg-[#DC2626] hover:bg-red-700 text-white font-semibold text-xs h-7 px-2.5 shadow-2xs"
                      onClick={() => onStartStep(step.id)}
                    >
                      Bắt đầu
                    </Button>
                  )}
                  {step.submissionStatus === "SUBMITTED" && !isLeadOfThisStep && (
                    <Tag
                      className="!bg-amber-50 !text-amber-800 !border-amber-200 text-[11px] font-semibold flex items-center gap-1 h-7 px-2 shadow-2xs"
                      icon={<ClockCircleFilled className="text-amber-600" />}
                    >
                      Đã nộp – Chờ duyệt
                    </Tag>
                  )}
                  {((isInProgress && step.submissionStatus !== "SUBMITTED") || step.submissionStatus === "REJECTED") && (
                    <Button
                      intent="primary"
                      scale="compact"
                      icon={step.submissionStatus === "REJECTED" ? <ReloadOutlined /> : <CheckOutlined />}
                      className="bg-[#DC2626] hover:bg-red-700 text-white font-semibold text-xs h-7 px-2.5 shadow-2xs"
                      onClick={() => {
                        if (onConfirmCompleteStep) {
                          onConfirmCompleteStep(step.id);
                        } else {
                          onOpenCompleteModal(step);
                        }
                      }}
                    >
                      {step.submissionStatus === "REJECTED" ? "Nộp lại" : "Xác nhận hoàn thành"}
                    </Button>
                  )}
                </div>
              )}

              {/* Thành viên khác trong tổ: chỉ xem */}
              {!isAssigned && !isLeadOfThisStep && !isDirector && (
                <Tag intent="default" className="text-[10px] text-slate-500 py-0.5">
                  Chỉ xem
                </Tag>
              )}
            </div>
          </div>

          {/* Hàng 2: Tên bước toàn chiều rộng */}
          <div className="py-0.5">
            <h4 className="text-left text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-[#DC2626] transition-colors block w-full m-0 select-none">
              {step.name}
            </h4>
          </div>

          {/* Hàng 3: Người thực hiện + Biên độ + Hồ sơ */}
          <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {/* Người thực hiện: Lead có thể gán nhanh, người khác chỉ xem */}
              <div
                className="flex items-center gap-1.5 text-slate-600"
                onClick={(e) => isLeadOfThisStep && e.stopPropagation()}
              >
                <UserOutlined className="text-slate-400 text-[11px]" />
                <span className="text-slate-500">Người thực hiện:</span>
                {isLeadOfThisStep && !isCompleted ? (
                  <Select
                    className="w-40 h-6 text-xs [&_.ant-select-selector]:!py-0"
                    placeholder="— Giao việc —"
                    value={step.assignedTo || undefined}
                    onChange={(val) => onAssignMember?.(step.id, val as string)}
                    options={departmentStaff.map((s) => ({
                      value: s.name,
                      label: `${s.name} (${s.title})`,
                    }))}
                  />
                ) : (
                  <strong
                    className={`font-semibold ${
                      step.assignedTo ? "text-slate-800" : "text-slate-400 italic"
                    }`}
                  >
                    {step.assignedTo || "Chưa phân công"}
                  </strong>
                )}
              </div>

              <span className="flex items-center gap-1.5 text-slate-600">
                <CalendarOutlined className="text-slate-400 text-[11px]" />
                <span>
                  Biên độ: <strong className="font-semibold text-slate-700">{step.durationMargin}</strong>
                </span>
              </span>

              {!isDisabled && (
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ClockCircleOutlined className="text-slate-400 text-[11px]" />
                  <span>
                    {isCompleted && step.actualEndDate ? (
                      <>
                        Hoàn thành: <strong className="font-semibold text-slate-700">{formatDate(step.actualEndDate)}</strong>
                      </>
                    ) : (
                      <>
                        Hạn KH: <strong className="font-semibold text-slate-700">{formatDate(step.endDatePlanned)}</strong>
                      </>
                    )}
                  </span>
                </span>
              )}
            </div>

            {/* Nút Hồ sơ đính kèm */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDocsModal(step);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition-all cursor-pointer hover:bg-slate-50 text-slate-700"
            >
              <PaperClipOutlined className="text-slate-400" />
              <span>Hồ sơ ({documentsCount})</span>
            </button>
          </div>

          {/* Banner lý do từ chối nếu bị reject */}
          {step.submissionStatus === "REJECTED" && step.rejectionReason && (
            <aside className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-950">
              <div className="flex items-center gap-1 font-bold text-rose-900 text-xs">
                <CloseOutlined className="text-rose-600" /> Ý kiến chỉ đạo của Lead (Yêu cầu làm lại):
              </div>
              <div className="mt-1 text-[11px] italic text-rose-800 pl-3 border-l-2 border-rose-400">
                {step.rejectionReason}
              </div>
            </aside>
          )}

          {/* Ghi chú nộp của thành viên nếu đang chờ duyệt */}
          {step.submissionStatus === "SUBMITTED" && step.submissionNote && (
            <aside className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
              <span className="font-semibold text-amber-900">Báo cáo của thành viên: </span>
              <span className="italic">{step.submissionNote}</span>
            </aside>
          )}
        </div>
      </div>

      {/* Modal Lead từ chối bước kèm lý do */}
      {isRejectModalOpen && (
        <Modal
          open={isRejectModalOpen}
          onCancel={() => setIsRejectModalOpen(false)}
          centered
          width={480}
          title={
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <CloseOutlined />
              <span>Từ chối bước: [{step.code}] {step.name}</span>
            </div>
          }
          footer={[
            <Button key="cancel" scale="compact" onClick={() => setIsRejectModalOpen(false)}>
              Hủy
            </Button>,
            <Button
              key="confirm"
              intent="primary"
              scale="compact"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              onClick={handleConfirmReject}
            >
              Xác nhận từ chối
            </Button>,
          ]}
        >
          <div className="py-2 space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed m-0">
              Bước này sẽ được gửi trả lại cho thành viên phụ trách{" "}
              <strong>&quot;{step.assignedTo || "người thực hiện"}&quot;</strong> để bổ sung, chỉnh sửa tài liệu.
            </p>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Lý do từ chối & Yêu cầu chỉnh sửa <span className="text-rose-500">*</span>
              </label>
              <Input.TextArea
                rows={3}
                placeholder="VD: Hồ sơ bản vẽ thi công thiếu chữ ký của Tư vấn thẩm tra; cần bổ sung kết quả nén mẫu bê tông..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
