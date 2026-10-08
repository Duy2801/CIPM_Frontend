/**
 * component/ui/tag.tsx — AntD Tag + Tailwind + CVA
 *
 * Wrap Ant Design Tag với CVA variants cho project semantic tags.
 */

import React from "react";
import AntTag from "antd/es/tag";
import type { TagProps as AntTagProps } from "antd/es/tag";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const tagVariants = cva("inline-flex items-center transition-all duration-200 select-none", {
  variants: {
    /** Semantic intent matching project color system */
    intent: {
      default: "",
      /** Version / Brand badge — teal pill */
      brand: themeClassNames.primitive.tagBrand,
      /** Feature new badge — red */
      new: themeClassNames.primitive.tagNew,
      /** Status: done */
      success: themeClassNames.primitive.tagSuccess,
      /** Status: warning */
      warning: themeClassNames.primitive.tagWarning,
      /** Status: error */
      danger: themeClassNames.primitive.tagDanger,
      /** Info / neutral */
      info: themeClassNames.primitive.tagInfo,
      /** Subtle neutral pill without border */
      subtle: "!bg-slate-100 !text-slate-700 !border-none !rounded",
      /** Muted pill with soft border */
      muted: "!bg-slate-50 !text-slate-500 !border-slate-200 !rounded",
    },
    /** Size */
    scale: {
      default: "",
      sm: "text-[10px] !px-1.5 !py-0 leading-4",
      md: "text-xs !px-2 !py-0.5",
      lg: "text-sm !px-3 !py-1",
    },
  },
  defaultVariants: {
    intent: "default",
    scale: "default",
  },
});

export interface TagProps
  extends AntTagProps,
  VariantProps<typeof tagVariants> { }

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ intent, scale, className, ...props }, ref) => {
    return (
      <AntTag
        ref={ref}
        className={cn(tagVariants({ intent, scale }), className)}
        {...props}
      />
    );
  }
);

Tag.displayName = "Tag";
