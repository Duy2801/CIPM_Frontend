"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Select, Text } from "@/components/ui";
import { FINANCE_MOCK_DATA } from "@/features/finance-settlement/constants/finance-mock-data";
import { todayIso } from "@/utils/date";
import type { BondStatus, WarrantyCreateInput, WarrantyProject, WarrantyRecord } from "../types/warranty.types";

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
    label = `Xanh: Còn ${daysLeft} ngày (> 90 ngày)`;
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
  const [selectedContractId, setSelectedContractId] = useState<string>("CTR-001");
  const [contractCode, setContractCode] = useState<string>("12/2026/HĐ-XL");
  const [contractor, setContractor] = useState<string>("Công ty CP Xây dựng Kiên Giang");
  const [projectId, setProjectId] = useState<string>("PRJ-101");
  const [workName, setWorkName] = useState<string>("");
  const [acceptanceDate, setAcceptanceDate] = useState<string>(today);
  const [months, setMonths] = useState<number>(24);
  const [bondValue, setBondValue] = useState<number>(3.625);
  const [bank, setBank] = useState<string>("Vietcombank – CN Kiên Giang");
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
      setProjectId("PRJ-101");
      setWorkName("");
      setAcceptanceDate(today);
      setMonths(24);
      setBondValue(3.625);
      setBank("Vietcombank – CN Kiên Giang");
      setBondStatus("HOLDING");
    }
  }, [editingWarranty, open, today]);

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
      if (contract.projectId) {
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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      title={
        <div className="py-1">
          <div className="text-base font-bold text-slate-800 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-[#007A78]" />
            {editingWarranty ? "Cập nhật hồ sơ bảo hành công trình" : "Thêm hồ sơ bảo hành công trình"}
          </div>
          <div className="text-xs text-slate-500 font-normal mt-0.5">
            {editingWarranty
              ? "Chỉnh sửa thời hạn bảo hành, hợp đồng liên kết và thông tin chứng thư bảo lãnh"
              : "Khởi tạo theo dõi thời hạn bảo hành và thông tin chứng thư bảo lãnh liên kết từ Hợp đồng M4"}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 py-2">
          <Button
            intent="primary"
            scale="sm"
            onClick={handleSubmit}
            className="!bg-[#007A78] !border-[#007A78] hover:!bg-[#006361] !text-white px-5 text-xs font-semibold rounded-lg shadow-sm"
          >
            {editingWarranty ? "Cập nhật hồ sơ" : "Lưu hồ sơ bảo hành"}
          </Button>
          <Button intent="outline" scale="sm" onClick={onClose} className="px-4 text-xs font-medium">
            Đóng
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-800">
        {errorText && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {errorText}
          </div>
        )}

        {/* 1. Hợp đồng liên kết từ M4 */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileTextOutlined className="text-[#007A78]" />
              Hợp đồng liên kết (M4 - Tài chính & Hợp đồng)
            </label>
            <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Liên kết từ M4
            </span>
          </div>

          <Select
            aria-label="Chọn hợp đồng M4"
            value={selectedContractId}
            onChange={handleSelectContract}
            className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
            options={[
              ...M4_CONTRACTS.map((c) => ({
                value: c.id,
                label: `${c.code} · ${c.contractor} (Giá trị HĐ: ${c.value} tỷ · Đề xuất BL: ${c.suggestedBond} tỷ)`,
              })),
              { value: "CUSTOM", label: "✏️ Nhập thủ công hợp đồng khác..." },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số / Mã hợp đồng</label>
              <Input
                intent="clean"
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="Ví dụ: 12/2026/HĐ-XL"
                className="w-full text-xs h-8"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nhà thầu thực hiện</label>
              <Input
                intent="clean"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="Tên nhà thầu xây lắp"
                className="w-full text-xs h-8"
              />
            </div>
          </div>
        </div>

        {/* Dự án & Tên công trình */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dự án trực thuộc <span className="text-rose-500">*</span>
            </label>
            <Select
              aria-label="Chọn dự án"
              value={projectId}
              onChange={setProjectId}
              className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.code} · ${p.name}`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên hạng mục / công trình bảo hành <span className="text-rose-500">*</span>
            </label>
            <Input
              intent="clean"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
              placeholder="Ví dụ: Mặt đường, vỉa hè và hệ thống thoát nước dọc đoạn K0+000 - K1+200"
              className="w-full text-xs h-8"
              required
            />
          </div>
        </div>

        {/* 2 & 3 & 4 & 5: Thời hạn bảo hành, Nghiệm thu & Tính toán tự động */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
            <ClockCircleOutlined className="text-[#007A78]" />
            Thời hạn & Tiến độ bảo hành (Tự động tính toán)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ngày nghiệm thu hoàn thành <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <Input
                type="date"
                intent="clean"
                value={acceptanceDate}
                onChange={(e) => setAcceptanceDate(e.target.value)}
                className="w-full text-xs h-8"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ngày bắt đầu tính thời hạn BH</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Thời hạn bảo hành (tháng) <span className="text-rose-500">* (Bắt buộc)</span>
              </label>
              <Input
                type="number"
                intent="clean"
                min={1}
                max={120}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 0)}
                placeholder="Ví dụ: 12, 24"
                className="w-full text-xs h-8"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Theo điều khoản HĐ (thường 12–24 tháng)</span>
            </div>
          </div>

          {/* Khối hiển thị tự động: Ngày hết hạn + Đếm ngược ngày còn lại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100/80">
            <div className="rounded-lg bg-white border border-slate-200 p-2.5">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <CalendarOutlined className="text-slate-400" />
                Ngày hết hạn bảo hành
                <span className="ml-auto text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">Tự động</span>
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {expiryDate ? expiryDate.split("-").reverse().join("/") : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">= Ngày NT + {months} tháng</div>
            </div>

            <div className={`rounded-lg p-2.5 border ${
              countdown?.tone === "safe"
                ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                : countdown?.tone === "watch"
                ? "bg-amber-50/90 border-amber-300 text-amber-900"
                : countdown?.tone === "urgent"
                ? "bg-rose-50/90 border-rose-300 text-rose-900"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}>
              <div className="text-[11px] font-medium flex items-center gap-1">
                <ClockCircleOutlined />
                Đếm ngược (ngày còn lại)
                <span className="ml-auto text-[10px] bg-white/80 px-1.5 py-0.2 rounded font-semibold">Tự động</span>
              </div>
              <div className="text-sm font-black mt-1">
                {countdown ? (countdown.daysLeft >= 0 ? `Còn ${countdown.daysLeft} ngày` : "Đã hết hạn") : "—"}
              </div>
              <div className="text-[10px] font-medium opacity-90 mt-0.5">
                {countdown?.label || "Hiển thị màu: Xanh > 90 / Vàng ≤ 90 / Đỏ ≤ 30"}
              </div>
            </div>
          </div>
        </div>

        {/* 6 & 7 & 8: Bảo lãnh bảo hành */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BankOutlined className="text-[#007A78]" />
            Thông tin bảo lãnh bảo hành
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Giá trị bảo lãnh (tỷ đồng)
              </label>
              <Input
                type="number"
                step="0.001"
                intent="clean"
                value={bondValue}
                onChange={(e) => setBondValue(Number(e.target.value) || 0)}
                placeholder="Ví dụ: 1.25"
                className="w-full text-xs h-8"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Thường 5% giá trị HĐ xây lắp</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Trạng thái bảo lãnh
              </label>
              <Select
                aria-label="Trạng thái bảo lãnh"
                value={bondStatus}
                onChange={(val) => setBondStatus(val as BondStatus)}
                className="w-full text-xs [&_.ant-select-selector]:!rounded-lg"
                options={BOND_STATUS_OPTIONS}
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Đang giữ / Đã hoàn trả / Đã thu hồi</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Ngân hàng phát hành bảo lãnh
            </label>
            <Input
              intent="clean"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="Ví dụ: Vietcombank – CN Kiên Giang, BIDV – CN Hà Tiên"
              className="w-full text-xs h-8"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Tên ngân hàng và chi nhánh phát hành bảo lãnh</span>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
