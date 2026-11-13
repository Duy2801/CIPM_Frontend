"use client";

import { useState } from "react";
import { Button, Divider, Input } from "@/components/ui";

interface DropdownAddOptionProps {
  placeholder: string;
  loading?: boolean;
  isDuplicate: (name: string) => boolean;
  onAdd: (name: string) => Promise<boolean>;
}

export default function DropdownAddOption({ placeholder, loading, isDuplicate, onAdd }: DropdownAddOptionProps) {
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
