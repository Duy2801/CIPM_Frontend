"use client";

import type { ReactNode } from "react";
import { CloseOutlined, DownloadOutlined } from "@ant-design/icons";
import { Modal } from "./modal";

const isImage = (name: string) => /\.(png|jpe?g|webp|gif)$/i.test(name);
const isPdf = (name: string) => /\.pdf$/i.test(name);

export interface FilePreviewModalProps {
  /** Tên tệp (dùng để nhận diện loại tệp và đặt tên khi tải về) */
  fileName: string;
  /** Đường dẫn nội dung tệp; không có = tệp demo / không còn nội dung gốc */
  url?: string;
  /** Hiển thị khi không có nội dung tệp */
  fallback?: ReactNode;
  onClose: () => void;
}

/** Xem tệp đính kèm: ảnh / PDF hiển thị trực tiếp, loại khác thì tải về */
export function FilePreviewModal({ fileName, url, fallback, onClose }: FilePreviewModalProps) {
  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      width="min(880px, calc(100vw - 24px))"
      destroyOnHidden
      styles={{
        container: { background: "transparent", boxShadow: "none", padding: 0 },
        body: { padding: 0 },
      }}
    >
      <div className="flex h-[calc(100dvh-48px)] flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div className="flex shrink-0 items-center gap-1 border-b border-slate-100 py-1.5 pl-4 pr-2">
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600" title={fileName}>
            {fileName}
          </span>
          {url && (
            <a
              href={url}
              download={fileName}
              title="Tải về"
              aria-label="Tải về"
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
            >
              <DownloadOutlined />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem tệp"
            title="Đóng"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-base text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100">
          {url && isPdf(fileName) ? (
            <iframe title={fileName} src={url} className="h-full w-full border-0 bg-white" />
          ) : url && isImage(fileName) ? (
            <div className="flex min-h-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tạm (data / blob URL) */}
              <img src={url} alt={fileName} className="max-h-full max-w-full rounded shadow" />
            </div>
          ) : url ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-500">
              Không xem trực tiếp được loại tệp này.
              <a
                href={url}
                download={fileName}
                className="rounded-md bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C]"
              >
                Tải về để xem
              </a>
            </div>
          ) : (
            (fallback ?? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                Tệp này chưa có nội dung gốc để xem.
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
