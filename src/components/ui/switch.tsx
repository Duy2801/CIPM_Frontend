import React from "react";
import AntSwitch from "antd/es/switch";
import type { SwitchProps as AntSwitchProps } from "antd/es/switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const switchVariants = cva("", {
  variants: {
    intent: {
      default: "",
      brand: "!bg-[#007A78]",
    },
    size: {
      default: "",
      small: "",
    },
  },
  defaultVariants: {
    intent: "default",
    size: "default",
  },
});

export interface SwitchProps
  extends Omit<AntSwitchProps, "size">,
    VariantProps<typeof switchVariants> {
  size?: "default" | "small";
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ intent, size, className, ...props }, ref) => (
    <AntSwitch
      ref={ref}
      size={size === "small" ? "small" : "default"}
      className={cn(switchVariants({ intent, size }), className)}
      {...props}
    />
  )
);

Switch.displayName = "Switch";
