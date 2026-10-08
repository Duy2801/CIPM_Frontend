"use client";

import { useMemo, useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { formatDateVi } from "@/utils/date";
import { CATEGORY_LABELS, STATUS_META } from "../constants/legal-mock-data";
import type {
  LegalDocument,
  LegalDocumentCategory,
  LegalAiPermissions,
} from "../types/legal-ai.types";

interface LegalDocumentTabProps {
  documents: LegalDocument[];
  permissions: LegalAiPermissions;
  onOpenDetail: (doc: LegalDocument) => void;
  onOpenCreate: () => void;
  onOpenEdit: (doc: LegalDocument) => void;
  onOpenAssistant: () => void;
}

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS: { value: LegalDocumentCategory; label: string }[] = [
  { value: "ALL", label: "Tất cả văn bản & biểu mẫu" },
  { value: "LAW", label: "Luật (Quốc hội)" },
  { value: "DECREE", label: "Nghị định (Chính phủ)" },
  { value: "CIRCULAR", label: "Thông tư (Bộ ngành)" },
  { value: "LOCAL", label: "Văn bản Kiên Giang" },
  { value: "TEMPLATE", label: "Biểu mẫu chuẩn (BQL)" },
];

export default function LegalDocumentTab({
  documents,
  permissions,
  onOpenDetail,
  onOpenCreate,
  onOpenEdit,
  onOpenAssistant,
}: LegalDocumentTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LegalDocumentCategory>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchCategory =
        categoryFilter === "ALL" || doc.category === categoryFilter;
      if (!matchCategory) return false;

      if (!q) return true;
      return (
        doc.code.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.issuer.toLowerCase().includes(q) ||
        doc.scope.toLowerCase().includes(q) ||
        doc.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [categoryFilter, documents, search]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, safeCurrentPage]);

  const handleDownload = (doc: LegalDocument) => {
    const fileName = `${doc.code.replace(/[\/\\?%*:|"<>]/g, "_")}_${doc.title.slice(0, 30)}.txt`;
    const element = window.document.createElement("a");
    const file = new Blob(
      [
        `VĂN BẢN PHÁP LÝ / BIỂU MẪU BAN QUẢN LÝ DỰ ÁN HÀ TIÊN\n\n` +
          `Số hiệu: ${doc.code}\n` +
          `Trích yếu: ${doc.title}\n` +
          `Phân loại: ${CATEGORY_LABELS[doc.category]}\n` +
          `Cơ quan ban hành: ${doc.issuer}\n` +
          `Ngày ban hành: ${doc.issueDate} - Ngày hiệu lực: ${doc.effectiveDate}\n` +
          `Phạm vi áp dụng: ${doc.scope}\n\n` +
          `TÓM TẮT NỘI DUNG & HƯỚNG DẪN ÁP DỤNG:\n${doc.summary}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  const columns: ColumnsType<LegalDocument> = [
    {
      title: "Số hiệu & Trích yếu văn bản",
      key: "docInfo",
      width: "42%",
      render: (_, row) => {
        return (
          <div className="py-1">
            <div className="flex items-center gap-2">
              {row.fileType === "PDF" ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-rose-50 text-rose-600">
                  <FilePdfOutlined className="text-xs" />
                </span>
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <FileWordOutlined className="text-xs" />
                </span>
              )}

              <span className="text-left text-xs font-bold text-slate-900 transition-colors group-hover:text-teal-700">
                {row.code}
              </span>

              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {row.fileSize}
              </span>
            </div>

            <div className="mt-1 line-clamp-2 text-xs font-medium text-slate-700 leading-snug">
              {row.title}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {row.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0.2 text-[10px] text-slate-600"
                >
                  #{tag}
                </span>
              ))}
              {row.tags.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{row.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Cơ quan & Phân hệ áp dụng",
      key: "issuerScope",
      width: "25%",
      render: (_, row) => (
        <div className="py-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
              {CATEGORY_LABELS[row.category].split("(")[0].trim()}
            </span>
          </div>
          <div className="mt-1 text-xs font-medium text-slate-800">
            {row.issuer}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1" title={row.scope}>
            {row.scope}
          </div>
        </div>
      ),
    },
    {
      title: "Hiệu lực & Ngày ban hành",
      key: "effective",
      width: "18%",
      render: (_, row) => {
        const meta = STATUS_META[row.status];
        return (
          <div className="py-1">
            <span
              className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}
            >
              {meta.label}
            </span>
            <div className="mt-1.5 text-xs text-slate-600">
              Ban hành: <span className="font-medium text-slate-800">{formatDateVi(row.issueDate)}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Hiệu lực: <span className="font-medium text-emerald-700">{formatDateVi(row.effectiveDate)}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "15%",
      render: (_, row) => (
        <div className="flex items-center gap-1.5 py-1">
          <Tooltip title="Xem chi tiết & Tóm tắt pháp lý">
            <Button
              scale="xs"
              intent="ghost"
              icon={<EyeOutlined />}
              onClick={() => onOpenDetail(row)}
              className="text-slate-600 hover:text-teal-700"
            />
          </Tooltip>

          <Tooltip title={`Tải tập tin ${row.fileType}`}>
            <Button
              scale="xs"
              intent="ghost"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(row)}
              className="text-teal-700 hover:text-teal-800"
            />
          </Tooltip>

          {permissions.canEditDocument && (
            <Tooltip title="Chỉnh sửa văn bản">
              <Button
                scale="xs"
                intent="ghost"
                icon={<EditOutlined />}
                onClick={() => onOpenEdit(row)}
                className="text-slate-600 hover:text-teal-700"
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      surface="flat"
      padding="none"
      rounded="lg"
      className="overflow-hidden border-slate-200 shadow-xs"
    >
      <SectionIntro
        title="Danh mục văn bản quy phạm pháp lý & Biểu mẫu chuẩn"
        description="Tra cứu Luật, Nghị định, Thông tư, Quyết định UBND Kiên Giang và các biểu mẫu 01-09 phục vụ nghiệp vụ BQL Hà Tiên."
        countLabel={`${filteredRows.length} văn bản / biểu mẫu`}
        readOnly={!permissions.canCreateDocument}
        guide="Toàn bộ văn bản đã được số hóa và chuẩn hóa dữ liệu đầu vào cho Trợ lý AI pháp lý."
        actions={
          <div className="flex items-center gap-2">
            <Button
              intent="outline"
              scale="sm"
              icon={<TagOutlined className="text-teal-700" />}
              onClick={onOpenAssistant}
              className="!border-teal-600 !text-teal-800 hover:!bg-teal-50 h-8 text-xs font-semibold rounded-lg"
            >
              Hỏi Trợ lý AI Pháp lý
            </Button>

            {permissions.canCreateDocument && (
              <Button
                intent="primary"
                scale="sm"
                icon={<PlusOutlined />}
                onClick={onOpenCreate}
                className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white h-8 text-xs font-semibold rounded-lg shadow-xs"
              >
                Thêm văn bản / biểu mẫu
              </Button>
            )}
          </div>
        }
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            {/* Search và Category Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-64 sm:w-80">
                <Input
                  allowClear
                  intent="clean"
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  placeholder="Tìm số hiệu, từ khóa, tên văn bản, cơ quan..."
                  className="w-full text-xs h-8"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select
                aria-label="Lọc theo nhóm văn bản"
                value={categoryFilter}
                className="w-56 sm:w-60 h-8 text-xs [&_.ant-select-selector]:!rounded-lg"
                options={CATEGORY_OPTIONS}
                onChange={(val) => {
                  setCategoryFilter(val as LegalDocumentCategory);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Phân trang đặt cùng hàng bên phải */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <Text className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Hiển thị {filteredRows.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(safeCurrentPage * PAGE_SIZE, filteredRows.length)} trong tổng số{" "}
                {filteredRows.length} văn bản
              </Text>
              <Pagination
                size="small"
                current={safeCurrentPage}
                pageSize={PAGE_SIZE}
                total={filteredRows.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                hideOnSinglePage={false}
                className="!m-0"
              />
            </div>
          </div>
        }
      />

      <Table<LegalDocument>
        rowKey="id"
        columns={columns}
        dataSource={paginatedRows}
        pagination={false}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a") ||
              target.closest("input") ||
              target.closest(".ant-btn") ||
              target.closest(".ant-dropdown") ||
              target.closest(".ant-popconfirm") ||
              target.closest(".ant-select")
            ) {
              return;
            }
            onOpenDetail(record);
          },
          className: "cursor-pointer hover:bg-slate-50/70 transition-colors group",
        })}
        className="w-full border-t border-slate-200"
      />
    </Card>
  );
}
