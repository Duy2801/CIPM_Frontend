/** Tiện ích ngày tháng dùng chung (chuỗi ngày dạng YYYY-MM-DD, tính theo lịch) */

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Số ngày từ `from` đến `to` (âm nếu `to` ở trước `from`) */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS);
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function addMonths(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 10);
}

export function formatDateVi(date?: string): string {
  if (!date) return "—";
  if (date.length > 10) {
    const value = new Date(date);
    if (!Number.isNaN(value.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
    }
  }
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
