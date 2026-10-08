/**
 * component/ui/layout.tsx — AntD Layout + Tailwind + CVA
 *
 * Wrap Layout shell components. Layout, Header, Content là structural —
 * CVA variants chỉ cho padding/surface intent.
 */

import React from "react";
import AntLayout from "antd/es/layout";
import type { BasicProps as LayoutProps } from "antd/es/layout/layout";
import type { SiderProps } from "antd/es/layout/Sider";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

/* ── Re-export structural sub-components ──────────────── */
const { Sider, Footer } = AntLayout;
export { Sider, Footer };
export type { LayoutProps, SiderProps };

/* ── Layout (root) ────────────────────────────────────── */
export const Layout = React.forwardRef<HTMLElement, LayoutProps>(
  ({ className, ...props }, ref) => {
    return <AntLayout ref={ref} className={cn(className)} {...props} />;
  },
);
Layout.displayName = "Layout";

/* ── Header + CVA ─────────────────────────────────────── */
export const headerVariants = cva("", {
  variants: {
    intent: {
      default: "",
      /** White topbar — light background */
      light: themeClassNames.primitive.headerLight,
      /** Dark header */
      dark: themeClassNames.primitive.headerDark,
    },
  },
  defaultVariants: { intent: "default" },
});

export interface HeaderProps
  extends LayoutProps,
  VariantProps<typeof headerVariants> { }

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ intent, className, ...props }, ref) => {
    return (
      <AntLayout.Header
        ref={ref}
        className={cn(headerVariants({ intent }), className)}
        {...props}
      />
    );
  },
);
Header.displayName = "Header";

/* ── Content + CVA ────────────────────────────────────── */
export const contentVariants = cva("", {
  variants: {
    /** Padding presets */
    padding: {
      default: "",
      none: "!p-0",
      sm: "!p-4",
      md: "!p-6",
      lg: "!p-8",
    },
    /** Surface background */
    surface: {
      default: "",
      white: themeClassNames.primitive.contentWhite,
      light: themeClassNames.primitive.contentLight,
    },
  },
  defaultVariants: { padding: "default", surface: "default" },
});

export interface ContentProps
  extends LayoutProps,
  VariantProps<typeof contentVariants> { }

export const Content = React.forwardRef<HTMLElement, ContentProps>(
  ({ padding, surface, className, ...props }, ref) => {
    return (
      <AntLayout.Content
        ref={ref}
        className={cn(contentVariants({ padding, surface }), className)}
        {...props}
      />
    );
  },
);
Content.displayName = "Content";
