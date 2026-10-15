"use client";

import React, { useRef, useState } from "react";
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
  EyeOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileZipOutlined,
  InboxOutlined,
  LockOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined,
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
  isDirectorUser,
  isLeadOfDepartment,
} from "../constants/procedure-department-templates";
import { canUserDo } from "@/access-control";

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
  onOpenDocsModal: (step: ProcedureStep) => void;
  canUpdateProcedure?: boolean;
  onAssignMember?: (stepId: string, memberName: string) => void;
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string, reason: string) => void;
  onAddDocument?: (stepId: string, doc: ProcedureDocument) => void;
  onDeleteDocument?: (stepId: string, docId: string) => void;
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
  onOpenDocsModal,
  canUpdateProcedure = true,
  onAssignMember,
  onApproveStep,
  onRejectStep,
  onAddDocument,
  onDeleteDocument,
}: ProcedureStepDetailDrawerProps) {
  const { user } = useAuth();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<ProcedureDocument | null>(null);
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
  const isDirector = isDirectorUser(user);
  const isLeadOfThisStep = isLeadOfDepartment(user, step.department);
  const userName = (user?.displayName || user?.name || "").trim().toLowerCase();
  const assignedName = (step.assignedTo || "").trim().toLowerCase();
  const isAssigned = Boolean(
    assignedName &&
      (assignedName === userName ||
        (step.assignedToId && step.assignedToId === user?.id))
  );

  const canOperateStep = canUserDo(user, "m3_construction_procedures", "input") || isAssigned;
  const canApproveStep = canUserDo(user, "m3_construction_procedures", "approve") || isLeadOfThisStep;
  const canAssignStep = canUserDo(user, "m3_construction_procedures", "configure") || canApproveStep;

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

  const facts = [
    { label: "Dự án áp dụng", value: projectName, wide: true },
    { label: "Phòng ban phụ trách", value: step.department || step.responsibleUnit, wide: true },
    { label: "Nhóm giai đoạn", value: `${step.groupCode}. ${step.groupTitle}`, wide: true },
    { label: "Mã bước", value: `Bước ${step.code}` },
    { label: "Phân loại", value: step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện" },
    { label: "Biên độ thời gian", value: step.durationMargin },
    { label: "Thời gian kế hoạch", value: step.plannedDays ? `${step.plannedDays} ngày` : step.durationMargin },
    { label: "Bắt đầu kế hoạch", value: formatDate(step.startDatePlanned) },
    { label: "Hạn kế hoạch", value: formatDate(step.endDatePlanned) },
    { label: "Bắt đầu thực tế", value: formatDate(step.actualStartDate) },
    ...(step.actualEndDate ? [{ label: "Hoàn thành thực tế", value: formatDate(step.actualEndDate) }] : []),
    {
      label: "Hồ sơ pháp lý đính kèm",
      value: `${step.attachments.length} văn bản`,
    },
  ];

  return (
    <>
      <Drawer
        open={open}
        width="min(680px, 100vw)"
        closable={false}
        onClose={onClose}
        footer={
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
              {canUpdateProcedure &&
                !isDisabled &&
                !isCompleted &&
                !isSkipped &&
                (isNotStarted || isInProgress) &&
                sequence.canOperate &&
                step.submissionStatus !== "SUBMITTED" &&
                step.submissionStatus !== "APPROVED" && (
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

            <Button intent="outline" scale="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        }
        title={
          <span>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">Bước {step.code}</span>
              <Tag intent={step.type === "MANDATORY" ? "info" : "warning"} scale="md">
                {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
              </Tag>
              {step.department && (
                <Tag className="!bg-blue-50 !text-blue-700 !border-blue-200 text-xs">
                  {step.department}
                </Tag>
              )}
              {isDirector && (
                <Tag className="!bg-red-50 !text-red-700 !border-red-200 text-xs font-semibold">
                  Ban Giám đốc (Toàn quyền)
                </Tag>
              )}
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

        {/* Trạng thái giao việc & Phân quyền nghiệp vụ */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserOutlined className="text-[#DC2626]" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                Phân công & Phân quyền thực hiện
              </span>
            </div>
            {isAssigned && (
              <Tag className="!bg-red-50 !text-[#DC2626] !border-red-200 font-semibold text-xs">
                Bạn là người phụ trách bước này
              </Tag>
            )}
            {!isAssigned && !isLeadOfThisStep && !canOperateStep && !canApproveStep && (
              <Tag className="!bg-slate-100 !text-slate-600 !border-slate-300 text-xs">
                Chỉ có quyền xem (Chỉ người được giao mới có quyền cập nhật)
              </Tag>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">
                Người thực hiện:
              </span>
              {canAssignStep && !isCompleted ? (
                <Select
                  className="w-full text-xs"
                  placeholder="Chọn thành viên thực hiện..."
                  value={step.assignedTo || undefined}
                  onChange={(val) => onAssignMember?.(step.id, val)}
                  options={departmentStaff.map((staff) => ({
                    value: staff.name,
                    label: `${staff.name} (${staff.title})`,
                  }))}
                />
              ) : (
                <span className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 block">
                  {step.assignedTo || "Chưa phân công"}
                </span>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">
                Trạng thái nộp / phê duyệt:
              </span>
              <div className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 flex items-center justify-between">
                <span>
                  {step.submissionStatus === "SUBMITTED"
                    ? "Đã nộp - Chờ Lead duyệt"
                    : step.submissionStatus === "APPROVED"
                    ? "Lead đã phê duyệt hoàn thành"
                    : step.submissionStatus === "REJECTED"
                    ? "Lead từ chối duyệt"
                    : "Chưa nộp hoàn thành"}
                </span>
                {renderStatusBadge()}
              </div>
            </div>
          </div>

          {step.submissionStatus === "SUBMITTED" && step.submissionNote && (
            <div className="mt-3 pt-2.5 border-t border-blue-200/60 text-xs text-blue-950">
              <span className="font-semibold">Ghi chú nộp:</span> {step.submissionNote}
            </div>
          )}

          {step.submissionStatus === "REJECTED" && step.rejectionReason && (
            <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <strong className="block font-semibold mb-0.5">Lý do từ chối từ Lead:</strong>
              {step.rejectionReason}
            </div>
          )}
        </div>

        {/* Thông tin chính của bước thủ tục */}
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {facts.map((fact) => (
            <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
              <dt className="text-xs text-slate-500 font-medium">{fact.label}</dt>
              <dd className="m-0 text-[13px] font-semibold text-slate-800 mt-0.5">{fact.value}</dd>
            </div>
          ))}
        </dl>

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

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Hồ sơ & Tài liệu đính kèm ({step.attachments.length})
                </Text>
                {hasAttachments ? (
                  <Tag className="!bg-red-50 !text-red-700 !border-red-200 text-[11px] font-semibold">
                    Đã đủ điều kiện
                  </Tag>
                ) : (
                  <Tag className="!bg-amber-50 !text-amber-700 !border-amber-200 text-[11px] font-semibold">
                    Bắt buộc có tệp
                  </Tag>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Đính kèm hồ sơ, bản vẽ, quyết định pháp lý để nghiệm thu bước
              </span>
            </div>

            {/* Nút Tải tệp trực tiếp từ máy tính */}
            <div>
              <Button
                intent="primary"
                scale="xs"
                icon={<UploadOutlined />}
                className="!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] text-white font-medium shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Tải tệp lên
              </Button>
            </div>
          </div>

          {/* Banner trạng thái điều kiện hồ sơ (chỉ hiện cảnh báo vàng khi chưa có tệp) */}
          {!hasAttachments && (
            <div className="mb-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <WarningOutlined className="text-amber-600 text-sm mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-amber-900 block mb-0.5">Yêu cầu tệp tài liệu đính kèm</span>
                Để đảm bảo tính pháp lý và quy trình nghiệm thu, bước này bắt buộc phải có ít nhất <strong>01 tệp tài liệu</strong> được tải lên trước khi cho phép bấm <strong>&ldquo;Xác nhận hoàn thành&rdquo;</strong>.
              </div>
            </div>
          )}

          {/* Vùng kéo thả / Nhấp để chọn tệp */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mb-3.5 border-2 border-dashed border-slate-200 hover:border-red-400 hover:bg-red-50/20 rounded-xl p-4 text-center cursor-pointer transition-colors group"
          >
            <div className="flex flex-col items-center justify-center">
              <InboxOutlined className="text-2xl text-slate-400 group-hover:text-[#DC2626] mb-1.5 transition-colors" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-[#DC2626]">
                Nhấn vào đây để chọn tệp từ máy tính
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Hỗ trợ PDF, Word (DOCX), Excel (XLSX), Bản vẽ, Tệp nén ZIP/RAR (Tối đa 50MB)
              </span>
            </div>
          </div>

          {/* Danh sách tệp tài liệu trực tiếp */}
          {step.attachments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-slate-100 rounded-xl bg-slate-50/50">
              Chưa có tài liệu nào. Vui lòng tải tệp từ máy tính.
            </div>
          ) : (
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
                    <Tooltip title="Xem chi tiết tài liệu">
                      <Button
                        intent="outline"
                        scale="xs"
                        icon={<EyeOutlined />}
                        className="!text-blue-600 hover:!bg-blue-50 !border-blue-200"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        Xem
                      </Button>
                    </Tooltip>
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
                            Modal.confirm({
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

      {/* Modal Xem chi tiết tài liệu trực tiếp */}
      <Modal
        open={Boolean(previewDoc)}
        title={
          <div className="flex items-center gap-2">
            <PaperClipOutlined className="text-blue-600" />
            <span>Chi tiết hồ sơ / tài liệu</span>
          </div>
        }
        onCancel={() => setPreviewDoc(null)}
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-400">
              {previewDoc?.fileSize ? `Kích thước: ${previewDoc.fileSize}` : ""}
            </span>
            <div className="flex gap-2">
              <Button intent="outline" scale="sm" onClick={() => setPreviewDoc(null)}>
                Đóng
              </Button>
              {previewDoc && (
                <Button
                  intent="primary"
                  scale="sm"
                  icon={<DownloadOutlined />}
                  className="!bg-[#DC2626] hover:!bg-[#B91C1C] !border-[#DC2626] text-white font-medium"
                  onClick={() => {
                    handleDownloadDoc(previewDoc);
                  }}
                >
                  Tải xuống tệp
                </Button>
              )}
            </div>
          </div>
        }
      >
        {previewDoc && (
          <div className="space-y-3.5 py-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {renderFileIcon(previewDoc.fileType, previewDoc.fileName)}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 break-words">
                  {previewDoc.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Mã văn bản: <strong className="text-slate-800 font-mono">{previewDoc.documentCode}</strong>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100 m-0">
              <div>
                <dt className="text-slate-400 font-medium">Cơ quan ban hành:</dt>
                <dd className="m-0 font-semibold text-slate-800 mt-0.5">{previewDoc.issuer || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Ngày ban hành:</dt>
                <dd className="m-0 font-semibold text-slate-800 mt-0.5">{formatDate(previewDoc.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Tên tệp tin gốc:</dt>
                <dd className="m-0 font-medium text-slate-700 mt-0.5 truncate" title={previewDoc.fileName}>
                  {previewDoc.fileName || "Văn bản định dạng hệ thống"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 font-medium">Định dạng / Dung lượng:</dt>
                <dd className="m-0 font-medium text-slate-700 mt-0.5">
                  {previewDoc.fileType ? previewDoc.fileType.toUpperCase() : "PDF"} · {previewDoc.fileSize || "Đã lưu trữ"}
                </dd>
              </div>
            </dl>

            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900 leading-relaxed">
              Tệp tài liệu này đã được lưu trữ an toàn trong hồ sơ bước thủ tục. Bạn có thể bấm nút <strong>&ldquo;Tải xuống tệp&rdquo;</strong> để lưu về thiết bị.
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
