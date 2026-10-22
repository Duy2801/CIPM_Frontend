"use client";

import { useRef, useState, type ReactNode } from "react";
import { FormOutlined } from "@ant-design/icons";
import { Input, Select, Tooltip } from "@/components/ui";

type EditorConfig =
  | { kind: "text"; placeholder?: string }
  | { kind: "date" }
  | { kind: "select"; options: { value: string; label: string }[] };

interface InlineEditFieldProps {
  label: string;
  /** Thay cho nhãn mặc định (vd. tiêu đề khối có icon) */
  labelNode?: ReactNode;
  /** Cho phép lưu giá trị rỗng */
  allowEmpty?: boolean;
  /** Trường đã sửa nhưng chưa bấm "Lưu thay đổi" */
  changed?: boolean;
  /** Giá trị đang hiển thị (đã định dạng, có thể kèm icon) */
  display: ReactNode;
  /** Giá trị thô đưa vào ô sửa */
  value: string;
  editor: EditorConfig;
  /** Không truyền = chỉ xem, không có nút bút chì */
  onSave?: (next: string) => void;
  /** Trả về thông báo lỗi nếu giá trị không hợp lệ */
  validate?: (next: string) => string | undefined;
  className?: string;
}

/** Một trường thông tin: bấm bút chì để sửa riêng trường đó; Enter / bấm ra ngoài là nhận, Esc là hủy */
export default function InlineEditField({
  label,
  labelNode,
  allowEmpty = false,
  changed = false,
  display,
  value,
  editor,
  onSave,
  validate,
  className,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();
  // Đã nhận / hủy rồi thì bỏ qua sự kiện blur đến sau (ô nhập vừa bị gỡ)
  const closedRef = useRef(false);

  const startEdit = () => {
    closedRef.current = false;
    setDraft(value);
    setError(undefined);
    setEditing(true);
  };
  const cancel = () => {
    closedRef.current = true;
    setEditing(false);
    setError(undefined);
  };
  const commit = (raw: string) => {
    if (closedRef.current) return;
    const next = raw.trim();
    const message =
      !next && !allowEmpty
        ? `Vui lòng nhập ${label.toLowerCase()}.`
        : validate?.(next);
    if (message) {
      setError(message);
      return;
    }
    closedRef.current = true;
    if (next !== value) onSave?.(next);
    setEditing(false);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      cancel();
    }
  };

  return (
    <div className={`group min-w-0 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        {labelNode ?? (
          <span className="text-[11px] font-medium text-slate-500">
            {label}
          </span>
        )}
        {changed && (
          <span className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">
            Đã sửa
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-1">
          {editor.kind === "select" ? (
            <Select
              autoFocus
              defaultOpen
              size="small"
              value={draft}
              options={editor.options}
              // Chọn xong là nhận luôn; đóng danh sách mà không chọn thì thôi
              onChange={(val) => commit(String(val))}
              onBlur={cancel}
              onKeyDown={(e) => e.key === "Escape" && cancel()}
              className="w-full text-xs"
              popupMatchSelectWidth={false}
            />
          ) : (
            <Input
              autoFocus
              size="small"
              type={editor.kind === "date" ? "date" : "text"}
              value={draft}
              placeholder={
                editor.kind === "text" ? editor.placeholder : undefined
              }
              onChange={(e) => {
                setDraft(e.target.value);
                setError(undefined);
              }}
              onKeyDown={onKeyDown}
              onBlur={() => commit(draft)}
              status={error ? "error" : undefined}
              className="w-full text-xs"
            />
          )}
          {error && (
            <p className="m-0 mt-1 text-[11px] text-rose-600">{error}</p>
          )}
        </div>
      ) : (
        // Bút chì nằm ngay bên phải giá trị, luôn hiện để dễ thấy
        <div className="mt-0.5 flex items-center gap-2">
          <div className="min-w-0 text-xs font-semibold text-slate-900">
            {display}
          </div>
          {onSave && (
            <Tooltip title={`Sửa ${label.toLowerCase()}`}>
              <button
                type="button"
                aria-label={`Sửa ${label.toLowerCase()}`}
                onClick={startEdit}
                className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white p-0 text-xs text-slate-500 shadow-2xs transition-colors hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626] focus-visible:border-[#DC2626]/40 focus-visible:text-[#DC2626]"
              >
                <FormOutlined />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
