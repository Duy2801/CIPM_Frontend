import type { ProjectDocument, ProjectItem } from "../types/project.types.ts";

/** Bộ hồ sơ pháp lý & kỹ thuật mẫu (chưa có backend): dùng cho dự án chưa có tài liệu đính kèm */
const SAMPLE_DOCUMENTS: (Omit<ProjectDocument, "id" | "uploadedAt"> & { daysAfterStart: number })[] = [
  {
    name: "Quyết định phê duyệt chủ trương đầu tư",
    fileName: "QD-phe-duyet-chu-truong-dau-tu.pdf",
    fileSize: "1.2 MB",
    type: "PDF",
    daysAfterStart: -30,
  },
  {
    name: "Báo cáo kinh tế - kỹ thuật đầu tư xây dựng",
    fileName: "Bao-cao-kinh-te-ky-thuat.pdf",
    fileSize: "4.8 MB",
    type: "PDF",
    daysAfterStart: -21,
  },
  {
    name: "Quyết định phê duyệt dự án",
    fileName: "QD-phe-duyet-du-an.pdf",
    fileSize: "860 KB",
    type: "PDF",
    daysAfterStart: -14,
  },
  {
    name: "Dự toán xây dựng công trình",
    fileName: "Du-toan-xay-dung-cong-trinh.xlsx",
    fileSize: "640 KB",
    type: "EXCEL",
    daysAfterStart: -10,
  },
  {
    name: "Hồ sơ thiết kế bản vẽ thi công",
    fileName: "Ho-so-ban-ve-thi-cong.pdf",
    fileSize: "18.5 MB",
    type: "PDF",
    daysAfterStart: -7,
  },
  {
    name: "Hợp đồng thi công xây dựng",
    fileName: "Hop-dong-thi-cong-xay-dung.docx",
    fileSize: "320 KB",
    type: "DOCX",
    daysAfterStart: 0,
  },
];

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Tài liệu đính kèm của dự án; dự án chưa có tài liệu thì dùng bộ hồ sơ mẫu (ngày tải theo ngày bắt đầu dự án) */
export function getProjectDocuments(project: ProjectItem): ProjectDocument[] {
  if (project.documents && project.documents.length > 0) return project.documents;
  const baseDate = project.startDate || new Date().toISOString().slice(0, 10);
  return SAMPLE_DOCUMENTS.map(({ daysAfterStart, ...doc }, index) => ({
    ...doc,
    id: `${project.id}-DOC-MOCK-${index + 1}`,
    uploadedAt: shiftDate(baseDate, daysAfterStart),
  }));
}
