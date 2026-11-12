"use client";

import { useEffect, useState } from "react";
import { emptyLayout, readCsv, readXlsx, type SheetData, type XlsxWorkbook } from "@/utils/xlsx-reader";

const isCsv = (name: string) => /\.csv$/i.test(name);

async function openWorkbook(blob: Blob, fileName: string): Promise<XlsxWorkbook> {
  if (!isCsv(fileName)) return readXlsx(blob);
  const rows = await readCsv(blob);
  return { sheetNames: ["CSV"], readSheet: async () => rows, readSheetFull: async () => ({ rows, layout: emptyLayout() }) };
}

export function useWorkbook(blob: Blob | undefined, fileName: string) {
  const [workbook, setWorkbook] = useState<XlsxWorkbook | null>(null);
  const [sheet, setSheet] = useState("");
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    let cancelled = false;
    openWorkbook(blob, fileName)
      .then((wb) => {
        if (cancelled) return;
        setError(null);
        setData(null);
        setWorkbook(wb);
        setSheet(wb.sheetNames[0] ?? "");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Không đọc được tệp."));
    return () => {
      cancelled = true;
    };
  }, [blob, fileName]);

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

  const selectSheet = (name: string) => {
    if (name === sheet) return;
    setData(null);
    setSheet(name);
  };

  return { sheetNames: workbook?.sheetNames ?? [], sheet, selectSheet, data, error };
}
