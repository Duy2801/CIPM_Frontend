"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";
import type { LegalDocument } from "../types/legal-ai.types";
import LegalDocumentRow from "./LegalDocumentRow";

interface LegalDocumentListProps {
  documents: LegalDocument[];
  /** Mã văn bản vừa thêm gần nhất (tô nổi) */
  newestId?: string;
  canManage: boolean;
  isFiltering: boolean;
  onResetFilters: () => void;
  onOpen: (documentId: string) => void;
}

/** Danh sách văn bản (không gom nhóm) kèm tiêu đề cột; trống thì gợi ý bỏ bớt bộ lọc */
export default function LegalDocumentList({
  documents,
  newestId,
  canManage,
  isFiltering,
  onResetFilters,
  onOpen,
}: LegalDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
        <SearchOutlined className="mb-2 text-2xl text-slate-300" />
        <p className="m-0 text-sm font-semibold text-slate-700">Không tìm thấy văn bản phù hợp</p>
        <p className="m-0 mt-1 text-xs text-slate-500">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
        {isFiltering && (
          <Button intent="outline" scale="compact" className="mt-3" onClick={onResetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Tiêu đề cột — khớp độ rộng với từng dòng bên dưới */}
      <div
        aria-hidden
        className="hidden items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:flex"
      >
        <span className="w-28 shrink-0">Số hiệu</span>
        <span className="w-24 shrink-0">Loại văn bản</span>
        <span className="min-w-0 flex-1">Tên văn bản</span>
        <div className="w-28 shrink-0 text-center leading-tight">
          <div className="whitespace-nowrap">Ngày ban hành</div>
          <div className="whitespace-nowrap text-[10px] font-medium text-slate-400">Ngày hiệu lực</div>
        </div>
        <span className="w-20 shrink-0 text-center">Tình trạng</span>
        {canManage && <span className="ml-auto w-12 shrink-0 text-center">Thao tác</span>}
      </div>
      <ol className="m-0 list-none divide-y divide-slate-100 p-0">
        {documents.map((doc) => (
          <li key={doc.id}>
            <LegalDocumentRow
              document={doc}
              isNewest={doc.id === newestId}
              canManage={canManage}
              onOpen={() => onOpen(doc.id)}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
