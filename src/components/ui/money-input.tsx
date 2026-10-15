"use client";

import React, { useEffect, useState, useRef } from "react";
import { Input, type InputProps } from "./input";
import { formatMoneyString, parseMoney } from "@/utils/format-money";

export interface MoneyInputProps extends Omit<InputProps, "value" | "onChange"> {
  value?: number | string;
  onChange?: (val: any) => void;
  allowNegative?: boolean;
  maxDecimals?: number;
}

export const MoneyInput = React.forwardRef<any, MoneyInputProps>(
  (
    {
      value,
      onChange,
      allowNegative = false,
      maxDecimals = 0,
      className,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>(() =>
      formatMoneyString(value, allowNegative, maxDecimals)
    );
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      const formatted = formatMoneyString(value, allowNegative, maxDecimals);
      if (formatted !== displayValue) {
        // Chỉ cập nhật nếu giá trị số thực sự thay đổi để tránh nhảy con trỏ khi đang gõ
        const currentNum = parseMoney(displayValue);
        const newNum = parseMoney(value);
        if (currentNum !== newNum || !displayValue) {
          setDisplayValue(formatted);
        }
      }
    }, [value, allowNegative, maxDecimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const selectionStart = e.target.selectionStart || 0;
      const digitsBefore = raw.slice(0, selectionStart).replace(/[^\d]/g, "").length;

      const formatted = formatMoneyString(raw, allowNegative, maxDecimals);
      setDisplayValue(formatted);

      if (onChange) {
        // Tương thích cả AntD Form (lấy e.target.value) và handler thông thường
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: props.name,
            value: formatted,
          },
        };
        onChange(syntheticEvent);
      }

      // Giữ vị trí con trỏ thông minh khi thêm/bớt dấu chấm
      requestAnimationFrame(() => {
        const input = inputRef.current || (e.target as HTMLInputElement);
        if (input && input.setSelectionRange) {
          let count = 0;
          let newPos = formatted.length;
          for (let i = 0; i < formatted.length; i++) {
            if (/[\d]/.test(formatted[i])) {
              count++;
              if (count === digitsBefore) {
                newPos = i + 1;
                break;
              }
            }
          }
          if (digitsBefore === 0) {
            newPos = formatted.startsWith("-") ? 1 : 1;
          }
          input.setSelectionRange(newPos, newPos);
        }
      });
    };

    return (
      <Input
        ref={(node: any) => {
          inputRef.current = node?.input || node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }}
        inputMode="decimal"
        className={className}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

MoneyInput.displayName = "MoneyInput";
