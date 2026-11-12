import type { AuthUser } from "@/types/auth";
import type { ReportFile, ReportType, StoredReportFile } from "../types/report.types";
import { reportTypeOf } from "../utils/report-format";
import { getReportHistory, logReportAction } from "./report-history";
import { reportStorage } from "./report-storage";
import { addReportType, loadReportTypes, removeReportType } from "./report-types";

const toMeta = (r: StoredReportFile): ReportFile => ({
  id: r.id,
  typeId: r.typeId,
  name: r.name,
  size: r.size,
  uploadedAt: r.uploadedAt,
  uploadedBy: r.uploadedBy,
});

const typeOf = (typeId: string): ReportType =>
  loadReportTypes().find((t) => t.id === typeId) ?? { id: typeId, name: "" };

export const mockReportRepository = {
  async getTypes(): Promise<ReportType[]> {
    return loadReportTypes();
  },

  async addType(name: string, user: AuthUser | null): Promise<ReportType> {
    const type = addReportType(name);
    logReportAction(user, "ADD_TYPE", type);
    return type;
  },

  async removeType(typeId: string, user: AuthUser | null): Promise<void> {
    const type = typeOf(typeId);
    removeReportType(typeId);
    logReportAction(user, "REMOVE_TYPE", type);
  },

  async getReports(): Promise<ReportFile[]> {
    return (await reportStorage.list()).map(toMeta);
  },

  async getContent(reportId: string): Promise<Blob> {
    const stored = await reportStorage.get(reportId);
    if (!stored) throw new Error("Không tìm thấy tệp báo cáo.");
    return stored.blob;
  },

  async upload(typeId: string, file: File, user: AuthUser | null): Promise<ReportFile> {
    const report: StoredReportFile = {
      id: `RP-${Date.now()}`,
      typeId,
      name: file.name,
      size: file.size,
      uploadedAt: Date.now(),
      uploadedBy: user?.displayName || user?.name || "Không rõ",
      blob: file,
    };
    const old = (await reportStorage.list()).filter((r) => reportTypeOf(r) === typeId);
    await reportStorage.save(report);
    await Promise.all(old.map((r) => reportStorage.remove(r.id)));
    logReportAction(user, "IMPORT", typeOf(typeId), file.name);
    return toMeta(report);
  },

  async download(reportId: string, user: AuthUser | null): Promise<Blob> {
    const stored = await reportStorage.get(reportId);
    if (!stored) throw new Error("Không tìm thấy tệp báo cáo.");
    logReportAction(user, "EXPORT", typeOf(reportTypeOf(stored)), stored.name);
    return stored.blob;
  },

  async getHistory(typeId?: string) {
    return getReportHistory(typeId);
  },
};
