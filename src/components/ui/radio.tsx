import React from "react";
import AntRadio from "antd/es/radio";
import type { RadioProps as AntRadioProps, RadioRef } from "antd/es/radio";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const radioVariants = cva("", {
  variants: {
    intent: {
      default: "",
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export interface RadioProps
  extends AntRadioProps,
    VariantProps<typeof radioVariants> {}

export const Radio = React.forwardRef<RadioRef, RadioProps>(
  ({ intent, className, ...props }, ref) => (
    <AntRadio
      ref={ref}
      className={cn(radioVariants({ intent }), className)}
      {...props}
    />
  )
) as React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<RadioRef>> & {
  Group: typeof AntRadio.Group;
  Button: typeof AntRadio.Button;
};

Radio.Group = AntRadio.Group;
Radio.Button = AntRadio.Button;
Radio.displayName = "Radio";
