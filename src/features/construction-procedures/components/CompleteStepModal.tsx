"use client";

import React, { useState } from "react";
import {
  CheckCircleFilled,
  FilePdfOutlined,
  PaperClipOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Input, Tag, Text } from "@/components/ui";
import type { ProcedureDocument, ProcedureStep } from "../types/procedure.types";

interface CompleteStepModalProps {
  open: boolean;
  step: ProcedureStep | null;
  onClose: () => void;
  onConfirmComplete: (
    stepId: string,
    completionData: {
      actualEndDate: string;
      notes?: string;
      newDocument?: ProcedureDocument;
    }
  ) => void;
}

export default function CompleteStepModal({
  open,
  step,
  onClose,
  onConfirmComplete,
}: CompleteStepModalProps) {
  const [actualEndDate, setActualEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string>("");

  React.useEffect(() => {
    if (open && step) {
      setActualEndDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setErrorMessage("");
    }
  }, [open, step?.id]);

  if (!step) return null;

  const currentDocsCount = step.attachments?.length || 0;
  const needsDocument = currentDocsCount === 0;

  const handleComplete = () => {
    setErrorMessage("");

    if (!actualEndDate) {
      setErrorMessage("Vui lòng chọn ngày hoàn thành thực tế.");
      return;
    }

    onConfirmComplete(step.id, {
      actualEndDate,
      notes: notes.trim() || undefined,
    });

    setNotes("");
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
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-[#102A43]">
                Xác Nhận Hoàn Thành Bước {step.code}
              </span>
              <Tag intent={step.type === "MANDATORY" ? "danger" : "warning"} scale="sm">
                {step.type === "MANDATORY" ? "Bắt buộc" : "Nếu có"}
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
            intent="primary"
            scale="sm"
            className="!bg-[#DC2626] hover:!bg-[#B91C1C] !text-white"
            icon={<CheckCircleFilled />}
            onClick={handleComplete}
          >
            Xác nhận Hoàn thành Bước
          </Button>
          <Button scale="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <Flex vertical gap={14} className="py-2">
        {/* Thông tin bước */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5 text-slate-700">
          <div className="flex justify-between items-center">
            <span>
              Đơn vị thực hiện: <strong>{step.responsibleUnit}</strong>
            </span>
            <Tag intent={step.type === "MANDATORY" ? "danger" : "warning"} scale="sm">
              {step.type === "MANDATORY" ? "Bắt buộc" : "Nếu có"}
            </Tag>
          </div>
          <div>
            Hạn kế hoạch quy định: <strong>{step.durationMargin}</strong> (
            {step.endDatePlanned || "Chưa thiết lập"})
          </div>
        </div>

        {/* Thông báo Quy tắc 10 */}
        <div
          className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
            needsDocument
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {needsDocument ? (
            <>
              <WarningOutlined className="text-amber-600 text-base shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Cần đính kèm văn bản pháp lý</strong>
                <span>Theo quy tắc kiểm soát, bước này cần tối thiểu 1 văn bản pháp lý đính kèm trước khi hoàn thành.</span>
              </div>
            </>
          ) : (
            <>
              <PaperClipOutlined className="text-[#DC2626] text-base shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Đã có văn bản pháp lý hợp lệ</strong>
                <span>Bước đã có {currentDocsCount} văn bản pháp lý đính kèm, đủ điều kiện để xác nhận hoàn thành.</span>
              </div>
            </>
          )}
        </div>

        {/* Danh sách văn bản hiện có */}
        {currentDocsCount > 0 && (
          <div>
            <Text className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Văn bản pháp lý đã đính kèm ({currentDocsCount}):
            </Text>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {step.attachments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FilePdfOutlined className="text-red-500 text-sm shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        [{doc.documentCode}] {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.issuer} — Ngày ban hành: {doc.issueDate}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                    {doc.fileSize}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Thông tin hoàn thành */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày hoàn thành thực tế *
            </label>
            <Input
              type="date"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người xác nhận
            </label>
            <Input disabled value="Lê Hoàng Minh (Giám đốc Quản lý Dự án)" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ghi chú kết quả thực hiện
          </label>
          <Input.TextArea
            rows={2}
            placeholder="Nhập nhận xét hoặc kết quả phê duyệt nếu có..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
