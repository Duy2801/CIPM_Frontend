"use client";

import { useState } from "react";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileWordOutlined,
  LoadingOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { Button, Modal, Tag } from "@/components/ui";

interface ReportPreviewModalProps {
  open: boolean;
  title: string;
  period: string;
  initialContent: string;
  onClose: () => void;
  canExport?: boolean;
}

export default function ReportPreviewModal({
  open,
  title,
  period,
  initialContent,
  onClose,
  canExport = true,
}: ReportPreviewModalProps) {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const fileName = `${title.replace(/[\/\\?%*:|"<>]/g, "_")}_${period}.doc`;
    const element = window.document.createElement("a");
    const file = new Blob([content], { type: "application/msword;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      closable={false}
      width={820}
      title={
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#007A78]">
              <RobotOutlined className="text-base" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-800">{title}</div>
              <div className="text-xs text-slate-500 font-normal">
                Kỳ báo cáo: {period} · {wordCount} từ
              </div>
            </div>
          </div>
          <Tag intent="warning">Bản thảo AI tự động</Tag>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircleOutlined className="text-emerald-600" />
            Tổng hợp từ dữ liệu thực tế M2, M4, M6, M7, M8
          </span>
          <div className="flex items-center gap-2">
            <Button
              scale="sm"
              intent="outline"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? "Đã sao chép!" : "Sao chép"}
            </Button>
            {canExport && (
              <Button
                scale="sm"
                intent="outline"
                icon={<FileWordOutlined className="text-blue-600" />}
                onClick={handleExportWord}
                className="text-xs font-semibold"
              >
                Xuất Word (.doc)
              </Button>
            )}
            <Button
              scale="sm"
              intent="primary"
              onClick={onClose}
              className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white text-xs font-semibold px-4"
            >
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="py-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            className="w-full resize-y font-sans text-xs leading-relaxed text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
            placeholder="Nội dung báo cáo tự động được điền ở đây..."
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400 italic">
          * Bạn có thể trực tiếp chỉnh sửa văn phong, số liệu trước khi xuất file hoặc sao chép.
        </p>
      </div>
    </Modal>
  );
}
