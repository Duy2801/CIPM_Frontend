import { formatMoneyString } from "../../../utils/format-money.ts";

export const money = (v: number) => `${formatMoneyString(v)} VNĐ`;
export const percent = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
export const today = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
