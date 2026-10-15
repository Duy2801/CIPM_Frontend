"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Tag, Text } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { CATEGORY_LABELS, STATUS_META } from "../constants/legal-mock-data";
import type { LegalDocument } from "../types/legal-ai.types";

interface DocumentDetailDrawerProps {
  open: boolean;
  document: LegalDocument | null;
  onClose: () => void;
  onEdit?: (doc: LegalDocument) => void;
}

export default function DocumentDetailDrawer({
  open,
  document,
  onClose,
  onEdit,
}: DocumentDetailDrawerProps) {
  if (!document) return null;

  const statusInfo = STATUS_META[document.status];

  const handleDownload = () => {
    // Giả lập download file thực tế
    const fileName = `${document.code.replace(/[\/\\?%*:|"<>]/g, "_")}_${document.title.slice(0, 30)}.pdf`;
    const element = window.document.createElement("a");
    const file = new Blob([`Tập tin văn bản pháp lý / biểu mẫu chuẩn: ${document.title}\nSố hiệu: ${document.code}\nCơ quan ban hành: ${document.issuer}\nNội dung tóm tắt:\n${document.summary}`], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const handleDownloadFile = (fileNameToDownload: string, fileTypeToDownload: "PDF" | "DOCX") => {
    const ext = fileTypeToDownload === "PDF" ? "pdf" : "docx";
    const safeName =
      fileNameToDownload.endsWith(".pdf") ||
      fileNameToDownload.endsWith(".docx") ||
      fileNameToDownload.endsWith(".doc")
        ? fileNameToDownload
        : `${fileNameToDownload}.${ext}`;
    const element = window.document.createElement("a");
    const file = new Blob(
      [
        `Tập tin văn bản pháp lý / biểu mẫu chuẩn: ${document.title}\nTên tệp: ${safeName}\nSố hiệu: ${document.code}\nCơ quan ban hành: ${document.issuer}\nNội dung tóm tắt:\n${document.summary}`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    element.href = URL.createObjectURL(file);
    element.download = safeName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2">
            {document.fileType === "PDF" ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <FilePdfOutlined className="text-sm" />
              </span>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileWordOutlined className="text-sm" />
              </span>
            )}
            <span className="text-base font-bold text-slate-800">
              {document.code}
            </span>
            <span
              className={`ml-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${statusInfo.badge}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <div className="mt-1 line-clamp-2 text-xs font-medium text-slate-600">
            {document.title}
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between py-1">
          <Button
            intent="outline"
            scale="sm"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            className="text-xs font-semibold text-[#DC2626] border-slate-300 hover:!border-[#DC2626] hover:!text-[#B91C1C]"
          >
            Tải văn bản ({document.fileSize})
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                intent="outline"
                scale="sm"
                icon={<EditOutlined />}
                onClick={() => {
                  onClose();
                  onEdit(document);
                }}
                className="text-xs font-medium text-slate-700"
              >
                Chỉnh sửa
              </Button>
            )}
            <Button
              intent="primary"
              scale="sm"
              onClick={onClose}
              className="!border-[#DC2626] !bg-[#DC2626] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#B91C1C]"
            >
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-slate-800">
        {/* Thuộc tính cơ bản */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thông tin pháp lý & Thuộc tính ban hành
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500">
                Phân loại văn bản
              </span>
              <div className="mt-0.5 text-xs font-semibold text-slate-900">
                {CATEGORY_LABELS[document.category]}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500">
                Cơ quan ban hành
              </span>
              <div className="mt-0.5 text-xs font-semibold text-slate-900">
                {document.issuer}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500">
                Ngày ban hành
              </span>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <CalendarOutlined className="text-slate-400" />
                {formatDateVi(document.issueDate)}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500">
                Ngày bắt đầu hiệu lực
              </span>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <CheckCircleOutlined className="text-slate-500" />
                {formatDateVi(document.effectiveDate)}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200/70 pt-2.5">
            <span className="text-[11px] font-medium text-slate-500">
              Phạm vi áp dụng trong BQL
            </span>
            <div className="mt-0.5 text-xs font-semibold text-slate-800">
              {document.scope}
            </div>
          </div>
        </div>

        {/* Tóm tắt nội dung */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <InfoCircleOutlined className="text-[#DC2626]" />
            Tóm tắt nội dung trọng tâm & Hướng dẫn áp dụng
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {document.summary}
          </p>
        </div>

        {/* Từ khóa & Thẻ liên kết */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <TagOutlined className="text-[#DC2626]" />
            Từ khóa tra cứu & Đối tượng liên quan
          </div>
          <div className="flex flex-wrap gap-1.5">
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* File đính kèm */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PaperClipOutlined className="text-[#DC2626]" />
              Tệp văn bản đính kèm ({document.files && document.files.length > 0 ? document.files.length : 1})
            </span>
          </div>

          {document.files && document.files.length > 0 ? (
            <div className="flex flex-col gap-2">
              {document.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {file.type === "PDF" ? (
                      <FilePdfOutlined className="text-xl text-rose-500 shrink-0" />
                    ) : (
                      <FileWordOutlined className="text-xl text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold text-[9.5px] ${
                            file.type === "PDF"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-blue-50 text-blue-600 border border-blue-200"
                          }`}
                        >
                          {file.type}
                        </span>
                        <span>{file.size}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    intent="primary"
                    scale="xs"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadFile(file.name, file.type)}
                    className="!border-[#DC2626] !bg-[#DC2626] text-xs font-semibold !text-white shadow-xs hover:!bg-[#B91C1C] shrink-0"
                  >
                    Tải về
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {document.fileType === "PDF" ? (
                  <FilePdfOutlined className="text-2xl text-rose-500" />
                ) : (
                  <FileWordOutlined className="text-2xl text-blue-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {document.code} - {document.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Định dạng {document.fileType} · Kích thước {document.fileSize} · {document.downloads} lượt tải
                  </div>
                </div>
              </div>

              <Button
                intent="primary"
                scale="sm"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="!border-[#DC2626] !bg-[#DC2626] text-xs font-semibold !text-white shadow-xs hover:!bg-[#B91C1C]"
              >
                Tải file
              </Button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
