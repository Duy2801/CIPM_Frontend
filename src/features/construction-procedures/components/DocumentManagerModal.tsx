"use client";

import React from "react";
import {
  DownloadOutlined,
  FilePdfOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Tag } from "@/components/ui";
import type { ProcedureDocument, ProcedureStep } from "../types/procedure.types";

interface DocumentManagerModalProps {
  open: boolean;
  step: ProcedureStep | null;
  onClose: () => void;
  onAddDocument?: (stepId: string, doc: ProcedureDocument) => void;
  onBackToDetail?: () => void;
}

export default function DocumentManagerModal({
  open,
  step,
  onClose,
  onBackToDetail,
}: DocumentManagerModalProps) {
  if (!step) return null;

  const docs = step.attachments || [];

  return (
    <Drawer
      open={open}
      width="min(680px, 100vw)"
      closable={false}
      onClose={onClose}
      className="[&_.ant-drawer-body]:flex [&_.ant-drawer-body]:flex-col [&_.ant-drawer-body]:min-h-full"
      title={
        <span>
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-[#102A43]">
              Hồ Sơ Pháp Lý – Bước {step.code}
            </span>
            <Tag intent={step.type === "MANDATORY" ? "info" : "warning"} scale="md">
              {step.type === "MANDATORY" ? "Bắt buộc" : "Điều kiện"}
            </Tag>
          </span>
          <span className="block text-xs font-normal text-slate-500 mt-0.5">
            {step.name}
          </span>
        </span>
      }
    >
      <div className="flex-1 flex flex-col justify-between select-none">
        <div className="space-y-4">
          {/* Thẻ tổng quan số lượng hồ sơ */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Danh mục tài liệu đính kèm
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Tổng cộng: <strong className="text-slate-800">{docs.length}</strong> văn bản
              </span>
            </div>
          </div>

          {/* Danh sách các văn bản */}
          {docs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
              Chưa có văn bản nào được đính kèm cho bước này.
            </div>
          ) : (
            <div className="space-y-2.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#007A78]/50 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-base mt-0.5">
                      <FilePdfOutlined />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">
                          [{doc.documentCode}]
                        </span>
                        <span className="font-semibold text-slate-800 leading-snug">
                          {doc.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          Cơ quan: <strong className="text-slate-700">{doc.issuer}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Ngày ký: <strong className="text-slate-700">{doc.issueDate}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Tải lên: <strong className="text-slate-700">{doc.uploadedBy}</strong> ({doc.uploadedAt})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                      {doc.fileSize}
                    </span>
                    <Button
                      scale="compact"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        alert(`Tải xuống tệp: ${doc.fileName}`);
                      }}
                    >
                      Tải về
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer thao tác */}
        <footer className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500 font-normal">
            Tổng cộng: <strong className="text-slate-800 font-semibold">{docs.length}</strong> văn bản
          </div>
          <div className="flex items-center gap-2">
            {onBackToDetail && (
              <Button scale="sm" onClick={onBackToDetail}>
                <RollbackOutlined className="mr-1" />
                Quay lại chi tiết
              </Button>
            )}
            <Button scale="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </footer>
      </div>
    </Drawer>
  );
}
