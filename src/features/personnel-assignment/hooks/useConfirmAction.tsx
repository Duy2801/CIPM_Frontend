"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { App } from "antd";

interface ConfirmActionOptions {
  title: string;
  description?: ReactNode;
  okText?: string;
  /** Thao tác mang tính gỡ bỏ / thu hồi → nút xác nhận màu đỏ cảnh báo */
  danger?: boolean;
}

/**
 * Hỏi xác nhận trước mọi thao tác thêm / cập nhật trong phân hệ Nhân sự & Phân công.
 * Trả về true khi người dùng đồng ý, false khi hủy — dùng: `if (!(await confirmAction({...}))) return;`
 */
export function useConfirmAction() {
  const { modal } = App.useApp();

  return useCallback(
    ({ title, description, okText = "Xác nhận", danger = false }: ConfirmActionOptions) =>
      new Promise<boolean>((resolve) => {
        modal.confirm({
          centered: true,
          width: 440,
          icon: null,
          zIndex: 1400,
          title,
          content: description ? <div className="m-0 text-xs leading-relaxed text-slate-600">{description}</div> : null,
          okText,
          cancelText: "Hủy",
          okButtonProps: danger ? { danger: true } : { className: "!bg-[#DC2626] !border-[#DC2626] hover:!bg-[#B91C1C]" },
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [modal]
  );
}
