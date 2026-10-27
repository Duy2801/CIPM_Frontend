"use client";

import { useState, type ReactNode } from "react";
import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "@/components/ui";

/** Độ rộng cột nhãn / giá trị theo nửa trái, nửa phải của bảng */
const SIDE_WIDTHS = {
  left: { label: "w-[18%]", value: "w-[30%]" },
  right: { label: "w-[24%]", value: "w-[28%]" },
};

export type CellEditorRender = (props: { autoFocus: boolean; onDone: () => void }) => ReactNode;

interface DocumentInfoCellProps {
  label: string;
  infoTooltip?: string;
  side: keyof typeof SIDE_WIDTHS;
  changed?: boolean;
  display: ReactNode;
  /** Ô nhập khi đang sửa; không truyền = chỉ xem */
  editor?: CellEditorRender;
}

/** Cặp ô "nhãn | giá trị" trong bảng thông tin văn bản: bấm vào giá trị để sửa tại chỗ */
export default function DocumentInfoCell({ label, infoTooltip, side, changed, display, editor }: DocumentInfoCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const widths = SIDE_WIDTHS[side];
  const canEdit = Boolean(editor);

  return (
    <>
      <td
        className={`${widths.label} border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] font-semibold text-slate-600 align-middle select-none`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}:</span>
          {infoTooltip && (
            <Tooltip title={infoTooltip}>
              <InfoCircleOutlined className="text-slate-400 text-[11px] cursor-help hover:text-slate-600 transition-colors" />
            </Tooltip>
          )}
        </div>
      </td>
      <td
        onClick={() => canEdit && setIsEditing(true)}
        className={`${widths.value} border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] text-slate-900 align-middle transition-colors ${
          !isEditing && canEdit ? "group cursor-pointer hover:bg-amber-50/30 hover:border-amber-300" : ""
        }`}
        title={!isEditing && canEdit ? `Nhấp để chỉnh sửa ${label.toLowerCase()}` : undefined}
      >
        <div className="flex items-center justify-between gap-1.5 min-h-[22px]">
          <div className="min-w-0 flex-1">
            {isEditing && editor ? (
              <div onClick={(e) => e.stopPropagation()}>
                {editor({ autoFocus: true, onDone: () => setIsEditing(false) })}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 font-medium">{display}</div>
                {canEdit && (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200/80 bg-slate-50 text-slate-400 shadow-2xs transition-all group-hover:border-[#DC2626]/50 group-hover:bg-red-50 group-hover:text-[#DC2626]"
                    title={`Nhấp để sửa ${label.toLowerCase()}`}
                  >
                    <EditOutlined className="text-[11px]" />
                  </span>
                )}
              </div>
            )}
          </div>
          {changed && !isEditing && (
            <span className="rounded bg-amber-100 px-1 py-px text-[9px] font-semibold text-amber-800 shrink-0 ml-1.5">
              Đã sửa
            </span>
          )}
        </div>
      </td>
    </>
  );
}
