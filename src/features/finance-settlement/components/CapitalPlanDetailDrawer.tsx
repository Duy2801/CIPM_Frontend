"use client";

import {
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Progress, Table, Tag, Text, Tooltip } from "@/components/ui";
import type { ColumnsType } from "@/components/ui";
import { SOURCE_TAG_INTENTS } from "../constants/finance-labels";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { CapitalPlan, Disbursement, FinanceProject } from "../types/finance.types";
import { formatVndBillions } from "../utils/finance-rules";

interface CapitalPlanDetailDrawerProps {
  project: FinanceProject;
  year: number;
  plans: CapitalPlan[];
  disbursements: Disbursement[];
  controller: FinanceSettlementController;
  onClose: () => void;
  onAdjustPlan: (plan: CapitalPlan) => void;
  onAddPlan: (projectId: string) => void;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export default function CapitalPlanDetailDrawer({
  project,
  year,
  plans,
  disbursements,
  controller,
  onClose,
  onAdjustPlan,
  onAddPlan,
}: CapitalPlanDetailDrawerProps) {
  const { rolePermissions } = controller;

  // Tổng hợp số liệu dự án
  const totalInitial = sum(plans.map((p) => p.initialAmount));
  const totalAdjustment = sum(plans.map((p) => p.adjustmentAmount));
  const totalCurrent = sum(plans.map((p) => p.initialAmount + p.adjustmentAmount));
  const totalDisbursed = sum(
    disbursements
      .filter((d) => d.projectId === project.id && d.status === "APPROVED")
      .map((d) => d.amount),
  );
  const totalRemaining = Math.max(0, totalCurrent - totalDisbursed);
  const overallPercent = totalCurrent > 0 ? Math.min(100, Math.round((totalDisbursed / totalCurrent) * 100)) : 0;

  // Lấy các hồ sơ giải ngân đã duyệt của dự án
  const projectDisbursements = disbursements.filter(
    (d) => d.projectId === project.id && d.status === "APPROVED",
  );

  // Cấu hình bảng nguồn vốn chi tiết
  const planColumns: ColumnsType<CapitalPlan> = [
    {
      title: "Nguồn vốn",
      key: "source",
      width: 150,
      render: (_, plan) => (
        <div>
          <Tag intent={SOURCE_TAG_INTENTS[plan.source]} scale="sm" className="font-semibold text-xs">
            {plan.source}
          </Tag>
          {plan.approvalDocument && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <PaperClipOutlined className="text-[10px] text-slate-400" />
              <span className="truncate max-w-[130px]" title={plan.approvalFileName ?? plan.approvalDocument}>
                {plan.approvalDocument}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Đầu năm",
      key: "initial",
      align: "right",
      render: (_, plan) => (
        <span className="text-xs font-medium text-slate-700">{formatVndBillions(plan.initialAmount)}</span>
      ),
    },
    {
      title: "Điều chỉnh",
      key: "adjustment",
      align: "right",
      render: (_, plan) => {
        if (plan.adjustmentAmount === 0) return <span className="text-xs text-slate-300">—</span>;
        const isPos = plan.adjustmentAmount > 0;
        return (
          <span className={`text-xs font-semibold ${isPos ? "text-emerald-700" : "text-rose-600"}`}>
            {isPos ? "+" : ""}
            {formatVndBillions(plan.adjustmentAmount)}
          </span>
        );
      },
    },
    {
      title: "KH hiện tại",
      key: "current",
      align: "right",
      render: (_, plan) => {
        const cur = plan.initialAmount + plan.adjustmentAmount;
        return <span className="text-xs font-bold text-[#102A43]">{formatVndBillions(cur)}</span>;
      },
    },
    {
      title: "Đã giải ngân",
      key: "disbursed",
      align: "right",
      render: (_, plan) => {
        const cur = plan.initialAmount + plan.adjustmentAmount;
        const proportion = totalCurrent > 0 ? cur / totalCurrent : 0;
        const disbursed = Math.round(totalDisbursed * proportion);
        const percent = cur > 0 ? Math.min(100, Math.round((disbursed / cur) * 100)) : 0;
        return (
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-700">{formatVndBillions(disbursed)}</span>
            <span className="text-[10.5px] text-slate-500">({percent}%)</span>
          </div>
        );
      },
    },
    {
      title: "Còn lại",
      key: "remaining",
      align: "right",
      render: (_, plan) => {
        const cur = plan.initialAmount + plan.adjustmentAmount;
        const proportion = totalCurrent > 0 ? cur / totalCurrent : 0;
        const disbursed = Math.round(totalDisbursed * proportion);
        const remaining = Math.max(0, cur - disbursed);
        return <span className="text-xs font-medium text-slate-700">{formatVndBillions(remaining)}</span>;
      },
    },
  ];

  if (rolePermissions.canAdjustCapitalPlan) {
    planColumns.push({
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: 90,
      render: (_, plan) => (
        <Button
          intent="textLink"
          scale="xs"
          icon={<EditOutlined className="text-xs" />}
          onClick={() => onAdjustPlan(plan)}
          className="text-xs font-medium text-[#007A78] hover:text-[#005f5d] px-1.5 py-0.5 rounded hover:bg-teal-50"
          title="Điều chỉnh tăng/giảm nguồn vốn này"
        >
          Điều chỉnh
        </Button>
      ),
    });
  }

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#102A43]">{project.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Tag intent="brand" scale="sm" className="font-semibold text-xs m-0">
              {project.code}
            </Tag>
            <span className="text-xs text-slate-500">Kế hoạch vốn niên độ {year}</span>
          </div>
        </div>
      }
      footer={
        <Flex justify="space-between" align="center" className="w-full">
          <div>
            {rolePermissions.canCreateCapitalPlan && (
              <Button
                intent="primary"
                scale="sm"
                icon={<PlusCircleOutlined />}
                onClick={() => onAddPlan(project.id)}
                className="bg-[#007A78] hover:bg-[#006664] text-white font-medium"
              >
                Thêm nguồn vốn mới
              </Button>
            )}
          </div>
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </Flex>
      }
    >
      <div className="space-y-5">
        {/* Khối thẻ tổng hợp số liệu kế hoạch vốn */}
        <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Tổng quan kế hoạch vốn dự án năm {year}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-[11px] text-slate-500">KH đầu năm</span>
              <span className="text-sm font-bold text-slate-800">{formatVndBillions(totalInitial)}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-[11px] text-slate-500">Điều chỉnh</span>
              <span
                className={`text-sm font-bold ${
                  totalAdjustment > 0
                    ? "text-emerald-700"
                    : totalAdjustment < 0
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                {totalAdjustment > 0 ? `+${formatVndBillions(totalAdjustment)}` : totalAdjustment < 0 ? formatVndBillions(totalAdjustment) : "0 tỷ"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-[11px] text-slate-500">KH hiện tại</span>
              <span className="text-sm font-black text-[#102A43]">{formatVndBillions(totalCurrent)}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-[11px] text-slate-500">Còn lại chưa GN</span>
              <span className="text-sm font-bold text-[#007A78]">{formatVndBillions(totalRemaining)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Tiến độ giải ngân</span>
              <span className="font-bold text-[#007A78]">
                {formatVndBillions(totalDisbursed)} / {formatVndBillions(totalCurrent)} ({overallPercent}%)
              </span>
            </div>
            <Progress
              percent={overallPercent}
              status={overallPercent >= 100 ? "success" : "active"}
              strokeColor="#007A78"
            />
          </div>
        </section>

        {/* Danh sách cơ cấu nguồn vốn */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-slate-500 text-sm" />
              <span className="text-sm font-bold text-slate-800">
                Cơ cấu nguồn vốn ({plans.length} nguồn)
              </span>
            </div>
            {rolePermissions.canCreateCapitalPlan && (
              <Button
                intent="textLink"
                scale="xs"
                icon={<PlusCircleOutlined className="text-xs" />}
                onClick={() => onAddPlan(project.id)}
                className="text-xs font-semibold text-[#007A78]"
              >
                + Thêm nguồn
              </Button>
            )}
          </div>

          <Table<CapitalPlan>
            rowKey="id"
            columns={planColumns}
            dataSource={plans}
            pagination={false}
            size="small"
            className="border border-slate-200 rounded-lg overflow-hidden [&_.ant-table-thead>tr>th]:bg-slate-100/80 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold"
          />
        </section>

        {/* Danh sách các hồ sơ giải ngân đã phê duyệt của dự án */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleOutlined className="text-emerald-600 text-sm" />
            <span className="text-sm font-bold text-slate-800">
              Hồ sơ giải ngân đã duyệt ({projectDisbursements.length} đợt)
            </span>
          </div>

          {projectDisbursements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Chưa có hồ sơ giải ngân nào được duyệt trong niên độ này.
            </div>
          ) : (
            <ul className="m-0 space-y-2 p-0 list-none">
              {projectDisbursements.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#102A43]">{d.code}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{d.payee}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{d.content}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-slate-800">{formatVndBillions(d.amount)}</div>
                    <div className="text-[10.5px] text-slate-400">{d.approvalDate}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}
