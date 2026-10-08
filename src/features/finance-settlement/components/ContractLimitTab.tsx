"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Flex,
  Input,
  Progress,
  Table,
  Tag,
  Text,
  Tooltip,
} from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { FilterChip, SectionIntro } from "@/components/workspace";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { DisbursementPrefill } from "../types/finance.types";
import { formatVndBillions, getContractUsagePercent } from "../utils/finance-rules";

interface ContractLimitTabProps {
  controller: FinanceSettlementController;
  onCreateDisbursementForContract: (prefill: DisbursementPrefill) => void;
}

type ContractFilter = "ALL" | "WARNING";

export default function ContractLimitTab({
  controller,
  onCreateDisbursementForContract,
}: ContractLimitTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContractFilter>("ALL");
  const { rolePermissions, data, filters } = controller;

  const scopedContracts = useMemo(
    () => data.contracts
      .filter((contract) => filters.projectId === "ALL" || contract.projectId === filters.projectId)
      .map((contract) => ({
        ...contract,
        project: data.projects.find((item) => item.id === contract.projectId),
        usage: getContractUsagePercent(contract.disbursed, contract.value),
        remaining: Math.max(0, contract.value - contract.disbursed),
      })),
    [data.contracts, data.projects, filters.projectId],
  );

  const warningCount = scopedContracts.filter((item) => item.usage.isWarning).length;

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedContracts
      .filter((contract) => filter === "ALL" || contract.usage.isWarning)
      .filter((contract) =>
        !query ||
        [contract.code, contract.contractor, contract.project?.name].some((value) =>
          value?.toLowerCase().includes(query),
        ))
      .sort((a, b) => b.usage.percent - a.usage.percent);
  }, [filter, scopedContracts, search]);

  const columns: ColumnsType<(typeof rows)[number]> = [
    {
      title: "Hợp đồng / Dự án",
      key: "contract",
      width: 260,
      render: (_, row) => (
        <section className="py-0.5">
          <Text className="block text-xs font-bold text-[#007A78]">{row.code}</Text>
          <Text className="mt-0.5 block line-clamp-2 text-xs font-semibold leading-5 text-[#102A43]">
            {row.project?.name}
          </Text>
        </section>
      ),
    },
    {
      title: "Nhà thầu",
      dataIndex: "contractor",
      width: 210,
      render: (value: string) => <Text className="text-xs font-medium text-slate-800">{value}</Text>,
    },
    {
      title: "Giá trị HĐ",
      dataIndex: "value",
      width: 120,
      align: "right",
      render: (value: number) => (
        <Text className="text-xs font-semibold text-slate-800">{formatVndBillions(value)}</Text>
      ),
    },
    {
      title: "Đã giải ngân",
      dataIndex: "disbursed",
      width: 120,
      align: "right",
      render: (value: number) => (
        <Text className="text-xs font-semibold text-emerald-700">{formatVndBillions(value)}</Text>
      ),
    },
    {
      title: "Còn được thanh toán",
      dataIndex: "remaining",
      width: 140,
      align: "right",
      render: (value: number) => (
        <Text className={`text-sm font-black ${value > 0 ? "text-[#102A43]" : "text-slate-400"}`}>
          {formatVndBillions(value)}
        </Text>
      ),
    },
    {
      title: "Mức sử dụng hợp đồng",
      key: "usage",
      width: 200,
      render: (_, row) => (
        <section className="py-0.5">
          <Flex justify="space-between" align="center">
            {row.usage.isWarning ? (
              <Tag intent="warning" scale="sm" icon={<WarningOutlined />} className="m-0">
                Chạm ngưỡng 95%
              </Tag>
            ) : (
              <Tag intent="success" scale="sm" icon={<CheckCircleOutlined />} className="m-0">
                An toàn
              </Tag>
            )}
            <Text className={`text-xs font-bold ${row.usage.isWarning ? "text-amber-700" : "text-teal-800"}`}>
              {row.usage.percent}%
            </Text>
          </Flex>
          <Progress
            percent={Math.min(100, row.usage.percent)}
            showInfo={false}
            size="small"
            strokeColor={row.usage.isWarning ? "#E09F3E" : "#007A78"}
          />
        </section>
      ),
    },
  ];

  if (rolePermissions.canCreateDisbursement) {
    columns.push({
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_, row) => (
        <Tooltip title={row.remaining <= 0 ? "Hợp đồng đã giải ngân đủ giá trị" : undefined}>
          <Button
            intent="outline"
            scale="compact"
            icon={<PlusOutlined />}
            disabled={row.remaining <= 0}
            onClick={() => onCreateDisbursementForContract({ projectId: row.projectId, contractId: row.id })}
          >
            Lập đề nghị
          </Button>
        </Tooltip>
      ),
    });
  }

  const chips: { key: ContractFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả", count: scopedContracts.length },
    { key: "WARNING", label: "Chạm ngưỡng 95%", count: warningCount },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100">
      <SectionIntro
        title="Hợp đồng & hạn mức thanh toán"
        description="Tổng giải ngân không được vượt giá trị hợp đồng. Hệ thống cảnh báo khi một hợp đồng đã giải ngân từ 95% trở lên."
        countLabel={`${rows.length} hợp đồng`}
        readOnly={rolePermissions.isReadOnly}
        guide="Hợp đồng có mức sử dụng cao nhất nằm trên cùng. Cột “Còn được thanh toán” là số tiền tối đa cho đợt đề nghị tiếp theo."
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap="small">
            <Flex gap={6} role="group" aria-label="Lọc hợp đồng">
              {chips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  active={filter === chip.key}
                  count={chip.count}
                  onClick={() => setFilter(chip.key)}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </Flex>
            <Input
              allowClear
              intent="clean"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm số hợp đồng, nhà thầu, dự án..."
              className="w-full sm:w-80"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Flex>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        size="middle"
        tableLayout="fixed"
        scroll={{ x: 1150 }}
        pagination={false}
        rowClassName={(row) => (row.usage.isWarning ? "[&>td]:!bg-amber-50/40" : "")}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-3"
        locale={{
          emptyText: (
            <Text className="block py-8 text-center text-xs text-slate-500">
              Không có hợp đồng phù hợp với bộ lọc hiện tại.
            </Text>
          ),
        }}
      />
    </Card>
  );
}
