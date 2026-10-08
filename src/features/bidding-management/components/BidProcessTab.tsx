"use client";

import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Card, Table, Tag, Text } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SectionIntro } from "@/components/workspace";
import { BID_STEPS } from "../constants/bidding-steps";
import type { BidStepDefinition } from "../constants/bidding-steps";
import type { BiddingController } from "../hooks/useBiddingManagement";
import { getCurrentBidStep } from "../utils/bidding-rules";

export default function BidProcessTab({ controller }: { controller: BiddingController }) {
  const countAt = (step: number) => controller.packages.filter((pkg) => getCurrentBidStep(pkg) === step).length;

  const columns: ColumnsType<BidStepDefinition> = [
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
              GĐ / PGĐ phê duyệt
            </Tag>
          )}
        </span>
      ),
    },
    { title: "Thời gian", dataIndex: "duration", width: 150, render: (value: string) => <Text className="text-[13px]">{value}</Text> },
    { title: "Kết quả đầu ra", dataIndex: "output", width: 280, render: (value: string) => <Text className="text-[13px] text-slate-700">{value}</Text> },
    {
      title: "Số gói đang ở bước này",
      key: "count",
      width: 150,
      align: "center",
      render: (_, row) => {
        const count = countAt(row.number);
        return <Text className={`text-lg font-black ${count ? "text-[#0F4C81]" : "text-slate-300"}`}>{count}</Text>;
      },
    },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100">
      <SectionIntro
        title="Quy trình 9 bước lựa chọn nhà thầu"
        description="Theo Luật Đấu thầu số 22/2023/QH15. Thông báo mời thầu đăng trên Hệ thống mạng đấu thầu quốc gia (muasamcong.mpi.gov.vn)."
        guide="Hạn nộp hồ sơ dự thầu còn ≤ 7 ngày: cảnh báo cam; ≤ 3 ngày: cảnh báo đỏ. Hợp đồng phải ký trong 30 ngày sau quyết định kết quả."
      />
      <Table
        rowKey="number"
        columns={columns}
        dataSource={BID_STEPS}
        size="middle"
        pagination={false}
        scroll={{ x: 950 }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600"
      />
    </Card>
  );
}
