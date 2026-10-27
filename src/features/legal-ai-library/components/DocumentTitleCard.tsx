"use client";

import { useState } from "react";
import { EditOutlined, FileTextOutlined } from "@ant-design/icons";
import { Input } from "@/components/ui";

interface DocumentTitleCardProps {
  title: string;
  /** Ghi tên mới vào bản nháp; không truyền = chỉ xem */
  onChange?: (title: string) => void;
}

/** Thẻ "Tên văn bản / Trích yếu nội dung" ở đầu drawer: bấm vào để sửa */
export default function DocumentTitleCard({ title, onChange }: DocumentTitleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const canStartEdit = Boolean(onChange) && !isEditing;

  return (
    <div
      onClick={() => canStartEdit && setIsEditing(true)}
      className={`rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/50 p-4 shadow-2xs transition-all ${
        canStartEdit ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50/80" : ""
      }`}
      title={canStartEdit ? "Nhấp để chỉnh sửa tên văn bản" : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <FileTextOutlined className="text-[#DC2626]" />
          Tên văn bản / Trích yếu nội dung
        </span>
        {onChange && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-400 shadow-2xs"
            title="Nhấp để sửa tên văn bản"
          >
            <EditOutlined className="text-[11px]" />
          </span>
        )}
      </div>
      {isEditing ? (
        <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
          <Input.TextArea
            autoFocus
            rows={3}
            value={title}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={() => setIsEditing(false)}
            placeholder="Nhập tên / trích yếu văn bản..."
            className="text-sm font-normal text-slate-800"
          />
        </div>
      ) : (
        <span className="text-sm font-normal text-slate-700 leading-relaxed block">
          {title || <span className="italic text-slate-400">Chưa có tên văn bản</span>}
        </span>
      )}
    </div>
  );
}
