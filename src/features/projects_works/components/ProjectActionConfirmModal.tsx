"use client";

import React from "react";
import { WarningOutlined, LockOutlined, DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Modal, Button } from "@/components/ui";
import type { ProjectItem } from "../types/project.types";

export type ProjectActionType =
  | "rule5_warning" // Có phát sinh giải ngân -> Không được xóa, chuyển sang Đóng
  | "close_confirm" // Xác nhận đóng dự án bình thường
  | "delete_confirm" // Xác nhận xóa vĩnh viễn khi lũy kế = 0
  | "reopen_confirm"; // Mở lại trạng thái hoạt động

export interface ProjectActionConfirmModalProps {
  open: boolean;
  type: ProjectActionType;
  project: ProjectItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ProjectActionConfirmModal({
  open,
  type,
  project,
  onClose,
  onConfirm,
}: ProjectActionConfirmModalProps) {
  if (!project) return null;

  const isRule5 = type === "rule5_warning";
  const isClose = type === "close_confirm";
  const isDelete = type === "delete_confirm";
  const isReopen = type === "reopen_confirm";

  let icon = <WarningOutlined className="text-lg text-amber-600" />;
  let iconBg = "bg-amber-100";
  let title = "Đóng dự án";
  let confirmText = "Chuyển sang Đóng";
  let confirmClass = "bg-[#007A78] hover:bg-[#005F5D]";

  if (isClose) {
    icon = <LockOutlined className="text-lg text-[#007A78]" />;
    iconBg = "bg-teal-100";
    title = "Xác nhận đóng dự án";
    confirmText = "Đóng dự án";
    confirmClass = "bg-[#007A78] hover:bg-[#005F5D]";
  } else if (isDelete) {
    icon = <DeleteOutlined className="text-lg text-rose-600" />;
    iconBg = "bg-rose-100";
    title = "Xác nhận xóa dự án";
    confirmText = "Xóa vĩnh viễn";
    confirmClass = "bg-rose-600 hover:bg-rose-700";
  } else if (isReopen) {
    icon = <CheckCircleOutlined className="text-lg text-emerald-600" />;
    iconBg = "bg-emerald-100";
    title = "Mở lại dự án hoạt động";
    confirmText = "Mở lại";
    confirmClass = "bg-[#007A78] hover:bg-[#005F5D]";
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      wrapClassName="cipm-centered-modal-wrap"
      width={460}
      transitionName=""
      maskTransitionName=""
      destroyOnHidden
      closable={false}
      className="m-0"
    >
      <div className="flex flex-col gap-3.5 p-1 select-none">
        {/* Header tinh gọn */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 m-0 leading-tight">
              {title}
            </h3>
            <p className="text-[11px] font-mono text-slate-500 m-0 mt-0.5">
              {project.code}
            </p>
          </div>
        </div>

        {/* Nội dung trực diện, đơn giản */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs leading-relaxed text-slate-700 space-y-1.5">
          <div className="font-semibold text-slate-900 line-clamp-2">
            {project.name}
          </div>

          {isRule5 && (
            <p className="text-[11.5px] text-slate-600 m-0">
              Đã giải ngân: <strong className="text-rose-600 font-mono">{project.disbursedAmount.toFixed(2)} tỷ VNĐ</strong>.
              Dự án đã có phát sinh tài chính không được phép xóa, chỉ chuyển sang trạng thái <strong>&quot;Đóng&quot;</strong> để lưu trữ hồ sơ.
            </p>
          )}

          {isClose && (
            <p className="text-[11.5px] text-slate-600 m-0">
              Chuyển trạng thái dự án sang <strong>&quot;Đóng&quot;</strong> và ngưng cập nhật tiến độ tuần.
            </p>
          )}

          {isDelete && (
            <p className="text-[11.5px] text-rose-600 font-medium m-0">
              Dự án chưa phát sinh tài chính (0.00 tỷ). Bạn có chắc chắn muốn xóa vĩnh viễn khỏi danh mục hệ thống?
            </p>
          )}

          {isReopen && (
            <p className="text-[11.5px] text-slate-600 m-0">
              Mở lại trạng thái hoạt động để tiếp tục theo dõi và cập nhật tiến độ tuần.
            </p>
          )}
        </div>

        {/* 2 nút hành động căn đều: Nút chức năng đứng TRƯỚC, Đóng đứng SAU */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button
            className={`w-full h-9 rounded-lg text-white font-semibold text-xs tracking-wide shadow-xs border-0 transition-colors ${confirmClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <Button
            className="w-full h-9 rounded-lg text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 font-medium text-xs tracking-wide transition-colors"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
