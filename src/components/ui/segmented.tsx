import AntSegmented from "antd/es/segmented";
import type { SegmentedProps as AntSegmentedProps } from "antd/es/segmented";
import { cn } from "@/utils/cn";

export type SegmentedProps<Value extends string | number = string> = AntSegmentedProps<Value>;

export function Segmented<Value extends string | number = string>({ className, ...props }: SegmentedProps<Value>) {
  return (
    <AntSegmented<Value>
      className={cn(
        "!bg-slate-100 text-xs [&_.ant-segmented-item-selected]:font-semibold [&_.ant-segmented-item-selected_.anticon]:!text-[#DC2626]",
        className,
      )}
      {...props}
    />
  );
}
