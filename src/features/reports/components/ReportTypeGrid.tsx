"use client";

import { useState } from "react";
import { App } from "antd";
import { DeleteOutlined, FolderOpenOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { Input, Modal } from "@/components/ui";
import { formatDate } from "../utils/report-format";
import type { ReportType } from "../types/report.types";

export interface ReportTypeSummary {
  type: ReportType;
  count: number;
  /** Lần nhập gần nhất (ms) */
  lastAt?: number;
}

/** Cấp 1: các loại báo cáo — bấm để xem danh sách báo cáo của loại đó */
export default function ReportTypeGrid({
  summaries,
  onOpen,
  onAddType,
  onRemoveType,
}: {
  summaries: ReportTypeSummary[];
  onOpen: (typeId: string) => void;
  onAddType: (name: string, description?: string) => void;
  onRemoveType: (type: ReportType) => void;
}) {
  const { modal } = App.useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const duplicate = summaries.some((s) => s.type.name.trim().toLowerCase() === name.trim().toLowerCase());

  const closeAdd = () => {
    setAdding(false);
    setName("");
    setDescription("");
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaries.map(({ type, count, lastAt }) => (
          <div
            key={type.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(type.id)}
            onKeyDown={(e) => e.key === "Enter" && onOpen(type.id)}
            className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:shadow-md focus-visible:border-[#DC2626]/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-[#DC2626]">
              <FolderOpenOutlined />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 truncate text-[15px] font-bold text-slate-900" title={type.name}>
                {type.name}
              </h3>
              {type.description && <p className="m-0 mt-1 line-clamp-2 text-xs text-slate-500">{type.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">{count} báo cáo</span>
                {lastAt && <span className="text-slate-400">Cập nhật {formatDate(lastAt)}</span>}
              </div>
            </div>
            <RightOutlined className="mt-1 text-xs text-slate-300 transition-colors group-hover:text-[#DC2626]" />
            {/* Loại tự thêm, chưa có báo cáo: xóa được */}
            {type.custom && count === 0 && (
              <button
                type="button"
                aria-label={`Xóa loại ${type.name}`}
                title="Xóa loại báo cáo"
                onClick={(e) => {
                  e.stopPropagation();
                  modal.confirm({
                    title: "Xóa loại báo cáo?",
                    content: `Loại "${type.name}" sẽ bị xóa.`,
                    okText: "Xóa",
                    okButtonProps: { danger: true },
                    cancelText: "Hủy",
                    onOk: () => onRemoveType(type),
                  });
                }}
                className="absolute bottom-3 right-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-[#DC2626] group-hover:opacity-100"
              >
                <DeleteOutlined />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 text-sm font-semibold text-slate-500 transition-colors hover:border-[#DC2626]/50 hover:text-[#DC2626]"
        >
          <PlusOutlined />
          Thêm loại báo cáo
        </button>
      </div>

      <Modal
        open={adding}
        title="Thêm loại báo cáo"
        okText="Thêm"
        cancelText="Hủy"
        centered
        destroyOnHidden
        onCancel={closeAdd}
        okButtonProps={{ disabled: !name.trim() || duplicate }}
        onOk={() => {
          onAddType(name, description);
          closeAdd();
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Mô tả</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Không bắt buộc" />
          </div>
        </div>
      </Modal>
    </>
  );
}
