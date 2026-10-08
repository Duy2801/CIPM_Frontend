"use client";

import type { ReactNode } from "react";
import { BulbOutlined, EyeOutlined } from "@ant-design/icons";
import { Flex, Tag, Text } from "@/components/ui";

interface SectionIntroProps {
  title: string;
  description: string;
  countLabel?: string;
  /** Gợi ý cách đọc bảng, hiển thị dưới mô tả */
  guide?: string;
  readOnly?: boolean;
  actions?: ReactNode;
  /** Thanh công cụ (tìm kiếm, lọc) nằm dưới phần tiêu đề */
  toolbar?: ReactNode;
}

export default function SectionIntro({
  title,
  description,
  countLabel,
  guide,
  readOnly,
  actions,
  toolbar,
}: SectionIntroProps) {
  return (
    <header className="border-b border-slate-100 px-5 py-4">
      <Flex justify="space-between" align="start" wrap="wrap" gap="middle">
        <section className="min-w-0 flex-1">
          <Flex align="center" gap="small" wrap="wrap">
            <Text className="text-base font-bold text-[#102A43]">{title}</Text>
            {countLabel && (
              <Tag intent="subtle" scale="sm" className="m-0 font-semibold">
                {countLabel}
              </Tag>
            )}
            {readOnly && (
              <Tag intent="muted" scale="sm" icon={<EyeOutlined />} className="m-0">
                Chỉ xem
              </Tag>
            )}
          </Flex>
          <Text className="mt-1 block text-[13px] leading-5 text-slate-500">{description}</Text>
          {guide && (
            <Text className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-teal-800">
              <BulbOutlined className="mt-1 shrink-0" />
              <span>{guide}</span>
            </Text>
          )}
        </section>
        {actions && <Flex gap="small" wrap="wrap">{actions}</Flex>}
      </Flex>
      {toolbar && <div className="mt-3">{toolbar}</div>}
    </header>
  );
}
