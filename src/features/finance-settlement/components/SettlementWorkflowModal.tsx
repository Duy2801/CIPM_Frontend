"use client";

import { useState } from "react";
import {
  BankOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FileDoneOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Progress, Switch, Tag, Text } from "@/components/ui";
import { SETTLEMENT_STEPS } from "../constants/finance-labels";
import type { SettlementStepPayload } from "../services/finance.repository";
import type { FinanceProject, FinanceRolePermissions, SettlementRecord } from "../types/finance.types";
import { canActOnSettlementStep } from "../utils/finance-permissions";
import { formatVndBillions } from "../utils/finance-rules";

interface SettlementWorkflowModalProps {
  open: boolean;
  settlement: SettlementRecord;
  project?: FinanceProject;
  rolePermissions: FinanceRolePermissions;
  onClose: () => void;
  onComplete: (id: string, step: number, payload: SettlementStepPayload) => Promise<boolean>;
}

function CheckLine({ ok, okText, failText }: { ok: boolean; okText: string; failText: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-700" : "text-rose-700"}`}>
      {ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
      {ok ? okText : failText}
    </li>
  );
}

export default function SettlementWorkflowModal({
  open,
  settlement,
  project,
  rolePermissions,
  onClose,
  onComplete,
}: SettlementWorkflowModalProps) {
  const [decisionFile, setDecisionFile] = useState(settlement.approvedDecisionFile ?? "");
  const [settlementAmount, setSettlementAmount] = useState<number>(
    settlement.approvedSettlementAmount || project?.totalInvestment || 0,
  );
  const [treasuryDate, setTreasuryDate] = useState(settlement.treasuryClosedDate ?? "");
  const [warrantyReturned, setWarrantyReturned] = useState(settlement.warrantyReturned);
  const [submittingStep, setSubmittingStep] = useState<number>();

  const currentApproved = settlementAmount || settlement.approvedSettlementAmount;
  const difference = Number((currentApproved - settlement.disbursedAmount).toFixed(4));
  const amountsMatch = Math.abs(difference) < 0.0001;
  const settled = settlement.status === "SETTLED";
  const percent = settlement.completedSteps.length * 20;

  const complete = async (step: number) => {
    const payload: SettlementStepPayload = {};
    if (step === 1) {
      payload.approvedDecisionFile = decisionFile;
      payload.approvedSettlementAmount = settlementAmount;
    }
    if (step === 3) payload.treasuryClosedDate = treasuryDate;
    if (step === 4) payload.warrantyReturned = warrantyReturned;
    setSubmittingStep(step);
    try {
      await onComplete(settlement.id, step, payload);
    } finally {
      setSubmittingStep(undefined);
    }
  };

  const isStepInputMissing = (step: number) =>
    (step === 1 && (!decisionFile || !settlementAmount || settlementAmount <= 0)) ||
    (step === 2 && (!amountsMatch || !settlement.advanceRecovered)) ||
    (step === 3 && !treasuryDate) ||
    (step === 4 && !warrantyReturned);

  return (
    <Drawer
      open={open}
      title={
        <span className="flex items-center gap-2">
          <BankOutlined className="text-[#007A78]" />
          <span className="text-base font-bold text-[#102A43]">Hồ sơ tất toán tài khoản KBNN</span>
        </span>
      }
      width="min(680px, 100vw)"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button intent="outline" scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <header className="mb-4 rounded-xl bg-gradient-to-r from-[#0B2546] to-[#134E4A] p-4 text-white">
        <Text className="block text-xs font-semibold !text-teal-300">{project?.code}</Text>
        <Text className="mt-0.5 block text-base font-bold !text-white">{project?.name}</Text>
        <section className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 md:grid-cols-4">
          <div>
            <Text className="block text-[11px] !text-teal-200">Tổng giải ngân</Text>
            <Text className="text-sm font-bold !text-white">{formatVndBillions(settlement.disbursedAmount)}</Text>
          </div>
          <div>
            <Text className="block text-[11px] !text-teal-200">Quyết toán duyệt</Text>
            <Text className="text-sm font-bold !text-white">{formatVndBillions(currentApproved)}</Text>
          </div>
          <div>
            <Text className="block text-[11px] !text-teal-200">Chênh lệch</Text>
            <Text className={`text-sm font-bold ${amountsMatch ? "!text-emerald-300" : "!text-rose-300"}`}>
              {amountsMatch ? "Khớp" : formatVndBillions(difference)}
            </Text>
          </div>
          <div>
            <Text className="block text-[11px] !text-teal-200">Tiến độ ({settlement.completedSteps.length}/5)</Text>
            <Progress percent={percent} size="small" strokeColor="#22C7A9" railColor="#334A68" />
          </div>
        </section>
      </header>

      {settled && (
        <aside className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <CheckCircleFilled /> Dự án đã hoàn tất tất toán và được đóng mã trên hệ thống.
        </aside>
      )}

      <ol className="m-0 list-none space-y-3 p-0">
        {SETTLEMENT_STEPS.map((step) => {
          const completed = settlement.completedSteps.includes(step.number);
          const unlocked = step.number === 1 || settlement.completedSteps.includes(step.number - 1);
          const isActive = !completed && unlocked;
          const canAct = canActOnSettlementStep(step.number, rolePermissions);

          return (
            <li
              key={step.number}
              className={`rounded-xl border p-4 ${
                completed
                  ? "border-emerald-200 bg-emerald-50/50"
                  : isActive
                    ? "border-teal-300 bg-white shadow-xs"
                    : "border-slate-200 bg-slate-50/50 opacity-70"
              }`}
            >
              <section className="flex items-start gap-3.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    completed
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "border border-teal-200 bg-teal-50 text-teal-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <CheckCircleFilled /> : isActive ? step.number : <LockOutlined />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Text strong className="text-sm text-[#102A43]">
                      {step.number}. {step.title}
                    </Text>
                    <Tag intent="subtle" scale="sm" className="m-0">{step.roleRequired}</Tag>
                  </span>
                  <Text className="mt-0.5 block text-xs leading-5 text-slate-500">{step.description}</Text>

                  {isActive && step.number === 1 && (
                    <section className="mt-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Giá trị quyết toán được duyệt (tỷ VNĐ)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            disabled={!canAct}
                            value={settlementAmount || ""}
                            onChange={(e) => setSettlementAmount(Number(e.target.value))}
                            placeholder="Nhập giá trị theo QĐ (VD: 31.2)"
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            File Quyết định phê duyệt quyết toán
                          </label>
                          <div className="flex gap-1.5">
                            <Input
                              readOnly
                              value={decisionFile}
                              prefix={<FileDoneOutlined className="text-teal-600" />}
                              placeholder="Chưa đính kèm file QĐ"
                              className="text-xs"
                            />
                            {canAct && (
                              <Button
                                intent="outline"
                                scale="sm"
                                icon={<UploadOutlined />}
                                onClick={() => setDecisionFile("QD-177-phe-duyet-quyet-toan.pdf")}
                              >
                                Chọn file
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {isActive && step.number === 2 && (
                    <ul className="m-0 mt-3 list-none space-y-1 p-0">
                      <CheckLine
                        ok={amountsMatch}
                        okText="Tổng giải ngân khớp giá trị quyết toán được duyệt"
                        failText={`Còn chênh lệch ${formatVndBillions(difference)} – cần đối chiếu lại với KBNN`}
                      />
                      <CheckLine
                        ok={settlement.advanceRecovered}
                        okText="Đã thu hồi toàn bộ tạm ứng"
                        failText="Còn tạm ứng chưa thu hồi"
                      />
                    </ul>
                  )}

                  {isActive && step.number === 3 && (
                    <section className="mt-3">
                      <label htmlFor="treasury-closed-date" className="mb-1 block text-[11px] text-slate-600">
                        Ngày KBNN đóng tài khoản dự án
                      </label>
                      <Input
                        id="treasury-closed-date"
                        className="max-w-64 text-xs"
                        type="date"
                        disabled={!canAct}
                        value={treasuryDate}
                        onChange={(event) => setTreasuryDate(event.target.value)}
                      />
                    </section>
                  )}

                  {isActive && step.number === 4 && (
                    <section className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <Switch
                        checked={warrantyReturned}
                        disabled={!canAct}
                        onChange={setWarrantyReturned}
                        aria-label="Xác nhận hoàn trả bảo lãnh bảo hành"
                      />
                      <Text className="text-xs text-slate-700">
                        Nhà thầu đã hoàn thành nghĩa vụ bảo hành (dữ liệu liên kết M8)
                      </Text>
                    </section>
                  )}

                  {isActive && !canAct && (
                    <Text className="mt-2 block text-xs text-amber-700">
                      Bước này thuộc thẩm quyền {step.roleRequired}. Bạn có thể theo dõi, không thể xác nhận.
                    </Text>
                  )}
                </span>

                <span className="shrink-0">
                  {completed ? (
                    <Tag intent="success" icon={<CheckCircleFilled />} className="m-0">Hoàn tất</Tag>
                  ) : isActive && canAct ? (
                    <Button
                      intent={step.number === 5 ? "primary" : "secondary"}
                      scale="sm"
                      icon={step.number === 5 ? <SafetyCertificateOutlined /> : undefined}
                      disabled={isStepInputMissing(step.number)}
                      loading={submittingStep === step.number}
                      onClick={() => complete(step.number)}
                    >
                      {step.number === 5 ? "Đóng mã dự án" : "Xác nhận bước"}
                    </Button>
                  ) : isActive ? (
                    <Tag intent="warning" className="m-0">Chờ xử lý</Tag>
                  ) : (
                    <Tag intent="muted" icon={<LockOutlined />} className="m-0">Chưa mở</Tag>
                  )}
                </span>
              </section>
            </li>
          );
        })}
      </ol>
    </Drawer>
  );
}
