"use client";

import { useEffect, useState } from "react";
import { CloseOutlined, DownloadOutlined, FileExcelOutlined, LoadingOutlined } from "@ant-design/icons";
import { Modal } from "@/components/ui";
import { cn } from "@/utils/cn";
import { emptyLayout, readCsv, readXlsx, type SheetData, type XlsxWorkbook } from "@/utils/xlsx-reader";
import { downloadBlob } from "@/utils/xlsx-writer";
import type { ReportFile } from "../types/report.types";
import SheetGrid from "./SheetGrid";

const isCsv = (name: string) => /\.csv$/i.test(name);

/** Xem tệp báo cáo Excel / CSV ngay trên trình duyệt, thao tác như Excel; chọn sheet ở thanh dưới */
export default function ReportPreviewModal({ report, onClose }: { report: ReportFile; onClose: () => void }) {
  const [workbook, setWorkbook] = useState<XlsxWorkbook | null>(null);
  const [sheet, setSheet] = useState<string>("");
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mở tệp: CSV coi như một sheet, không có bố cục
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let wb: XlsxWorkbook;
        if (isCsv(report.name)) {
          const rows = await readCsv(report.blob);
          wb = { sheetNames: ["CSV"], readSheet: async () => rows, readSheetFull: async () => ({ rows, layout: emptyLayout() }) };
        } else {
          wb = await readXlsx(report.blob);
        }
        if (cancelled) return;
        setWorkbook(wb);
        setSheet(wb.sheetNames[0] ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không đọc được tệp.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [report]);

  // Đổi sheet: đọc lại dữ liệu + bố cục sheet đó
  useEffect(() => {
    if (!workbook || !sheet) return;
    let cancelled = false;
    workbook
      .readSheetFull(sheet)
      .then((result) => !cancelled && setData(result))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Không đọc được sheet."));
    return () => {
      cancelled = true;
    };
  }, [workbook, sheet]);

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      width="min(1600px, calc(100vw - 24px))"
      destroyOnHidden
      styles={{
        container: { background: "transparent", boxShadow: "none", padding: 0 },
        body: { padding: 0 },
      }}
    >
      <div className="flex h-[calc(100dvh-48px)] flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        {/* Thanh trên: tên tệp · tải về · đóng */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 py-1.5 pl-4 pr-2">
          <FileExcelOutlined className="text-emerald-600" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700" title={report.name}>
            {report.name}
          </span>
          {data && (
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              {data.rows.length.toLocaleString("vi-VN")} dòng
            </span>
          )}
          <button
            type="button"
            onClick={() => downloadBlob(report.blob, report.name)}
            title="Tải về tệp gốc"
            aria-label="Tải về"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
          >
            <DownloadOutlined />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Đóng"
            aria-label="Đóng xem tệp"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-base text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
          >
            <CloseOutlined />
          </button>
        </div>

        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-500">
            <span>{error}</span>
            <span className="text-xs text-slate-400">Chỉ xem trực tiếp được tệp .xlsx, .xlsm, .csv.</span>
            <button
              type="button"
              onClick={() => downloadBlob(report.blob, report.name)}
              className="cursor-pointer rounded-md border-0 bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
            >
              Tải về để xem
            </button>
          </div>
        ) : !data ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
            <LoadingOutlined /> Đang đọc tệp…
          </div>
        ) : (
          // Mỗi sheet một lưới riêng: đổi sheet là về ô A1, độ rộng theo sheet đó
          <SheetGrid key={sheet} data={data} fallbackFit={isCsv(report.name)} />
        )}

        {/* Thanh sheet phía dưới như Excel */}
        {workbook && workbook.sheetNames.length > 0 && (
          <div className="flex shrink-0 gap-0.5 overflow-x-auto border-t border-slate-200 bg-slate-50 px-2">
            {workbook.sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  if (name === sheet) return;
                  setData(null);
                  setSheet(name);
                }}
                className={cn(
                  "-mt-px shrink-0 cursor-pointer whitespace-nowrap border-0 border-t-2 px-3 py-1.5 text-xs transition-colors",
                  name === sheet
                    ? "border-[#DC2626] bg-white font-semibold text-[#DC2626]"
                    : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-900",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
