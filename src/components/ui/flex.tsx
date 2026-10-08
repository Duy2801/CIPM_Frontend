/**
 * component/ui/flex.tsx — AntD Flex + Tailwind + CVA
 *
 * Wrap Ant Design Flex với CVA layout variants.
 * Thay thế naked <div className="flex ..."> — Zero Naked Div Policy.
 */

import React from "react";
import AntFlex from "antd/es/flex";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

type AntFlexProps = React.ComponentProps<typeof AntFlex>;

export const flexVariants = cva("", {
  variants: {
    /** Common layout patterns */
    layout: {
      default: "",
      /** Row: center vertically, space-between horizontally */
      between: "w-full",
      /** Centered both axes */
      center: "",
      /** Stack items vertically with gap */
      stack: "",
    },
    /** Spacing scale */
    spacing: {
      none: "",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
  },
  defaultVariants: {
    layout: "default",
    spacing: "none",
  },
});

export interface FlexProps
  extends AntFlexProps,
    VariantProps<typeof flexVariants> {}

export const Flex = React.forwardRef<React.ElementRef<typeof AntFlex>, FlexProps>(
  ({ layout, spacing, className, ...props }, ref) => {
    // Map layout variants to Ant Flex props
    const layoutProps: Partial<AntFlexProps> = {};
    if (layout === "between") {
      layoutProps.align = props.align ?? "center";
      layoutProps.justify = props.justify ?? "space-between";
    } else if (layout === "center") {
      layoutProps.align = props.align ?? "center";
      layoutProps.justify = props.justify ?? "center";
    } else if (layout === "stack") {
      layoutProps.vertical = props.vertical ?? true;
    }

    return (
      <AntFlex
        ref={ref}
        className={cn(flexVariants({ layout, spacing }), className)}
        {...layoutProps}
        {...props}
      />
    );
  },
);

Flex.displayName = "Flex";
