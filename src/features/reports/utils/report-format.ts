import { OTHER_REPORT_TYPE_ID } from "../services/report-types.ts";
import type { ReportFile } from "../types/report.types";

export const REPORT_ACCEPT = ".xlsx,.xlsm,.xls,.xlsb,.csv";
export const isReportFile = (name: string) => /\.(xlsx|xlsm|xls|xlsb|csv)$/i.test(name);

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const reportTypeOf = (r: ReportFile) => r.typeId || OTHER_REPORT_TYPE_ID;
