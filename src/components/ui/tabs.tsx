import React from "react";
import AntTabs from "antd/es/tabs";
import type { TabsProps as AntTabsProps } from "antd/es/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const tabsVariants = cva("", {
  variants: {
    intent: {
      default: "",
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export interface TabsProps
  extends AntTabsProps,
    VariantProps<typeof tabsVariants> {}

export const Tabs: React.FC<TabsProps> = ({
  intent,
  className,
  destroyInactiveTabPane,
  destroyOnHidden,
  ...props
}) => {
  const finalDestroyOnHidden = destroyOnHidden ?? destroyInactiveTabPane;
  return (
    <AntTabs
      className={cn(tabsVariants({ intent }), className)}
      destroyOnHidden={finalDestroyOnHidden}
      {...props}
    />
  );
};

Tabs.displayName = "Tabs";
