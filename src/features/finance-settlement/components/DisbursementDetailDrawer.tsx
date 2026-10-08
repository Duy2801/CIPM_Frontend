"use client";

import { ExclamationCircleFilled, WarningOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Progress, Tag, Text } from "@/components/ui";
import { APPROVAL_STATUS_META } from "../constants/finance-labels";
import type { FinanceSettlementController } from "../hooks/useFinanceSettlement";
import type { Disbursement } from "../types/finance.types";
import { formatVndBillions, getContractUsagePercent, getWorkingDaysUntil } from "../utils/finance-rules";
import ApprovalFlow from "./ApprovalFlow";
import DisbursementActions from "./DisbursementActions";

interface DisbursementDetailDrawerProps {
  disbursement: Disbursement;
  controller: FinanceSettlementController;
  onClose: () => void;
  onReject: (disbursement: Disbursement) => void;
  onEdit: (disbursement: Disbursement) => void;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString("vi-VN");

/** Toàn bộ thông tin một đợt giải ngân: số liệu, hợp đồng, chứng từ, luồng duyệt và lý do trả lại */
export default function DisbursementDetailDrawer({
  disbursement,
  controller,
  onClose,
  onReject,
  onEdit,
}: DisbursementDetailDrawerProps) {
  const { data, rolePermissions } = controller;
  const project = data.projects.find((item) => item.id === disbursement.projectId);
  const contract = data.contracts.find((item) => item.id === disbursement.contractId);
  const treasury = data.treasuryAccounts.find((item) => item.id === disbursement.treasuryAccountId);
  const status = APPROVAL_STATUS_META[disbursement.status];
  const isPending = disbursement.status === "PENDING_CHIEF" || disbursement.status === "PENDING_DIRECTOR";
  const days = isPending ? getWorkingDaysUntil(disbursement.dueDate) : undefined;
  const usage = contract ? getContractUsagePercent(contract.disbursed, contract.value) : undefined;

  const facts = [
    { label: "Dự án", value: `${project?.code} · ${project?.name}`, wide: true },
    { label: "Bên nhận thanh toán", value: disbursement.payee, wide: true },
    { label: "Số tiền", value: formatVndBillions(disbursement.amount) },
    { label: "Ngày ký duyệt", value: formatDate(disbursement.approvalDate) },
    { label: "Hạn thanh toán", value: formatDate(disbursement.dueDate) },
    { label: "Tài khoản KBNN", value: treasury ? `${treasury.number} · ${treasury.label}` : "—" },
  ];

  return (
    <Drawer
      open
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-start gap-2.5 flex-wrap px-1 py-1">
          <DisbursementActions
            disbursement={disbursement}
            rolePermissions={rolePermissions}
            project={project}
            contract={contract}
            size="comfortable"
            onApprove={controller.approveDisbursement}
            onReject={(item) => {
              onClose();
              onReject(item);
            }}
            onEdit={(item) => {
              onClose();
              onEdit(item);
            }}
          />
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
      title={
        <span>
          <span className="flex items-center gap-2">
            <span className="text-base font-bold text-[#102A43]">{disbursement.code}</span>
            <Tag intent={status.intent} scale="md" className="m-0">{status.label}</Tag>
          </span>
          <span className="block text-xs font-normal text-slate-500">{status.hint}</span>
        </span>
      }
    >
      {disbursement.status === "REJECTED" && disbursement.rejectionReason && (
        <aside className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
          <ExclamationCircleFilled className="mt-0.5 text-rose-500" />
          <span>
            <Text strong className="block text-[13px] text-rose-900">Lý do bị trả lại</Text>
            <Text className="block text-[13px] text-rose-800">{disbursement.rejectionReason}</Text>
          </span>
        </aside>
      )}

      {days !== undefined && days <= 5 && (
        <aside
          className={`mb-4 rounded-lg px-3 py-2 text-[13px] font-medium ${
            days < 0 ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"
          }`}
        >
          {days < 0
            ? `Đã quá hạn thanh toán ${Math.abs(days)} ngày làm việc.`
            : `Còn ${days} ngày làm việc đến hạn thanh toán.`}
        </aside>
      )}

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {facts.map((fact) => (
          <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
            <dt className="text-xs text-slate-500">{fact.label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-slate-800">{fact.value}</dd>
          </div>
        ))}
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Nội dung thanh toán</dt>
          <dd className="m-0 text-[13px] text-slate-700">{disbursement.content}</dd>
        </div>
      </dl>

      {contract && usage && (
        <section className="mt-4 rounded-xl border border-slate-200 p-4">
          <Flex align="center" justify="space-between" gap="small">
            <Text className="text-[13px] font-semibold text-slate-800">Hợp đồng {contract.code}</Text>
            <Text className={`text-[13px] font-bold ${usage.isWarning ? "text-amber-700" : "text-teal-800"}`}>
              {usage.percent}%
            </Text>
          </Flex>
          <Progress
            percent={Math.min(100, usage.percent)}
            showInfo={false}
            size="small"
            strokeColor={usage.isWarning ? "#E09F3E" : "#007A78"}
          />
          <Text className="block text-xs text-slate-600">
            {contract.contractor} · Giá trị {formatVndBillions(contract.value)} · Đã giải ngân{" "}
            {formatVndBillions(contract.disbursed)} · Còn {formatVndBillions(contract.value - contract.disbursed)}
          </Text>
          {usage.isWarning && (
            <Text className="mt-1 block text-[13px] font-medium text-amber-700">
              <WarningOutlined /> Hợp đồng đã chạm ngưỡng cảnh báo 95%.
            </Text>
          )}
        </section>
      )}

      <div className="mt-4">
        <ApprovalFlow disbursement={disbursement} />
      </div>
    </Drawer>
  );
}
