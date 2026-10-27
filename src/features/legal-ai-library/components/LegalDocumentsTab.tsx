"use client";

import { useMemo, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
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
import CreateDocumentDrawer from "./CreateDocumentDrawer";
import DocumentDetailDrawer from "./DocumentDetailDrawer";
import LegalDocumentList from "./LegalDocumentList";
import LegalDocumentToolbar from "./LegalDocumentToolbar";
import LegalStatsChart from "./LegalStatsChart";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

/** Tab "Danh sách văn bản": thống kê hiệu lực, lọc, phân trang, thêm và xem/sửa văn bản */
export default function LegalDocumentsTab() {
  const { data: documents = [] } = useLegalDocuments();
  const canManage = useCanManageLegalDocuments();

  const [filters, setFilters] = useState<LegalDocumentFilters>(DEFAULT_LEGAL_FILTERS);
  const [page, setPage] = useState(1);
  // Văn bản thêm trong phiên làm việc — mới nhất đứng đầu, luôn hiển thị trên cùng danh sách
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const categoryKeys = useMemo(() => getCategoryKeys(documents), [documents]);
  const filtered = useMemo(
    () => filterLegalDocuments(documents, filters, recentlyAddedIds),
    [documents, filters, recentlyAddedIds],
  );

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
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <h2 className="m-0 text-base font-bold text-slate-900">Văn bản pháp luật</h2>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Luật, nghị định, thông tư, nghị quyết và quyết định áp dụng cho công tác quản lý dự án.
            </p>
          </div>
          {canManage && (
            <Button
              intent="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
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
              <div className="flex shrink-0 items-center justify-between gap-3 text-xs text-slate-500 xl:justify-end">
                <span className="whitespace-nowrap">
                  Hiển thị {pageStart + 1}–{pageStart + paged.length} / {filtered.length} văn bản
                </span>
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
          documents={paged}
          newestId={recentlyAddedIds[0]}
          canManage={canManage}
          isFiltering={isLegalFiltering(filters)}
          onResetFilters={resetFilters}
          onOpen={setSelectedId}
        />
      </Card>

      {/* Drawer xem / sửa chi tiết văn bản */}
      {selectedId && <DocumentDetailDrawer key={selectedId} documentId={selectedId} onClose={() => setSelectedId(null)} />}

      {/* Drawer thêm mới văn bản: mở lại là form trống */}
      {createOpen && (
        <CreateDocumentDrawer
          onClose={() => setCreateOpen(false)}
          onCreated={(created) => {
            setRecentlyAddedIds((prev) => [created.id, ...prev]);
            resetFilters();
            setCreateOpen(false);
          }}
        />
      )}
    </>
  );
}
