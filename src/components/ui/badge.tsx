/**
 * component/ui/badge.tsx — AntD Badge + Tailwind + CVA
 *
 * Wrap Ant Design Badge với CVA variants.
 */

import React from "react";
import AntBadge from "antd/es/badge";
import type { BadgeProps as AntBadgeProps } from "antd/es/badge";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const badgeVariants = cva("", {
  variants: {
    intent: {
      default: "",
      /** Teal count badge — sidebar menu */
      brand: themeClassNames.primitive.badgeBrand,
      /** Red dot/count — urgent notifications */
      danger: themeClassNames.primitive.badgeDanger,
      /** Gold — financial alerts */
      warning: themeClassNames.primitive.badgeWarning,
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export interface BadgeProps
  extends AntBadgeProps,
  VariantProps<typeof badgeVariants> { }

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ intent, className, ...props }, ref) => {
    return (
      <AntBadge
        ref={ref}
        className={cn(badgeVariants({ intent }), className)}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
