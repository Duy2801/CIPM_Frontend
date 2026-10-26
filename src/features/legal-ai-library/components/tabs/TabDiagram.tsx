"use client";

import { useState } from "react";
import {
  DownOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import type { DetailedLegalDocument } from "../../types/legal-viewer.types";

interface TabDiagramProps {
  document: DetailedLegalDocument;
  onOpenColorGuide: () => void;
  onSelectDocumentCode?: (code: string) => void;
}

export default function TabDiagram({
  document: doc,
  onOpenColorGuide,
  onSelectDocumentCode,
}: TabDiagramProps) {
  const { message } = App.useApp();
  // Trạng thái gập/mở của các nhóm accordion
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    guidedBefore: true,
    amendedBefore: false,
    expiredBefore: false,
    stipulatedBefore: true,
    partialExpiredBefore: false,
    englishSub: false,
    basisSub: false,
    guidingAfter: false,
    amendingAfter: false,
    replacingAfter: true,
  });

  const toggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportExcel = () => {
    message.success("Đang xuất sơ đồ quan hệ văn bản ra file Excel...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header và 2 nút tác vụ trên cùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="m-0 text-base font-bold uppercase tracking-wider text-slate-900">
            LƯỢC ĐỒ
          </h2>
          <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed italic max-w-3xl">
            Lược đồ văn bản giúp bạn biết được vị trí của Văn bản đang xem trong mối quan hệ với các văn bản liên quan ban hành trước và ban hành sau, qua đó khái quát nhanh về các quy định hiện hành và các quy định ban hành trước và sau.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
          >
            <FileExcelOutlined className="text-emerald-600" />
            <span>Tải file Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <PrinterOutlined className="text-slate-600" />
            <span>In lược đồ</span>
          </button>
        </div>
      </div>

      {/* Sơ đồ 3 cột: Cột 1 (Trước) - Cột 2 (Văn bản đang xem) - Cột 3 (Sau) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ================= CỘT 1: VĂN BẢN BAN HÀNH TRƯỚC / BỊ TÁC ĐỘNG ================= */}
        <div className="space-y-3">
          {/* Nhóm 1: Văn bản được hướng dẫn (0) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("guidedBefore")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản được hướng dẫn</span>
                <span className="text-slate-500 font-semibold">(0)</span>
              </div>
              {collapsed.guidedBefore ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
          </div>

          {/* Nhóm 2: Văn bản bị sửa đổi, bổ sung (2) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("amendedBefore")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản bị sửa đổi, bổ sung</span>
                <span className="text-[#DC2626] font-bold">(2)</span>
              </div>
              {collapsed.amendedBefore ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.amendedBefore && (
              <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectDocumentCode?.("92/2015/QH13")}
                  className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer pt-1 block leading-snug"
                >
                  Bộ luật Tố tụng dân sự của Quốc hội, số 92/2015/QH13
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDocumentCode?.("58/2014/QH13")}
                  className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer pt-2 block leading-snug"
                >
                  Luật Bảo hiểm xã hội của Quốc hội, số 58/2014/QH13
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 3: Văn bản hết hiệu lực (1) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("expiredBefore")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản hết hiệu lực</span>
                <span className="text-[#DC2626] font-bold">(1)</span>
              </div>
              {collapsed.expiredBefore ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.expiredBefore && (
              <div className="p-3 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectDocumentCode?.("10/2012/QH13")}
                  className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer block leading-snug"
                >
                  Bộ luật Lao động của Quốc hội, số 10/2012/QH13
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 4: Văn bản bị quy định hết hiệu lực (0) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("stipulatedBefore")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản bị quy định hết hiệu lực</span>
                <span className="text-slate-500 font-semibold">(0)</span>
              </div>
              {collapsed.stipulatedBefore ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
          </div>

          {/* Nhóm 5: Văn bản hết hiệu lực một phần (1) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("partialExpiredBefore")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản hết hiệu lực một phần</span>
                <span className="text-[#DC2626] font-bold">(1)</span>
              </div>
              {collapsed.partialExpiredBefore ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.partialExpiredBefore && (
              <div className="p-3 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectDocumentCode?.("92/2015/QH13")}
                  className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer block leading-snug"
                >
                  Bộ luật Tố tụng dân sự của Quốc hội, số 92/2015/QH13
                </button>
              </div>
            )}
          </div>

          {/* Chú thích màu chỉ dẫn */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenColorGuide}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors shadow-2xs"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Chú thích màu chỉ dẫn</span>
            </button>
          </div>
        </div>

        {/* ================= CỘT 2: VĂN BẢN ĐANG XEM (CARD TRUNG TÂM NỔI BẬT) ================= */}
        <div className="space-y-3">
          {/* Card chính màu xanh ngọc pastel, viền teal #26A69A / #4DB6AC đặc trưng */}
          <div className="rounded-xl border-2 border-teal-500/80 bg-teal-50/50 overflow-hidden shadow-md">
            <div className="bg-teal-600 px-4 py-2.5 text-white font-bold text-xs uppercase tracking-wider text-center">
              Văn bản đang xem
            </div>

            <div className="p-4 space-y-3 text-xs">
              <h3 className="m-0 text-sm font-bold text-slate-900 text-center leading-snug">
                {doc.title}
              </h3>

              <div className="divide-y divide-teal-200/60 pt-1">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Cơ quan ban hành:</span>
                  <span className="font-bold text-slate-900">{doc.issuer}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Số hiệu:</span>
                  <span className="font-bold text-slate-900">{doc.code}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Loại văn bản:</span>
                  <span className="font-bold text-slate-900">{doc.categoryName}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Ngày ban hành:</span>
                  <span className="font-medium text-slate-900">{doc.issueDate}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Hiệu lực:</span>
                  <span className="font-bold text-slate-900">{doc.effectiveDate}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Lĩnh vực:</span>
                  <span className="font-medium text-slate-900">{doc.field}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Ngày đăng công báo:</span>
                  <span className="font-medium text-slate-900">{doc.gazetteDate}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Số công báo:</span>
                  <span className="font-medium text-slate-900">{doc.gazetteNumber}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Người ký:</span>
                  <span className="font-medium text-slate-900">{doc.signer}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600 font-medium">Ngày hết hiệu lực:</span>
                  <span className="font-medium text-slate-500 italic">{doc.expiredDate}</span>
                </div>
                <div className="py-1.5 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Tình trạng hiệu lực:</span>
                  <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                    {doc.statusText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thẻ con: Văn bản Tiếng Anh (1) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("englishSub")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản Tiếng Anh</span>
                <span className="text-[#DC2626] font-bold">(1)</span>
              </div>
              {collapsed.englishSub ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.englishSub && (
              <div className="p-3 text-xs text-slate-700 font-serif leading-relaxed">
                {doc.englishTitle}
              </div>
            )}
          </div>

          {/* Thẻ con: Văn bản căn cứ (1) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("basisSub")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản căn cứ</span>
                <span className="text-[#DC2626] font-bold">(1)</span>
              </div>
              {collapsed.basisSub ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.basisSub && (
              <div className="p-3 text-xs font-medium text-slate-800">
                Hiến pháp năm 2013 của nước Cộng hòa xã hội chủ nghĩa Việt Nam
              </div>
            )}
          </div>
        </div>

        {/* ================= CỘT 3: VĂN BẢN HƯỚNG DẪN / SỬA ĐỔI BAN HÀNH SAU ================= */}
        <div className="space-y-3">
          {/* Nhóm 1: Văn bản hướng dẫn (35) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("guidingAfter")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản hướng dẫn</span>
                <span className="text-[#DC2626] font-bold">(35)</span>
              </div>
              {collapsed.guidingAfter ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.guidingAfter && (
              <div className="p-3 space-y-2.5 text-xs divide-y divide-slate-100">
                <div className="pt-1">
                  <a href="#" className="font-medium text-slate-800 hover:text-[#DC2626] block leading-snug">
                    Nghị định 393/2026/NĐ-CP của Chính phủ quy định về người lao động nước ngoài làm việc tại Việt Nam
                  </a>
                </div>
                <div className="pt-2">
                  <a href="#" className="font-medium text-slate-800 hover:text-[#DC2626] block leading-snug">
                    Nghị định 371/2026/NĐ-CP của Chính phủ quy định chi tiết việc tuyển dụng, quản lý người lao động Việt Nam cho tổ chức nước ngoài
                  </a>
                </div>
                <div className="pt-2">
                  <a href="#" className="font-medium text-slate-800 hover:text-[#DC2626] block leading-snug">
                    Nghị định 283/2026/NĐ-CP của Chính phủ quy định xử phạt vi phạm hành chính trong lĩnh vực lao động, bảo hiểm xã hội
                  </a>
                </div>
                <div className="pt-2 text-center">
                  <span className="text-[#DC2626] font-semibold cursor-pointer hover:underline text-[11px]">
                    Xem thêm (32 văn bản khác) v
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Nhóm 2: Văn bản sửa đổi, bổ sung (3) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("amendingAfter")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản sửa đổi, bổ sung</span>
                <span className="text-[#DC2626] font-bold">(3)</span>
              </div>
              {collapsed.amendingAfter ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
            {!collapsed.amendingAfter && (
              <div className="p-3 space-y-2.5 text-xs divide-y divide-slate-100">
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("124/2025/QH15")}
                    className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer block leading-snug"
                  >
                    Luật Giáo dục nghề nghiệp của Quốc hội, số 124/2025/QH15
                  </button>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("113/2025/QH15")}
                    className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer block leading-snug"
                  >
                    Luật Dân số của Quốc hội, số 113/2025/QH15
                  </button>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectDocumentCode?.("71/2025/QH15")}
                    className="w-full text-left font-medium text-slate-800 hover:text-[#DC2626] cursor-pointer block leading-snug"
                  >
                    Luật Công nghiệp công nghệ số của Quốc hội, số 71/2025/QH15
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nhóm 3: Văn bản thay thế (0) */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggle("replacingAfter")}
              className="w-full flex items-center justify-between bg-slate-50 px-3.5 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span>Văn bản thay thế</span>
                <span className="text-slate-500 font-semibold">(0)</span>
              </div>
              {collapsed.replacingAfter ? (
                <DownOutlined className="text-[10px] text-slate-400" />
              ) : (
                <UpOutlined className="text-[10px] text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
