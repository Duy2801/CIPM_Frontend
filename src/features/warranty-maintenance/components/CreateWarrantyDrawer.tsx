"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Drawer, Input, MoneyInput, Select } from "@/components/ui";
import { FINANCE_MOCK_DATA } from "@/features/finance-settlement/constants/finance-mock-data";
import { todayIso } from "@/utils/date";
import { parseMoney } from "@/utils/format-money";
import type { BondStatus, WarrantyCreateInput, WarrantyProject, WarrantyRecord } from "../types/warranty.types";
import { useProjectScope } from "@/components/workspace";

interface CreateWarrantyDrawerProps {
  open: boolean;
  editingWarranty?: WarrantyRecord | null;
  projects: WarrantyProject[];
  today?: string;
  errorText?: string;
  onClose: () => void;
  onSubmit: (input: WarrantyCreateInput) => void;
}

// Danh sách các hợp đồng M4 kết hợp dữ liệu mẫu
const M4_CONTRACTS = [
  ...FINANCE_MOCK_DATA.contracts.map((c) => ({
    id: c.id,
    code: c.code,
    projectId: c.projectId,
    contractor: c.contractor,
    value: c.value,
    suggestedBond: Math.round(c.value * 0.05 * 1000) / 1000,
  })),
  {
    id: "CTR-005",
    code: "08/2023/HĐ-XL",
    projectId: "PRJ-101",
    contractor: "Công ty CP Xây dựng Kiên Giang",
    value: 25.0,
    suggestedBond: 1.25,
  },
  {
    id: "CTR-006",
    code: "14/2024/HĐ-XL",
    projectId: "PRJ-102",
    contractor: "Công ty TNHH Cầu đường 68",
    value: 9.6,
    suggestedBond: 0.48,
  },
  {
    id: "CTR-007",
    code: "21/2024/HĐ-XL",
    projectId: "PRJ-103",
    contractor: "Công ty TNHH Xây dựng Phú Quốc",
    value: 7.2,
    suggestedBond: 0.36,
  },
];

const BOND_STATUS_OPTIONS: { value: BondStatus; label: string }[] = [
  { value: "HOLDING", label: "Đang giữ" },
  { value: "RETURNED", label: "Đã hoàn trả" },
  { value: "FORFEITED", label: "Đã thu hồi (vi phạm)" },
];

function addMonthsToDate(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "";
  const [year, month, day] = parts;
  const d = new Date(year, month - 1 + months, day);
  return d.toISOString().slice(0, 10);
}

function calculateCountdown(expiryDateStr: string, todayStr: string) {
  if (!expiryDateStr || !todayStr) return null;
  const expiry = new Date(expiryDateStr);
  const now = new Date(todayStr);
  const diffTime = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let tone: "safe" | "watch" | "urgent" | "expired" = "safe";
  let label = `Còn ${daysLeft} ngày`;

  if (daysLeft < 0) {
    tone = "expired";
    label = "Đã hết hạn";
  } else if (daysLeft <= 30) {
    tone = "urgent";
    label = `Đỏ: Còn ${daysLeft} ngày (≤ 30 ngày)`;
  } else if (daysLeft <= 90) {
    tone = "watch";
    label = `Vàng: Còn ${daysLeft} ngày (≤ 90 ngày)`;
  } else {
    tone = "safe";
    label = `Thời hạn: Còn ${daysLeft} ngày (> 90 ngày)`;
  }

  return { daysLeft, tone, label };
}

