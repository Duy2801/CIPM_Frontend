"use client";

import { ClockCircleOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "@/components/ui";
import type { AttachedDocumentFile } from "../types/legal-ai.types";

interface DocumentFileItemProps {
  file: AttachedDocumentFile;
  /** Thời điểm cập nhật đã định dạng (dd/mm/yyyy hh:mm) */
  updatedAt: string;
  /** Tệp vừa thêm: viền đỏ + nhãn "Vừa thêm" */
  isLatest: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onDownload: () => void;
}

/** Một tệp đính kèm: bấm tên để xem, nút tải về bên phải */
export default function DocumentFileItem({
  file,
  updatedAt,
  isLatest,
  isPreviewing,
  onPreview,
  onDownload,
}: DocumentFileItemProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 shadow-xs transition-colors ${
        isLatest
          ? "border-2 border-[#DC2626] bg-red-50/15 shadow-2xs"
          : isPreviewing
          ? "border border-[#DC2626]/40"
          : "border border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onPreview}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 pr-2 text-left"
      >
        {file.type === "PDF" ? (
          <FilePdfOutlined className="shrink-0 text-xl text-rose-500" />
        ) : (
          <FileWordOutlined className="shrink-0 text-xl text-blue-600" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block truncate text-xs font-bold text-slate-800 hover:text-[#DC2626]" title={file.name}>
              {file.name}
            </span>
            {isLatest && (
              <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#DC2626]">
                Vừa thêm
              </span>
            )}
          </span>
          <span className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
            <span>
              {file.type} · {file.size}
            </span>
            {updatedAt && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                  <ClockCircleOutlined className="text-[10px] text-slate-400" />
                  <span>Cập nhật: {updatedAt}</span>
                </span>
              </>
            )}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip title="Tải về">
          <Button
            intent="outline"
            scale="xs"
            icon={<DownloadOutlined />}
            aria-label={`Tải về ${file.name}`}
            onClick={onDownload}
            className="text-xs"
          />
        </Tooltip>
      </div>
    </div>
  );
}
