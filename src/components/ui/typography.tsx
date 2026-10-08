/**
 * component/ui/typography.tsx — AntD Typography + Tailwind + CVA
 *
 * Wrap Typography.Title và Typography.Text với CVA variants.
 * Typography.Paragraph, Typography.Link giữ nguyên re-export.
 */

import React from "react";
import AntTypography from "antd/es/typography";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

/* ── Re-export compound components không cần CVA ──────── */
const { Paragraph, Link } = AntTypography;
export { AntTypography as Typography, Paragraph, Link };

/* ── Title + CVA ──────────────────────────────────────── */
export const titleVariants = cva("", {
  variants: {
    variant: {
      default: "",
      /** Brand heading — sidebar brand name */
      brand: themeClassNames.primitive.titleBrand,
      /** Gradient heading */
      gradient: themeClassNames.primitive.titleGradient,
      /** Muted section label */
      muted: themeClassNames.primitive.titleMuted,
    },
  },
  defaultVariants: { variant: "default" },
});

type AntTitleProps = React.ComponentProps<typeof AntTypography.Title>;

export interface TitleProps
  extends AntTitleProps,
  VariantProps<typeof titleVariants> { }

export const Title = React.forwardRef<HTMLElement, TitleProps>(
  ({ variant, className, ...props }, ref) => {
    return (
      <AntTypography.Title
        ref={ref}
        className={cn(titleVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Title.displayName = "Title";

/* ── Text + CVA ───────────────────────────────────────── */
export const textVariants = cva("", {
  variants: {
    variant: {
      default: "",
      /** Muted description text */
      muted: themeClassNames.primitive.textMuted,
      /** Faint metadata */
      faint: themeClassNames.primitive.textFaint,
      /** Brand accent */
      brand: themeClassNames.primitive.textBrand,
      /** Label text */
      label: themeClassNames.primitive.textLabel,
    },
  },
  defaultVariants: { variant: "default" },
});

type AntTextProps = React.ComponentProps<typeof AntTypography.Text>;

export interface TextProps
  extends AntTextProps,
  VariantProps<typeof textVariants> { }

export const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ variant, className, ...props }, ref) => {
    return (
      <AntTypography.Text
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
