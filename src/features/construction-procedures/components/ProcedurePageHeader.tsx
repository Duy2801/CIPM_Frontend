"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";

interface ProcedurePageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack: () => void;
}

/** Đầu trang con của tab "Quy trình" (chi tiết / thêm mới): nút quay lại + tiêu đề */
export default function ProcedurePageHeader({ title, subtitle, onBack }: ProcedurePageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        intent="outline"
        scale="compact"
        icon={<ArrowLeftOutlined />}
        aria-label="Quay lại danh sách quy trình"
        onClick={onBack}
        className="h-9! w-9! shrink-0 p-0!"
      />
      <div className="min-w-0">
        <h1 className="m-0 truncate text-base font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="m-0 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
