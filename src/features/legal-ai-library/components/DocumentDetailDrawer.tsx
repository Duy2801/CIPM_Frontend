"use client";

import { useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  PaperClipOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Drawer } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { STATUS_META, getCategoryLabel } from "../constants/legal-mock-data";
import type { AttachedDocumentFile, LegalDocument } from "../types/legal-ai.types";
import FilePreviewModal from "./FilePreviewModal";

/** Mã tệp ảo cho văn bản mẫu chưa khai báo danh sách tệp */
const ORIGINAL_FILE_ID = "__original__";

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
  // Tệp đang xem, gắn với mã văn bản để đổi văn bản là tự đóng xem
  const [preview, setPreview] = useState<{ docId: string; fileId: string } | null>(null);

  if (!document) return null;

  const previewFileId = preview?.docId === document.id ? preview.fileId : null;
  const openPreview = (fileId: string) => setPreview({ docId: document.id, fileId });
  const previewFile = document.files?.find((f) => f.id === previewFileId);

  const statusInfo = STATUS_META[document.status];

  const handleDownload = () => {
    // Giả lập download file thực tế
    const safeCode = document.code.replace(/[\/\\?%*:|"<>]/g, "_");
    const fileName = document.title ? `${safeCode}_${document.title.slice(0, 30)}.pdf` : `${safeCode}.pdf`;
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

  const handleDownloadFile = (attached: AttachedDocumentFile) => {
    if (attached.rawFile || attached.url) {
      const href = attached.rawFile ? URL.createObjectURL(attached.rawFile) : attached.url!;
      const link = window.document.createElement("a");
      link.href = href;
      link.download = attached.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      if (attached.rawFile) URL.revokeObjectURL(href);
      return;
    }
    handleDownloadSampleFile(attached.name, attached.type);
  };

  const handleDownloadSampleFile = (fileNameToDownload: string, fileTypeToDownload: "PDF" | "DOCX") => {
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
            <span className="text-base font-bold text-slate-800">
              {document.code}
            </span>
            <span
              className={`ml-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${statusInfo.badge}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {document.title && (
            <div className="mt-1 line-clamp-2 text-xs font-medium text-slate-600">
              {document.title}
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-2.5 py-1">
          <Button intent="outline" scale="sm" onClick={onClose} className="px-5 text-xs font-medium">
            Đóng
          </Button>
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
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-slate-800">
        {/* Thuộc tính cơ bản */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <SafetyCertificateOutlined className="text-[#DC2626]" />
            Thông tin ban hành
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-medium text-slate-500">
                Phân loại văn bản
              </span>
              <div className="mt-0.5 text-xs font-semibold text-slate-900">
                {getCategoryLabel(document.category)}
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
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <CheckCircleOutlined className="text-slate-400" />
                {formatDateVi(document.effectiveDate)}
              </div>
            </div>

            {document.updatedAt && (
              <div>
                <span className="text-[11px] font-medium text-slate-500">
                  Cập nhật vào thư viện
                </span>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <SyncOutlined className="text-slate-400" />
                  {formatDateVi(document.updatedAt)}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Từ khóa tra cứu (cùng kiểu nhãn với danh sách) */}
        {document.tags.length > 0 && (
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <TagOutlined className="text-[#DC2626]" />
              Từ khóa tra cứu
            </div>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {document.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File đính kèm */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PaperClipOutlined className="text-[#DC2626]" />
              Tệp văn bản đính kèm ({document.files ? document.files.length : 1})
            </span>
          </div>

          {document.files && document.files.length > 0 ? (
            <div className="flex flex-col gap-2">
              {document.files.map((file) => {
                const isPreviewing = previewFileId === file.id;
                return (
                  <div key={file.id}>
                    <div
                      className={`flex items-center justify-between gap-2 rounded-lg border bg-white p-2.5 shadow-xs transition-colors ${
                        isPreviewing ? "border-[#DC2626]/40" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openPreview(file.id)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 pr-2 text-left"
                      >
                        {file.type === "PDF" ? (
                          <FilePdfOutlined className="shrink-0 text-xl text-rose-500" />
                        ) : (
                          <FileWordOutlined className="shrink-0 text-xl text-blue-600" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800 hover:text-[#DC2626]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {file.type} · {file.size}
                          </span>
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          intent="outline"
                          scale="xs"
                          icon={<DownloadOutlined />}
                          aria-label={`Tải về ${file.name}`}
                          onClick={() => handleDownloadFile(file)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : document.files ? (
            <p className="m-0 text-xs italic text-slate-400">Chưa có tệp đính kèm.</p>
          ) : (
            // Văn bản mẫu có sẵn chưa khai báo danh sách tệp: hiện tệp gốc của văn bản
            <div>
              <div
                className={`flex items-center justify-between gap-2 rounded-lg border bg-white p-2.5 shadow-xs ${
                  previewFileId === ORIGINAL_FILE_ID ? "border-[#DC2626]/40" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openPreview(ORIGINAL_FILE_ID)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 pr-2 text-left"
                >
                  {document.fileType === "PDF" ? (
                    <FilePdfOutlined className="shrink-0 text-xl text-rose-500" />
                  ) : (
                    <FileWordOutlined className="shrink-0 text-xl text-blue-500" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 hover:text-[#DC2626]">
                      {document.title ? `${document.code} - ${document.title}` : document.code}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {document.fileType} · {document.fileSize}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    intent="outline"
                    scale="xs"
                    icon={<DownloadOutlined />}
                    aria-label="Tải về tệp văn bản"
                    onClick={handleDownload}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FilePreviewModal
        open={Boolean(previewFileId)}
        document={document}
        file={previewFile}
        onDownload={() => (previewFile ? handleDownloadFile(previewFile) : handleDownload())}
        onClose={() => setPreview(null)}
      />
    </Drawer>
  );
}
