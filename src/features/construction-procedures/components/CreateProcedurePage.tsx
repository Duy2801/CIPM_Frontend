"use client";

import { useState } from "react";
import { Input, toast } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import ProcedurePageHeader from "./ProcedurePageHeader";
import StepConfigModal from "./StepConfigModal";

/** Quy trình mới bắt đầu trống (hằng số để bảng bước không bị nạp lại mỗi lần render) */
const NO_STEPS: ProcedureStep[] = [];

export interface CreateProcedurePageValues {
  name: string;
  steps: ProcedureStep[];
}

interface CreateProcedurePageProps {
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
  onBack,
  onCreate,
}: CreateProcedurePageProps) {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleCreate = (steps: ProcedureStep[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: "Vui lòng nhập tên quy trình" });
      toast.warning("Thiếu thông tin quy trình", "Vui lòng nhập tên quy trình");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onCreate({ name: trimmed, steps });
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
              if (errors.name) setErrors({});
            }}
            className="h-9 w-full text-xs"
            autoFocus
          />
          {errors.name && <p className="m-0 mt-1 text-[11px] text-rose-500">{errors.name}</p>}
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
