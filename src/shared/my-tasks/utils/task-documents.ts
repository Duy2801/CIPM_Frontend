import type { UploadedAttachment } from "@/components/ui";
import type { ProcedureDocument } from "@/shared/construction-procedures/types/procedure.types";
import { readFileForStorage } from "@/utils/stored-file";

const FILE_TYPES: Record<string, ProcedureDocument["fileType"]> = {
  PDF: "pdf",
  DOCX: "docx",
  EXCEL: "xlsx",
};

/** Tệp vừa tải lên → hồ sơ đính kèm của bước (kèm nội dung để xem lại) */
export async function toProcedureDocuments(files: UploadedAttachment[], uploadedBy: string): Promise<ProcedureDocument[]> {
  const today = new Date().toISOString().slice(0, 10);
  return Promise.all(
    files.map(async (f) => {
      const dataUrl = await readFileForStorage(f.id, f.rawFile);
      return {
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
        ...(dataUrl ? { dataUrl } : {}),
      };
    }),
  );
}
