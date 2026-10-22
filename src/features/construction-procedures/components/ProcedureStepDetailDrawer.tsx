"use client";

import React, { useRef, useState } from "react";
import { App } from "antd";
import {
  AlertFilled,
  CalendarOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileZipOutlined,
  InboxOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Input, Modal, Select, Tag, Text, Tooltip, toast } from "@/components/ui";
import {
  calculateDaysRemaining,
  getStepAlertLevel,
  getStepSequenceValidation,
} from "../utils/procedure-rules";
import type { ProcedureDocument, ProcedureStep } from "../types/procedure.types";
import { useAuth } from "@/features/auth";
import {
  getDepartmentStaff,
  isLeadOfDepartment,
} from "../constants/procedure-department-templates";
import { canUserDo, hasMatrixPermission } from "@/access-control";
import { InlineEditField } from "@/components/workspace";

/** Thông tin bước sửa nhanh bằng bút chì trong drawer */
export type ProcedureStepInfoPatch = Partial<
  Pick<
    ProcedureStep,
    "name" | "type" | "startDatePlanned" | "endDatePlanned" | "plannedDays" | "durationMargin" | "durationDaysMin" | "durationDaysMax"
  >
>;

/** Số ngày kế hoạch (tính cả ngày đầu và ngày cuối) từ 2 ngày yyyy-mm-dd */
function countPlannedDays(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
  return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) + 1 : undefined;
}

/** Ngày kế hoạch mới kèm số ngày / biên độ tự tính */
function buildPlannedDates(start?: string, end?: string): ProcedureStepInfoPatch {
  const days = countPlannedDays(start, end);
  return {
    startDatePlanned: start || undefined,
    endDatePlanned: end || undefined,
    plannedDays: days,
    durationMargin: days ? `${days} ngày` : "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
  };
}

interface ProcedureStepDetailDrawerProps {
  step: ProcedureStep | null;
  allSteps: ProcedureStep[];
  projectName: string;
  open: boolean;
  onClose: () => void;
  onStartStep: (stepId: string) => void;
  onOpenCompleteModal: (step: ProcedureStep) => void;
  onConfirmCompleteStep?: (stepId: string) => void;
  onOpenSkipModal: (step: ProcedureStep) => void;
  canUpdateProcedure?: boolean;
  onAssignMember?: (stepId: string, memberName: string) => void;
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string, reason: string) => void;
  onAddDocument?: (stepId: string, doc: ProcedureDocument) => void;
  onDeleteDocument?: (stepId: string, docId: string) => void;
  /** Lưu thông tin bước sửa bằng bút chì (tên, phân loại, ngày kế hoạch); không truyền = chỉ xem */
  onUpdateStep?: (stepId: string, patch: ProcedureStepInfoPatch) => void;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "—";
}

