/**
 * component/ui/dropdown.tsx — AntD Dropdown + Tailwind
 *
 * Wrap Ant Design Dropdown primitive.
 */

import React from "react";
import AntDropdown from "antd/es/dropdown";
import type { DropdownProps as AntDropdownProps } from "antd/es/dropdown";
import { cn } from "@/utils/cn";

export interface DropdownProps extends AntDropdownProps {
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ className, children, ...props }) => {
  return (
    <AntDropdown className={cn(className)} {...props}>
      {children}
    </AntDropdown>
  );
};

Dropdown.displayName = "Dropdown";
