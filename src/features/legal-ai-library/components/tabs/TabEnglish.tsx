"use client";

import { CopyOutlined, GlobalOutlined } from "@ant-design/icons";
import { App } from "antd";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabEnglishProps {
  document: DetailedLegalDocument;
}

export default function TabEnglish({ document: doc }: TabEnglishProps) {
  const { message } = App.useApp();
  const handleCopy = () => {
    if (doc.englishContent) {
      navigator.clipboard.writeText(doc.englishContent);
      message.success("Đã sao chép toàn văn tiếng Anh vào bộ nhớ đệm.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bản dịch tiếng Anh */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <GlobalOutlined className="text-blue-600 text-base" />
          <span className="font-bold text-slate-800">
            Bản dịch tiếng Anh chính thức (English Translation - Official Gazette)
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1 font-semibold text-slate-700 cursor-pointer shadow-2xs"
        >
          <CopyOutlined /> Sao chép bản dịch
        </button>
      </div>

      {/* Khung nội dung tiếng Anh */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-10 shadow-xs font-serif leading-relaxed text-xs sm:text-sm text-slate-900 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <div className="font-bold uppercase tracking-wide text-xs">
            THE NATIONAL ASSEMBLY OF THE SOCIALIST REPUBLIC OF VIETNAM
          </div>
          <div className="font-medium text-xs">Independence - Freedom - Happiness</div>
          <div className="text-slate-400 text-xs">***</div>
          <h1 className="m-0 text-base sm:text-lg font-bold uppercase text-slate-900 pt-2">
            {doc.englishTitle}
          </h1>
        </div>

        <div className="whitespace-pre-line text-justify font-sans text-xs sm:text-[13px] leading-relaxed text-slate-800">
          {doc.englishContent || "Đang cập nhật toàn văn tiếng Anh cho văn bản này..."}
        </div>
      </div>
    </div>
  );
}