export default function ProcedureStepDetailDrawer({
  step,
  allSteps,
  projectName,
  open,
  onClose,
  onStartStep,
  onOpenCompleteModal,
  onConfirmCompleteStep,
  onOpenSkipModal,
  canUpdateProcedure = true,
  onAssignMember,
  onApproveStep,
  onRejectStep,
  onAddDocument,
  onDeleteDocument,
  onUpdateStep,
}: ProcedureStepDetailDrawerProps) {
  const { user } = useAuth();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { modal } = App.useApp();
  // Các trường đã sửa bằng bút chì nhưng chưa bấm "Lưu thay đổi" (gắn với mã bước: đổi bước là bỏ)
  const [pending, setPending] = useState<{ stepId: string; patch: ProcedureStepInfoPatch } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!step) return null;

  const hasAttachments = Boolean(step.attachments && step.attachments.length > 0);
  const operatorName = user?.displayName || user?.name || "Cán bộ quản lý";

  // Xử lý tải tệp trực tiếp từ máy tính
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const extRaw = file.name.split(".").pop()?.toLowerCase() || "";
      const validMap: Record<string, "pdf" | "doc" | "docx" | "xlsx" | "zip"> = {
        pdf: "pdf",
        doc: "doc",
        docx: "docx",
        xlsx: "xlsx",
        xls: "xlsx",
        zip: "zip",
        rar: "zip",
        "7z": "zip",
      };
      const fileType = validMap[extRaw] || "pdf";
      const sizeMb = file.size / (1024 * 1024);
      const sizeStr = sizeMb < 1 ? `${Math.round(file.size / 1024)} KB` : `${sizeMb.toFixed(1)} MB`;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      const newDoc: ProcedureDocument = {
        id: `DOC-${Date.now()}-${idx}`,
        documentCode: `${String((step.attachments?.length || 0) + idx + 1).padStart(2, "0")}/${(extRaw || "FILE").toUpperCase()}-${step.code}`,
        title: cleanName,
        issuer: step.responsibleUnit || step.department || "BQL ĐTXD Hà Tiên",
        issueDate: new Date().toISOString().slice(0, 10),
        fileName: file.name,
        fileSize: sizeStr,
        uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        uploadedBy: operatorName,
        fileType,
      };

      onAddDocument?.(step.id, newDoc);
    });

    toast.success("Tải tệp lên thành công", `Đã đính kèm ${files.length} tệp tài liệu vào bước ${step.code}.`);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  // Tải file trực tiếp về máy người dùng
  const handleDownloadDoc = (doc: ProcedureDocument) => {
    const content = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nTHÔNG TIN HỒ SƠ TÀI LIỆU DỰ ÁN\nDự án: ${projectName}\nBước: [${step.code}] ${step.name}\nMã văn bản: ${doc.documentCode}\nTiêu đề: ${doc.title}\nCơ quan ban hành: ${doc.issuer || "BQL ĐTXD Hà Tiên"}\nNgày ban hành: ${formatDate(doc.issueDate)}\nTên tệp tin: ${doc.fileName || "Tài liệu"}\nDung lượng: ${doc.fileSize || "1.5 MB"}\nNgười tải lên: ${doc.uploadedBy || "Cán bộ phụ trách"}\nThời gian lưu: ${doc.uploadedAt || new Date().toISOString()}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName || `${doc.documentCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tải xuống thành công", `Đang tải tệp: ${doc.fileName || doc.documentCode}`);
  };

  const renderFileIcon = (fileType?: string, fileName?: string) => {
    const name = (fileName || "").toLowerCase();
    if (fileType === "xlsx" || name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-base">
          <FileExcelOutlined />
        </div>
      );
    }
    if (fileType === "doc" || fileType === "docx" || name.endsWith(".doc") || name.endsWith(".docx")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-base">
          <FileWordOutlined />
        </div>
      );
    }
    if (fileType === "zip" || name.endsWith(".zip") || name.endsWith(".rar")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-base">
          <FileZipOutlined />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-base">
        <FilePdfOutlined />
      </div>
    );
  };

  const alertLevel = getStepAlertLevel(step);
  const daysRemaining = calculateDaysRemaining(step.endDatePlanned);
  const sequence = getStepSequenceValidation(step.id, allSteps);

  const isCompleted = step.status === "COMPLETED";
  const isSkipped = step.status === "SKIPPED";
  const isInProgress = step.status === "IN_PROGRESS";
  const isNotStarted = step.status === "NOT_STARTED";
  const isDisabled = !step.isEnabled;

  // Xác định vai trò & quyền hạn theo Ma trận phân quyền
  const isLeadOfThisStep = isLeadOfDepartment(user, step.department);
  const userName = (user?.displayName || user?.name || "").trim().toLowerCase();
  const assignedName = (step.assignedTo || "").trim().toLowerCase();
  const isAssigned = Boolean(
    assignedName &&
      (assignedName === userName ||
        (step.assignedToId && step.assignedToId === user?.id))
  );

  const canOperateStep =
    canUserDo(user, "m3_construction_procedures", "input") ||
    hasMatrixPermission(user, "m3.update_step") ||
    canUserDo(user, "m3_construction_procedures", "configure") ||
    hasMatrixPermission(user, "m3.config_template") ||
    isAssigned;

  const canApproveStep =
    canUserDo(user, "m3_construction_procedures", "approve") ||
    hasMatrixPermission(user, "m3.approve_step") ||
    isLeadOfThisStep;

  const canAssignStep =
    canUserDo(user, "m3_construction_procedures", "configure") ||
    hasMatrixPermission(user, "m3.config_template") ||
    canApproveStep;

  const departmentStaff = getDepartmentStaff(step.department);

  const renderStatusBadge = () => {
    if (isDisabled) return <Tag intent="muted">Đã tắt</Tag>;
    if (isCompleted) {
      return (
        <Tag className="!border-red-200 !bg-red-50 !text-[#DC2626] font-semibold" icon={<CheckCircleFilled className="text-[#DC2626]" />}>
          Đã hoàn thành
        </Tag>
      );
    }
    if (step.submissionStatus === "SUBMITTED") {
      return (
        <Tag className="!border-amber-200 !bg-amber-50 !text-amber-800 font-semibold animate-pulse" icon={<ClockCircleFilled className="text-amber-600" />}>
          Chờ Lead duyệt
        </Tag>
      );
    }
    if (step.submissionStatus === "REJECTED") {
      return (
        <Tag className="!border-rose-200 !bg-rose-50 !text-rose-700 font-semibold" icon={<CloseOutlined />}>
          Lead từ chối
        </Tag>
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

  // Người phê duyệt chỉ có khi bước đã được duyệt (bị từ chối / nộp lại thì chưa có)
  const approverName = step.submissionStatus === "APPROVED" || isCompleted ? step.approvedBy : undefined;

  // Sửa thông tin bước: người có quyền phân công / cấu hình, bước chưa xong và chưa tắt
  const canEditInfo = Boolean(onUpdateStep) && canAssignStep && !isCompleted && !isDisabled;
  const pendingPatch: ProcedureStepInfoPatch = pending?.stepId === step.id ? pending.patch : {};
  // Bước đang hiển thị = bản gốc + các trường đang sửa
  const view: ProcedureStep = { ...step, ...pendingPatch };
  const isChanged = (field: "name" | "type" | "startDatePlanned" | "endDatePlanned") => field in pendingPatch;

  // Ghi nhận trường vừa sửa; sửa về đúng giá trị cũ thì bỏ khỏi danh sách chờ lưu
  const saveInfo = canEditInfo
    ? (patch: ProcedureStepInfoPatch) => {
        const next: ProcedureStepInfoPatch = { ...pendingPatch, ...patch };
        if (next.name === step.name) delete next.name;
        if (next.type === step.type) delete next.type;
        const sameDates =
          (next.startDatePlanned ?? step.startDatePlanned) === step.startDatePlanned &&
          (next.endDatePlanned ?? step.endDatePlanned) === step.endDatePlanned;
        if (sameDates) {
          for (const key of [
            "startDatePlanned",
            "endDatePlanned",
            "plannedDays",
            "durationMargin",
            "durationDaysMin",
            "durationDaysMax",
          ] as const) {
            delete next[key];
          }
        }
        setPending({ stepId: step.id, patch: next });
      }
    : undefined;

  // Danh sách thay đổi "cũ → mới" để xác nhận trước khi lưu
  const typeLabel = (t?: string) => (t === "MANDATORY" ? "Bắt buộc" : t === "CONDITIONAL" ? "Điều kiện" : "");
  const pendingChanges = [
    "name" in pendingPatch ? { label: "Tên bước", from: step.name, to: view.name } : null,
    "type" in pendingPatch ? { label: "Phân loại", from: typeLabel(step.type), to: typeLabel(view.type) } : null,
    "startDatePlanned" in pendingPatch && pendingPatch.startDatePlanned !== step.startDatePlanned
      ? { label: "Bắt đầu kế hoạch", from: formatDate(step.startDatePlanned), to: formatDate(view.startDatePlanned) }
      : null,
    "endDatePlanned" in pendingPatch && pendingPatch.endDatePlanned !== step.endDatePlanned
      ? { label: "Hạn kế hoạch", from: formatDate(step.endDatePlanned), to: formatDate(view.endDatePlanned) }
      : null,
  ].filter((c): c is { label: string; from: string; to: string } => Boolean(c));
  const isDirty = Object.keys(pendingPatch).length > 0;

  const discardChanges = () => setPending(null);

  const confirmSaveChanges = () =>
    modal.confirm({
      centered: true,
      width: 480,
      title: "Xác nhận thay đổi thông tin bước",
      content: (
        <div className="space-y-2.5 text-xs">
          <p className="m-0 text-slate-600">
            Bạn có đồng ý cập nhật {pendingChanges.length} thông tin sau cho bước{" "}
            <strong className="text-slate-900">{step.code}</strong>?
          </p>
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            {pendingChanges.map((c) => (
              <div key={c.label} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-semibold text-slate-700">{c.label}:</span>
                <span className="text-slate-500 line-through">{c.from || "Trống"}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-[#DC2626]">{c.to || "Trống"}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      okText: "Đồng ý lưu",
      cancelText: "Xem lại",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => {
        onUpdateStep?.(step.id, pendingPatch);
        setPending(null);
      },
    });

  // Đóng khi còn thay đổi chưa lưu: hỏi trước để không mất dữ liệu
  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    modal.confirm({
      centered: true,
      width: 420,
      title: "Bỏ các thay đổi chưa lưu?",
      content: (
        <p className="m-0 text-xs text-slate-600">
          Có thay đổi thông tin bước chưa lưu. Đóng lại sẽ bỏ các thay đổi này.
        </p>
      ),
      okText: "Bỏ thay đổi",
      cancelText: "Tiếp tục sửa",
      okButtonProps: { danger: true },
      onOk: () => {
        setPending(null);
        onClose();
      },
    });
  };


  return (
    <>
      <Drawer
        open={open}
        width="min(680px, 100vw)"
        closable={false}
        onClose={handleClose}
        footer={
          isDirty ? (
            // Có thay đổi chưa lưu: chỉ còn "Lưu thay đổi" · "Hủy thay đổi"; lưu/hủy xong các nút khác hiện lại
            <div className="flex items-center gap-2.5 px-1 py-1">
              <Button
                intent="primary"
                scale="sm"
                onClick={confirmSaveChanges}
                className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 font-semibold"
              >
                Lưu thay đổi
              </Button>
              <Button intent="outline" scale="sm" onClick={discardChanges} className="px-5">
                Hủy thay đổi
              </Button>
            </div>
          ) : (
          <div className="flex items-center justify-between gap-2.5 flex-wrap px-1 py-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Thao tác của Thành viên được giao việc hoặc có quyền nhập/sửa */}
              {canOperateStep && !isCompleted && !isDisabled && sequence.canOperate && (
                <>
                  {isNotStarted && (
                    <Button
                      intent="primary"
                      scale="sm"
                      icon={<PlayCircleOutlined />}
                      onClick={() => onStartStep(step.id)}
                    >
                      Bắt đầu thực hiện
                    </Button>
                  )}

                  {step.submissionStatus === "SUBMITTED" && !canApproveStep && (
                    <Tag
                      className="!bg-amber-50 !text-amber-800 !border-amber-200 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 shadow-2xs"
                      icon={<ClockCircleFilled className="text-amber-600" />}
                    >
                      Đã nộp kết quả – Đang chờ phê duyệt
                    </Tag>
                  )}

                  {/* Nút Xác nhận hoàn thành: Bắt buộc phải có tệp mới được bấm */}
                  {((isInProgress && step.submissionStatus !== "SUBMITTED") || step.submissionStatus === "REJECTED") && (
                    <Tooltip
                      title={
                        !hasAttachments
                          ? "Cần đính kèm ít nhất 1 tệp/hồ sơ tài liệu trước khi xác nhận hoàn thành"
                          : undefined
                      }
                    >
                      <span>
                        <Button
                          intent="primary"
                          scale="sm"
                          icon={step.submissionStatus === "REJECTED" ? <ReloadOutlined /> : <CheckOutlined />}
                          disabled={!hasAttachments}
                          className={
                            hasAttachments
                              ? "!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] text-white font-semibold shadow-2xs cursor-pointer"
                              : "!bg-slate-200 !border-slate-200 !text-slate-400 cursor-not-allowed"
                          }
                          onClick={() => {
                            if (!hasAttachments) {
                              toast.warning(
                                "Chưa có tài liệu đính kèm",
                                "Vui lòng đính kèm ít nhất 1 hồ sơ / tài liệu pháp lý trước khi xác nhận hoàn thành!"
                              );
                              return;
                            }
                            onClose();
                            if (onConfirmCompleteStep) {
                              onConfirmCompleteStep(step.id);
                            } else {
                              onOpenCompleteModal(step);
                            }
                          }}
                        >
                          {step.submissionStatus === "REJECTED" ? "Nộp lại kết quả duyệt" : "Xác nhận hoàn thành"}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </>
              )}

              {/* Thao tác Phê duyệt / Từ chối (dành cho người có quyền approve hoặc Lead) */}
              {canApproveStep && step.submissionStatus === "SUBMITTED" && !isCompleted && (
                <>
                  <Button
                    intent="primary"
                    scale="sm"
                    icon={<CheckOutlined />}
                    className="!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] text-white font-semibold"
                    onClick={() => {
                      onApproveStep?.(step.id);
                    }}
                  >
                    Duyệt hoàn thành bước
                  </Button>
                  <Button
                    intent="outline"
                    scale="sm"
                    icon={<CloseOutlined />}
                    className="!border-rose-300 !text-rose-700 hover:!bg-rose-50"
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    Từ chối
                  </Button>
                </>
              )}

              {/* Thao tác Bỏ qua bước: Chỉ cho phép khi CHƯA có ai nộp hồ sơ/nộp duyệt */}
              {/* Chỉ bước điều kiện mới bỏ qua được (luôn hiện); bước bắt buộc không có nút bỏ qua */}
              {canUpdateProcedure && step.type === "CONDITIONAL" && !isDisabled && !isSkipped && (
                  <Button
                    intent="outline"
                    scale="sm"
                    icon={<StopOutlined className="text-amber-600" />}
                    className="!border-amber-300 !text-amber-800 hover:!bg-amber-50 hover:!border-amber-400 hover:!text-amber-900"
                    onClick={() => {
                      onClose();
                      onOpenSkipModal(step);
                    }}
                  >
                    Bỏ qua bước
                  </Button>
                )}
            </div>

            <Button intent="outline" scale="sm" onClick={handleClose}>
              Đóng
            </Button>
          </div>
          )
        }
        title={
          <span>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">Bước {step.code}</span>
              {renderStatusBadge()}
            </span>
            <span className="block text-xs font-normal text-slate-500 mt-0.5">
              {step.name}
            </span>
          </span>
        }
      >
        {/* Banner cảnh báo tiến độ */}
        {alertLevel === "DANGER_RED" && (
          <aside className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-800">
            <AlertFilled className="shrink-0 text-rose-600" />
            <span>
              Bước này đã quá hạn {Math.abs(daysRemaining ?? 0)} ngày so với kế hoạch ban đầu (Hạn chót:{" "}
              {formatDate(step.endDatePlanned)}).
            </span>
          </aside>
        )}
        {alertLevel === "WARNING_YELLOW" && (
          <aside className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium text-amber-800">
            <ClockCircleFilled className="shrink-0 text-amber-600" />
            <span>
              Sắp đến hạn hoàn thành: Còn {daysRemaining} ngày (Hạn chót: {formatDate(step.endDatePlanned)}).
            </span>
          </aside>
        )}

        {/* Phân công & trạng thái nộp / duyệt */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Người thực hiện</div>
              {canAssignStep && !isCompleted ? (
                <Select
                  className="mt-1 w-full text-xs"
                  placeholder="Chọn thành viên thực hiện..."
                  value={step.assignedTo || undefined}
                  onChange={(val) => onAssignMember?.(step.id, val)}
                  options={departmentStaff.map((staff) => ({
                    value: staff.name,
                    label: `${staff.name} (${staff.title})`,
                  }))}
                />
              ) : (
                <div className="mt-1 flex min-h-7 items-center">
                  <span
                    className={`truncate text-[13px] ${
                      step.assignedTo ? "font-semibold text-slate-900" : "italic text-slate-400"
                    }`}
                  >
                    {step.assignedTo || "Chưa phân công"}
                  </span>
                </div>
              )}
              {isAssigned && (
                <div className="mt-1 text-[11px] font-medium text-[#DC2626]">Bạn là người phụ trách bước này</div>
              )}
            </div>

            {/* Người phê duyệt: người đã duyệt hoàn thành bước (Tổ trưởng / Ban Giám đốc) */}
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Người phê duyệt</div>
              <div className="mt-1 flex min-h-7 items-center">
                <span
                  className={`truncate text-[13px] ${approverName ? "font-semibold text-slate-900" : "italic text-slate-400"}`}
                  title={approverName && step.approvedAt ? `Duyệt ngày ${formatDate(step.approvedAt)}` : undefined}
                >
                  {approverName || (step.submissionStatus === "SUBMITTED" ? "Đang chờ duyệt" : "Chưa phê duyệt")}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Trạng thái</div>
              <div className="mt-1">{renderStatusBadge()}</div>
            </div>
          </div>

          {step.submissionStatus === "SUBMITTED" && step.submissionNote && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-700">
              <span className="font-semibold">Ghi chú nộp:</span> {step.submissionNote}
            </div>
          )}

          {step.submissionStatus === "REJECTED" && step.rejectionReason && (
            <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <strong className="block font-semibold mb-0.5">Lý do từ chối:</strong>
              {step.rejectionReason}
            </div>
          )}
        </div>

        {/* Thông tin chính của bước: bấm bút chì để sửa từng trường */}
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <InlineEditField
            className="sm:col-span-2"
            label="Tên bước"
            changed={isChanged("name")}
            value={view.name}
            display={view.name}
            editor={{ kind: "text", placeholder: "Tên bước thủ tục" }}
            onSave={saveInfo && ((name) => saveInfo({ name }))}
          />
          <div className="sm:col-span-2">
            <span className="text-[11px] font-medium text-slate-500">Giai đoạn</span>
            <div className="mt-0.5 text-xs font-semibold text-slate-900">
              {view.groupCode}. {view.groupTitle}
            </div>
          </div>
          <InlineEditField
            label="Phân loại"
            changed={isChanged("type")}
            value={view.type}
            display={view.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
            editor={{
              kind: "select",
              options: [
                { value: "MANDATORY", label: "Bắt buộc" },
                { value: "CONDITIONAL", label: "Điều kiện" },
              ],
            }}
            onSave={saveInfo && ((type) => saveInfo({ type: type as ProcedureStep["type"] }))}
          />
          <div>
            <span className="text-[11px] font-medium text-slate-500">Thời gian kế hoạch</span>
            <div className="mt-0.5 text-xs font-semibold text-slate-900">
              {view.plannedDays ? `${view.plannedDays} ngày` : view.durationMargin || "Theo quy định"}
            </div>
          </div>
          <InlineEditField
            label="Bắt đầu kế hoạch"
            changed={isChanged("startDatePlanned")}
            value={view.startDatePlanned || ""}
            display={formatDate(view.startDatePlanned)}
            editor={{ kind: "date" }}
            allowEmpty
            validate={(next) =>
              next && view.endDatePlanned && next > view.endDatePlanned
                ? "Ngày bắt đầu không được sau hạn kế hoạch."
                : undefined
            }
            onSave={saveInfo && ((start) => saveInfo(buildPlannedDates(start, view.endDatePlanned)))}
          />
          <InlineEditField
            label="Hạn kế hoạch"
            changed={isChanged("endDatePlanned")}
            value={view.endDatePlanned || ""}
            display={formatDate(view.endDatePlanned)}
            editor={{ kind: "date" }}
            allowEmpty
            validate={(next) =>
              next && view.startDatePlanned && next < view.startDatePlanned
                ? "Hạn kế hoạch không được trước ngày bắt đầu."
                : undefined
            }
            onSave={saveInfo && ((end) => saveInfo(buildPlannedDates(view.startDatePlanned, end)))}
          />
          {view.actualStartDate && (
            <div>
              <span className="text-[11px] font-medium text-slate-500">Bắt đầu thực tế</span>
              <div className="mt-0.5 text-xs font-semibold text-slate-900">{formatDate(view.actualStartDate)}</div>
            </div>
          )}
          {view.actualEndDate && (
            <div>
              <span className="text-[11px] font-medium text-slate-500">Hoàn thành thực tế</span>
              <div className="mt-0.5 text-xs font-semibold text-slate-900">{formatDate(view.actualEndDate)}</div>
            </div>
          )}
        </div>

        {/* Ràng buộc tuần tự & Khóa bước */}
        {!sequence.canOperate && sequence.blockingStep && (
          <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <Flex align="center" gap={6} className="mb-2">
              <LockOutlined className="text-rose-600" />
              <Text className="text-xs font-bold uppercase tracking-wide text-rose-800">
                Ràng buộc tuần tự – Chưa thể thực hiện
              </Text>
            </Flex>
            <p className="m-0 text-xs text-rose-800 leading-relaxed">
              {sequence.reasonMessage}
            </p>
            <div className="mt-2 pt-2 border-t border-rose-200/60 text-xs text-rose-900 font-medium">
              Bước đang chặn: <strong>[{sequence.blockingStep.code}] {sequence.blockingStep.name}</strong> (Trạng thái: {sequence.blockingStep.status === "NOT_STARTED" ? "Chưa bắt đầu" : "Đang thực hiện"})
            </div>
          </section>
        )}

        {/* Danh mục hồ sơ & Quản lý tệp trực tiếp tại chỗ (In-place) */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          {/* File input ẩn cho máy tính */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />

          <Text className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-800">
            Hồ sơ & Tài liệu đính kèm ({step.attachments.length})
          </Text>

          {/* Vùng kéo thả / Nhấp để chọn tệp */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mb-3.5 border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors group bg-white"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-red-50 text-slate-500 group-hover:text-red-500 transition-colors mb-1.5">
                <InboxOutlined className="text-2xl" />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                Nhấn hoặc kéo thả để tải lên tệp tài liệu số hóa
              </span>
            </div>
          </div>

          {/* Danh sách tệp tài liệu trực tiếp */}
          {step.attachments.length === 0 ? null : (
            <div className="space-y-2.5">
              {step.attachments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {renderFileIcon(doc.fileType, doc.fileName)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-xs truncate max-w-full">
                          {doc.title || doc.fileName || doc.documentCode}
                        </span>
                        {doc.documentCode && (
                          <Tag scale="sm" className="!bg-slate-100 !text-slate-600 !border-slate-200 font-mono text-[10px]">
                            {doc.documentCode}
                          </Tag>
                        )}
                        {doc.fileSize && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({doc.fileSize})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        {doc.issuer && (
                          <span>
                            Cơ quan: <strong className="text-slate-700">{doc.issuer}</strong>
                          </span>
                        )}
                        {doc.issueDate && (
                          <span>
                            Ngày ban hành: <strong className="text-slate-700">{formatDate(doc.issueDate)}</strong>
                          </span>
                        )}
                        {doc.fileName && (
                          <span className="text-slate-400 truncate max-w-[200px]" title={doc.fileName}>
                            Tệp: {doc.fileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cụm nút thao tác trực tiếp trên từng file */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip title="Tải tệp này về máy tính">
                      <Button
                        intent="outline"
                        scale="xs"
                        icon={<DownloadOutlined />}
                        className="!text-slate-700 hover:!bg-slate-50 !border-slate-300"
                        onClick={() => handleDownloadDoc(doc)}
                      >
                        Tải về
                      </Button>
                    </Tooltip>
                    {onDeleteDocument && (
                      <Tooltip title="Xóa tài liệu khỏi bước này">
                        <Button
                          intent="outline"
                          scale="xs"
                          icon={<DeleteOutlined />}
                          className="!text-rose-600 hover:!bg-rose-50 !border-rose-200"
                          onClick={() => {
                            modal.confirm({
                              title: "Xác nhận xóa tài liệu",
                              content: `Bạn có chắc muốn xóa văn bản/tệp "${doc.title || doc.documentCode}"?`,
                              okText: "Xóa",
                              cancelText: "Hủy",
                              okButtonProps: { danger: true },
                              onOk: () => onDeleteDocument(step.id, doc.id),
                            });
                          }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </Drawer>

      {/* Modal từ chối phê duyệt từ Lead */}
      <Modal
        open={isRejectModalOpen}
        title="Từ chối phê duyệt bước thủ tục"
        onCancel={() => setIsRejectModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button intent="outline" scale="sm" onClick={() => setIsRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              intent="primary"
              scale="sm"
              className="!bg-rose-600 hover:!bg-rose-700 !border-rose-600 text-white"
              onClick={() => {
                if (!rejectReason.trim()) return;
                onRejectStep?.(step.id, rejectReason.trim());
                setIsRejectModalOpen(false);
                setRejectReason("");
              }}
              disabled={!rejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-600 m-0">
            Vui lòng nhập lý do từ chối để nhân sự phụ trách <strong>{step.assignedTo || "nhân viên"}</strong> biết và cập nhật lại hồ sơ, thủ tục:
          </p>
          <Input.TextArea
            rows={3}
            placeholder="Nhập lý do từ chối, yêu cầu bổ sung hồ sơ..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

    </>
  );
}
