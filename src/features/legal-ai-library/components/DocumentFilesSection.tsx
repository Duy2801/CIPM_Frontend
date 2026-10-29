"use client";

import { useRef, useState } from "react";
import { App } from "antd";
import { EditOutlined, PaperClipOutlined } from "@ant-design/icons";
import { toast, Tooltip } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import type { AttachedDocumentFile, LegalDocument } from "../types/legal-ai.types";
import {
  ORIGINAL_FILE_ID,
  createFileId,
  formatFileDateTime,
  formatFileSize,
  getDisplayFiles,
  nowDateTimeVi,
} from "../utils/legal-files";
import { downloadFile } from "../services/legal.api";
import DocumentFileItem from "./DocumentFileItem";
import FilePreviewModal from "./FilePreviewModal";

interface DocumentFilesSectionProps {
  /** Văn bản đang hiển thị (bản nháp) */
  document: LegalDocument;
  changed: boolean;
  /** Ghi danh sách tệp mới vào bản nháp; không truyền = chỉ xem */
  onChange?: (files: AttachedDocumentFile[]) => void;
}

/** Tệp văn bản đính kèm: xem, tải về; có quyền sửa thì thêm tệp (PDF / Word) */
export default function DocumentFilesSection({ document, changed, onChange }: DocumentFilesSectionProps) {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Mã tệp vừa thêm (để tô nổi)
  const [recentFileId, setRecentFileId] = useState<string | null>(null);

  const files = getDisplayFiles(document);
  // Tệp mới nhất: tệp vừa thêm (nếu còn trong danh sách), không thì tệp cuối khi có nhiều tệp
  const latestFileId = files.some((f) => f.id === recentFileId)
    ? recentFileId
    : files.length > 1
      ? files[files.length - 1].id
      : null;
  const previewFile = files.find((f) => f.id === previewId);

  const handleFilePicked = (picked: File | undefined) => {
    if (!picked || !onChange) return;
    const lowerName = picked.name.toLowerCase();
    const isWord = lowerName.endsWith(".doc") || lowerName.endsWith(".docx");
    if (!isWord && !lowerName.endsWith(".pdf")) {
      message.error("Chỉ hỗ trợ tệp PDF hoặc Word (.doc, .docx).");
      return;
    }
    const added: AttachedDocumentFile = {
      id: createFileId(),
      name: picked.name,
      size: formatFileSize(picked.size),
      type: isWord ? "DOCX" : "PDF",
      rawFile: picked,
      updatedAt: nowDateTimeVi(),
    };
    setRecentFileId(added.id);
    setPreviewId(null);
    onChange([...files, added]);
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <PaperClipOutlined className="text-[#DC2626]" />
          Tệp văn bản đính kèm ({files.length})
          {changed && (
            <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">Đã sửa</span>
          )}
        </span>
        {onChange && (
          <Tooltip title="Thêm tệp đính kèm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626]"
              aria-label="Thêm tệp đính kèm"
            >
              <EditOutlined className="text-xs" />
            </button>
          </Tooltip>
        )}
      </div>

      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <DocumentFileItem
              key={file.id}
              file={file}
              updatedAt={
                formatFileDateTime(file.updatedAt) ||
                (document.updatedAt ? `${formatDateVi(document.updatedAt)} 08:30` : "")
              }
              isLatest={file.id === latestFileId}
              isPreviewing={file.id === previewId}
              onPreview={() => setPreviewId(file.id)}
              onDownload={() =>
                downloadFile(document, file).catch((error) =>
                  toast.error(error instanceof Error ? error.message : "Không tải được tệp, vui lòng thử lại."),
                )
              }
            />
          ))}
        </div>
      ) : (
        <p className="m-0 text-xs italic text-slate-400">Chưa có tệp đính kèm.</p>
      )}

      {/* Ô chọn tệp ẩn cho nút "Thêm tệp" */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          handleFilePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <FilePreviewModal
        open={Boolean(previewFile)}
        document={document}
        // Tệp gốc ảo của văn bản mẫu: không truyền tệp để dựng bản xem trước từ thông tin văn bản
        file={previewFile?.id === ORIGINAL_FILE_ID ? undefined : previewFile}
        onClose={() => setPreviewId(null)}
      />
    </div>
  );
}
