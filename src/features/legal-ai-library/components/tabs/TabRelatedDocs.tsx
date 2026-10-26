"use client";

import { useMemo, useState } from "react";
import { InfoCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { Tooltip } from "@/components/ui";
import {
  MOCK_RELATED_DOCUMENTS,
  RELATED_CATEGORIES_METAS,
} from "../../constants/legal-viewer-data";
import type {
  DetailedLegalDocument,
  RelatedCategoryKey,
  RelatedDocumentItem,
} from "../../types/legal-viewer.types";

interface TabRelatedDocsProps {
  document: DetailedLegalDocument;
  onNavigateTab: (tabKey: any) => void;
  onOpenColorGuide: () => void;
  onSelectDocumentItem?: (doc: RelatedDocumentItem) => void;
}

export default function TabRelatedDocs({
  document: currentDoc,
  onNavigateTab,
  onOpenColorGuide,
  onSelectDocumentItem,
}: TabRelatedDocsProps) {
  const [selectedCategory, setSelectedCategory] = useState<RelatedCategoryKey>("all");

  const filteredDocs = useMemo(() => {
    if (selectedCategory === "all") return MOCK_RELATED_DOCUMENTS;
    return MOCK_RELATED_DOCUMENTS.filter((item) => item.categoryKey === selectedCategory);
  }, [selectedCategory]);

  const getStatusBadge = (statusText: string, statusCode: string) => {
    switch (statusCode) {
      case "EFFECTIVE":
        return <span className="font-semibold text-emerald-700">{statusText}</span>;
      case "PARTIAL":
        return <span className="font-semibold text-amber-700">{statusText}</span>;
      case "PENDING":
        return <span className="font-semibold text-blue-700">{statusText}</span>;
      case "EXPIRED":
        return <span className="font-semibold text-slate-500">{statusText}</span>;
      default:
        return <span className="text-slate-600">{statusText}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Tiêu đề & Dòng mô tả */}
      <div>
        <h2 className="m-0 text-base font-bold uppercase tracking-wider text-slate-900">
          VĂN BẢN LIÊN QUAN
        </h2>
        <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed italic">
          Tổng hợp toàn bộ các văn bản có liên quan đến Văn bản đang xem, phân loại để dễ theo dõi danh mục văn bản theo từng kiểu liên quan đến Văn bản đang xem.
        </p>
      </div>

      {/* Bố cục 2 cột đặc trưng: Cột trái phân loại có đếm số, Cột phải danh sách văn bản */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Cột trái: Phân loại kiểu quan hệ văn bản (4 cột trên md, 3 cột trên xl) */}
        <div className="md:col-span-4 xl:col-span-3 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs divide-y divide-slate-100">
            {RELATED_CATEGORIES_METAS.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <Tooltip
                  key={cat.key}
                  placement="right"
                  title={
                    <div className="p-1 max-w-xs text-xs leading-relaxed">
                      <strong>{cat.label}:</strong> {cat.description}
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left cursor-pointer transition-colors ${
                      isActive
                        ? "bg-red-50 text-[#DC2626] font-bold border-l-4 border-l-[#DC2626]"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs ${
                        isActive ? "text-[#DC2626] font-bold" : "text-[#DC2626]/80 font-semibold"
                      }`}
                    >
                      ({cat.count})
                    </span>
                  </button>
                </Tooltip>
              );
            })}
          </div>

          {/* Nút Chú thích màu chỉ dẫn */}
          <button
            type="button"
            onClick={onOpenColorGuide}
            className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Chú thích màu chỉ dẫn</span>
          </button>
        </div>

        {/* Cột phải: Danh sách các văn bản (8 cột trên md, 9 cột trên xl) */}
        <div className="md:col-span-8 xl:col-span-9">
          <div className="rounded-lg border border-slate-200 bg-white shadow-2xs divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Không có văn bản nào trong mục phân loại này.
              </div>
            ) : (
              filteredDocs.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Trái: Số thứ tự dạng to + Tên văn bản + Link tác vụ */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-sm font-black text-slate-900 shrink-0 w-6 pt-0.5">
                      {item.orderNumber}
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectDocumentItem?.(item)}
                        className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-[#DC2626] cursor-pointer leading-snug line-clamp-2 block"
                      >
                        {item.title}
                      </button>

                      {/* Hàng link hành động nhanh */}
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onNavigateTab("overview")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          Tổng quan
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("related")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          VB liên quan
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("validity")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          Hiệu lực
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("diagram")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          Lược đồ
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("english")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          Tiếng Anh
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab("download")}
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          Tải về
                        </button>
                        <span>·</span>
                        <SaveOutlined className="text-slate-400 hover:text-slate-700 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Phải: Ban hành, Áp dụng, Hiệu lực */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:w-64 sm:text-right">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ban hành:</span>
                      <span className="font-medium text-slate-800">{item.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Áp dụng:</span>
                      <span className="font-medium text-slate-800">{item.effectiveDate}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block text-[10px]">Hiệu lực:</span>
                      {getStatusBadge(item.statusText, item.statusCode)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
