"use client";

import { useRef, useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { useReportActions } from "../hooks/useReportActions";
import { useReportOf, useReportType } from "../hooks/useReportQueries";
import { REPORT_ACCEPT } from "../utils/report-format";
import ReportDetailHeader from "./ReportDetailHeader";
import ReportEmptyImport from "./ReportEmptyImport";
import ReportHistoryTab from "./ReportHistoryTab";
import WorkbookView from "./WorkbookView";

interface ReportDetailProps {
  typeId: string;
  onBack: () => void;
}

export default function ReportDetail({ typeId, onBack }: ReportDetailProps) {
  const type = useReportType(typeId);
  const report = useReportOf(typeId);
  const { importReport } = useReportActions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const pickFile = () => fileRef.current?.click();

  return (
    <div
      className="relative flex flex-col gap-3"
      onDragOver={(e) => {
        e.preventDefault();
        if (!showHistory) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!showHistory) void importReport(typeId, e.dataTransfer.files[0]);
      }}
    >
      <ReportDetailHeader
        typeId={typeId}
        showHistory={showHistory}
        onBack={() => (showHistory ? setShowHistory(false) : onBack())}
        onShowHistory={() => setShowHistory(true)}
        onPickFile={pickFile}
      />
      <input
        ref={fileRef}
        type="file"
        accept={REPORT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          void importReport(typeId, e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {showHistory ? (
        <ReportHistoryTab typeId={typeId} title="" />
      ) : report ? (
        <WorkbookView typeId={typeId} />
      ) : (
        <ReportEmptyImport onPickFile={pickFile} />
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-[#DC2626]/50 bg-white/85 text-sm font-semibold text-[#DC2626]">
          <InboxOutlined className="mr-2 text-2xl" /> Thả tệp Excel vào đây để nhập vào “{type?.name}”
        </div>
      )}
    </div>
  );
}
