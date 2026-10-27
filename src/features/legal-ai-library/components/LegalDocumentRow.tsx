"use client";

import { EditOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "@/components/ui";
import { formatDateVi } from "@/utils/date";
import { STATUS_META, getCategoryLabel } from "../constants/legal-labels";
import type { LegalDocument } from "../types/legal-ai.types";

interface LegalDocumentRowProps {
  document: LegalDocument;
  /** Văn bản vừa thêm gần nhất: tô nổi + nhãn "Mới thêm" */
  isNewest: boolean;
  /** Hiện cột thao tác (nút sửa) */
  canManage: boolean;
  onOpen: () => void;
}

/** Một dòng văn bản: số hiệu · loại · tên · ngày ban hành/hiệu lực · tình trạng · sửa */
export default function LegalDocumentRow({ document: item, isNewest, canManage, onOpen }: LegalDocumentRowProps) {
  const status = STATUS_META[item.status];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết ${item.title ? `${item.code} – ${item.title}` : item.code}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-all focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#DC2626]/40 md:flex-row md:items-center md:gap-4 ${
        isNewest
          ? "bg-amber-50/70 border-l-4 border-l-[#DC2626] hover:bg-amber-100/70 shadow-2xs"
          : "hover:bg-slate-50/80 focus-visible:bg-slate-50 border-l-4 border-l-transparent"
      }`}
    >
      {/* Số hiệu · cơ quan ban hành */}
      <div className="flex shrink-0 flex-col items-start gap-1 text-xs md:w-28">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-800">{item.code}</span>
          {isNewest && (
            <span className="inline-flex items-center rounded bg-[#DC2626] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-2xs">
              Mới thêm
            </span>
          )}
        </div>
        <span className="text-slate-500">{item.issuer}</span>
      </div>

      {/* Loại văn bản */}
      <div className="shrink-0 md:w-24">
        <span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {getCategoryLabel(item.category)}
        </span>
      </div>

      {/* Tên văn bản */}
      <p
        title={item.title || item.code}
        className="m-0 line-clamp-2 min-w-0 flex-1 text-sm font-normal leading-snug text-slate-800 transition-colors group-hover:text-[#DC2626]"
      >
        {item.title || item.code}
      </p>

      {/* Ngày ban hành (trên) · Ngày hiệu lực (dưới) */}
      <div className="flex shrink-0 flex-col items-start gap-0.5 text-xs md:w-28 md:items-center md:text-center">
        <span className="font-medium tabular-nums text-slate-800" title={`Ngày ban hành: ${formatDateVi(item.issueDate)}`}>
          <span className="text-slate-400 md:hidden">Ban hành: </span>
          {formatDateVi(item.issueDate)}
        </span>
        <span className="text-[11px] tabular-nums text-slate-500" title={`Ngày hiệu lực: ${formatDateVi(item.effectiveDate)}`}>
          <span className="text-slate-400 md:hidden">Hiệu lực: </span>
          {formatDateVi(item.effectiveDate)}
        </span>
      </div>

      {/* Tình trạng văn bản */}
      <div className="flex shrink-0 items-center justify-start md:w-20 md:justify-center">
        <Tooltip title={`Tình trạng: ${status.label}`}>
          <div className="inline-flex cursor-help items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 md:border-0 md:bg-transparent md:p-0">
            <span
              className={`inline-block h-3 w-3 rounded-full ${status.dotClass} shadow-xs ring-4 ring-slate-100`}
              aria-label={status.label}
            />
            <span className="text-xs font-medium text-slate-600 md:hidden">{status.label}</span>
          </div>
        </Tooltip>
      </div>

      {/* Thao tác: sửa (mở drawer chi tiết, sửa từng trường bằng bút chì) */}
      {canManage && (
        <div
          className="flex shrink-0 items-center justify-center md:ml-auto md:w-12"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Tooltip title="Chỉnh sửa thông tin văn bản">
            <Button
              intent="outline"
              scale="compact"
              icon={<EditOutlined />}
              aria-label={`Chỉnh sửa ${item.code}`}
              onClick={onOpen}
              className="!h-7 !w-7 !p-0 !border-[#DC2626] !text-[#DC2626] hover:!bg-red-50/60"
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}
