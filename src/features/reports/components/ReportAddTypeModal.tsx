"use client";

import { useState } from "react";
import { Input, Modal } from "@/components/ui";
import { useReportActions } from "../hooks/useReportActions";
import { useReportTypes } from "../hooks/useReportQueries";

interface ReportAddTypeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ReportAddTypeModal({ open, onClose }: ReportAddTypeModalProps) {
  const types = useReportTypes();
  const { addType } = useReportActions();
  const [name, setName] = useState("");
  const duplicate = types.some((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase());

  const close = () => {
    setName("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Thêm loại báo cáo"
      okText="Thêm"
      cancelText="Hủy"
      centered
      destroyOnHidden
      onCancel={close}
      okButtonProps={{ disabled: !name.trim() || duplicate }}
      onOk={() => {
        void addType(name);
        close();
      }}
    >
      <div className="flex flex-col gap-3 pt-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Tên loại báo cáo<span className="text-rose-500"> *</span>
          </label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Báo cáo quyết toán"
            status={duplicate ? "error" : undefined}
          />
          {duplicate && <p className="m-0 mt-1 text-[11px] text-rose-600">Loại báo cáo này đã có.</p>}
        </div>
      </div>
    </Modal>
  );
}
