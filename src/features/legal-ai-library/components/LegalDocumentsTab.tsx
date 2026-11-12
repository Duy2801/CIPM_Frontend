"use client";

import { useMemo, useState } from "react";

import { Button, Card, DEFAULT_LIST_PAGE_SIZE, Pagination } from "@/components/ui";
import { useCanManageLegalDocuments } from "../hooks/useLegalAccess";
import { useLegalDocuments } from "../hooks/useLegalQueries";
import {
  DEFAULT_LEGAL_FILTERS,
  filterLegalDocuments,
  getCategoryKeys,
  isLegalFiltering,
  type LegalDocumentFilters,
} from "../utils/legal-document-filters";
import LegalDocumentList, { type LegalDateSort } from "./LegalDocumentList";
import LegalDocumentToolbar from "./LegalDocumentToolbar";
import LegalStatsChart from "./LegalStatsChart";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Tab "Danh sách văn bản": thống kê hiệu lực, lọc, phân trang, thêm văn bản; bấm văn bản để mở trang chi tiết */
export default function LegalDocumentsTab({
  onOpen,
  onCreate,
  createdIds,
}: {
  onOpen: (documentId: string) => void;
  onCreate: () => void;
  createdIds: string[];
}) {
  const { data: documents = [] } = useLegalDocuments();
  const canManage = useCanManageLegalDocuments();

  const [filters, setFilters] = useState<LegalDocumentFilters>(DEFAULT_LEGAL_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<LegalDateSort>(null);
  const recentlyAddedIds = createdIds;
  const [seenCreatedId, setSeenCreatedId] = useState(createdIds[0]);
  if (seenCreatedId !== createdIds[0]) {
    setSeenCreatedId(createdIds[0]);
    setFilters(DEFAULT_LEGAL_FILTERS);
    setPage(1);
  }

  const categoryKeys = useMemo(() => getCategoryKeys(documents), [documents]);
  const filtered = useMemo(() => {
    const list = filterLegalDocuments(documents, filters, recentlyAddedIds);
    if (!sort) return list;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = a[sort.key] || "";
      const y = b[sort.key] || "";
      if (!x || !y) return x ? -1 : y ? 1 : 0;
      return x.localeCompare(y) * sign;
    });
  }, [documents, filters, recentlyAddedIds, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const changeFilters = (next: LegalDocumentFilters) => {
    setFilters(next);
    setPage(1);
  };
  const resetFilters = () => changeFilters(DEFAULT_LEGAL_FILTERS);

  return (
    <>
      {/* Biểu đồ thống kê tình trạng hiệu lực của toàn thư viện */}
      <LegalStatsChart documents={documents} />

      <Card
        surface="flat"
        padding="none"
        rounded="lg"
        className="overflow-hidden border border-slate-200 shadow-xs bg-white"
      >
        {/* Hàng 1: tiêu đề · thêm văn bản */}
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <h2 className="m-0 text-base font-bold text-slate-900">Văn bản pháp luật</h2>
          </div>
          {canManage && (
            <Button
              intent="primary"
              onClick={onCreate}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white h-9 shrink-0 text-sm font-semibold shadow-2xs"
            >
              Thêm văn bản
            </Button>
          )}
        </div>

        {/* Hàng 2: tìm kiếm · lọc loại văn bản · lọc tình trạng | phân trang */}
        <LegalDocumentToolbar
          filters={filters}
          onChange={changeFilters}
          categoryKeys={categoryKeys}
          pagination={
            filtered.length > 0 && (
              <div className="flex shrink-0 items-center justify-end gap-3 text-xs text-slate-500">
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  onChange={setPage}
                  showSizeChanger={false}
                  size="small"
                />
              </div>
            )
          }
        />

        <LegalDocumentList
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
          documents={paged}
          newestId={recentlyAddedIds[0]}
          canManage={canManage}
          isFiltering={isLegalFiltering(filters)}
          onResetFilters={resetFilters}
          onOpen={onOpen}
        />
      </Card>
    </>
  );
}
