import React from "react";
import AntCheckbox from "antd/es/checkbox";
import type { CheckboxProps as AntCheckboxProps, CheckboxRef } from "antd/es/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const checkboxVariants = cva("", {
  variants: {
    intent: {
      default: "",
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export interface CheckboxProps
  extends AntCheckboxProps,
    VariantProps<typeof checkboxVariants> {}

export const Checkbox = React.forwardRef<CheckboxRef, CheckboxProps>(
  ({ intent, className, ...props }, ref) => (
    <AntCheckbox
      ref={ref}
      className={cn(checkboxVariants({ intent }), className)}
      {...props}
    />
  )
) as React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<CheckboxRef>> & {
  Group: typeof AntCheckbox.Group;
};

Checkbox.Group = AntCheckbox.Group;
Checkbox.displayName = "Checkbox";
