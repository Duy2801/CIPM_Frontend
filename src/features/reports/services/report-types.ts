import type { ReportType } from "../types/report.types";

/** Loại báo cáo mặc định; loại tự thêm lưu trên máy (bản mock) */
export const OTHER_REPORT_TYPE_ID = "khac";

export const DEFAULT_REPORT_TYPES: ReportType[] = [
  { id: "giam-sat", name: "Báo cáo giám sát – kỹ thuật", description: "Tình hình thi công, khối lượng, chất lượng công trình" },
  { id: "giai-ngan", name: "Báo cáo giải ngân", description: "Kế hoạch vốn, giải ngân và dự kiến giải ngân" },
  { id: "tien-do", name: "Báo cáo tiến độ dự án", description: "Tiến độ thực hiện các dự án, công trình" },
  { id: "gpmb", name: "Báo cáo bồi thường, GPMB", description: "Phương án bồi thường, hỗ trợ, tái định cư" },
  { id: OTHER_REPORT_TYPE_ID, name: "Báo cáo khác", description: "Các báo cáo chưa phân loại" },
];

const STORAGE_KEY = "cipm_report_types_v1";

function loadCustomTypes(): ReportType[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((t) => t && typeof t.id === "string" && typeof t.name === "string") : [];
  } catch {
    return [];
  }
}

function saveCustomTypes(types: ReportType[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  } catch {
    // Không lưu được thì vẫn dùng trong phiên này
  }
}

/** Loại mặc định + loại tự thêm ("Báo cáo khác" luôn đứng cuối) */
export function loadReportTypes(): ReportType[] {
  const other = DEFAULT_REPORT_TYPES.filter((t) => t.id === OTHER_REPORT_TYPE_ID);
  const defaults = DEFAULT_REPORT_TYPES.filter((t) => t.id !== OTHER_REPORT_TYPE_ID);
  return [...defaults, ...loadCustomTypes(), ...other];
}

export function addReportType(name: string, description?: string): ReportType {
  const type: ReportType = { id: `RT-${Date.now()}`, name: name.trim(), description: description?.trim() || undefined, custom: true };
  saveCustomTypes([...loadCustomTypes(), type]);
  return type;
}

export function removeReportType(id: string) {
  saveCustomTypes(loadCustomTypes().filter((t) => t.id !== id));
}
