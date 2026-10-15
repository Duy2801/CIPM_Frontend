"use client";

import React, { useRef, useState, useId } from "react";
import {
  DeleteOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  InboxOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";

export type AttachmentFileType = "PDF" | "DOCX" | "EXCEL" | "IMAGE" | "OTHER";

export interface UploadedAttachment {
  id: string;
  name: string;
  size: string;
  type: AttachmentFileType;
  rawFile?: File;
  url?: string;
}

export function detectAttachmentType(fileName: string): AttachmentFileType {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "DOCX";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "EXCEL";
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  ) {
    return "IMAGE";
  }
  return "OTHER";
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface StandardFileUploadProps {
  title?: string;
  subTitle?: string;
  promptText?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hideHeader?: boolean;
  value?: UploadedAttachment[];
  defaultValue?: UploadedAttachment[];
  onChange?: (files: UploadedAttachment[]) => void;
  singleFileName?: string;
  onSingleFileNameChange?: (fileName: string) => void;
}

export function StandardFileUpload({
  title = "Đính kèm tệp văn bản số hóa (PDF, DOCX)",
  subTitle = "Tự động nhận diện cả .pdf, .docx, .doc · Hỗ trợ chọn nhiều tệp cùng lúc (Tối đa 50MB/tệp)",
  promptText = "Nhấn hoặc kéo thả để tải lên tệp tài liệu số hóa",
  accept = ".pdf,.docx,.doc,.xls,.xlsx,.png,.jpg,.jpeg",
  multiple = true,
  maxSizeMB = 50,
  disabled = false,
  required = false,
  className = "",
  hideHeader = false,
  value,
  defaultValue = [],
  onChange,
  singleFileName,
  onSingleFileNameChange,
}: StandardFileUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalFiles, setInternalFiles] = useState<UploadedAttachment[]>(() => {
    if (value) return value;
    if (singleFileName) {
      return [
        {
          id: `single-file-init`,
          name: singleFileName,
          size: "2.4 MB",
          type: detectAttachmentType(singleFileName),
        },
      ];
    }
    return defaultValue;
  });

  const [isDragOver, setIsDragOver] = useState(false);

  const activeFiles: UploadedAttachment[] = value !== undefined ? value : internalFiles;

  const handleFilesAdded = (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || disabled) return;

    const newItems: UploadedAttachment[] = Array.from(files).map((f, idx) => {
      const type = detectAttachmentType(f.name);
      return {
        id: `file-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: formatAttachmentSize(f.size),
        type,
        rawFile: f,
      };
    });

    const updated = multiple ? [...activeFiles, ...newItems] : newItems.slice(0, 1);

    if (value === undefined) {
      setInternalFiles(updated);
    }
    onChange?.(updated);

    if (onSingleFileNameChange) {
      onSingleFileNameChange(updated[0]?.name || "");
    }
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    const updated = activeFiles.filter((f) => f.id !== id);
    if (value === undefined) {
      setInternalFiles(updated);
    }
    onChange?.(updated);

    if (onSingleFileNameChange) {
      onSingleFileNameChange(updated[0]?.name || "");
    }
  };

  const renderFileIcon = (type: AttachmentFileType) => {
    switch (type) {
      case "PDF":
        return <FilePdfOutlined className="text-lg text-rose-500 shrink-0" />;
      case "DOCX":
        return <FileWordOutlined className="text-lg text-blue-600 shrink-0" />;
      case "EXCEL":
        return <FileExcelOutlined className="text-lg text-emerald-600 shrink-0" />;
      case "IMAGE":
        return <FileImageOutlined className="text-lg text-violet-500 shrink-0" />;
      default:
        return <FileTextOutlined className="text-lg text-slate-500 shrink-0" />;
    }
  };

  const renderBadge = (type: AttachmentFileType) => {
    switch (type) {
      case "PDF":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      case "DOCX":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "EXCEL":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "IMAGE":
        return "bg-violet-50 text-violet-600 border border-violet-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all ${
        disabled ? "opacity-60 pointer-events-none" : ""
      } ${className}`}
    >
      {/* 1. Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <UploadOutlined className="text-[#DC2626]" />
            {title}
            {required && <span className="text-rose-500">*</span>}
          </span>
          {activeFiles.length > 0 && (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Đã chọn {activeFiles.length} tệp
            </span>
          )}
        </div>
      )}

      {/* 2. Drag & Drop Upload Zone */}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) {
            handleFilesAdded(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center group ${
          isDragOver
            ? "border-red-500 bg-red-50/40"
            : "border-slate-300 bg-white hover:border-red-400 hover:bg-red-50/20"
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 group-hover:bg-red-50 text-slate-500 group-hover:text-red-500 transition-colors mb-1.5">
          <InboxOutlined className="text-2xl" />
        </div>
        <span className="text-xs font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
          {promptText}
        </span>
        <span className="text-[11px] text-slate-500 mt-1">{subTitle}</span>
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            handleFilesAdded(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {/* 3. Danh sách các tệp đã thêm */}
      {activeFiles.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <PaperClipOutlined /> Danh sách tệp đính kèm ({activeFiles.length}):
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {activeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {renderFileIcon(file.type)}
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-[10.5px] text-slate-500 flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold text-[9.5px] ${renderBadge(
                          file.type
                        )}`}
                      >
                        {file.type}
                      </span>
                      <span>{file.size}</span>
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(file.id);
                    }}
                    title="Xóa tệp"
                    className="shrink-0 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <DeleteOutlined className="text-sm" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardFileUpload;
