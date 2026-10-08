"use client";

import React, { useState } from "react";
import {
  FileTextOutlined,
  StopOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Input, Tag, Text } from "@/components/ui";
import type { ProcedureStep } from "../types/procedure.types";

interface SkipStepModalProps {
  open: boolean;
  step: ProcedureStep | null;
  onClose: () => void;
  onConfirmSkip: (
    stepId: string,
    skipData: {
      reason: string;
      skipDocumentCode: string;
      skipIssuer: string;
    }
  ) => void;
}

export default function SkipStepModal({
  open,
  step,
  onClose,
  onConfirmSkip,
}: SkipStepModalProps) {
  const [skipDocumentCode, setSkipDocumentCode] = useState<string>("");
  const [skipIssuer, setSkipIssuer] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  React.useEffect(() => {
    if (open && step) {
      setSkipDocumentCode("");
      setSkipIssuer("");
      setReason("");
      setErrorMessage("");
    }
  }, [open, step?.id]);

  if (!step) return null;

  const handleSubmit = () => {
    setErrorMessage("");

    if (!skipDocumentCode.trim()) {
      setErrorMessage(
        "Quy tắc 7: Bắt buộc phải có Số hiệu văn bản căn cứ cho phép bỏ qua bước."
      );
      return;
    }

    if (!skipIssuer.trim()) {
      setErrorMessage("Vui lòng nhập Cơ quan ban hành văn bản cho phép bỏ qua.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 15) {
      setErrorMessage(
        "Quy tắc 7: Bắt buộc phải nhập lý do giải trình bằng văn bản (tối thiểu 15 ký tự)."
      );
      return;
    }

    onConfirmSkip(step.id, {
      reason: reason.trim(),
      skipDocumentCode: skipDocumentCode.trim(),
      skipIssuer: skipIssuer.trim(),
    });

    // Reset form
    setSkipDocumentCode("");
    setSkipIssuer("");
    setReason("");
    setErrorMessage("");
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={false}
      destroyOnClose
      width="min(680px, 100vw)"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
            <StopOutlined className="text-base" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">
                Bỏ Qua Bước {step.code}
              </span>
              <Tag intent="warning" scale="sm">
                Cần căn cứ văn bản
              </Tag>
            </div>
            <p className="text-xs font-normal text-slate-500 mt-0.5 truncate">
              {step.name}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-start gap-2.5 py-1">
          <Button
            intent="danger"
            scale="sm"
            icon={<FileTextOutlined />}
            onClick={handleSubmit}
          >
            Lưu văn bản & Đánh dấu Bỏ qua
          </Button>
          <Button scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <Flex vertical gap={14} className="py-2">
        {/* Căn cứ pháp lý & giải trình */}
        <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <WarningFilled className="text-amber-600 text-base shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-semibold text-amber-900">
              Quy định về việc bỏ qua bước thủ tục:
            </strong>
            <span>
              Để chuyển sang bước kế tiếp khi bước này không thực hiện, bắt buộc phải có{" "}
              <strong>văn bản phê duyệt cho phép bỏ qua</strong> kèm nội dung giải trình. Thông tin này sẽ được lưu trữ đầy đủ trong Nhật ký thay đổi của dự án.
            </span>
          </div>
        </div>

        {/* Form nhập lý do văn bản */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số hiệu văn bản căn cứ *
            </label>
            <Input
              placeholder="Ví dụ: 105/SKHĐT-ĐKKD"
              value={skipDocumentCode}
              onChange={(e) => setSkipDocumentCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cơ quan ban hành văn bản *
            </label>
            <Input
              placeholder="Ví dụ: Sở Kế hoạch và Đầu tư Kiên Giang"
              value={skipIssuer}
              onChange={(e) => setSkipIssuer(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nội dung lý do giải trình bằng văn bản (Bắt buộc) *
          </label>
          <Input.TextArea
            rows={3}
            placeholder="Giải trình cụ thể căn cứ pháp lý hoặc điều kiện dự án cho phép miễn/bỏ qua bước này..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="text-[11px] text-slate-500 mt-1">
            Yêu cầu ghi rõ lý do thực tế (ví dụ: hạn mức gói thầu, không thuộc đối
            tượng thẩm định giá độc lập, thỏa thuận liên ngành...).
          </div>
        </div>

        {errorMessage && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {errorMessage}
          </div>
        )}
      </Flex>
    </Drawer>
  );
}
