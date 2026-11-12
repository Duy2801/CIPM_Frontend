"use client";

import { Button } from "@/components/ui";

export default function ProjectSaveBar({
  changeCount,
  onDiscard,
  onSave,
}: {
  changeCount: number;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <span className="mr-auto text-xs text-slate-600">
        Có <strong className="text-slate-900">{changeCount}</strong> thay đổi chưa lưu
      </span>
      <Button intent="outline" scale="sm" onClick={onDiscard} className="px-5">
        Hủy thay đổi
      </Button>
      <Button
        intent="primary"
        scale="sm"
        onClick={onSave}
        className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] px-5 font-semibold"
      >
        Lưu thay đổi
      </Button>
    </div>
  );
}
