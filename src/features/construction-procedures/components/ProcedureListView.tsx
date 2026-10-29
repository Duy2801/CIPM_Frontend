"use client";

import { useMemo, useState } from "react";
import { BranchesOutlined, EditOutlined, FolderAddOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Switch, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { normalizeSearchText } from "@/utils/search-text";
import {
  PROCEDURE_STATUS_LABELS,
  type ProcedureLibraryItem,
  type ProcedureStatus,
} from "../utils/procedure-library";
import { getProcedureDays } from "../utils/procedure-progress";

interface ProcedureListViewProps {
  procedures: ProcedureLibraryItem[];
  onOpen: (procedureId: string) => void;
  onCreate: () => void;
  onToggle: (procedure: ProcedureLibraryItem, enabled: boolean) => void;
}

const STATUS_STYLES: Record<ProcedureStatus, string> = {
  APPLIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  PENDING_APPROVAL: "border-amber-200 bg-amber-50 text-amber-700",
  STOPPED: "border-slate-200 bg-slate-100 text-slate-500",
};

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
export default function ProcedureListView({ procedures, onOpen, onCreate, onToggle }: ProcedureListViewProps) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const key = normalizeSearchText(search.trim());
    if (!key) return procedures;
    return procedures.filter((p) => normalizeSearchText(`${p.name} ${p.department ?? ""}`).includes(key));
  }, [procedures, search]);

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
        <div className="min-w-[1080px]">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <div className="min-w-0 flex-1">Tên quy trình</div>
            <div className="w-36 shrink-0 text-center">Số ngày hoàn thành</div>
            <div className="w-24 shrink-0 text-center">Trạng thái</div>
            <div className="w-28 shrink-0">Người tạo</div>
            <div className="w-28 shrink-0">Người duyệt</div>
            <div className="w-24 shrink-0 text-center">Ngày tạo</div>
            <div className="w-24 shrink-0 text-center">Ngày cập nhật</div>
            <div className="w-20 shrink-0 text-center">Thao tác</div>
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
                    <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                      <BranchesOutlined className="shrink-0 text-[#DC2626]" />
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900" title={procedure.name}>
                        {procedure.name}
                      </span>
                    </div>
                    {/* Tổng thời gian cả quy trình: bước song song tính theo bước lâu nhất */}
                    <div className="w-36 shrink-0 text-center tabular-nums text-slate-700">
                      {getProcedureDays(procedure.steps)} ngày
                    </div>
                    <div className="flex w-24 shrink-0 justify-center">
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          STATUS_STYLES[procedure.status],
                        )}
                      >
                        {PROCEDURE_STATUS_LABELS[procedure.status]}
                      </span>
                    </div>
                    <div className="w-28 shrink-0 truncate text-slate-700" title={procedure.createdBy ?? undefined}>
                      {procedure.createdBy || EMPTY}
                    </div>
                    <div className="w-28 shrink-0 truncate text-slate-700" title={procedure.approvedBy ?? undefined}>
                      {procedure.approvedBy || EMPTY}
                    </div>
                    <div className="w-24 shrink-0 text-center tabular-nums text-slate-600">
                      {formatDate(procedure.createdAt) ?? EMPTY}
                    </div>
                    <div className="w-24 shrink-0 text-center tabular-nums text-slate-600">
                      {/* Chưa cập nhật lần nào thì lấy ngày tạo */}
                      {formatLocalDate(procedure.updatedAt) ?? formatDate(procedure.createdAt) ?? EMPTY}
                    </div>
                    <div className="flex w-20 shrink-0 items-center justify-center gap-2">
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
                      <Tooltip title={procedure.enabled ? "Tắt quy trình" : "Bật quy trình"}>
                        {/* Chặn click lan ra dòng (dòng bấm vào là mở chi tiết) */}
                        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <Switch
                            size="small"
                            checked={procedure.enabled}
                            aria-label={`${procedure.enabled ? "Tắt" : "Bật"} ${procedure.name}`}
                            onChange={(checked) => onToggle(procedure, checked)}
                            className={cn(procedure.enabled && "!bg-[#DC2626]")}
                          />
                        </span>
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
