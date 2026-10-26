"use client";

import { useState } from "react";
import {
  DownloadOutlined,
  FilePdfOutlined,
  FullscreenOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabOriginalPdfProps {
  document: DetailedLegalDocument;
}

export default function TabOriginalPdf({ document: doc }: TabOriginalPdfProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 48;

  return (
    <div className="space-y-4">
      {/* Toolbar xem trước tài liệu gốc */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100/90 px-4 py-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <FilePdfOutlined className="text-rose-600 text-base" />
          <span className="font-bold text-slate-800">
            Bản scan gốc Công báo nước CHXHCN Việt Nam (có dấu đỏ)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Phân trang */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-300">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold px-1"
            >
              ‹
            </button>
            <span className="tabular-nums font-semibold text-slate-800">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold px-1"
            >
              ›
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-300">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 hover:text-[#DC2626] cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOutOutlined />
            </button>
            <span className="w-12 text-center font-medium text-slate-800">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 hover:text-[#DC2626] cursor-pointer"
              title="Phóng to"
            >
              <ZoomInOutlined />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.open("#", "_blank")}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1 rounded font-semibold text-slate-700 cursor-pointer"
          >
            <FullscreenOutlined /> Toàn màn hình
          </button>
        </div>
      </div>

      {/* Khung mô phỏng tờ công báo gốc có dấu đỏ Quốc hội */}
      <div className="flex justify-center bg-slate-200/70 p-6 sm:p-10 rounded-xl overflow-x-auto min-h-[700px]">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          className="relative w-[760px] min-h-[980px] bg-white shadow-xl rounded-sm p-12 text-slate-900 transition-transform font-serif border border-slate-300 select-none"
        >
          {/* Header công báo */}
          <div className="grid grid-cols-2 gap-4 pb-8 border-b-2 border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">QUỐC HỘI</div>
              <div className="text-[11px] font-medium mt-1">Số: {doc.code}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wide">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-xs font-bold mt-0.5">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[11px] text-slate-600 mt-1 italic">
                Hà Nội, ngày 20 tháng 11 năm 2019
              </div>
            </div>
          </div>

          {/* Dấu mộc đỏ Quốc hội Việt Nam */}
          <div className="absolute right-16 top-40 w-32 h-32 rounded-full border-4 border-red-600 flex flex-col items-center justify-center text-center p-2 transform -rotate-12 opacity-85 pointer-events-none">
            <div className="text-[8px] font-black uppercase text-red-600 leading-tight">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-[14px] text-red-600 font-black my-0.5">★</div>
            <div className="text-[9px] font-black uppercase text-red-600">QUỐC HỘI</div>
          </div>

          {/* Tiêu đề Luật */}
          <div className="text-center py-8 space-y-2">
            <div className="text-xl font-bold uppercase tracking-wider">{doc.shortTitle}</div>
            <div className="text-xs italic text-slate-600">
              Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;
            </div>
            <div className="text-xs font-semibold">
              Quốc hội ban hành {doc.shortTitle}.
            </div>
          </div>

          {/* Nội dung chương 1 */}
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="text-center font-bold uppercase tracking-wide">
              CHƯƠNG I: NHỮNG QUY ĐỊNH CHUNG
            </div>
            <div>
              <span className="font-bold">Điều 1. Phạm vi điều chỉnh</span>
              <p className="mt-1 text-justify">
                {doc.shortTitle} quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, tổ chức đại diện người lao động tại cơ sở, tổ chức đại diện người sử dụng lao động trong quan hệ lao động và các quan hệ khác liên quan trực tiếp đến quan hệ lao động; quản lý nhà nước về lao động.
              </p>
            </div>
            <div>
              <span className="font-bold">Điều 2. Đối tượng áp dụng</span>
              <p className="mt-1 text-justify">
                1. Người lao động, người học nghề, người tập nghề và người làm việc không có quan hệ lao động.<br />
                2. Người sử dụng lao động.<br />
                3. Người lao động nước ngoài làm việc tại Việt Nam.<br />
                4. Cơ quan, tổ chức, cá nhân khác có liên quan trực tiếp đến quan hệ lao động.
              </p>
            </div>
          </div>

          {/* Dấu trang và số công báo chân trang */}
          <div className="absolute bottom-6 left-12 right-12 flex justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-2 font-sans">
            <span>CÔNG BÁO / Số {doc.gazetteNumber}</span>
            <span>Trang {page}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
