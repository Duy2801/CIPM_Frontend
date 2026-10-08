"use client";

import { AlertOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Card, Table, Tag, Text } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { GPMB_STEPS } from "../constants/gpmb-steps";
import type { GpmbStepDefinition } from "../constants/gpmb-steps";
import type { SiteClearanceController } from "../hooks/useSiteClearance";
import { getCurrentStep } from "../utils/gpmb-rules";

interface GpmbProcessTabProps {
  controller: SiteClearanceController;
}

export default function GpmbProcessTab({ controller }: GpmbProcessTabProps) {
  const { households } = controller;
  const countAt = (step: number) => households.filter((item) => getCurrentStep(item) === step).length;

  const columns: ColumnsType<GpmbStepDefinition> = [
    {
      title: "Bước",
      dataIndex: "number",
      width: 70,
      align: "center",
      render: (value: number) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0B2546] text-sm font-bold text-white">
          {value}
        </span>
      ),
    },
    {
      title: "Tên bước",
      key: "title",
      width: 300,
      render: (_, row) => (
        <span>
          <Text className="block text-sm font-semibold text-[#102A43]">{row.title}</Text>
          {row.requiresApproval && (
            <Tag intent="info" scale="md" icon={<SafetyCertificateOutlined />} className="mt-1">
              Cần GĐ/PGĐ duyệt
            </Tag>
          )}
          {(row.number === 14 || row.number === 15) && (
            <Text className="mt-1 block text-xs text-slate-500">
              Chỉ áp dụng với hộ {row.number === 14 ? "không đồng ý phương án" : "không bàn giao đất"}
            </Text>
          )}
        </span>
      ),
    },
    {
      title: "Thời hạn pháp lý",
      key: "legal",
      width: 160,
      render: (_, row) =>
        row.legalDays ? (
          <Tag intent={row.mandatory ? "danger" : "warning"} scale="md" icon={row.mandatory ? <AlertOutlined /> : undefined}>
            {row.legalDays} ngày{row.mandatory ? " – bắt buộc" : ""}
          </Tag>
        ) : (
          <Text className="text-[13px] text-slate-400">Không quy định</Text>
        ),
    },
    {
      title: "Biểu mẫu / sản phẩm",
      key: "output",
      width: 260,
      render: (_, row) => (
        <span>
          <Text className="block text-[13px] text-slate-700">{row.output}</Text>
          {row.forms && <Text className="block text-xs font-semibold text-teal-800">{row.forms}</Text>}
        </span>
      ),
    },
    {
      title: "Số hộ đang ở bước này",
      key: "count",
      width: 150,
      align: "center",
      render: (_, row) => {
        const count = countAt(row.number);
        return (
          <Text className={`text-lg font-black ${count > 0 ? "text-[#0F4C81]" : "text-slate-300"}`}>{count}</Text>
        );
      },
    },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100">
      <SectionIntro
        title="Quy trình 16 bước và biểu mẫu chuẩn"
        description="Theo Phụ lục I kèm Công văn Sở NN&MT tỉnh Kiên Giang. Các bước có thời hạn bắt buộc sẽ cảnh báo đỏ ngay khi vượt hạn."
        guide="Bước có biểu mẫu phải đính kèm file trước khi hoàn thành. Bước 12 (chi trả) chỉ làm được khi bước 9 đã được duyệt."
      />
      <Table
        rowKey="number"
        columns={columns}
        dataSource={GPMB_STEPS}
        size="middle"
        pagination={false}
        scroll={{ x: 940 }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600"
      />
    </Card>
  );
}
