"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Select } from "@/components/ui";
import { normalizeSearchText } from "@/utils/search-text";

interface SelectWithAddOptionProps {
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /** Thêm lựa chọn mới (tên đã cắt khoảng trắng) */
  onAdd: (name: string) => void;
  addPlaceholder: string;
  /** Ô nhập cuối danh sách đồng thời lọc các lựa chọn đang có */
  filterByQuery?: boolean;
  placeholder?: string;
  notFoundContent?: ReactNode;
  /** Ô nhỏ (dùng trong dòng bảng) */
  size?: "small" | "middle";
  "aria-label"?: string;
}

/** Ô chọn có thêm ô nhập ở cuối danh sách: gõ tên mới rồi bấm "Thêm" (hoặc Enter) */
export default function SelectWithAddOption({
  value,
  options,
  onChange,
  onAdd,
  addPlaceholder,
  filterByQuery,
  placeholder,
  notFoundContent,
  size,
  "aria-label": ariaLabel,
}: SelectWithAddOptionProps) {
  const [query, setQuery] = useState("");
  const name = query.trim();
  const key = normalizeSearchText(name);
  // Tên đã có trong danh sách → khóa nút "Thêm"
  const canAdd = Boolean(name) && !options.some((opt) => normalizeSearchText(opt.label) === key);

  const visibleOptions = useMemo(
    () => (filterByQuery && key ? options.filter((opt) => normalizeSearchText(opt.label).includes(key)) : options),
    [filterByQuery, key, options],
  );

  const add = () => {
    if (!canAdd) return;
    onAdd(name);
    setQuery("");
  };

  return (
    <Select
      aria-label={ariaLabel}
      size={size}
      placeholder={placeholder}
      value={value}
      options={visibleOptions}
      onChange={(next) => {
        onChange(next);
        setQuery("");
      }}
      notFoundContent={notFoundContent}
      className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: "6px 0" }} />
          <div className="flex items-center gap-2 px-2 pb-1.5" onMouseDown={(e) => e.stopPropagation()}>
            <Input
              intent="clean"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Không để phím gõ trong ô này điều khiển danh sách chọn
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder={addPlaceholder}
              className="h-7 flex-1 text-xs"
            />
            <Button
              htmlType="button"
              intent="primary"
              scale="xs"
              icon={<PlusOutlined />}
              disabled={!canAdd}
              onClick={add}
              className="text-xs"
            >
              Thêm
            </Button>
          </div>
        </>
      )}
    />
  );
}
