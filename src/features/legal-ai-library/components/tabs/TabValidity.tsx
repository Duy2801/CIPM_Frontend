"use client";

import { useState } from "react";
import {
  DownOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  UpOutlined,
} from "@ant-design/icons";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabValidityProps {
  document: DetailedLegalDocument;
  onNavigateTab: (tabKey: any) => void;
  onOpenColorGuide: () => void;
  onSelectDocumentCode?: (code: string) => void;
}

export default function TabValidity({
  document: doc,
  onNavigateTab,
  onOpenColorGuide,
  onSelectDocumentCode,
}: TabValidityProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    partialExpired: true,
    amending: true,
    replaced: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Lời giải thích */}
      <div>
        <h2 className="m-0 text-base font-bold uppercase tracking-wider text-slate-900">
          HIỆU LỰC
        </h2>
        <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed italic">
          Giúp người xem biết được ngày ban hành, ngày có hiệu lực, ngày hết hiệu lực, trạng thái hiệu lực của Văn bản đang xem và những văn bản sửa đổi, bổ sung, thay thế... văn bản này, hoặc bị văn bản này sửa đổi, bổ sung, thay thế...
        </p>
      </div>

      {/* Thông tin văn bản đang xem */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="m-0 text-sm font-bold text-slate-900">{doc.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => onNavigateTab("overview")}
                className="hover:text-[#DC2626] hover:underline cursor-pointer"
              >
                Tổng quan
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigateTab("related")}
                className="hover:text-[#DC2626] hover:underline cursor-pointer"
              >
                VB liên quan
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigateTab("validity")}
                className="font-bold text-[#DC2626] cursor-pointer"
              >
                Hiệu lực
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigateTab("diagram")}
                className="hover:text-[#DC2626] hover:underline cursor-pointer"
              >
                Lược đồ
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigateTab("english")}
                className="hover:text-[#DC2626] hover:underline cursor-pointer"
              >
                Tiếng Anh
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onNavigateTab("download")}
                className="hover:text-[#DC2626] hover:underline cursor-pointer"
              >
                Tải về
              </button>
              <span>·</span>
              <SaveOutlined className="text-slate-400 hover:text-slate-700 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Ban hành:</span>
              <span className="font-semibold text-slate-800">{doc.issueDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Áp dụng:</span>
              <span className="font-semibold text-slate-800">{doc.effectiveDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[11px]">Hiệu lực:</span>
              <span className="font-bold text-amber-700">{doc.statusText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Khối HIỆU LỰC LIÊN QUAN */}
      <div className="space-y-4">
        <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-800">
          HIỆU LỰC LIÊN QUAN
        </h3>

        {/* Nhóm 1: Văn bản quy định hết hiệu lực một phần */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection("partialExpired")}
            className="w-full flex items-center justify-between bg-slate-50/90 px-4 py-3 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>Văn bản quy định hết hiệu lực một phần</span>
              <span className="text-[#DC2626] font-bold">(1)</span>
            </div>
            {openSections.partialExpired ? (
              <UpOutlined className="text-xs text-slate-400" />
            ) : (
              <DownOutlined className="text-xs text-slate-400" />
            )}
          </button>

          {openSections.partialExpired && (
            <div className="p-4 divide-y divide-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("41/2024/QH15")}
                    className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-[#DC2626] cursor-pointer"
                  >
                    Luật Bảo hiểm xã hội của Quốc hội, số 41/2024/QH15
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="hover:text-[#DC2626] cursor-pointer">Tổng quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">VB liên quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Hiệu lực</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Lược đồ</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Tiếng Anh</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Tải về</span>
                    <span>·</span>
                    <SaveOutlined className="text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ban hành:</span>
                    <span className="font-medium text-slate-800">29/06/2024</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Áp dụng:</span>
                    <span className="font-medium text-slate-800">01/07/2025</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[11px]">Hiệu lực:</span>
                    <span className="font-semibold text-amber-700">Hết hiệu lực một phần</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nhóm 2: Văn bản sửa đổi, bổ sung */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection("amending")}
            className="w-full flex items-center justify-between bg-slate-50/90 px-4 py-3 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>Văn bản sửa đổi, bổ sung</span>
              <span className="text-[#DC2626] font-bold">(3)</span>
            </div>
            {openSections.amending ? (
              <UpOutlined className="text-xs text-slate-400" />
            ) : (
              <DownOutlined className="text-xs text-slate-400" />
            )}
          </button>

          {openSections.amending && (
            <div className="p-4 divide-y divide-slate-100 space-y-2">
              {/* Item 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("71/2025/QH15")}
                    className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-[#DC2626] cursor-pointer"
                  >
                    Luật Công nghiệp công nghệ số của Quốc hội, số 71/2025/QH15
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="hover:text-[#DC2626] cursor-pointer">Tổng quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">VB liên quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Hiệu lực</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Lược đồ</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Tải về</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ban hành:</span>
                    <span className="font-medium text-slate-800">14/06/2025</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Áp dụng:</span>
                    <span className="font-medium text-slate-800">01/01/2026</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hiệu lực:</span>
                    <span className="font-semibold text-amber-700">Hết hiệu lực một phần</span>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("113/2025/QH15")}
                    className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-[#DC2626] cursor-pointer"
                  >
                    Luật Dân số của Quốc hội, số 113/2025/QH15
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="hover:text-[#DC2626] cursor-pointer">Tổng quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">VB liên quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Hiệu lực</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Lược đồ</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Tải về</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ban hành:</span>
                    <span className="font-medium text-slate-800">10/12/2025</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Áp dụng:</span>
                    <span className="font-medium text-slate-800">01/07/2026</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hiệu lực:</span>
                    <span className="font-semibold text-emerald-700">Còn hiệu lực</span>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("124/2025/QH15")}
                    className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-[#DC2626] cursor-pointer"
                  >
                    Luật Giáo dục nghề nghiệp của Quốc hội, số 124/2025/QH15
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="hover:text-[#DC2626] cursor-pointer">Tổng quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">VB liên quan</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Hiệu lực</span>
                    <span>·</span>
                    <span className="hover:text-[#DC2626] cursor-pointer">Tải về</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ban hành:</span>
                    <span className="font-medium text-slate-800">20/11/2025</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Áp dụng:</span>
                    <span className="font-medium text-slate-800">01/07/2026</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hiệu lực:</span>
                    <span className="font-semibold text-emerald-700">Còn hiệu lực</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nhóm 3: Văn bản thay thế */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs opacity-80">
          <button
            type="button"
            onClick={() => toggleSection("replaced")}
            className="w-full flex items-center justify-between bg-slate-50 px-4 py-3 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>Văn bản thay thế</span>
              <span className="text-slate-500 font-bold">(0)</span>
            </div>
            {openSections.replaced ? (
              <UpOutlined className="text-xs text-slate-400" />
            ) : (
              <DownOutlined className="text-xs text-slate-400" />
            )}
          </button>
          {openSections.replaced && (
            <div className="p-4 text-xs text-slate-500 italic">
              Hiện chưa có văn bản thay thế hoàn toàn {doc.shortTitle}.
            </div>
          )}
        </div>
      </div>

      {/* Nút Chú thích màu chỉ dẫn */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onOpenColorGuide}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 transition-colors shadow-2xs"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Chú thích màu chỉ dẫn tình trạng hiệu lực</span>
        </button>
      </div>
    </div>
  );
}
