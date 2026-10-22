"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CloseOutlined,
  DownloadOutlined,
  ExportOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import { Modal } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { STATUS_META, getCategoryLabel } from "../constants/legal-mock-data";
import type {
  AttachedDocumentFile,
  LegalDocument,
} from "../types/legal-ai.types";
import PdfPagesViewer from "./PdfPagesViewer";

interface FilePreviewModalProps {
  open: boolean;
  document: LegalDocument;
  /** Tệp cần xem; không truyền = văn bản mẫu chưa có tệp gốc */
  file?: AttachedDocumentFile;
  onDownload: () => void;
  onClose: () => void;
}

/**
 * Xem tệp văn bản: chỉ hiện tờ văn bản nổi trên nền mờ (không khung, không nền), cuộn chuột để đọc.
 * PDF hiển thị trực tiếp, Word thì hướng dẫn tải về, văn bản mẫu dựng bản xem trước từ thông tin.
 */
export default function FilePreviewModal({
  open,
  document,
  file,
  onDownload,
  onClose,
}: FilePreviewModalProps) {
  // Tệp vừa tải lên chỉ có File trong bộ nhớ → tạo đường dẫn tạm, thu hồi khi đóng
  const fileUrl = useMemo(
    () => (file?.rawFile ? URL.createObjectURL(file.rawFile) : file?.url),
    [file],
  );
  useEffect(() => {
    if (!file?.rawFile || !fileUrl) return;
    return () => URL.revokeObjectURL(fileUrl);
  }, [file, fileUrl]);

  const fileName =
    file?.name ??
    (document.title ? `${document.code} - ${document.title}` : document.code);
  const canEmbedPdf = Boolean(file && fileUrl && file.type === "PDF");
  // Số trang của PDF đang xem (gắn với đường dẫn tệp để đổi tệp là tự đặt lại)
  const [pageInfo, setPageInfo] = useState<{ url: string; count: number } | null>(null);
  const pageCount = pageInfo && pageInfo.url === fileUrl ? pageInfo.count : null;

  const iconButtonClass =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#DC2626]";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="min(880px, calc(100vw - 24px))"
      destroyOnHidden
      // Bỏ khung/nền của modal (antd 6: phần "container"): chỉ còn tờ văn bản, ngoài tờ nhìn xuyên xuống giao diện
      styles={{
        container: { background: "transparent", boxShadow: "none", padding: 0 },
        body: { padding: 0 },
      }}
    >
      <div className="flex h-[calc(100dvh-48px)] flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        {/* Dải tiêu đề mảnh: cố định, không che chữ */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 py-1.5 pl-4 pr-2">
          <span
            className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600"
            title={fileName}
          >
            {fileName}
            {canEmbedPdf && pageCount !== null && (
              <span className="ml-2 font-normal text-slate-400">· {pageCount} trang</span>
            )}
          </span>
          {canEmbedPdf && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở trong tab mới"
              title="Mở trong tab mới"
              className={iconButtonClass}
            >
              <ExportOutlined />
            </a>
          )}
          <button
            type="button"
            onClick={onDownload}
            aria-label="Tải về"
            title="Tải về"
            className={iconButtonClass}
          >
            <DownloadOutlined />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem tệp"
            title="Đóng"
            className={`${iconButtonClass} text-base`}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Vùng nội dung: cuộn bên trong tờ */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {canEmbedPdf ? (
            // PDF: vẽ từng trang thành tờ giấy trắng trên nền xám nhạt, cuộn chuột để đọc
            <div className="min-h-full bg-slate-100 px-3 py-4 sm:px-6 sm:py-6">
              <PdfPagesViewer
                key={fileUrl}
                url={fileUrl!}
                onPageCount={(count) => setPageInfo({ url: fileUrl!, count })}
              />
            </div>
          ) : file && file.type === "DOCX" ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <FileWordOutlined className="text-4xl text-blue-500" />
              <p className="m-0 text-sm font-semibold text-slate-700">
                {fileName}
              </p>
              <p className="m-0 max-w-md text-xs text-slate-500">
                Tệp Word chưa xem trực tiếp được — trình duyệt chỉ hiển thị được
                tệp PDF. Vui lòng bấm Tải về để mở bằng Word, hoặc đính kèm bản
                PDF.
              </p>
            </div>
          ) : (
            // Văn bản mẫu chưa có tệp gốc: dựng tờ văn bản từ thông tin đã lưu
            <article className="px-5 py-8 text-slate-800 sm:px-12 sm:py-10 lg:px-16">
              <div className="flex flex-col justify-between gap-4 text-center text-xs sm:flex-row">
                <div className="sm:w-1/2">
                  <p className="m-0 font-bold uppercase">{document.issuer}</p>
                  <p className="m-0 mt-1">Số: {document.code}</p>
                </div>
                <div className="sm:w-1/2">
                  <p className="m-0 font-bold uppercase">
                    Cộng hòa xã hội chủ nghĩa Việt Nam
                  </p>
                  <p className="m-0 font-semibold">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <p className="m-0 mt-1 italic">
                    Ngày ban hành: {formatDateVi(document.issueDate)}
                  </p>
                </div>
              </div>

              <h4 className="mb-1 mt-10 text-center text-base font-bold uppercase">
                {getCategoryLabel(document.category)}
              </h4>
              {document.title && (
                <p className="m-0 text-center text-sm font-semibold">
                  {document.title}
                </p>
              )}

              <dl className="mx-auto mt-8 grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-slate-500">Ngày có hiệu lực</dt>
                <dd className="m-0 font-medium">
                  {formatDateVi(document.effectiveDate)}
                </dd>
                <dt className="text-slate-500">Tình trạng</dt>
                <dd
                  className={`m-0 font-semibold ${STATUS_META[document.status].textClass}`}
                >
                  {STATUS_META[document.status].label}
                </dd>
              </dl>

              {document.summary.trim() && !document.content?.length && (
                <p className="mt-8 text-sm leading-relaxed text-slate-700">
                  {document.summary}
                </p>
              )}

              {/* Toàn văn: Chương → Điều → khoản */}
              {document.content?.map((section) => (
                <section key={section.heading} className="mt-10">
                  <h5 className="m-0 text-center text-sm font-bold uppercase">
                    {section.heading}
                  </h5>
                  {section.articles.map((article) => (
                    <div key={article.title} className="mt-5">
                      <p className="m-0 text-sm font-bold">{article.title}</p>
                      {article.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph.slice(0, 40)}
                          className="m-0 mt-2 text-justify text-sm leading-relaxed text-slate-700"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ))}
                </section>
              ))}

              <p className="mb-0 mt-16 border-t border-dashed border-slate-200 pt-3 text-center text-[11px] italic text-slate-400">
                Văn bản mẫu chưa có tệp gốc — đây là bản xem trước dựng từ thông
                tin đã lưu.
              </p>
            </article>
          )}
        </div>
      </div>
    </Modal>
  );
}
