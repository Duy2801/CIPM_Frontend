"use client";

import { useMemo, useState } from "react";
import { App } from "antd";
import { BranchesOutlined, DeleteOutlined, EditOutlined, FolderAddOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Tag, Tooltip } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";
import type { ProcedureLibraryItem } from "../utils/procedure-library";

interface ProcedureListViewProps {
  procedures: ProcedureLibraryItem[];
  onOpen: (procedureId: string) => void;
  onCreate: () => void;
  onDelete: (procedure: ProcedureLibraryItem) => void;
}

/** "2026-10-22" → "22/10/2026"; null → null */
const formatDate = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

/** ISO → "22/10/2026" theo giờ máy */
const formatLocalDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** Ô trống (null) hiện gạch ngang nhạt */
const EMPTY = <span className="text-slate-300">—</span>;

/** Danh sách quy trình: tìm theo tên / tổ phụ trách, bấm dòng hoặc "Chi tiết" để xem các bước */
export default function ProcedureListView({ procedures, onOpen, onCreate, onDelete }: ProcedureListViewProps) {
  const { modal } = App.useApp();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const key = normalizeSearchText(search.trim());
    if (!key) return procedures;
    return procedures.filter((p) => normalizeSearchText(`${p.name} ${p.department ?? ""}`).includes(key));
  }, [procedures, search]);

  const confirmDelete = (procedure: ProcedureLibraryItem) =>
    modal.confirm({
      centered: true,
      width: 440,
      title: "Xóa quy trình?",
      content: (
        <p className="m-0 text-xs leading-relaxed text-slate-600">
          Quy trình <strong className="text-slate-800">{procedure.name}</strong> sẽ bị xóa khỏi danh sách. Các dự án đang áp
          dụng vẫn giữ nguyên các bước đã cấu hình.
        </p>
      ),
      okText: "Xóa quy trình",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => onDelete(procedure),
    });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Thanh công cụ: tìm kiếm | thêm quy trình */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <Input
          allowClear
          intent="clean"
          aria-label="Tìm quy trình"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm tên quy trình hoặc tổ phụ trách..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full text-sm sm:max-w-md"
        />
        <Button
          intent="primary"
          scale="compact"
          icon={<FolderAddOutlined />}
          onClick={onCreate}
          className="h-9 shrink-0 bg-[#DC2626] border-[#DC2626] text-xs font-semibold text-white hover:bg-[#B91C1C]"
        >
          Thêm quy trình mới
        </Button>
      </div>

      {/* Bảng quy trình */}
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="min-w-[1100px]">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <div className="min-w-0 flex-1">Tên quy trình</div>
            <div className="w-40 shrink-0">Tổ phụ trách</div>
            <div className="w-28 shrink-0 text-center">Số bước</div>
            <div className="w-32 shrink-0">Người tạo</div>
            <div className="w-24 shrink-0 text-center">Ngày tạo</div>
            <div className="w-32 shrink-0 text-center">Cập nhật lần cuối</div>
            <div className="w-24 shrink-0 text-center">Thao tác</div>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-slate-400">
              {search.trim() ? "Không tìm thấy quy trình phù hợp với từ khóa." : "Chưa có quy trình nào. Bấm \"Thêm quy trình mới\" để bắt đầu."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((procedure) => {
                return (
                  <div
                    key={procedure.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(procedure.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onOpen(procedure.id);
                    }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-red-50/40"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <BranchesOutlined className="shrink-0 text-[#DC2626]" />
                      <span className="truncate text-sm font-semibold text-slate-900" title={procedure.name}>
                        {procedure.name}
                      </span>
                      <Tag intent="subtle" scale="sm" className="shrink-0">
                        {procedure.isCustom ? "Tự tạo" : "Mẫu"}
                      </Tag>
                    </div>
                    <div className="w-40 shrink-0 truncate text-slate-700" title={procedure.department}>
                      {procedure.department || EMPTY}
                    </div>
                    <div className="w-28 shrink-0 text-center font-semibold text-slate-900">{procedure.steps.length} bước</div>
                    <div className="w-32 shrink-0 truncate text-slate-700" title={procedure.createdBy ?? undefined}>
                      {procedure.createdBy || EMPTY}
                    </div>
                    <div className="w-24 shrink-0 text-center tabular-nums text-slate-600">
                      {formatDate(procedure.createdAt) ?? EMPTY}
                    </div>
                    <div className="w-32 shrink-0 text-center tabular-nums text-slate-600">
                      {formatLocalDate(procedure.updatedAt) ?? EMPTY}
                    </div>
                    <div className="flex w-24 shrink-0 items-center justify-center gap-1.5">
                      <Tooltip title="Chỉnh sửa quy trình">
                        {/* Cùng kiểu nút bút chì với Thư viện pháp lý */}
                        <Button
                          intent="outline"
                          scale="compact"
                          icon={<EditOutlined />}
                          aria-label={`Chỉnh sửa ${procedure.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen(procedure.id);
                          }}
                          className="!h-7 !w-7 !p-0 !border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60"
                        />
                      </Tooltip>
                      <Tooltip title="Xóa quy trình">
                        <button
                          type="button"
                          aria-label={`Xóa ${procedure.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(procedure);
                          }}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-2xs transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
