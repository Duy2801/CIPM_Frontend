"use client";

import { useMemo, useState } from "react";
import {
  EyeOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Progress, Table, Tag, Text } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SETTLEMENT_STEPS } from "../constants/finance-labels";
import { SectionIntro } from "@/components/workspace";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { SettlementRecord } from "../types/finance.types";
import { canActOnSettlementStep } from "../utils/finance-permissions";
import { formatVndBillions, getNextSettlementStep } from "../utils/finance-rules";
import SettlementWorkflowModal from "./SettlementWorkflowModal";

interface TreasurySettlementTabProps {
  controller: FinanceSettlementController;
}

export default function TreasurySettlementTab({ controller }: TreasurySettlementTabProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const { rolePermissions, data, visibleSettlements } = controller;

  const selectedSettlement = useMemo(
    () => data.settlements.find((item) => item.id === selectedId),
    [data.settlements, selectedId],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleSettlements.filter((settlement) => {
      const project = data.projects.find((item) => item.id === settlement.projectId);
      if (!query) return true;
      const code = project?.code?.toLowerCase() ?? "";
      const name = project?.name?.toLowerCase() ?? "";
      return code.includes(query) || name.includes(query);
    });
  }, [data.projects, search, visibleSettlements]);

  const columns: ColumnsType<SettlementRecord> = [
    {
      title: "Dự án / Mã DA",
      key: "project",
      width: "28%",
      render: (_, settlement) => {
        const project = data.projects.find((item) => item.id === settlement.projectId);
        const nextStep = getNextSettlementStep(settlement.completedSteps);
        const isMyTurn = nextStep !== null && canActOnSettlementStep(nextStep, rolePermissions);

        return (
          <div className="py-1 pr-2 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedId(settlement.id)}
              className="group block text-left w-full cursor-pointer"
            >
              <Text
                className="block text-xs font-bold leading-snug text-[#102A43] group-hover:text-[#007A78] transition-colors line-clamp-2"
                title={project?.name}
              >
                {project?.name}
              </Text>
            </button>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-slate-500">{project?.code}</span>
              {isMyTurn && (
                <Tag intent="warning" scale="sm" className="m-0 font-medium text-[10px]">
                  Đến lượt bạn
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Đã giải ngân",
      key: "disbursed",
      width: "12%",
      align: "center",
      render: (_, settlement) => (
        <span className="text-xs font-bold text-slate-800">
          {formatVndBillions(settlement.disbursedAmount)}
        </span>
      ),
    },
    {
      title: "Quyết toán duyệt",
      key: "approved",
      width: "12%",
      align: "center",
      render: (_, settlement) => (
        <span className="text-xs font-bold text-[#102A43]">
          {formatVndBillions(settlement.approvedSettlementAmount)}
        </span>
      ),
    },
    {
      title: "Chênh lệch",
      key: "difference",
      width: "11%",
      align: "center",
      render: (_, settlement) => {
        const diff = settlement.approvedSettlementAmount - settlement.disbursedAmount;
        if (diff === 0) {
          return (
            <Tag intent="success" scale="sm" className="m-0 font-semibold">
              Khớp
            </Tag>
          );
        }
        return (
          <Tag intent="danger" scale="sm" className="m-0 font-semibold">
            {formatVndBillions(diff)}
          </Tag>
        );
      },
    },
    {
      title: "Tiến độ tất toán",
      key: "progress",
      width: "14%",
      align: "center",
      render: (_, settlement) => {
        const nextStep = getNextSettlementStep(settlement.completedSteps);
        const nextStepMeta = SETTLEMENT_STEPS.find((s) => s.number === nextStep);
        const percent = settlement.completedSteps.length * 20;

        return (
          <div className="py-0.5 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 text-[11.5px] mb-0.5 leading-none">
              <span className="font-bold text-[#007A78]">{settlement.completedSteps.length}/5 bước</span>
              {nextStepMeta && (
                <span className="text-[10px] text-slate-400 truncate max-w-[85px]" title={nextStepMeta.title}>
                  · B{nextStep}
                </span>
              )}
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              size="small"
              strokeColor="#007A78"
              className="m-0 w-full max-w-[100px] [&_.ant-progress-inner]:!h-1.5"
            />
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: "11%",
      align: "center",
      render: (_, settlement) => {
        const settled = settlement.status === "SETTLED";
        return (
          <Tag
            intent={settled ? "success" : settlement.status === "IN_PROGRESS" ? "info" : "muted"}
            scale="sm"
            className="m-0 font-medium"
          >
            {settled ? "Đã tất toán" : settlement.status === "IN_PROGRESS" ? "Đang tất toán" : "Chưa bắt đầu"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "12%",
      align: "center",
      render: (_, settlement) => {
        const nextStep = getNextSettlementStep(settlement.completedSteps);
        const isMyTurn = nextStep !== null && canActOnSettlementStep(nextStep, rolePermissions);

        return (
          <div className="flex items-center justify-center gap-1.5">
            {isMyTurn ? (
              <Button
                intent="primary"
                scale="xs"
                icon={<RightOutlined className="text-xs" />}
                onClick={() => setSelectedId(settlement.id)}
                className="bg-[#007A78] hover:bg-[#006664] text-white text-xs font-semibold px-2 py-0.5 rounded shadow-xs whitespace-nowrap"
                title={`Thực hiện bước ${nextStep}`}
              >
                Bước {nextStep}
              </Button>
            ) : (
              <Button
                intent="textLink"
                scale="xs"
                icon={<EyeOutlined className="text-xs" />}
                onClick={() => setSelectedId(settlement.id)}
                className="text-xs font-semibold text-[#007A78] hover:text-[#005f5d] px-1.5 py-0.5 rounded hover:bg-teal-50 transition-colors whitespace-nowrap"
                title="Xem chi tiết hồ sơ tất toán"
              >
                Chi tiết
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
      <SectionIntro
        title="Tất toán tài khoản dự án tại KBNN"
        description="Dự án hoàn thành phải đi đủ 5 bước theo thứ tự: lập hồ sơ → đối chiếu số liệu → lệnh tất toán KBNN → hoàn trả bảo lãnh bảo hành → đóng mã dự án."
        countLabel={`${rows.length} hồ sơ`}
        readOnly={rolePermissions.settlementSteps.length === 0}
        guide="Hồ sơ có nhãn “Đến lượt bạn” là hồ sơ mà bước tiếp theo thuộc thẩm quyền của bạn. Chênh lệch khác 0 sẽ chặn bước đối chiếu."
        toolbar={
          <Flex align="center" gap="small" wrap="wrap" className="w-full">
            <Input
              allowClear
              intent="clean"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm kiếm theo mã dự án, tên dự án..."
              style={{ width: 340, maxWidth: "100%" }}
              className="text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Flex>
        }
      />

      <Table<SettlementRecord>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        size="middle"
        tableLayout="fixed"
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("button") || target.closest("input") || target.closest("select")) {
              return;
            }
            setSelectedId(record.id);
          },
          className: "cursor-pointer hover:bg-teal-50/20 transition-colors",
        })}
        pagination={{
          pageSize: 5,
          size: "small",
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
          showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} hồ sơ`,
          className: "!px-4 !py-3 !m-0",
        }}
        className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:whitespace-nowrap [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:before:!hidden [&_.ant-table-thead>tr>th]:after:!hidden [&_.ant-table-tbody>tr>td]:py-2.5 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-thead>tr>th:first-child]:!pl-5 [&_.ant-table-tbody>tr>td:first-child]:!pl-5 [&_.ant-table-thead>tr>th:last-child]:!pr-5 [&_.ant-table-tbody>tr>td:last-child]:!pr-5"
        locale={{
          emptyText: (
            <div className="py-8 text-center text-slate-500">
              <Text className="block text-xs">
                {search
                  ? `Không tìm thấy hồ sơ tất toán nào khớp với "${search}".`
                  : "Chưa có dự án nào trong phạm vi lọc cần tất toán."}
              </Text>
              {search && (
                <Button
                  intent="textLink"
                  scale="xs"
                  className="mt-2 text-xs font-semibold text-[#007A78]"
                  onClick={() => setSearch("")}
                >
                  Xóa tìm kiếm
                </Button>
              )}
            </div>
          ),
        }}
      />

      {selectedSettlement && (
        <SettlementWorkflowModal
          key={selectedSettlement.id}
          open
          settlement={selectedSettlement}
          project={data.projects.find((item) => item.id === selectedSettlement.projectId)}
          rolePermissions={rolePermissions}
          onClose={() => setSelectedId(undefined)}
          onComplete={controller.completeSettlementStep}
        />
      )}
    </Card>
  );
}
