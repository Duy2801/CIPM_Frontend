"use client";

import React, { useEffect, useState } from "react";
import { Checkbox } from "antd";
import {
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProjectOutlined,
  SendOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Tag, toast } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import type { Assignment, ProjectDocumentSubmission } from "../types/personnel.types";

interface SubmitToCndaModalProps {
  open: boolean;
  assignment: Assignment | null;
  projectName?: string;
  onClose: () => void;
  onSubmit: (
    assignmentId: string,
    submissionData?: Partial<ProjectDocumentSubmission>
  ) => Promise<void>;
}

export default function SubmitToCndaModal({
  open,
  assignment,
  projectName = "Dự án",
  onClose,
  onSubmit,
}: SubmitToCndaModalProps) {
  // Trạng thái đính kèm thêm tài liệu
  const [includeNewDoc, setIncludeNewDoc] = useState(false);
  const [docCode, setDocCode] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docFileName, setDocFileName] = useState("");
  const [docFileType, setDocFileType] = useState<"pdf" | "docx" | "xlsx">("pdf");

  // Checklist kiểm tra tính đầy đủ
  const [checkWorkCompleted, setCheckWorkCompleted] = useState(true);
  const [checkDocsVerified, setCheckDocsVerified] = useState(true);
  const [checkReadyForReview, setCheckReadyForReview] = useState(true);

  // Ghi chú gửi Chủ nhiệm dự án
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xác định người duyệt
  const isCndaApprover =
    assignment?.assignmentLevel === "PHASE_LEAD" ||
    assignment?.assignedByRole === "PROJECT_LEAD";
  const approverTitle = isCndaApprover ? "Chủ nhiệm dự án (CNDA)" : "Tổ trưởng chuyên môn";

  useEffect(() => {
    if (open && assignment) {
      setIncludeNewDoc(false);
      setDocCode(`BC-HT-${Date.now().toString().slice(-4)}`);
      setDocTitle(`Báo cáo hoàn thành: ${assignment.title}`);
      setDocFileName(`${assignment.stepCode || "BAOCAO"}_HoanThanh.pdf`);
      setDocFileType("pdf");
      setCheckWorkCompleted(true);
      setCheckDocsVerified(true);
      setCheckReadyForReview(true);
      setNote(
        `Kính gửi ${approverTitle} xem xét, phê duyệt nghiệm thu kết quả thực hiện cho công việc [${
          assignment.stepCode ? assignment.stepCode + " · " : ""
        }${assignment.title}]. Toàn bộ hồ sơ tài liệu đã được kiểm tra đầy đủ theo quy định.`
      );
      setIsSubmitting(false);
    }
  }, [open, assignment, approverTitle]);

  if (!assignment) return null;

  const existingSubmissions = assignment.submissions || [];
  const hasExistingDocs = existingSubmissions.length > 0;
  const isAllChecked = checkWorkCompleted && checkDocsVerified && checkReadyForReview;

  const handleSubmit = async () => {
    if (!isAllChecked) {
      toast.error(
        "Chưa hoàn tất kiểm tra",
        "Vui lòng tích xác nhận đầy đủ các tiêu chí kiểm tra trước khi nộp hồ sơ."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      let submissionData: Partial<ProjectDocumentSubmission> | undefined = undefined;

      if (includeNewDoc || !hasExistingDocs) {
        submissionData = {
          documentCode: docCode.trim() || `BC-HT-${Date.now().toString().slice(-4)}`,
          title: docTitle.trim() || `Báo cáo hoàn thành: ${assignment.title}`,
          fileName: docFileName.trim() || `${assignment.stepCode || "BC"}_HoanThanh.${docFileType}`,
          fileSize: "1.8 MB",
          fileType: docFileType,
          leadFeedbackNote: note.trim(),
        };
      } else if (note.trim()) {
        submissionData = {
          leadFeedbackNote: note.trim(),
        };
      }

      await onSubmit(assignment.id, submissionData);
      toast.success(
        `Đã nộp hồ sơ cho ${approverTitle}`,
        `Hồ sơ báo cáo hoàn thành nhiệm vụ "${assignment.title}" đã được gửi thành công!`
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi nộp hồ sơ.";
      toast.error("Không thể nộp hồ sơ", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileIcon = (type?: string) => {
    switch (type) {
      case "pdf":
        return <FilePdfOutlined className="text-rose-500 text-sm" />;
      case "doc":
      case "docx":
        return <FileWordOutlined className="text-blue-500 text-sm" />;
      case "xlsx":
        return <FileExcelOutlined className="text-emerald-600 text-sm" />;
      default:
        return <FileTextOutlined className="text-slate-500 text-sm" />;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={660}
      centered
      destroyOnHidden
      title={
        <div className="flex items-center gap-2.5 text-[#DC2626]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 border border-red-200 shadow-2xs">
            <SendOutlined className="text-base" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Phiếu nộp hồ sơ trình {approverTitle} duyệt
            </h3>
            <p className="text-[11px] font-normal text-slate-500 mt-0.5">
              Kiểm tra tính đầy đủ của hồ sơ, tài liệu minh chứng trước khi nộp nghiệm thu
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-1">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            {isAllChecked ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircleFilled /> Đủ điều kiện nộp duyệt
              </span>
            ) : (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <WarningOutlined /> Cần xác nhận đủ tiêu chí checklist
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              scale="compact"
              intent="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-medium px-4 h-8.5"
            >
              Hủy bỏ
            </Button>
            <Button
              scale="compact"
              intent="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!isAllChecked || isSubmitting}
              className="bg-[#DC2626] hover:bg-[#B91C1C] border-[#DC2626] text-white text-xs font-semibold px-4.5 h-8.5 shadow-2xs"
            >
              Xác nhận nộp cho {isCndaApprover ? "CNDA" : "Tổ trưởng"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="py-2.5 space-y-4 text-xs">
        {/* 1. Thẻ thông tin công việc nộp */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {assignment.assignmentLevel === "PHASE_LEAD" ? "Giai đoạn" : "Nhiệm vụ"}
              </span>
              {assignment.stepCode && (
                <Tag intent="info" scale="sm" className="font-mono font-bold">
                  {assignment.stepCode}
                </Tag>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <CalendarOutlined className="text-slate-400" />
              <span>Hạn: {formatDateVi(assignment.dueDate)}</span>
            </div>
          </div>

          <div className="font-bold text-slate-900 text-sm leading-snug">
            {assignment.title}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
            <ProjectOutlined className="text-[#DC2626]" />
            <span className="font-medium text-slate-700 truncate">{projectName}</span>
          </div>
        </div>

        {/* 2. Kiểm tra hồ sơ & tài liệu đính kèm */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <PaperClipOutlined className="text-[#DC2626]" />
              Hồ sơ, tài liệu minh chứng đính kèm
            </span>
            {hasExistingDocs ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                ✓ Đã có {existingSubmissions.length} tài liệu
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-50 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <WarningOutlined /> Chưa có hồ sơ đính kèm
              </span>
            )}
          </div>

          {/* Danh sách tài liệu hiện có */}
          {hasExistingDocs ? (
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-36 overflow-y-auto bg-white">
              {existingSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {renderFileIcon(sub.fileType)}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate" title={sub.title}>
                        {sub.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sub.documentCode} · {sub.fileName} ({sub.fileSize})
                      </div>
                    </div>
                  </div>
                  <Tag intent="success" scale="sm">
                    Đã đính kèm
                  </Tag>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-900 leading-relaxed text-xs">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800 mb-0.5">
                <WarningOutlined /> Khuyến nghị nộp kèm hồ sơ minh chứng
              </div>
              Công việc này hiện chưa có văn bản/biên bản nào đính kèm. Bạn nên đính kèm Báo cáo hoàn thành hoặc Biên bản nghiệm thu bên dưới để Chủ nhiệm dự án có đủ căn cứ phê duyệt.
            </div>
          )}

          {/* Nút bật/tắt bổ sung văn bản mới */}
          <div className="pt-1">
            {!includeNewDoc ? (
              <button
                type="button"
                onClick={() => setIncludeNewDoc(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline cursor-pointer"
              >
                <PlusOutlined className="text-[11px]" />
                {hasExistingDocs ? "Đính kèm thêm văn bản / báo cáo mới" : "Tạo và đính kèm Báo cáo hoàn thành ngay bây giờ"}
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 space-y-2.5 mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#DC2626] text-xs">
                    Thông tin văn bản báo cáo hoàn thành nộp kèm
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeNewDoc(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    Bỏ đính kèm
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Số / Mã văn bản <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      size="small"
                      value={docCode}
                      onChange={(e) => setDocCode(e.target.value)}
                      placeholder="VD: BC-HT-01"
                      className="text-xs h-7.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Định dạng tài liệu
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      {(["pdf", "docx", "xlsx"] as const).map((ext) => (
                        <button
                          key={ext}
                          type="button"
                          onClick={() => setDocFileType(ext)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase border transition-all cursor-pointer ${
                            docFileType === ext
                              ? "bg-[#DC2626] border-[#DC2626] text-white font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          .{ext}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Tiêu đề văn bản / biên bản <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    size="small"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="VD: Báo cáo kết quả kiểm tra và nghiệm thu công việc..."
                    className="text-xs h-7.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Tên tệp đính kèm
                  </label>
                  <Input
                    size="small"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    placeholder="VD: BienBan_NghiemThu.pdf"
                    className="text-xs h-7.5 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Tiêu chí kiểm tra tính đầy đủ (Checklist bắt buộc) */}
        <div className="space-y-2 pt-1">
          <div className="font-bold text-slate-800 text-xs">
            Xác nhận các điều kiện hoàn thành (Checklist)
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={checkWorkCompleted}
                onChange={(e) => setCheckWorkCompleted(e.target.checked)}
                className="mt-0.5"
              />
              <span
                onClick={() => setCheckWorkCompleted(!checkWorkCompleted)}
                className="text-xs text-slate-800 cursor-pointer select-none leading-relaxed"
              >
                <strong>Đã hoàn thành 100% khối lượng công việc:</strong> Các nội dung chuyên môn, hạng mục thực hiện theo nhiệm vụ được giao đã triển khai đầy đủ.
              </span>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
              <Checkbox
                checked={checkDocsVerified}
                onChange={(e) => setCheckDocsVerified(e.target.checked)}
                className="mt-0.5"
              />
              <span
                onClick={() => setCheckDocsVerified(!checkDocsVerified)}
                className="text-xs text-slate-800 cursor-pointer select-none leading-relaxed"
              >
                <strong>Đã kiểm tra tính đầy đủ và hợp lệ:</strong> Số liệu, tài liệu báo cáo và các biên bản minh chứng đã được đối chiếu, ký duyệt theo đúng quy định.
              </span>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
              <Checkbox
                checked={checkReadyForReview}
                onChange={(e) => setCheckReadyForReview(e.target.checked)}
                className="mt-0.5"
              />
              <span
                onClick={() => setCheckReadyForReview(!checkReadyForReview)}
                className="text-xs text-slate-800 cursor-pointer select-none leading-relaxed"
              >
                <strong>Sẵn sàng chuyển giao cho {approverTitle}:</strong> Kính chuyển hồ sơ cho {approverTitle} xem xét tổ chức đánh giá nghiệm thu.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Nội dung báo cáo / Ghi chú gửi CNDA */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 text-xs">
              Ý kiến / Nội dung báo cáo gửi {approverTitle}
            </label>
            <span className="text-[10px] text-slate-400">Có thể chỉnh sửa trước khi gửi</span>
          </div>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Nhập nội dung báo cáo hoặc ghi chú gửi ${approverTitle} xem xét...`}
            className="text-xs rounded-lg"
          />
        </div>
      </div>
    </Modal>
  );
}
