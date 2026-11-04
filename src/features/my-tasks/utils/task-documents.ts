import type { UploadedAttachment } from "@/components/ui";
import type { ProcedureDocument } from "@/features/construction-procedures/types/procedure.types";

const FILE_TYPES: Record<string, ProcedureDocument["fileType"]> = {
  PDF: "pdf",
  DOCX: "docx",
  EXCEL: "xlsx",
};

/** Tệp vừa tải lên → hồ sơ đính kèm của bước */
export function toProcedureDocuments(files: UploadedAttachment[], uploadedBy: string): ProcedureDocument[] {
  const today = new Date().toISOString().slice(0, 10);
  return files.map((f) => ({
    id: f.id,
    documentCode: "",
    title: f.name,
    issuer: "",
    issueDate: today,
    fileName: f.name,
    fileSize: f.size,
    uploadedAt: today,
    uploadedBy,
    fileType: FILE_TYPES[f.type],
  }));
}
