"use client";

import type { ReactNode } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Select } from "@/components/ui";
import { STATUS_META, STATUS_ORDER, getCategoryLabel } from "../constants/legal-labels";
import type { DocumentCategoryKey } from "../types/legal-ai.types";
import type { LegalDocumentFilters } from "../utils/legal-document-filters";

interface LegalDocumentToolbarProps {
  filters: LegalDocumentFilters;
  onChange: (filters: LegalDocumentFilters) => void;
  categoryKeys: DocumentCategoryKey[];
  /** Phân trang nằm bên phải thanh lọc */
  pagination?: ReactNode;
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả tình trạng" },
  ...STATUS_ORDER.map((st) => ({ value: st, label: STATUS_META[st].label })),
];

/** Thanh lọc văn bản: tìm kiếm · loại văn bản · tình trạng | phân trang */
export default function LegalDocumentToolbar({ filters, onChange, categoryKeys, pagination }: LegalDocumentToolbarProps) {
  const update = (patch: Partial<LegalDocumentFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 pb-3.5 pt-3 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          allowClear
          intent="clean"
          aria-label="Tìm văn bản"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm số hiệu, tên, cơ quan ban hành, từ khóa..."
          className="h-9 w-full text-sm sm:max-w-md sm:flex-1"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
        <Select
          aria-label="Lọc theo loại văn bản"
          value={filters.category}
          onChange={(category) => update({ category })}
          className="h-9 w-full sm:w-52"
          options={[
            { value: "ALL", label: "Tất cả loại văn bản" },
            ...categoryKeys.map((cat) => ({ value: cat, label: getCategoryLabel(cat) })),
          ]}
        />
        <Select
          aria-label="Lọc theo tình trạng"
          value={filters.status}
          onChange={(status) => update({ status: status as LegalDocumentFilters["status"] })}
          className="h-9 w-full sm:w-52"
          options={STATUS_FILTER_OPTIONS}
        />
      </div>
      {pagination}
    </div>
  );
}
