"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  InboxOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Input, Pagination } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { ReportFile, ReportType } from "../types/report.types";
import { REPORT_ACCEPT, formatDate, reportTitle } from "../utils/report-format";

const PAGE_SIZE = 10;

/** Cấp 2: các báo cáo thuộc một loại — nhập (hoặc kéo thả) tệp Excel, bấm thẻ để xem */
export default function ReportList({
  type,
  reports,
  importing,
  onBack,
  onImport,
  onOpen,
}: {
  type: ReportType;
  reports: ReportFile[];
  importing: boolean;
  onBack: () => void;
  onImport: (files: File[]) => void;
  onOpen: (report: ReportFile) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dragging, setDragging] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => !q || reportTitle(r).toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [reports, search]);
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onImport(Array.from(e.dataTransfer.files));
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
      {/* Đầu trang: quay lại · tên loại · tìm · nhập */}
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
          <h1 className="m-0 truncate text-base font-bold text-slate-900">{type.name}</h1>
          <p className="m-0 text-xs text-slate-500">{reports.length} báo cáo</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            allowClear
            intent="clean"
            prefix={<SearchOutlined className="text-xs text-slate-400" />}
            placeholder="Tìm báo cáo..."
            className="h-9 w-full text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          intent="primary"
          scale="sm"
          icon={<UploadOutlined />}
          loading={importing}
          onClick={() => fileRef.current?.click()}
          className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
        >
          Nhập Excel
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={REPORT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            onImport(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {rows.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 hover:border-[#DC2626]/50 hover:text-[#DC2626]"
        >
          <InboxOutlined className="text-4xl text-slate-300" />
          <span className="text-sm font-semibold">
            {search ? "Không có báo cáo nào khớp từ khóa." : "Chưa có báo cáo. Nhấn hoặc kéo thả tệp Excel vào đây."}
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2.5">
          {paged.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(r)}
              onKeyDown={(e) => e.key === "Enter" && onOpen(r)}
              className="group flex cursor-pointer flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs outline-none transition-all hover:border-[#DC2626]/40 hover:shadow-md focus-visible:border-[#DC2626]/60"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                <FileExcelOutlined />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="m-0 truncate text-[15px] font-bold text-slate-900 group-hover:text-[#DC2626]" title={r.name}>
                  {reportTitle(r)}
                </h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5">
                    <CalendarOutlined className="text-slate-400" /> {formatDate(r.uploadedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5">
                    <UserOutlined className="text-slate-400" /> {r.uploadedBy}
                  </span>
                </div>
              </div>
              {/* Chặn nổi bọt để bấm nút không mở báo cáo hai lần */}
              <div className="flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                <Button
                  intent="primary"
                  scale="sm"
                  onClick={() => onOpen(r)}
                  className="h-9 !border-[#DC2626] !bg-[#DC2626] px-4 text-xs font-semibold !text-white hover:!bg-[#B91C1C]"
                >
                  Xem báo cáo
                </Button>
              </div>
            </div>
          ))}
          {rows.length > PAGE_SIZE && (
            <div className="flex justify-end">
              <Pagination size="small" current={page} onChange={setPage} pageSize={PAGE_SIZE} total={rows.length} showSizeChanger={false} />
            </div>
          )}
        </div>
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
