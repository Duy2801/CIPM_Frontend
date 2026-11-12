import type { ReportType } from "../types/report.types";

export const OTHER_REPORT_TYPE_ID = "khac";

export const DEFAULT_REPORT_TYPES: ReportType[] = [
  { id: "giam-sat", name: "Báo cáo giám sát – kỹ thuật" },
  { id: "giai-ngan", name: "Báo cáo giải ngân" },
  { id: "tien-do", name: "Báo cáo tiến độ dự án" },
  { id: "gpmb", name: "Báo cáo bồi thường, GPMB" },
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

/** Loại mặc định + loại tự thêm */
export function loadReportTypes(): ReportType[] {
  return [...DEFAULT_REPORT_TYPES, ...loadCustomTypes()];
}

export function addReportType(name: string): ReportType {
  const type: ReportType = { id: `RT-${Date.now()}`, name: name.trim(), custom: true };
  saveCustomTypes([...loadCustomTypes(), type]);
  return type;
}

export function removeReportType(id: string) {
  saveCustomTypes(loadCustomTypes().filter((t) => t.id !== id));
}
