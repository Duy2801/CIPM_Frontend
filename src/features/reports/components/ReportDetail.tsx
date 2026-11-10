"use client";

import { useRef, useState, type DragEvent } from "react";
import { App } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import { downloadBlob } from "@/utils/xlsx-writer";
import type { ReportFile, ReportType } from "../types/report.types";
import { REPORT_ACCEPT, formatDateTime, isReportFile, reportTitle } from "../utils/report-format";
import WorkbookView from "./WorkbookView";

/**
 * Báo cáo của một loại: mở thẳng bản nhập mới nhất.
 * Nhập Excel = thêm bản mới (thành bản đang xem) · Xuất Excel = tải tệp gốc.
 */
export default function ReportDetail({
  type,
  reports,
  currentId,
  importing,
  onBack,
  onImport,
}: {
  type: ReportType;
  /** Các bản nhập của loại này, mới nhất trước */
  reports: ReportFile[];
  currentId?: string;
  importing: boolean;
  onBack: () => void;
  onImport: (file: File) => void;
}) {
  const { message } = App.useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const report = reports.find((r) => r.id === currentId) ?? reports[0];

  const pick = (file?: File) => {
    if (!file) return;
    if (!isReportFile(file.name)) {
      message.warning("Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.");
      return;
    }
    onImport(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  return (
    <div
      className="relative flex flex-col gap-3"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {/* Đầu trang: quay lại · tên báo cáo · bản nhập · nhập / xuất */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label="Quay lại loại báo cáo"
          title="Quay lại"
          onClick={onBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-bold text-slate-900" title={report?.name}>
            {report ? reportTitle(report) : type.name}
          </h1>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            {report ? `${formatDateTime(report.uploadedAt)} · ${report.uploadedBy}` : type.name}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            intent="outline"
            scale="sm"
            icon={<UploadOutlined />}
            loading={importing}
            onClick={() => fileRef.current?.click()}
            className="h-9 px-4 text-xs font-semibold"
          >
            Nhập Excel
          </Button>
          {report && (
            <Button
              intent="primary"
              scale="sm"
              icon={<DownloadOutlined />}
              onClick={() => downloadBlob(report.blob, report.name)}
              className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
            >
              Xuất Excel
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={REPORT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {report ? (
        <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border-slate-200 shadow-sm shadow-slate-100">
          <WorkbookView report={report} />
        </Card>
      ) : (
        // Loại chưa có báo cáo: ô nhập lớn
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 hover:border-[#DC2626]/50 hover:text-[#DC2626]"
        >
          <InboxOutlined className="text-4xl text-slate-300" />
          <span className="text-sm font-semibold">Chưa có báo cáo. Nhấn hoặc kéo thả tệp Excel vào đây.</span>
        </button>
      )}

      {dragging && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-[#DC2626]/50 bg-white/85 text-sm font-semibold text-[#DC2626]",
          )}
        >
          <InboxOutlined className="mr-2 text-2xl" /> Thả tệp Excel vào đây để nhập vào “{type.name}”
        </div>
      )}
    </div>
  );
}
