"use client";

import { useState } from "react";
import {
  CommentOutlined,
  CopyOutlined,
  EllipsisOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Dropdown, Tooltip } from "@/components/ui";
import { App } from "antd";
import type { ChapterItem, DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabContentProps {
  document: DetailedLegalDocument;
  isBilingual?: boolean;
  onAskAiArticle?: (articleText: string) => void;
  onAddNoteArticle?: (articleTitle: string) => void;
}

export default function TabContent({
  document: doc,
  isBilingual = false,
  onAskAiArticle,
  onAddNoteArticle,
}: TabContentProps) {
  const { message } = App.useApp();
  const [viewMode, setViewMode] = useState<"ALL" | "EFFECTIVE_ONLY" | "HIGHLIGHT_AMENDED">("ALL");

  const handleCopyArticle = (artTitle: string, paragraphs: string[]) => {
    const text = `${artTitle}\n${paragraphs.join("\n")}\n(Trích từ ${doc.title})`;
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép nội dung ${artTitle}`);
  };

  return (
    <div className="space-y-4">
      {/* Thanh bộ lọc & chế độ xem điều khoản */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Tình trạng hiệu lực:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {doc.statusText}
          </span>
          <Tooltip title="Nhấp tab Hiệu lực để xem danh sách các luật sửa đổi, bổ sung">
            <InfoCircleOutlined className="text-slate-400 cursor-help" />
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Chế độ xem:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-[#DC2626] focus:outline-hidden"
          >
            <option value="ALL">Tất cả chế độ xem</option>
            <option value="EFFECTIVE_ONLY">Chỉ xem điều khoản còn hiệu lực</option>
            <option value="HIGHLIGHT_AMENDED">Làm nổi bật các điều khoản bị sửa đổi</option>
          </select>
        </div>
      </div>

      {/* Khung văn bản quy phạm pháp luật chuẩn thể thức Quốc hội */}
      <div className="relative rounded-lg border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
        {/* Con dấu hiệu lực watermark nghiêng góc phải đặc trưng LuatVietnam / CIPM */}
        <div className="absolute right-4 top-4 sm:right-8 sm:top-8 z-10 select-none">
          <div className="transform rotate-3 rounded-lg border-2 border-dashed border-red-500/80 bg-red-50/70 px-3.5 py-2 text-center text-red-700 shadow-xs backdrop-blur-2xs">
            <div className="text-[10px] font-black tracking-widest text-red-600">
              ★★★ CIPM LEGAL ★★★
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-red-700">
              Hiệu lực: {doc.effectiveDate}
            </div>
            <div className="text-[11px] font-bold text-red-600">
              Tình trạng: {doc.statusText}
            </div>
          </div>
        </div>

        {/* Tiêu ngữ & Cơ quan ban hành */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center sm:text-left pt-2 pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900">
                {doc.issuer.toUpperCase()}
              </div>
              <div className="text-xs text-slate-600 mt-1">--------</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {doc.categoryName} số: {doc.code}
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="text-xs text-slate-600 mt-1 sm:text-right">----------------</div>
            </div>
          </div>

          {/* Tên văn bản */}
          <div className="text-center space-y-2 py-2">
            <h1 className="m-0 text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
              {doc.shortTitle.toUpperCase()}
            </h1>
            <p className="m-0 text-xs text-slate-600 italic">
              Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;
            </p>
            <p className="m-0 text-xs font-semibold text-slate-800">
              Quốc hội ban hành {doc.shortTitle}.
            </p>
          </div>

          {/* Nội dung các Chương và Điều */}
          <div className="space-y-8 pt-4">
            {doc.chapters.map((chapter: ChapterItem, cIdx) => (
              <div key={cIdx} className="space-y-4">
                {/* Tiêu đề chương */}
                <div className="text-center border-t border-slate-100 pt-6">
                  <div className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                    {chapter.number}
                  </div>
                  <div className="text-sm font-black uppercase text-slate-900 mt-0.5">
                    {chapter.title}
                  </div>
                </div>

                {/* Các điều */}
                <div className="space-y-5">
                  {chapter.articles.map((art, aIdx) => {
                    const isAmended = Boolean(art.amendedNote);
                    if (viewMode === "EFFECTIVE_ONLY" && art.status === "EXPIRED") {
                      return null;
                    }

                    const menuItems = [
                      {
                        key: "copy",
                        label: "Sao chép điều khoản",
                        icon: <CopyOutlined />,
                        onClick: () => handleCopyArticle(art.number, art.paragraphs),
                      },
                      {
                        key: "note",
                        label: "Thêm ghi chú điều này",
                        icon: <CommentOutlined />,
                        onClick: () => onAddNoteArticle?.(`${art.number} – ${art.title}`),
                      },
                      {
                        key: "ai",
                        label: "Hỏi AI về điều khoản này",
                        icon: <QuestionCircleOutlined />,
                        onClick: () =>
                          onAskAiArticle?.(
                            `Giải thích quy định tại ${art.number} (${art.title}) của ${doc.shortTitle}: ${art.paragraphs.join(" ")}`,
                          ),
                      },
                    ];

                    return (
                      <div
                        key={aIdx}
                        id={`art-${art.number.replace(/\s+/g, "-")}`}
                        className={`group relative rounded-lg border p-4 transition-all ${
                          isAmended && viewMode === "HIGHLIGHT_AMENDED"
                            ? "border-amber-300 bg-amber-50/40"
                            : "border-transparent hover:border-slate-200 hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Nút tác vụ menu 3 chấm ở góc phải */}
                        <div className="absolute right-2 top-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                            <button
                              type="button"
                              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800 cursor-pointer transition-colors"
                              title="Tùy chọn điều khoản"
                            >
                              <EllipsisOutlined className="text-base" />
                            </button>
                          </Dropdown>
                        </div>

                        {/* Tiêu đề điều */}
                        <div className="flex items-center gap-2 pr-8">
                          <h4 className="m-0 text-xs sm:text-sm font-bold text-slate-900">
                            {art.number}. {art.title}
                          </h4>
                          {isAmended && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                              Đã sửa đổi
                            </span>
                          )}
                        </div>

                        {/* Nội dung đoạn văn */}
                        <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-800 font-serif sm:text-[13px]">
                          {art.paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="m-0 text-justify">
                              {p}
                            </p>
                          ))}
                        </div>

                        {/* Nếu bật chế độ song ngữ */}
                        {isBilingual && (
                          <div className="mt-3 border-t border-slate-200 pt-2 text-xs italic text-slate-600 bg-slate-50/80 p-2.5 rounded">
                            <span className="font-semibold text-slate-700 not-italic block mb-1">
                              [English Translation]:
                            </span>
                            {art.number}. {art.title} – Provisions applied under Vietnam Labor Code No. {doc.code}.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
