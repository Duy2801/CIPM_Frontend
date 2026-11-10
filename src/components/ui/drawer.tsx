"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import AntDrawer from "antd/es/drawer";
import type { DrawerProps as AntDrawerProps } from "antd/es/drawer";
import { cn } from "@/utils/cn";
import {
  getDrawerClosable,
  getDrawerSize,
  getDrawerZIndex,
  STANDARD_DRAWER_WIDTH,
} from "./drawer-close";

export { STANDARD_DRAWER_WIDTH };

export type DrawerProps = Omit<AntDrawerProps, "width"> & {
  /** @deprecated Use `size` for new callers. */
  width?: string | number;
  /** Nút quay lại (←) bên trái tiêu đề, bấm là đóng drawer — thay cho nút "Đóng" ở chân drawer */
  showBack?: boolean;
};

export function Drawer({
  closable = false,
  closeIcon = null,
  size,
  width,
  zIndex,
  className,
  showBack = false,
  title,
  ...props
}: DrawerProps) {
  const closePlacement = getDrawerClosable(closable);

  return (
    <AntDrawer
      className={cn(
        "[&_.ant-drawer-footer]:!flex [&_.ant-drawer-footer]:!flex-row [&_.ant-drawer-footer]:!justify-start [&_.ant-drawer-footer]:!items-center [&_.ant-drawer-footer]:!gap-2.5",
        className,
      )}
      {...props}
      title={
        showBack ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => props.onClose?.(e)}
              aria-label="Quay lại"
              title="Quay lại"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-solid border-slate-200 bg-white text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeftOutlined />
            </button>
            <div className="min-w-0 flex-1">{title}</div>
          </div>
        ) : (
          title
        )
      }
      size={getDrawerSize(size, width)}
      zIndex={getDrawerZIndex(zIndex)}
      closable={
        closable === true
          ? (closePlacement ? { placement: closePlacement } : true)
          : false
      }
      closeIcon={closable === true ? closeIcon : null}
    />
  );
}
