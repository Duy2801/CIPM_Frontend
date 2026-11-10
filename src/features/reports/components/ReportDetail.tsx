"use client";

import { useRef } from "react";
import { App } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Card } from "@/components/ui";
import { downloadBlob } from "@/utils/xlsx-writer";
import type { ReportFile, ReportType } from "../types/report.types";
import { REPORT_ACCEPT, formatDateTime, isReportFile, reportTitle } from "../utils/report-format";
import WorkbookView from "./WorkbookView";

/** Cấp 3: một báo cáo — Nhập Excel (thay bằng bản mới) · Xuất Excel (tải tệp gốc) · bảng dữ liệu */
export default function ReportDetail({
  type,
  report,
  replacing,
  onBack,
  onReplace,
}: {
  type: ReportType;
  report: ReportFile;
  replacing: boolean;
  onBack: () => void;
  onReplace: (file: File) => void;
}) {
  const { modal, message } = App.useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const pickReplacement = (file?: File) => {
    if (!file) return;
    if (!isReportFile(file.name)) {
      message.warning("Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.");
      return;
    }
    modal.confirm({
      title: "Cập nhật báo cáo bằng tệp mới?",
      content: (
        <span className="text-xs text-slate-600">
          Dữ liệu của <strong>{reportTitle(report)}</strong> sẽ được thay bằng tệp <strong>{file.name}</strong>.
        </span>
      ),
      okText: "Cập nhật",
      cancelText: "Hủy",
      okButtonProps: { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
      onOk: () => onReplace(file),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Đầu trang: quay lại · tên báo cáo · thông tin tệp · nhập / xuất */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          intent="outline"
          scale="compact"
          icon={<ArrowLeftOutlined />}
          aria-label={`Quay lại ${type.name}`}
          title="Quay lại"
          onClick={onBack}
          className="h-9! w-9! shrink-0 p-0!"
        />
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-bold text-slate-900" title={report.name}>
            {reportTitle(report)}
          </h1>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            {formatDateTime(report.uploadedAt)} · {report.uploadedBy}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            intent="outline"
            scale="sm"
            icon={<UploadOutlined />}
            loading={replacing}
            onClick={() => fileRef.current?.click()}
            className="h-9 px-4 text-xs font-semibold"
          >
            Nhập Excel
          </Button>
          <Button
            intent="primary"
            scale="sm"
            icon={<DownloadOutlined />}
            onClick={() => downloadBlob(report.blob, report.name)}
            className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
          >
            Xuất Excel
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={REPORT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              pickReplacement(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border-slate-200 shadow-sm shadow-slate-100">
        <WorkbookView report={report} />
      </Card>
    </div>
  );
}
