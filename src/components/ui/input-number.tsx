import AntInputNumber from "antd/es/input-number";
import type { InputNumberProps as AntInputNumberProps } from "antd/es/input-number";
import { cn } from "@/utils/cn";

export type InputNumberProps = AntInputNumberProps<number>;

export function InputNumber({ className, ...props }: InputNumberProps) {
  return <AntInputNumber<number> className={cn("!rounded-md", className)} {...props} />;
}
