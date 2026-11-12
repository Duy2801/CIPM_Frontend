"use client";

import { DeleteOutlined, FolderOpenOutlined, RightOutlined } from "@ant-design/icons";
import { useReportActions } from "../hooks/useReportActions";
import { useReportOf, useReportType } from "../hooks/useReportQueries";
import { formatDate } from "../utils/report-format";

interface ReportTypeCardProps {
  typeId: string;
  onOpen: (typeId: string) => void;
}

export default function ReportTypeCard({ typeId, onOpen }: ReportTypeCardProps) {
  const type = useReportType(typeId);
  const report = useReportOf(typeId);
  const { removeType } = useReportActions();
  if (!type) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(typeId)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(typeId)}
      className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:shadow-md focus-visible:border-[#DC2626]/60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-[#DC2626]">
        <FolderOpenOutlined />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 truncate text-[15px] font-bold text-slate-900" title={type.name}>
          {type.name}
        </h3>
        <p className="m-0 mt-1 text-xs text-slate-400">
          {report ? `Cập nhật ${formatDate(report.uploadedAt)}` : "Chưa có dữ liệu"}
        </p>
      </div>
      <RightOutlined className="mt-1 text-xs text-slate-300 transition-colors group-hover:text-[#DC2626]" />
      {type.custom && !report && (
        <button
          type="button"
          aria-label={`Xóa loại ${type.name}`}
          title="Xóa loại báo cáo"
          onClick={(e) => {
            e.stopPropagation();
            removeType(typeId);
          }}
          className="absolute bottom-3 right-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-[#DC2626] group-hover:opacity-100"
        >
          <DeleteOutlined />
        </button>
      )}
    </div>
  );
}
