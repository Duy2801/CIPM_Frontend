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
            className="text-xs font-semibold text-teal-800 hover:!border-teal-600 hover:!text-teal-700"
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
              className="!border-[#007A78] !bg-[#007A78] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#006361]"
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
            <SafetyCertificateOutlined className="text-[#007A78]" />
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
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircleOutlined className="text-emerald-600" />
                {formatDateVi(document.effectiveDate)}
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200/70 pt-2.5">
            <span className="text-[11px] font-medium text-slate-500">
              Phạm vi áp dụng trong BQL
            </span>
            <div className="mt-0.5 text-xs font-semibold text-teal-800">
              {document.scope}
            </div>
          </div>
        </div>

        {/* Tóm tắt nội dung */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <InfoCircleOutlined className="text-[#007A78]" />
            Tóm tắt nội dung trọng tâm & Hướng dẫn áp dụng
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {document.summary}
          </p>
        </div>

        {/* Từ khóa & Thẻ liên kết */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <TagOutlined className="text-[#007A78]" />
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
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
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
              className="!border-[#007A78] !bg-[#007A78] text-xs font-semibold !text-white shadow-xs hover:!bg-[#006361]"
            >
              Tải file
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
