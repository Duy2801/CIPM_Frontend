import React from "react";
import AntCard from "antd/es/card";
import type { CardProps as AntCardProps } from "antd/es/card";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const cardVariants = cva("overflow-hidden transition-all duration-200", {
  variants: {
    surface: {
      default: "",
      workspace: themeClassNames.primitive.cardWorkspace,
      quiet: themeClassNames.primitive.cardQuiet,
      portal: "bg-white border-slate-200 shadow-xl shadow-slate-200/60 border-t-4 border-t-[#0052CC]",
      elevated: "bg-white border-slate-200 shadow-xl shadow-slate-200/50",
      flat: "bg-white border-slate-200 shadow-none",
    },
    padding: {
      default: "",
      none: "!p-0 [&>.ant-card-body]:!p-0",
      sm: "!p-3 [&>.ant-card-body]:!p-3",
      compact: "!p-4 [&>.ant-card-body]:!p-4",
      md: "!p-4 [&>.ant-card-body]:!p-4",
      comfortable: "!p-6 [&>.ant-card-body]:!p-6",
      spacious: "!p-7 sm:!p-8 [&>.ant-card-body]:!p-7 sm:[&>.ant-card-body]:!p-8",
    },
    rounded: {
      default: "rounded-xl",
      sm: "rounded-lg",
      lg: "rounded-2xl",
      none: "rounded-none",
    },
  },
  defaultVariants: {
    surface: "default",
    padding: "default",
    rounded: "default",
  },
});

export interface CardProps
  extends AntCardProps,
  VariantProps<typeof cardVariants> { }

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ surface, padding, rounded, className, ...props }, ref) => (
    <AntCard
      ref={ref}
      className={cn(cardVariants({ surface, padding, rounded }), className)}
      {...props}
    />
  )
);

Card.displayName = "Card";
