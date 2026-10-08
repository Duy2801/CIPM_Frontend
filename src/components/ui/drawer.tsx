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
};

export function Drawer({
  closable = false,
  closeIcon = null,
  size,
  width,
  zIndex,
  className,
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
