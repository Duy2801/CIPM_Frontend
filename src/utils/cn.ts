/**
 * utils/cn.ts — Class merge utility
 *
 * Kết hợp clsx (conditional classes) + tailwind-merge (resolve Tailwind conflicts).
 * Dùng trong mọi component/ui wrapper để merge base CVA classes với caller overrides.
 *
 * Usage:
 *   import { cn } from "@/utils/cn";
 *   cn("base-class", condition && "active-class", className)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
