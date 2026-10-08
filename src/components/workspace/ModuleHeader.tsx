"use client";

import type { ReactNode } from "react";
import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { Card, Flex, Tag, Text } from "@/components/ui";

interface ModuleHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  roleTitle: string;
  isReadOnly?: boolean;
  /** Nút thao tác chính của vai trò (ẩn hẳn khi vai trò không có quyền) */
  actions?: ReactNode;
  /** Các ô lọc áp dụng cho toàn trang */
  filters?: ReactNode;
  /** Thông tin phụ hiển thị cuối thanh lọc */
  filterSummary?: ReactNode;
}

export default function ModuleHeader({
  icon,
  title,
  subtitle,
  roleTitle,
  isReadOnly,
  actions,
  filters,
  filterSummary,
}: ModuleHeaderProps) {
  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200/90 bg-white shadow-xs">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-xl text-[#007A78]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-lg font-bold tracking-tight text-[#102A43]">{title}</h1>
              <Tag intent="brand" scale="md" className="m-0 font-semibold">{roleTitle}</Tag>
              {isReadOnly && (
                <Tag intent="muted" scale="md" icon={<EyeOutlined />} className="m-0">
                  Chế độ chỉ xem
                </Tag>
              )}
            </div>
            <Text className="mt-0.5 block text-[13px] text-slate-500">{subtitle}</Text>
          </div>
        </div>
        {actions && <Flex gap="small" wrap="wrap">{actions}</Flex>}
      </div>

      {filters && (
        <div className="flex flex-col gap-2.5 border-t border-slate-200 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center">
          <Text className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-slate-600">
            <FilterOutlined /> Bộ lọc dữ liệu
          </Text>
          <Flex gap="small" wrap="wrap" align="center" className="flex-1">
            {filters}
          </Flex>
          {filterSummary && <Text className="text-xs text-slate-500">{filterSummary}</Text>}
        </div>
      )}
    </Card>
  );
}
