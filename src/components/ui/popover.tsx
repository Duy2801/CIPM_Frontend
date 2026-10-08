/**
 * component/ui/popover.tsx — AntD Popover + Tailwind
 *
 * Wrap Ant Design Popover primitive.
 */

import React from "react";
import AntPopover from "antd/es/popover";
import type { PopoverProps as AntPopoverProps } from "antd/es/popover";
import { cn } from "@/utils/cn";

export interface PopoverProps extends AntPopoverProps {
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({ className, children, ...props }) => {
  return (
    <AntPopover overlayClassName={cn(className)} {...props}>
      {children}
    </AntPopover>
  );
};

Popover.displayName = "Popover";
