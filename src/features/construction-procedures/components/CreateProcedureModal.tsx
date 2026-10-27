"use client";

import { useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Select } from "@/components/ui";

export interface CreateProcedureValues {
  name: string;
  department: string;
  /** null = quy trình trống */
  copyFromId: string | null;
}

interface CreateProcedureModalProps {
  /** Các quy trình có thể sao chép */
  sourceOptions: { value: string; label: string }[];
  /** Danh sách tổ phụ trách để chọn */
  departmentOptions: string[];
  defaultDepartment?: string;
  /** Người đang tạo (hiện chỉ xem); không truyền thì ẩn */
  creatorName?: string;
  onClose: () => void;
  onCreate: (values: CreateProcedureValues) => void;
}

const todayVi = () => new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Nhãn trường (dấu * nếu bắt buộc) */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-slate-700 font-semibold mb-1">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

/** Hộp "Thêm quy trình thủ tục mới": tên, tổ phụ trách, nguồn khởi tạo các bước (mở là mount mới) */
export default function CreateProcedureModal({
  sourceOptions,
  departmentOptions,
  defaultDepartment,
  creatorName,
  onClose,
  onCreate,
}: CreateProcedureModalProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState(defaultDepartment ?? "");
  const [source, setSource] = useState<"COPY" | "EMPTY">("EMPTY");
  const [copyFromId, setCopyFromId] = useState("");
  const [error, setError] = useState("");
  const [createdOn] = useState(todayVi);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên quy trình mới");
      return;
    }
    if (!department) {
      setError("Vui lòng chọn tổ phụ trách");
      return;
    }
    if (source === "COPY" && !copyFromId) {
      setError("Vui lòng chọn quy trình muốn sao chép");
      return;
    }
    onCreate({ name: trimmed, department, copyFromId: source === "COPY" ? copyFromId : null });
  };

  return (
    <Modal
      open
      onCancel={onClose}
      centered
      width={600}
      zIndex={1350}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <span>Thêm Quy trình Thủ tục Mới</span>
        </div>
      }
      footer={[
        <Button
          key="confirm-create"
          intent="primary"
          scale="compact"
          icon={<CheckOutlined />}
          className="bg-[#DC2626] border-[#DC2626] text-white font-semibold"
          onClick={handleConfirm}
        >
          Tạo quy trình
        </Button>,
        <Button key="cancel-create" scale="compact" onClick={onClose}>
          Hủy
        </Button>,
      ]}
    >
      <div className="space-y-4 py-2 text-xs">
        <div>
          <FieldLabel required>Tên quy trình</FieldLabel>
          <Input
            placeholder="VD: Quy trình Giám sát công trình đặc thù, Quy trình nghiệm thu nhanh..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onPressEnter={handleConfirm}
            className="w-full text-xs h-9"
            autoFocus
          />
        </div>

        <div>
          <FieldLabel required>Tổ phụ trách</FieldLabel>
          <Select
            aria-label="Tổ phụ trách"
            className="w-full text-xs"
            placeholder="— Chọn tổ phụ trách —"
            showSearch
            optionFilterProp="label"
            value={department || undefined}
            onChange={(val: string) => {
              setDepartment(val);
              if (error) setError("");
            }}
            options={departmentOptions.map((d) => ({ value: d, label: d }))}
            getPopupContainer={() => document.body}
          />
        </div>

        {/* Người tạo / ngày tạo: hệ thống tự ghi */}
        <div className="grid grid-cols-2 gap-3">
          {creatorName && (
            <div>
              <FieldLabel>Người tạo</FieldLabel>
              <Input value={creatorName} disabled className="w-full text-xs h-9" />
            </div>
          )}
          <div>
            <FieldLabel>Ngày tạo</FieldLabel>
            <Input value={createdOn} disabled className="w-full text-xs h-9" />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Nguồn khởi tạo các bước quy trình:</label>
          <div className="space-y-2">
            {/* Sao chép từ một quy trình bất kỳ — chọn ngay trong ô bên dưới */}
            <div
              role="radio"
              aria-checked={source === "COPY"}
              tabIndex={0}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                source === "COPY" ? "border-[#DC2626] bg-red-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
              onClick={() => setSource("COPY")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSource("COPY");
                }
              }}
            >
              <input
                type="radio"
                name="newProfileSource"
                checked={source === "COPY"}
                onChange={() => setSource("COPY")}
                className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
                tabIndex={-1}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800">Sao chép từ quy trình khác</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Chọn bất kỳ quy trình mẫu hoặc quy trình đã lưu để sao chép toàn bộ bước, không cần chuyển sang quy trình
                  đó trước.
                </div>
                <Select
                  aria-label="Quy trình muốn sao chép"
                  className="mt-2 w-full text-xs"
                  placeholder="— Chọn quy trình muốn sao chép —"
                  showSearch
                  optionFilterProp="label"
                  value={copyFromId || undefined}
                  onChange={(val: string) => {
                    setCopyFromId(val);
                    setSource("COPY");
                    if (error) setError("");
                  }}
                  options={sourceOptions}
                  getPopupContainer={() => document.body}
                />
              </div>
            </div>

            <label
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                source === "EMPTY" ? "border-[#DC2626] bg-red-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
              onClick={() => setSource("EMPTY")}
            >
              <input
                type="radio"
                name="newProfileSource"
                checked={source === "EMPTY"}
                onChange={() => setSource("EMPTY")}
                className="mt-0.5 text-[#DC2626] focus:ring-[#DC2626]"
              />
              <div>
                <div className="font-semibold text-slate-800">Quy trình trống (tự thêm bước từ đầu)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Bắt đầu với danh sách rỗng và tự thêm các bước chính, bước con theo nhu cầu.
                </div>
              </div>
            </label>
          </div>
        </div>

        {error && <p className="m-0 text-[11px] text-rose-500 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
