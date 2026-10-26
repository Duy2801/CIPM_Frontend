"use client";

import { useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Select } from "@/components/ui";

interface AdvancedSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (criteria: AdvancedSearchCriteria) => void;
}

export interface AdvancedSearchCriteria {
  keyword: string;
  code: string;
  issuer: string;
  category: string;
  field: string;
  year: string;
  status: string;
}

export default function AdvancedSearchModal({
  open,
  onClose,
  onSearch,
}: AdvancedSearchModalProps) {
  const [form, setForm] = useState<AdvancedSearchCriteria>({
    keyword: "",
    code: "",
    issuer: "ALL",
    category: "ALL",
    field: "ALL",
    year: "ALL",
    status: "ALL",
  });

  const handleReset = () => {
    setForm({
      keyword: "",
      code: "",
      issuer: "ALL",
      category: "ALL",
      field: "ALL",
      year: "ALL",
      status: "ALL",
    });
  };

  const handleApply = () => {
    onSearch(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex items-center justify-between">
          <Button intent="outline" onClick={handleReset}>
            Đặt lại tiêu chí
          </Button>
          <div className="flex items-center gap-2">
            <Button intent="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              intent="primary"
              icon={<SearchOutlined />}
              onClick={handleApply}
              className="!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C] text-white"
            >
              Tìm kiếm nâng cao
            </Button>
          </div>
        </div>
      }
      title={
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <SearchOutlined className="text-[#DC2626] text-base" />
          <span className="text-base font-bold text-slate-800">
            Tìm kiếm văn bản pháp luật nâng cao
          </span>
        </div>
      }
      width={640}
      centered
    >
      <div className="py-2 space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Từ khóa trong tiêu đề / trích yếu:
          </label>
          <Input
            placeholder="Ví dụ: Lao động, Hợp đồng, Chi phí đầu tư xây dựng, Đấu thầu..."
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số hiệu văn bản:</label>
            <Input
              placeholder="Ví dụ: 45/2019/QH14, 10/2021/NĐ-CP..."
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực áp dụng:</label>
            <Select
              className="w-full"
              value={form.field}
              onChange={(val) => setForm({ ...form, field: val })}
              options={[
                { value: "ALL", label: "Tất cả lĩnh vực" },
                { value: "Lao động-Tiền lương", label: "Lao động - Tiền lương" },
                { value: "Đầu tư xây dựng", label: "Đầu tư xây dựng" },
                { value: "Đấu thầu", label: "Đấu thầu qua mạng" },
                { value: "Đất đai - GPMB", label: "Đất đai - Bồi thường GPMB" },
                { value: "Tài chính - Quyết toán", label: "Tài chính - Giải ngân KBNN" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cơ quan ban hành:</label>
            <Select
              className="w-full"
              value={form.issuer}
              onChange={(val) => setForm({ ...form, issuer: val })}
              options={[
                { value: "ALL", label: "Tất cả cơ quan" },
                { value: "Quốc hội", label: "Quốc hội" },
                { value: "Chính phủ", label: "Chính phủ" },
                { value: "Thủ tướng Chính phủ", label: "Thủ tướng Chính phủ" },
                { value: "Bộ Xây dựng", label: "Bộ Xây dựng" },
                { value: "Bộ Tài chính", label: "Bộ Tài chính" },
                { value: "UBND tỉnh Kiên Giang", label: "UBND tỉnh Kiên Giang" },
              ]}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Loại văn bản:</label>
            <Select
              className="w-full"
              value={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              options={[
                { value: "ALL", label: "Tất cả loại văn bản" },
                { value: "Bộ luật", label: "Bộ luật / Luật" },
                { value: "Nghị định", label: "Nghị định" },
                { value: "Thông tư", label: "Thông tư" },
                { value: "Nghị quyết", label: "Nghị quyết" },
                { value: "Quyết định", label: "Quyết định" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Năm ban hành:</label>
            <Select
              className="w-full"
              value={form.year}
              onChange={(val) => setForm({ ...form, year: val })}
              options={[
                { value: "ALL", label: "Tất cả các năm" },
                { value: "2026", label: "Năm 2026" },
                { value: "2025", label: "Năm 2025" },
                { value: "2024", label: "Năm 2024" },
                { value: "2023", label: "Năm 2023" },
                { value: "2021", label: "Năm 2021" },
                { value: "2019", label: "Năm 2019" },
                { value: "2014", label: "Năm 2014" },
              ]}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tình trạng hiệu lực:</label>
            <Select
              className="w-full"
              value={form.status}
              onChange={(val) => setForm({ ...form, status: val })}
              options={[
                { value: "ALL", label: "Tất cả tình trạng" },
                { value: "Còn hiệu lực", label: "Còn hiệu lực" },
                { value: "Hết Hiệu lực một phần", label: "Hết hiệu lực một phần" },
                { value: "Chưa áp dụng", label: "Chưa áp dụng" },
                { value: "Hết hiệu lực", label: "Hết hiệu lực" },
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
