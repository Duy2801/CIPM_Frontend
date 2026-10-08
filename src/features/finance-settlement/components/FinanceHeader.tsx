"use client";

import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui";

interface FinanceHeaderProps {
  filters?: { year?: number | string };
  onOpenCreateModal?: () => void;
}

export default function FinanceHeader({ filters = { year: 2026 }, onOpenCreateModal }: FinanceHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Kế hoạch vốn, giải ngân qua KBNN và tất toán dự án hoàn thành
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo gồm kế hoạch vốn, giải ngân và tất toán niên độ <strong>{filters.year}</strong>
          </p>
        </div>
        {onOpenCreateModal && (
          <Button
            intent="primary"
            icon={<PlusOutlined />}
            onClick={onOpenCreateModal}
          >
            Lập đề nghị thanh toán
          </Button>
        )}
      </div>

      <div className="border-t border-slate-200 pt-3">
        <span className="text-xs font-semibold text-slate-600">Bộ lọc dữ liệu</span>
      </div>
    </header>
  );
}
