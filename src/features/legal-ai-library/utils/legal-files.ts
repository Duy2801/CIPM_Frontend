import type { AttachedDocumentFile, LegalDocument } from "../types/legal-ai.types.ts";

/** Mã tệp ảo cho văn bản mẫu chưa khai báo danh sách tệp */
export const ORIGINAL_FILE_ID = "__original__";

/** Mã duy nhất cho tệp vừa chọn (gọi trong xử lý sự kiện, không gọi khi render) */
export const createFileId = () => `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Thời điểm hiện tại dạng "dd/mm/yyyy hh:mm" */
export function nowDateTimeVi(now = new Date()): string {
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** "2024-01-15 09:15" / "2024-01-15T09:15" → "15/01/2024 09:15"; đã đúng dạng thì giữ nguyên */
export function formatFileDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/") && dateStr.includes(":")) return dateStr;
  const [datePart, timePart] = dateStr.replace("T", " ").split(" ");
  if (datePart && datePart.includes("-")) {
    const [y, m, d] = datePart.split("-");
    const time = timePart ? timePart.slice(0, 5) : "08:30";
    return `${d}/${m}/${y} ${time}`;
  }
  return dateStr;
}

/** Tệp hiển thị của văn bản: văn bản mẫu chưa khai báo tệp thì coi tệp gốc là một tệp đính kèm */
export function getDisplayFiles(document: LegalDocument): AttachedDocumentFile[] {
  return (
    document.files ?? [
      {
        id: ORIGINAL_FILE_ID,
        name: document.title ? `${document.code} - ${document.title}` : document.code,
        size: document.fileSize,
        type: document.fileType,
      },
    ]
  );
}

function saveBlob(href: string, fileName: string) {
  const link = window.document.createElement("a");
  link.href = href;
  link.download = fileName;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
}

/** Tệp mẫu chưa có tệp thật: tải về một tệp chữ tóm tắt thông tin văn bản */
function downloadPlaceholder(document: LegalDocument, fileName: string) {
  const content = [
    `Tập tin văn bản pháp lý / biểu mẫu chuẩn: ${document.title}`,
    `Tên tệp: ${fileName}`,
    `Số hiệu: ${document.code}`,
    `Cơ quan ban hành: ${document.issuer}`,
    `Nội dung tóm tắt:`,
    document.summary,
  ].join("\n");
  const href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  saveBlob(href, fileName);
  URL.revokeObjectURL(href);
}

/** Tải một tệp của văn bản: tệp vừa tải lên / có đường dẫn thì tải thật, còn lại tải tệp mẫu */
export function downloadLegalFile(document: LegalDocument, file: AttachedDocumentFile) {
  if (file.rawFile) {
    const href = URL.createObjectURL(file.rawFile);
    saveBlob(href, file.name);
    URL.revokeObjectURL(href);
    return;
  }
  if (file.url) {
    saveBlob(file.url, file.name);
    return;
  }
  if (file.id === ORIGINAL_FILE_ID) {
    const safeCode = document.code.replace(/[/\\?%*:|"<>]/g, "_");
    downloadPlaceholder(document, document.title ? `${safeCode}_${document.title.slice(0, 30)}.pdf` : `${safeCode}.pdf`);
    return;
  }
  const hasExtension = /\.(pdf|docx?)$/i.test(file.name);
  downloadPlaceholder(document, hasExtension ? file.name : `${file.name}.${file.type === "PDF" ? "pdf" : "docx"}`);
}
