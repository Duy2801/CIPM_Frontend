import { formatMoneyString } from "../../../../../utils/format-money.ts";

export const money = (v: number) => `${formatMoneyString(v)} VNĐ`;
export const percent = (part: number, whole: number) =>
  whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
export const today = () => new Date().toISOString().slice(0, 10);

export const GRID =
  "grid grid-cols-[minmax(220px,1fr)_80px_160px_minmax(180px,240px)_110px_190px] items-center gap-x-6";
