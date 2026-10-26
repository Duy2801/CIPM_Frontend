"use client";

import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Divider, Input } from "@/components/ui";

interface StaffFormAddOptionProps {
  placeholder: string;
  loading?: boolean;
  /** Tên đã có trong danh sách → khóa nút "Thêm" */
  isDuplicate: (name: string) => boolean;
  /** Trả về true khi thêm thành công để xóa ô nhập */
  onAdd: (name: string) => Promise<boolean>;
}

/** Ô nhập tên mới ngay cuối danh sách chọn: gõ rồi bấm "Thêm" (hoặc Enter) */
export default function StaffFormAddOption({ placeholder, loading, isDuplicate, onAdd }: StaffFormAddOptionProps) {
  const [value, setValue] = useState("");
  const query = value.trim();
  const canAdd = Boolean(query) && !isDuplicate(query);

  const submit = async () => {
    if (await onAdd(value)) setValue("");
  };

  return (
    <>
      <Divider style={{ margin: "6px 0" }} />
      <div className="flex items-center gap-2 px-2 pb-1.5">
        <Input
          size="small"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // Không để phím gõ trong ô này điều khiển danh sách chọn
            e.stopPropagation();
            if (e.key === "Enter" && canAdd) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-xs"
        />
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          disabled={!canAdd}
          loading={loading}
          onClick={submit}
          className="text-xs"
        >
          Thêm
        </Button>
      </div>
    </>
  );
}
