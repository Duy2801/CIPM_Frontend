"use client";

import { useEffect, useRef, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

/** Nạp pdf.js một lần (chỉ khi mở xem PDF) và dùng chung một worker cho cả ứng dụng */
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerPort) {
        pdfjs.GlobalWorkerOptions.workerPort = new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
          { type: "module" },
        );
      }
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

interface PdfPagesViewerProps {
  url: string;
}

/**
 * Hiển thị PDF thành các tờ giấy trắng xếp dọc (cuộn chuột để đọc), tự co theo chiều rộng khung.
 * Mỗi lần đổi tệp, component được mount lại (key = url) nên trạng thái luôn bắt đầu từ "đang tải".
 */
export default function PdfPagesViewer({ url }: PdfPagesViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);

  // Mở tài liệu
  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    loadPdfJs()
      .then((pdfjs) => {
        if (cancelled) return null;
        loadingTask = pdfjs.getDocument({ url });
        return loadingTask.promise;
      })
      .then((doc) => {
        if (cancelled || !doc) return;
        setPdf(doc);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    // Đóng xem / đổi tệp: hủy tải và giải phóng bộ nhớ của tài liệu
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [url]);

  // Theo dõi chiều rộng khung để tờ giấy luôn vừa màn hình
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[820px]">
      {error ? (
        <p className="m-0 py-16 text-center text-sm text-slate-500">
          Không mở được tệp PDF này. Vui lòng bấm Tải về để xem bằng ứng dụng khác.
        </p>
      ) : !pdf || width === 0 ? (
        <p className="m-0 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <LoadingOutlined /> Đang mở tệp PDF...
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from({ length: pdf.numPages }, (_, i) => (
            <PdfPage key={i + 1} pdf={pdf} pageNumber={i + 1} width={width} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Một trang PDF: vẽ lên canvas theo chiều rộng khung, nét theo mật độ điểm ảnh của màn hình */
function PdfPage({ pdf, pageNumber, width }: { pdf: PDFDocumentProxy; pageNumber: number; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    pdf.getPage(pageNumber).then((page) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const cssScale = width / baseViewport.width;
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: cssScale * pixelRatio });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
      canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

      const task = page.render({ canvas, viewport });
      renderTask = task;
      task.promise.catch(() => {
        // Bị hủy do đổi kích thước / đóng xem: bỏ qua
      });
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <div className="overflow-hidden rounded-sm bg-white shadow-md">
      <canvas ref={canvasRef} aria-label={`Trang ${pageNumber}`} className="block" />
    </div>
  );
}
