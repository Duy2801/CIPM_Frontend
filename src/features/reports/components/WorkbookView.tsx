"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { Card } from "@/components/ui";
import { useReportContent, useReportOf } from "../hooks/useReportQueries";
import { useWorkbook } from "../hooks/useWorkbook";
import SheetTable from "./SheetTable";
import WorkbookSheetTabs from "./WorkbookSheetTabs";

export default function WorkbookView({ typeId }: { typeId: string }) {
  const report = useReportOf(typeId);
  const content = useReportContent(report?.id);
  const { sheetNames, sheet, selectSheet, data, error: readError } = useWorkbook(content.data, report?.name ?? "");
  const error = content.error ? "Không tải được tệp báo cáo." : readError;
  if (!report) return null;

  return (
    <Card surface="flat" padding="none" rounded="lg" className="overflow-hidden border-slate-200 shadow-sm shadow-slate-100">
      {error ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
          <span>{error}</span>
          <span className="text-xs text-slate-400">
            Chỉ xem trực tiếp được tệp .xlsx, .xlsm, .csv — dùng “Xuất Excel” để tải tệp về.
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          <WorkbookSheetTabs sheets={sheetNames} active={sheet} onSelect={selectSheet} />
          {data ? (
            <SheetTable key={`${report.id}-${report.uploadedAt}-${sheet}`} data={data} />
          ) : (
            <div className="flex min-h-80 flex-1 items-center justify-center gap-2 text-sm text-slate-500">
              <LoadingOutlined /> Đang đọc tệp…
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