export default function CreateWarrantyDrawer({
  open,
  editingWarranty,
  projects,
  today = todayIso(),
  errorText,
  onClose,
  onSubmit,
}: CreateWarrantyDrawerProps) {
  const scopedProjectId = useProjectScope();
  // Mở trong trang chi tiết dự án: chỉ chọn hợp đồng của dự án đó
  const contractChoices = scopedProjectId
    ? M4_CONTRACTS.filter((c) => c.projectId === scopedProjectId)
    : M4_CONTRACTS;
  const [selectedContractId, setSelectedContractId] = useState<string>("CTR-001");
  const [contractCode, setContractCode] = useState<string>("12/2026/HĐ-XL");
  const [contractor, setContractor] = useState<string>("Công ty CP Xây dựng Kiên Giang");
  const [projectId, setProjectId] = useState<string>(scopedProjectId ?? "PRJ-101");
  const [workName, setWorkName] = useState<string>("");
  const [acceptanceDate, setAcceptanceDate] = useState<string>(today);
  const [months, setMonths] = useState<number>(24);
  const [bondValue, setBondValue] = useState<number>(3.625);
  const [bank, setBank] = useState<string>("");
  const [bondStatus, setBondStatus] = useState<BondStatus>("HOLDING");

  useEffect(() => {
    if (editingWarranty) {
      setContractCode(editingWarranty.contractCode);
      setContractor(editingWarranty.contractor);
      setProjectId(editingWarranty.projectId);
      setWorkName(editingWarranty.workName);
      setAcceptanceDate(editingWarranty.acceptanceDate);
      setMonths(editingWarranty.months);
      setBondValue(editingWarranty.bondValue);
      setBank(editingWarranty.bank);
      setBondStatus(editingWarranty.bondStatus);
      const matched = M4_CONTRACTS.find((c) => c.code === editingWarranty.contractCode);
      setSelectedContractId(matched ? matched.id : "CUSTOM");
    } else {
      setSelectedContractId("CTR-001");
      setContractCode("12/2026/HĐ-XL");
      setContractor("Công ty CP Xây dựng Kiên Giang");
      setProjectId(scopedProjectId ?? "PRJ-101");
      setWorkName("");
      setAcceptanceDate(today);
      setMonths(24);
      setBondValue(3.625);
      setBank("");
      setBondStatus("HOLDING");
      if (scopedProjectId) {
        // Hợp đồng đầu tiên của dự án; dự án chưa có hợp đồng thì nhập thủ công
        const first = M4_CONTRACTS.find((c) => c.projectId === scopedProjectId);
        setSelectedContractId(first ? first.id : "CUSTOM");
        setContractCode(first?.code ?? "");
        setContractor(first?.contractor ?? "");
        setBondValue(first?.suggestedBond ?? 0);
      }
    }
  }, [editingWarranty, open, today, scopedProjectId]);

  // Xử lý khi chọn hợp đồng từ M4
  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    if (contractId === "CUSTOM") {
      return;
    }
    const contract = M4_CONTRACTS.find((c) => c.id === contractId);
    if (contract) {
      setContractCode(contract.code);
      setContractor(contract.contractor);
      setBondValue(contract.suggestedBond);
      if (contract.projectId && !scopedProjectId) {
        setProjectId(contract.projectId);
      }
      if (!workName) {
        setWorkName(`Công trình theo ${contract.code} (${contract.contractor})`);
      }
    }
  };

  // Tính tự động: Ngày hết hạn bảo hành = Ngày NT + Thời hạn BH (tháng)
  const expiryDate = useMemo(() => {
    return addMonthsToDate(acceptanceDate, Number(months) || 0);
  }, [acceptanceDate, months]);

  // Đếm ngược (ngày còn lại) tự động theo màu
  const countdown = useMemo(() => {
    return calculateCountdown(expiryDate, today);
  }, [expiryDate, today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptanceDate) return;
    if (!months || months <= 0) return;
    if (!workName.trim()) return;

    onSubmit({
      projectId,
      workName: workName.trim(),
      contractCode: contractCode.trim() || "Chưa có mã HĐ",
      contractor: contractor.trim() || "Chưa cập nhật nhà thầu",
      acceptanceDate,
      months: Number(months),
      bondValue: Number(bondValue) || 0,
      bank: bank.trim() || "Chưa cập nhật ngân hàng",
      bondStatus,
    });
  };

  const fieldLabel = "mb-1 block text-xs font-semibold text-slate-700";
  const required = <span className="text-rose-500"> *</span>;
  const sectionTitle = "m-0 text-[13px] font-bold text-slate-900";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(640px, 100vw)"
      title={
        <div className="flex items-center gap-2 text-base font-bold text-slate-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Quay lại"
            title="Quay lại"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"
          >
            <ArrowLeftOutlined />
          </button>
          {editingWarranty ? "Cập nhật bảo hành" : "Thêm bảo hành"}
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-start py-2">
          <Button
            intent="primary"
            scale="sm"
            onClick={handleSubmit}
            className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] !text-white px-5 text-xs font-semibold rounded-lg shadow-sm"
          >
            {editingWarranty ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-slate-800">
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {errorText}
          </div>
        )}

        {/* Công trình */}
        <section className="flex flex-col gap-3">
          {/* Mở trong trang chi tiết dự án: dự án cố định, không cần chọn */}
          {!scopedProjectId && (
            <div>
              <label className={fieldLabel}>Dự án{required}</label>
              <Select
                aria-label="Chọn dự án"
                value={projectId}
                onChange={setProjectId}
                className="!h-10 w-full text-sm [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-lg"
                options={projects.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))}
              />
            </div>
          )}
          <div>
            <label className={fieldLabel}>Tên công trình / hạng mục{required}</label>
            <Input
              intent="clean"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
              placeholder="VD: Mặt đường, vỉa hè đoạn K0+000 - K1+200"
              scale="comfortable" className="w-full"
              required
            />
          </div>
        </section>

        {/* Hợp đồng */}
        <section className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <h4 className={sectionTitle}>Hợp đồng</h4>
          {/* Dự án chưa có hợp đồng nào: nhập thẳng số hợp đồng / nhà thầu, không cần ô chọn */}
          {contractChoices.length > 0 && (
            <Select
              aria-label="Chọn hợp đồng"
              value={selectedContractId}
              onChange={handleSelectContract}
              className="!h-10 w-full text-sm [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-lg"
              options={[
                ...contractChoices.map((c) => ({ value: c.id, label: `${c.code} · ${c.contractor}` })),
                { value: "CUSTOM", label: "Nhập hợp đồng khác" },
              ]}
            />
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Số hợp đồng</label>
              <Input
                intent="clean"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="VD: 12/2026/HĐ-XL"
                scale="comfortable" className="w-full"
              />
            </div>
            <div>
              <label className={fieldLabel}>Nhà thầu</label>
              <Input
                intent="clean"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="Tên nhà thầu"
                scale="comfortable" className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Thời hạn bảo hành: ngày hết hạn tự tính */}
        <section className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <h4 className={sectionTitle}>Thời hạn bảo hành</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Ngày nghiệm thu{required}</label>
              <Input
                type="date"
                intent="clean"
                value={acceptanceDate}
                onChange={(e) => setAcceptanceDate(e.target.value)}
                scale="comfortable" className="w-full"
                required
              />
            </div>
            <div>
              <label className={fieldLabel}>Thời hạn (tháng){required}</label>
              <Input
                type="number"
                intent="clean"
                min={1}
                max={120}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 0)}
                scale="comfortable" className="w-full"
                required
              />
            </div>
          </div>
          {/* Ngày hết hạn tự tính: một dòng chữ dưới hai ô, không phải ô nhập */}
          {expiryDate && countdown && (
            <p className="m-0 text-xs text-slate-500">
              Hết hạn <strong className="text-slate-800">{expiryDate.split("-").reverse().join("/")}</strong>
              {" · "}
              <span
                className={
                  countdown.tone === "watch"
                    ? "font-medium text-amber-600"
                    : countdown.tone === "safe"
                      ? ""
                      : "font-medium text-rose-600"
                }
              >
                {countdown.daysLeft >= 0 ? `còn ${countdown.daysLeft} ngày` : "đã hết hạn"}
              </span>
            </p>
          )}
        </section>

        {/* Bảo lãnh bảo hành */}
        <section className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <h4 className={sectionTitle}>Bảo lãnh bảo hành</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Giá trị bảo lãnh (VNĐ)</label>
              <MoneyInput
                intent="clean"
                value={bondValue}
                onChange={(e) => setBondValue(parseMoney(e.target.value))}
                placeholder="0"
                scale="comfortable" className="w-full"
              />
            </div>
            <div>
              <label className={fieldLabel}>Trạng thái</label>
              <Select
                aria-label="Trạng thái bảo lãnh"
                value={bondStatus}
                onChange={(val) => setBondStatus(val as BondStatus)}
                className="!h-10 w-full text-sm [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!rounded-lg"
                options={BOND_STATUS_OPTIONS}
              />
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Ngân hàng phát hành</label>
            <Input
              intent="clean"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="VD: Vietcombank – CN Kiên Giang"
              scale="comfortable" className="w-full"
            />
          </div>
        </section>
      </form>
    </Drawer>
  );
}
