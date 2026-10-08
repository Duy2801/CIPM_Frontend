/**
 * component/ui/input.tsx — AntD Input + Tailwind + CVA
 *
 * Wrap Ant Design Input compound component (Input, Input.Search, Input.TextArea, Input.Password).
 * Feature code imports từ đây.
 */

import React from "react";
import AntInput from "antd/es/input";
import type { InputProps as AntInputProps, InputRef } from "antd/es/input";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const inputVariants = cva("transition-all duration-200", {
  variants: {
    intent: {
      default: "",
      /** Clean white input with subtle border */
      clean: "!bg-white !border-slate-300 hover:!border-blue-600 focus:!border-blue-600 shadow-none",
      /** Search bar trong topbar — subtle background */
      search: themeClassNames.primitive.inputSearch,
      /** Dark surface input */
      dark: "!bg-[#0A1628]/90 !border-white/15 !text-white hover:!border-[#00C9A7] focus:!border-[#00C9A7]",
    },
    scale: {
      default: "",
      compact: "!h-7 text-xs",
      comfortable: "!h-10 text-sm",
      md: "!h-11 text-sm",
      lg: "!h-12 text-base",
    },
    rounded: {
      default: "!rounded-lg",
      sm: "!rounded-md",
      full: "!rounded-full",
      none: "!rounded-none",
    },
  },
  defaultVariants: {
    intent: "default",
    scale: "default",
    rounded: "default",
  },
});

export interface InputProps
  extends AntInputProps,
  VariantProps<typeof inputVariants> { }

export interface PasswordProps
  extends React.ComponentProps<typeof AntInput.Password>,
  VariantProps<typeof inputVariants> { }

export const Input = React.forwardRef<InputRef, InputProps>(
  ({ intent, scale, rounded, className, ...props }, ref) => {
    return (
      <AntInput
        ref={ref}
        className={cn(inputVariants({ intent, scale, rounded }), className)}
        {...props}
      />
    );
  }
) as React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> & {
  Search: typeof AntInput.Search;
  TextArea: typeof AntInput.TextArea;
  Password: React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<InputRef>>;
  OTP: typeof AntInput.OTP;
};

/** Attach compound sub-components with CVA support */
Input.Search = AntInput.Search;
Input.TextArea = AntInput.TextArea;
Input.Password = React.forwardRef<InputRef, PasswordProps>(
  ({ intent, scale, rounded, className, ...props }, ref) => (
    <AntInput.Password
      ref={ref}
      className={cn(inputVariants({ intent, scale, rounded }), className)}
      {...props}
    />
  )
) as React.ForwardRefExoticComponent<PasswordProps & React.RefAttributes<InputRef>>;
Input.Password.displayName = "Input.Password";
Input.OTP = AntInput.OTP;
Input.displayName = "Input";
