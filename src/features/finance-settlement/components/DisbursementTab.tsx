"use client";

import { useMemo, useState } from "react";
import {
  AlertOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Table, Tag, Text, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { ReasonModal, SectionIntro } from "@/components/workspace";
import { APPROVAL_STATUS_META, STATUS_FILTER_ORDER } from "../constants/finance-labels";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { Disbursement, DisbursementStatusFilter } from "../types/finance.types";
import { formatVndBillions, getContractUsagePercent, getWorkingDaysUntil } from "../utils/finance-rules";
import DisbursementActions from "./DisbursementActions";
import DisbursementDetailDrawer from "./DisbursementDetailDrawer";

interface DisbursementTabProps {
  controller: FinanceSettlementController;
  statusFilter: DisbursementStatusFilter;
  onStatusFilterChange: (status: DisbursementStatusFilter) => void;
  onEditDisbursement: (disbursement: Disbursement) => void;
  onCreateDisbursement?: () => void;
}

const STATUS_PRIORITY: Record<Disbursement["status"], number> = {
  REJECTED: 1,
  PENDING_CHIEF: 2,
  PENDING_DIRECTOR: 3,
  DRAFT: 4,
  APPROVED: 5,
};

export default function DisbursementTab({
  controller,
  statusFilter,
  onStatusFilterChange,
  onEditDisbursement,
  onCreateDisbursement,
}: DisbursementTabProps) {
  const [search, setSearch] = useState("");
  const [rejectModalItem, setRejectModalItem] = useState<Disbursement | null>(null);
  const [detailId, setDetailId] = useState<string>();

  const { rolePermissions, data } = controller;
  const { actionStatus } = rolePermissions;

  const findProject = (id: string) => data.projects.find((item) => item.id === id);
  const findContract = (id?: string) => data.contracts.find((item) => item.id === id);
  const detailItem = controller.visibleDisbursements.find((item) => item.id === detailId);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<DisbursementStatusFilter, number>> = {
      ALL: controller.visibleDisbursements.length,
    };
    controller.visibleDisbursements.forEach((item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    });
    return counts;
  }, [controller.visibleDisbursements]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return controller.visibleDisbursements
      .filter((item) => {
        if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
        if (!query) return true;
        const project = data.projects.find((entry) => entry.id === item.projectId);
        return [item.code, item.payee, item.content, project?.name].some((value) =>
          value?.toLowerCase().includes(query),
        );
      })
      .sort((a, b) => {
        // Hồ sơ đến lượt người đang đăng nhập luôn nằm trên cùng
        const aMine = a.status === actionStatus ? 0 : 1;
        const bMine = b.status === actionStatus ? 0 : 1;
        if (aMine !== bMine) return aMine - bMine;
        if (a.status !== b.status) return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [actionStatus, controller.visibleDisbursements, data.projects, search, statusFilter]);

  const handleExportCSV = () => {
    const headers = ["Mã hồ sơ", "Dự án", "Bên nhận", "Nội dung", "Số tiền (VNĐ)", "Hạn thanh toán", "Trạng thái"];
    const csvRows = rows.map((r) => [
      `"${r.code}"`,
      `"${findProject(r.projectId)?.name ?? ""}"`,
      `"${r.payee.replace(/"/g, '""')}"`,
      `"${r.content.replace(/"/g, '""')}"`,
      r.amount,
      r.dueDate,
      `"${r.status}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `danh_sach_giai_ngan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnsType<Disbursement> = [
    {
      title: "Hồ sơ / Dự án",
      key: "project",
      width: 230,
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setDetailId(row.id)}
          className="group block w-full cursor-pointer text-left"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-[#007A78] group-hover:underline">{row.code}</span>
            {row.status === actionStatus && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Đến lượt bạn" />
            )}
            <RightOutlined className="text-[10px] text-slate-400" />
          </span>
          <span className="block truncate text-[13px] text-slate-600">{findProject(row.projectId)?.name}</span>
        </button>
      ),
    },
    {
      title: "Bên nhận & nội dung",
      key: "payee",
      width: 250,
      render: (_, row) => (
        <span className="block">
          <Text className="block truncate text-[13px] font-semibold text-slate-800">{row.payee}</Text>
          <Tooltip title={row.content}>
            <Text className="block truncate text-xs text-slate-500">{row.content}</Text>
          </Tooltip>
        </span>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      width: 120,
      align: "center",
      render: (value: number, row) => {
        const contract = findContract(row.contractId);
        const usage = contract ? getContractUsagePercent(contract.disbursed, contract.value) : undefined;
        return (
          <span className="inline-flex items-center justify-center gap-1">
            {usage?.isWarning && (
              <Tooltip title={`Hợp đồng ${contract?.code} đã giải ngân ${usage.percent}% – chạm ngưỡng 95%`}>
                <WarningOutlined className="text-amber-600" />
              </Tooltip>
            )}
            <Text className="text-[15px] font-black text-[#102A43]">{formatVndBillions(value)}</Text>
          </span>
        );
      },
    },
    {
      title: "Hạn thanh toán",
      dataIndex: "dueDate",
      width: 130,
      align: "center",
      render: (value: string, row) => {
        const isPending = row.status === "PENDING_CHIEF" || row.status === "PENDING_DIRECTOR";
        const days = isPending ? getWorkingDaysUntil(value) : undefined;
        return (
          <span className="block text-center">
            <Text className="block text-[13px] text-slate-700">{new Date(value).toLocaleDateString("vi-VN")}</Text>
            {days !== undefined && days < 0 && (
              <Text className="block text-xs font-semibold text-rose-700">
                <AlertOutlined /> Quá hạn {Math.abs(days)} ngày
              </Text>
            )}
            {days !== undefined && days >= 0 && days <= 5 && (
              <Text className="block text-xs font-semibold text-amber-700">
                <ClockCircleOutlined /> Còn {days} ngày
              </Text>
            )}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 155,
      align: "center",
      render: (value: Disbursement["status"], row) => (
        <span className="flex flex-col items-center">
          <Tooltip title={APPROVAL_STATUS_META[value].hint}>
            <Tag intent={APPROVAL_STATUS_META[value].intent} scale="md" className="m-0 whitespace-nowrap font-medium">
              {APPROVAL_STATUS_META[value].label}
            </Tag>
          </Tooltip>
          {value === "REJECTED" && row.rejectionReason && (
            <Button intent="textLink" className="mt-0.5 block text-xs" onClick={() => setDetailId(row.id)}>
              Xem lý do trả lại
            </Button>
          )}
        </span>
      ),
    },
  ];

  if (!rolePermissions.isReadOnly) {
    columns.push({
      title: "Thao tác",
      key: "action",
      width: 235,
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center">
          <DisbursementActions
            disbursement={row}
            rolePermissions={rolePermissions}
            project={findProject(row.projectId)}
            contract={findContract(row.contractId)}
            onApprove={controller.approveDisbursement}
            onReject={setRejectModalItem}
            onEdit={onEditDisbursement}
          />
        </div>
      ),
    });
  }

  const statusOptions = [
    { value: "ALL", label: `Tất cả trạng thái (${statusCounts.ALL ?? 0})` },
    ...STATUS_FILTER_ORDER.map((key) => ({
      value: key,
      label: `${APPROVAL_STATUS_META[key].label} (${statusCounts[key] ?? 0})`,
    })),
  ];

  return (
    <>
      <Card surface="flat" padding="none" rounded="lg" className="border-slate-200 shadow-sm shadow-slate-100">
        <SectionIntro
          title="Hồ sơ đề nghị thanh toán"
          description=""
          countLabel={`${rows.length} hồ sơ phù hợp`}
          readOnly={rolePermissions.isReadOnly}
          guide="Bấm vào mã hồ sơ để mở chi tiết: chứng từ, hợp đồng, luồng duyệt và lý do trả lại."
          actions={
            <div className="flex items-center gap-2">
              {rolePermissions.canExport && (
                <Button
                  intent="outline"
                  scale="sm"
                  icon={<DownloadOutlined />}
                  onClick={handleExportCSV}
                >
                  Xuất CSV
                </Button>
              )}
              {rolePermissions.canCreateDisbursement && onCreateDisbursement && (
                <Button
                  intent="primary"
                  scale="sm"
                  icon={<PlusOutlined />}
                  onClick={onCreateDisbursement}
                  className="bg-[#007A78] hover:bg-[#006664] text-white font-semibold shadow-xs"
                >
                  Lập đề nghị thanh toán
                </Button>
              )}
            </div>
          }
          toolbar={
            <Flex align="center" gap="small" wrap="wrap">
              <Input
                allowClear
                intent="clean"
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm mã hồ sơ, bên nhận, dự án..."
                style={{ width: 280, maxWidth: "100%" }}
                className="text-xs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                value={statusFilter}
                onChange={(val) => onStatusFilterChange(val as DisbursementStatusFilter)}
                style={{ width: 220 }}
                className="text-xs shrink-0"
                options={statusOptions}
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
          scroll={{ x: rolePermissions.isReadOnly ? 900 : 1090 }}
          onRow={(record) => ({
            onClick: (e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button") || target.closest("input") || target.closest("select")) {
                return;
              }
              setDetailId(record.id);
            },
            className: "cursor-pointer",
          })}
          className="[&_.ant-table-thead>tr>th]:bg-slate-50/90 [&_.ant-table-thead>tr>th]:py-2.5 [&_.ant-table-thead>tr>th]:text-[13px] [&_.ant-table-thead>tr>th]:font-bold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th::before]:!hidden [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr:hover>td]:bg-cyan-50/40 [&_.ant-pagination]:mx-4"
          rowClassName={(row) => (row.status === actionStatus ? "cursor-pointer [&>td]:!bg-amber-50/50" : "cursor-pointer")}
          pagination={{
            pageSize: 10,
            size: "small",
            showSizeChanger: false,
            hideOnSinglePage: true,
            showTotal: (total) => `Tổng cộng ${total} hồ sơ`,
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-slate-500">
                <FileSearchOutlined className="mb-2 text-2xl text-slate-400" />
                <Text className="block text-[13px]">Không có hồ sơ phù hợp với bộ lọc hiện tại.</Text>
                {(statusFilter !== "ALL" || search) && (
                  <Button
                    intent="textLink"
                    className="mt-1 text-[13px]"
                    onClick={() => {
                      setSearch("");
                      onStatusFilterChange("ALL");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {detailItem && (
        <DisbursementDetailDrawer
          disbursement={detailItem}
          controller={controller}
          onClose={() => setDetailId(undefined)}
          onReject={setRejectModalItem}
          onEdit={onEditDisbursement}
        />
      )}

      {rejectModalItem && (
        <ReasonModal
          open
          title={`Trả lại hồ sơ ${rejectModalItem.code}`}
          summary={
            <>
              {rejectModalItem.payee} · <strong>{formatVndBillions(rejectModalItem.amount)}</strong> ·{" "}
              {findProject(rejectModalItem.projectId)?.name}
            </>
          }
          label="Lý do trả lại"
          placeholder="Nêu rõ lý do: thiếu chứng từ, sai khối lượng, vượt hạn mức hợp đồng..."
          confirmText="Xác nhận trả lại"
          onClose={() => setRejectModalItem(null)}
          onConfirm={(reason) => controller.rejectDisbursement(rejectModalItem.id, reason)}
        />
      )}
    </>
  );
}
