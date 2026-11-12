"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";
import { SortIcon } from "@/features/projects_works/components/list/ProjectsTableHeaders";
import type { LegalDocument } from "../types/legal-ai.types";
import LegalDocumentRow from "./LegalDocumentRow";

export type LegalDateSortKey = "issueDate" | "effectiveDate";
export type LegalDateSort = { key: LegalDateSortKey; dir: "asc" | "desc" } | null;

function SortHeader({
  label,
  sortKey,
  sort,
  onSortChange,
}: {
  label: string;
  sortKey: LegalDateSortKey;
  sort: LegalDateSort;
  onSortChange: (sort: LegalDateSort) => void;
}) {
  const direction = sort?.key === sortKey ? sort.dir : null;
  const next: LegalDateSort =
    direction === null ? { key: sortKey, dir: "desc" } : direction === "desc" ? { key: sortKey, dir: "asc" } : null;
  return (
    <button
      type="button"
      onClick={() => onSortChange(next)}
      title={
        direction === "desc"
          ? `${label}: mới nhất trước. Bấm để xếp cũ nhất trước`
          : direction === "asc"
            ? `${label}: cũ nhất trước. Bấm để bỏ sắp xếp`
            : `Sắp xếp theo ${label.toLowerCase()}`
      }
      className={`group/col inline-flex w-28 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded border-0 bg-transparent p-0 font-semibold uppercase tracking-wide ${
        direction ? "text-[#DC2626]" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
      <SortIcon direction={direction} />
    </button>
  );
}

interface LegalDocumentListProps {
  sort: LegalDateSort;
  onSortChange: (sort: LegalDateSort) => void;
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
  sort,
  onSortChange,
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
        className="hidden items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500 md:flex"
      >
        <span className="w-28 shrink-0">Số hiệu</span>
        <span className="w-24 shrink-0">Loại văn bản</span>
        <span className="min-w-0 flex-1">Tên văn bản</span>
        <SortHeader label="Ngày ban hành" sortKey="issueDate" sort={sort} onSortChange={onSortChange} />
        <SortHeader label="Ngày hiệu lực" sortKey="effectiveDate" sort={sort} onSortChange={onSortChange} />
        <span className="w-24 shrink-0 whitespace-nowrap text-center">Tình trạng</span>
        {canManage && <span className="ml-auto w-20 shrink-0 whitespace-nowrap text-center">Thao tác</span>}
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
