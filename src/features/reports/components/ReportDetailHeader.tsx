"use client";

import { ArrowLeftOutlined, DownloadOutlined, HistoryOutlined, UploadOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";
import { useReportActions } from "../hooks/useReportActions";
import { useReportImporting, useReportOf, useReportType } from "../hooks/useReportQueries";

interface ReportDetailHeaderProps {
  typeId: string;
  showHistory: boolean;
  onBack: () => void;
  onShowHistory: () => void;
  onPickFile: () => void;
}

export default function ReportDetailHeader({ typeId, showHistory, onBack, onShowHistory, onPickFile }: ReportDetailHeaderProps) {
  const type = useReportType(typeId);
  const report = useReportOf(typeId);
  const importing = useReportImporting();
  const { exportReport } = useReportActions();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        intent="outline"
        scale="compact"
        icon={<ArrowLeftOutlined />}
        aria-label="Quay lại"
        title="Quay lại"
        onClick={onBack}
        className="h-9! w-9! shrink-0 p-0!"
      />
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate text-base font-bold text-slate-900" title={report?.name}>
          {showHistory ? "Lịch sử · " : ""}
          {type?.name}
        </h1>
      </div>
      {!showHistory && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button intent="outline" scale="sm" icon={<HistoryOutlined />} onClick={onShowHistory} className="h-9 px-4 text-xs font-semibold">
            Lịch sử
          </Button>
          <Button
            intent="outline"
            scale="sm"
            icon={<UploadOutlined />}
            loading={importing}
            onClick={onPickFile}
            className="h-9 px-4 text-xs font-semibold"
          >
            Nhập Excel
          </Button>
          {report && (
            <Button
              intent="primary"
              scale="sm"
              icon={<DownloadOutlined />}
              onClick={() => exportReport(typeId)}
              className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
            >
              Xuất Excel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
