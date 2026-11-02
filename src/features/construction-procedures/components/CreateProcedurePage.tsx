"use client";

import { useState } from "react";
import { Form, Input, toast } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";
import { DEFAULT_PROCEDURE_VERSION } from "../utils/procedure-library";
import ProcedurePageHeader from "./ProcedurePageHeader";
import ProcedureStepEditor from "./ProcedureStepEditor";
import ProcedureVersionInput from "./ProcedureVersionInput";

const NO_STEPS: ProcedureStep[] = [];

export interface CreateProcedurePageValues {
  name: string;
  version: string;
  steps: ProcedureStep[];
}

interface CreateProcedurePageProps {
  onBack: () => void;
  onCreate: (values: CreateProcedurePageValues) => void;
}

export default function CreateProcedurePage({ onBack, onCreate }: CreateProcedurePageProps) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState(DEFAULT_PROCEDURE_VERSION);
  const [nameError, setNameError] = useState("");

  const handleCreate = (steps: ProcedureStep[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Vui lòng nhập tên quy trình");
      toast.warning("Thiếu thông tin quy trình", "Vui lòng nhập tên quy trình");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onCreate({ name: trimmed, version: version.trim(), steps });
  };

  return (
    <div className="space-y-3">
      <ProcedurePageHeader
        title="Thêm quy trình mới"
        subtitle="Nhập thông tin chung, thêm các bước bên dưới rồi bấm “Tạo quy trình”"
        onBack={onBack}
      />

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <Form
          layout="vertical"
          layoutType="compact"
          requiredMark
          className="flex flex-wrap items-start gap-4 [&_.ant-form-item]:!mb-0 [&_.ant-form-item-label>label]:text-xs [&_.ant-form-item-label>label]:font-semibold"
        >
          <Form.Item
            label="Tên quy trình"
            required
            validateStatus={nameError ? "error" : undefined}
            help={nameError || undefined}
            className="w-full sm:w-96"
          >
            <Input
              placeholder="VD: Quy trình Giám sát công trình đặc thù..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              className="h-9 w-full text-xs"
              autoFocus
            />
          </Form.Item>

          <Form.Item label="Version" className="w-40">
            <ProcedureVersionInput value={version} onChange={setVersion} className="h-9 w-full text-xs" />
          </Form.Item>
        </Form>
      </div>

      <ProcedureStepEditor
        steps={NO_STEPS}
        onCreate={handleCreate}
        addLockedReason={name.trim() ? undefined : "Nhập tên quy trình trước khi thêm bước"}
      />
    </div>
  );
}
