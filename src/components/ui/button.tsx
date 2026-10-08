/**
 * component/ui/button.tsx — AntD Button + Tailwind + CVA
 *
 * Wrap Ant Design Button với CVA variants cho project-wide styling.
 * Feature code import từ đây, không import trực tiếp từ 'antd'.
 */

import React from "react";
import AntButton from "antd/es/button";
import type { ButtonProps as AntButtonProps } from "antd/es/button";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none",
  {
    variants: {
      /** Semantic visual intent */
      intent: {
        default: "",
        /** Brand Teal / Primary Action */
        primary:
          "!bg-[#007A78] !border-[#007A78] !text-white hover:!bg-[#006361] hover:!border-[#006361] shadow-sm font-semibold",
        /** Brand Teal */
        brand:
          "!bg-[#00C9A7] !border-[#00C9A7] !text-[#0A1628] hover:!bg-[#00A88C] font-semibold",
        /** Subtle Outline Button */
        outline:
          "!bg-white !border-slate-300 !text-slate-700 hover:!border-[#0F4C81] hover:!text-[#0F4C81]",
        /** Secondary / Standard Neutral Button */
        secondary:
          "!bg-white !border-slate-300 !text-slate-700 hover:!border-[#007A78] hover:!text-[#007A78] shadow-2xs",
        /** Subtle Soft Background */
        subtle:
          "!bg-slate-100 !text-slate-700 !border-transparent hover:!bg-slate-200",
        /** Inline Clean Navigation Link */
        link:
          "!p-0 !h-auto !bg-transparent !border-none !text-slate-500 hover:!text-[#0F4C81] hover:underline !inline-flex font-normal",
        /** Highlight Text Link (e.g. Quên mật khẩu) */
        textLink:
          "!p-0 !h-auto !bg-transparent !border-none !text-[#0F4C81] hover:!text-[#072F57] hover:underline !inline-flex font-medium",
        /** Danger / Red */
        danger:
          "!bg-[#FF5B5B] !border-[#FF5B5B] !text-white hover:!bg-[#E03A3A]",
        glass: themeClassNames.primitive.buttonGlass,
        gradient: themeClassNames.primitive.buttonGradient,
        ghost: themeClassNames.primitive.buttonGhost,
      },
      /** Size scale */
      scale: {
        default: "",
        inline: "!h-auto !p-0 leading-normal",
        xs: "!h-6 !px-2 text-xs",
        compact: "!h-7 !px-2.5 text-xs",
        sm: "!h-8 !px-3 text-xs",
        comfortable: "!h-10 !px-5 text-sm",
        md: "!h-11 !px-5 text-sm",
        lg: "!h-12 !px-6 text-base font-semibold",
        hero: "!h-12 !px-8 text-base font-bold rounded-xl",
      },
      /** Width */
      fullWidth: {
        true: "w-full",
        false: "",
      },
      /** Border Radius */
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
      fullWidth: false,
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends AntButtonProps,
  VariantProps<typeof buttonVariants> { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent, scale, fullWidth, rounded, className, ...props }, ref) => {
    return (
      <AntButton
        ref={ref}
        className={cn(buttonVariants({ intent, scale, fullWidth, rounded }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
