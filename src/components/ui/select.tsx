/**
 * component/ui/select.tsx — AntD Select + Tailwind + CVA
 *
 * Wrap Ant Design Select.
 */

import React from "react";
import AntSelect from "antd/es/select";
import type {
  RefSelectProps,
  SelectProps as AntSelectProps,
} from "antd/es/select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const selectVariants = cva("transition-all duration-200", {
  variants: {
    intent: {
      default: "",
      /** Borderless / subtle — year selector, topbar filters */
      subtle:
        "!bg-transparent !border-0 [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!shadow-none font-semibold",
    },
    scale: {
      default: "",
      compact: "[&_.ant-select-selector]:!h-7 text-xs",
    },
  },
  defaultVariants: {
    intent: "default",
    scale: "default",
  },
});

export interface SelectProps
  extends AntSelectProps,
    VariantProps<typeof selectVariants> {}

export const Select = React.forwardRef<RefSelectProps, SelectProps>(
  (
    {
      intent,
      scale,
      className,
      dropdownStyle,
      styles,
      popupMatchSelectWidth = false,
      ...props
    },
    ref,
  ) => {
    let resolvedStyles = styles;
    if (typeof styles !== "function") {
      const stylesObj = (styles || {}) as Record<string, any>;
      const existingPopup =
        typeof stylesObj.popup === "object" && stylesObj.popup !== null
          ? stylesObj.popup
          : {};
      resolvedStyles = {
        ...stylesObj,
        popup: {
          ...existingPopup,
          root: {
            minWidth: "max-content",
            ...(existingPopup.root || {}),
            ...dropdownStyle,
          },
        },
      } as SelectProps["styles"];
    }

    return (
      <AntSelect
        ref={ref}
        className={cn(selectVariants({ intent, scale }), className)}
        styles={resolvedStyles}
        popupMatchSelectWidth={popupMatchSelectWidth}
        {...props}
      />
    );
  },
);

Select.displayName = "Select";
