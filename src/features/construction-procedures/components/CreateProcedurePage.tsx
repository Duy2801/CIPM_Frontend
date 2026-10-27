"use client";

import { useState } from "react";
import { Input, Select, toast } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import ProcedurePageHeader from "./ProcedurePageHeader";
import StepConfigModal from "./StepConfigModal";

/** Quy trình mới bắt đầu trống (hằng số để bảng bước không bị nạp lại mỗi lần render) */
const NO_STEPS: ProcedureStep[] = [];

export interface CreateProcedurePageValues {
  name: string;
  department: string;
  steps: ProcedureStep[];
}

interface CreateProcedurePageProps {
  departmentOptions: string[];
  onBack: () => void;
  onCreate: (values: CreateProcedurePageValues) => void;
}

/** Nhãn trường (dấu * nếu bắt buộc) */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-slate-700">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

/** Trang "Thêm quy trình mới": nhập thông tin chung rồi thêm bước ngay bên dưới, bấm "Tạo quy trình" mới lưu */
export default function CreateProcedurePage({
  departmentOptions,
  onBack,
  onCreate,
}: CreateProcedurePageProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; department?: string }>({});

  const handleCreate = (steps: ProcedureStep[]) => {
    const trimmed = name.trim();
    const nextErrors = {
      name: trimmed ? undefined : "Vui lòng nhập tên quy trình",
      department: department ? undefined : "Vui lòng chọn tổ phụ trách",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.department) {
      toast.warning("Thiếu thông tin quy trình", nextErrors.name ?? nextErrors.department);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onCreate({ name: trimmed, department, steps });
  };

  return (
    <div className="space-y-3">
      <ProcedurePageHeader
        title="Thêm quy trình mới"
        subtitle="Nhập thông tin chung, thêm các bước bên dưới rồi bấm “Tạo quy trình”"
        onBack={onBack}
      />

      {/* Thông tin chung */}
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="w-full sm:w-96">
          <FieldLabel required>Tên quy trình</FieldLabel>
          <Input
            placeholder="VD: Quy trình Giám sát công trình đặc thù..."
            value={name}
            status={errors.name ? "error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className="h-9 w-full text-xs"
            autoFocus
          />
          {errors.name && <p className="m-0 mt-1 text-[11px] text-rose-500">{errors.name}</p>}
        </div>

        <div className="w-full sm:w-72">
          <FieldLabel required>Tổ phụ trách</FieldLabel>
          <Select
            aria-label="Tổ phụ trách"
            className="w-full text-xs"
            placeholder="— Chọn tổ phụ trách —"
            showSearch
            optionFilterProp="label"
            status={errors.department ? "error" : undefined}
            value={department || undefined}
            onChange={(val: string) => {
              setDepartment(val);
              if (errors.department) setErrors((prev) => ({ ...prev, department: undefined }));
            }}
            options={departmentOptions.map((d) => ({ value: d, label: d }))}
          />
          {errors.department && <p className="m-0 mt-1 text-[11px] text-rose-500">{errors.department}</p>}
        </div>

      </div>

      <StepConfigModal
        open
        variant="page"
        steps={NO_STEPS}
        onBack={onBack}
        onCreateNew={handleCreate}
        onClose={() => {}}
        onSaveConfig={() => {}}
      />
    </div>
  );
}
