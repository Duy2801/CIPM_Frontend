"use client";

import { useMemo, useState } from "react";
import {
  ClockCircleOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Select, Tag, Tooltip } from "@/components/ui";
import type { ProcedureHistoryLog, ProcedureStep } from "../types/procedure.types";

interface ProcedureAuditLogModalProps {
  open: boolean;
  onClose: () => void;
  history: ProcedureHistoryLog[];
  steps?: ProcedureStep[];
  projectName: string;
}

export default function ProcedureAuditLogModal({
  open,
  onClose,
  history,
  projectName,
}: ProcedureAuditLogModalProps) {
  const [selectedActionType, setSelectedActionType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Lọc danh sách theo các điều kiện
  const filteredLogs = useMemo(() => {
    return history.filter((log) => {

      // Lọc theo loại hành động
      if (selectedActionType !== "ALL") {
        if (selectedActionType === "COMPLETE" && log.action !== "COMPLETE_STEP") return false;
        if (selectedActionType === "START" && log.action !== "START_STEP") return false;
        if (selectedActionType === "SKIP" && log.action !== "SKIP_STEP") return false;
        if (selectedActionType === "TOGGLE" && log.action !== "TOGGLE_STEP") return false;
        if (
          selectedActionType === "DOCUMENT" &&
          log.action !== "ADD_DOCUMENT" &&
          log.action !== "REMOVE_DOCUMENT"
        ) {
          return false;
        }
      }

      // Tìm kiếm từ khóa
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchDetails = log.details.toLowerCase().includes(term);
        const matchStep =
          log.stepCode.toLowerCase().includes(term) ||
          log.stepName.toLowerCase().includes(term);
        const matchUser =
          log.performedBy.toLowerCase().includes(term) ||
          log.role.toLowerCase().includes(term);
        const matchReason = log.reason ? log.reason.toLowerCase().includes(term) : false;
        const matchDoc = log.skipDocumentCode
          ? log.skipDocumentCode.toLowerCase().includes(term)
          : false;

        if (!matchDetails && !matchStep && !matchUser && !matchReason && !matchDoc) {
          return false;
        }
      }

      return true;
    });
  }, [history, selectedActionType, searchTerm]);

  // Sắp xếp mới nhất trước
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredLogs]);

  const getActionTag = (action: ProcedureHistoryLog["action"], label: string) => {
    // Rút gọn nhãn thao tác để tag vừa vặn, không bị tràn hay đè chữ vào cột nội dung
    let cleanLabel = label;
    if (action === "SKIP_STEP") cleanLabel = "Bỏ qua bước";
    else if (action === "COMPLETE_STEP") cleanLabel = "Hoàn thành bước";
    else if (action === "START_STEP") cleanLabel = "Khởi động bước";
    else if (action === "TOGGLE_STEP") {
      cleanLabel = label.toLowerCase().includes("tắt") ? "Tắt bước" : "Bật bước";
    }

    switch (action) {
      case "COMPLETE_STEP":
        return (
          <Tag intent="success" scale="sm">
            {cleanLabel}
          </Tag>
        );
      case "START_STEP":
        return (
          <Tag intent="brand" scale="sm">
            {cleanLabel}
          </Tag>
        );
      case "SKIP_STEP":
        return (
          <Tag intent="warning" scale="sm">
            {cleanLabel}
          </Tag>
        );
      case "TOGGLE_STEP":
        return (
          <Tag intent="default" scale="sm">
            {cleanLabel}
          </Tag>
        );
      case "ADD_DOCUMENT":
      case "REMOVE_DOCUMENT":
        return (
          <Tag intent="brand" scale="sm">
            {cleanLabel}
          </Tag>
        );
      default:
        return (
          <Tag intent="default" scale="sm">
            {cleanLabel}
          </Tag>
        );
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnHidden
      width="min(1180px, calc(100vw - var(--cipm-sidebar-width, 0px) - 56px))"
      centered
      wrapClassName="cipm-centered-modal-wrap"
      className="m-0 max-w-[calc(100vw-32px)]"
      transitionName=""
      maskTransitionName=""
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
            <HistoryOutlined className="text-base" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Nhật Ký Thay Đổi & Lịch Sử Thủ Tục
            </h3>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Dự án: <strong className="text-slate-700">{projectName}</strong> — Theo dõi chi tiết mọi thay đổi, chuyển bước và giải trình
            </p>
          </div>
        </div>
      }
      footer={[
        <div key="footer-row" className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-normal">
            Hiển thị <strong className="text-slate-800 font-semibold">{sortedLogs.length}</strong> / {history.length} sự kiện được ghi nhận
          </div>
          <Button key="close" scale="compact" onClick={onClose}>
            Đóng
          </Button>
        </div>,
      ]}
    >
      <div className="h-[520px] flex flex-col gap-3 pr-1 pb-2 text-xs">
        {/* Thanh công cụ lọc & tìm kiếm 1 hàng: Cố định */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Tìm kiếm */}
            <Input
              placeholder="Tìm nội dung, mã bước, người thực hiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              className="h-8 text-xs max-w-[280px]"
            />

            {/* Lọc theo loại thao tác */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="hidden sm:inline text-[11px] font-medium text-slate-500 shrink-0">
                Thao tác:
              </span>
              <Select
                className="w-[170px] text-xs"
                size="small"
                value={selectedActionType}
                onChange={setSelectedActionType}
                options={[
                  { value: "ALL", label: "Tất cả thao tác" },
                  { value: "START", label: "Khởi động bước" },
                  { value: "COMPLETE", label: "Hoàn thành bước" },
                  { value: "SKIP", label: "Bỏ qua bước" },
                  { value: "TOGGLE", label: "Bật / Tắt bước" },
                  { value: "DOCUMENT", label: "Hồ sơ văn bản" },
                ]}
              />
            </div>
          </div>

          {/* Nút đặt lại bộ lọc nếu đang áp dụng */}
          {(searchTerm || selectedActionType !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedActionType("ALL");
              }}
              className="text-xs text-[#007A78] hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Bảng danh sách nhật ký: Cố định kích thước khung, y hệt form cấu hình quy trình */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white min-h-0">
          {/* Table Header: Cố định */}
          <div className="shrink-0 flex items-center gap-4 border-b border-slate-200 bg-slate-100/90 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <div className="w-36 shrink-0">Thời gian</div>
            <div className="w-60 shrink-0">Bước thủ tục</div>
            <div className="w-36 shrink-0">Thao tác</div>
            <div className="min-w-0 flex-1">Nội dung chi tiết & Căn cứ</div>
            <div className="w-44 shrink-0 text-right">Người thực hiện</div>
          </div>

          {/* Table Rows: Cuộn mượt bên trong, min-h-0 */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin] min-h-0">
            {sortedLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
                Không tìm thấy bản ghi lịch sử nào phù hợp với bộ lọc.
              </div>
            ) : (
                sortedLogs.map((log, index) => {
                  const isSkip = log.action === "SKIP_STEP";
                  const isComplete = log.action === "COMPLETE_STEP";

                  return (
                    <div
                      key={log.id || index}
                      className={`flex items-start gap-4 px-4 py-3 transition-colors ${
                        isSkip
                          ? "bg-amber-50/25 hover:bg-amber-50/45"
                          : isComplete
                          ? "bg-emerald-50/20 hover:bg-emerald-50/35"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Thời gian */}
                      <div className="w-36 shrink-0 pt-0.5 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <ClockCircleOutlined className="text-slate-400 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>

                      {/* Bước thủ tục */}
                      <div className="w-60 shrink-0">
                        <div className="flex items-start gap-1.5">
                          <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold font-mono text-slate-800 shrink-0">
                            {log.stepCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 leading-snug">
                            {log.stepName}
                          </span>
                        </div>
                      </div>

                      {/* Loại thao tác */}
                      <div className="w-36 shrink-0 pt-0.5">
                        {getActionTag(log.action, log.actionLabel)}
                      </div>

                      {/* Nội dung chi tiết & Căn cứ */}
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {log.details}
                        </p>

                        {/* Căn cứ văn bản & Lý do bỏ qua nếu có */}
                        {log.reason && (
                          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-950 shadow-2xs">
                            <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-[11px]">
                              <FileProtectOutlined className="text-xs text-amber-700 shrink-0" />
                              <span>Căn cứ văn bản: <strong className="font-bold text-amber-950">{log.skipDocumentCode || "Theo hồ sơ"}</strong></span>
                            </div>
                            <div className="mt-1 text-[11px] italic text-amber-900/90 pl-3 border-l-2 border-amber-400">
                              &ldquo;{log.reason}&rdquo;
                            </div>
                          </div>
                        )}

                        {/* Đính kèm văn bản tham chiếu */}
                        {log.documentReference && !log.reason && (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] text-teal-800 font-medium">
                            <FileTextOutlined className="text-xs text-teal-600" />
                            <span>Văn bản: <strong>{log.documentReference}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Người thực hiện */}
                      <div className="w-44 shrink-0 text-right pt-0.5">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-900">
                          <UserOutlined className="text-slate-400 text-[11px]" />
                          <span>{log.performedBy}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {log.role}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
    </Modal>
  );
}
