"use client";

import { useEffect, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { cn } from "@/utils/cn";
import { emptyLayout, readCsv, readXlsx, type SheetData, type XlsxWorkbook } from "@/utils/xlsx-reader";
import type { ReportFile } from "../types/report.types";
import SheetTable from "./SheetTable";

const isCsv = (name: string) => /\.csv$/i.test(name);

/** Dữ liệu của tệp báo cáo: tab sheet phía trên, bảng dữ liệu bên dưới */
export default function WorkbookView({ report }: { report: ReportFile }) {
  const [workbook, setWorkbook] = useState<XlsxWorkbook | null>(null);
  const [sheet, setSheet] = useState("");
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mở tệp (đổi tệp – vd. vừa nhập bản mới – thì đọc lại); CSV coi như một sheet, không có bố cục
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
        setError(null);
        setData(null);
        setWorkbook(wb);
        setSheet(wb.sheetNames[0] ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không đọc được tệp.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [report.blob, report.name]);

  // Đổi sheet: đọc dữ liệu + bố cục sheet đó
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

  if (error) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500">
        <span>{error}</span>
        <span className="text-xs text-slate-400">Chỉ xem trực tiếp được tệp .xlsx, .xlsm, .csv — dùng “Xuất Excel” để tải tệp về.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tab sheet */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3">
        <div role="tablist" className="flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(workbook?.sheetNames ?? []).map((name) => {
            const active = name === sheet;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (active) return;
                  setData(null);
                  setSheet(name);
                }}
                className={cn(
                  "-mb-px shrink-0 cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-3 py-3 text-[13px] transition-colors",
                  active
                    ? "border-[#DC2626] font-semibold text-[#DC2626]"
                    : "border-transparent font-medium text-slate-500 hover:text-slate-900",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {data ? (
        <SheetTable key={`${report.id}-${report.uploadedAt}-${sheet}`} data={data} />
      ) : (
        <div className="flex min-h-80 flex-1 items-center justify-center gap-2 text-sm text-slate-500">
          <LoadingOutlined /> Đang đọc tệp…
        </div>
      )}
    </div>
  );
}
