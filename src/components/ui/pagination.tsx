import React from "react";
import AntPagination from "antd/es/pagination";
import type { PaginationProps as AntPaginationProps } from "antd/es/pagination";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const paginationVariants = cva(
  "flex items-center select-none text-xs [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item]:!border-slate-200 [&_.ant-pagination-item-active]:!border-[#007A78] [&_.ant-pagination-item-active]:!bg-[#007A78] [&_.ant-pagination-item-active_a]:!text-white [&_.ant-pagination-prev]:!rounded-md [&_.ant-pagination-next]:!rounded-md",
  {
    variants: {
      scale: {
        default: "",
        small: "scale-90 origin-right",
      },
    },
    defaultVariants: {
      scale: "default",
    },
  }
);

export interface PaginationProps
  extends AntPaginationProps,
    VariantProps<typeof paginationVariants> {}

export const Pagination: React.FC<PaginationProps> = ({
  scale,
  className,
  ...props
}) => {
  return (
    <AntPagination
      className={cn(paginationVariants({ scale }), className)}
      {...props}
    />
  );
};

Pagination.displayName = "Pagination";
