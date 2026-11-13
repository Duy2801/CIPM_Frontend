import type {
  ChartBarItem,
  ChartDataset,
  ChartMetric,
  DisbursementTimeFilter,
  DisbursementTotals,
  QuarterlyData,
} from "../types/dashboard.types.ts";

export const CURRENT_YEAR = 2026;
export const CURRENT_WEEK = 41;
export const CURRENT_MONTH = 10;
export const MONTH_BLOCKS = ["1-4", "5-8", "9-12"] as const;
export const QUARTER_KEYS = ["all", "1", "2", "3", "4"] as const;

export interface DisbursementPeriod {
  filter: DisbursementTimeFilter;
  week: number;
  monthBlock: string;
  quarter: string;
}

const UNIT = "ĐVT: Tỷ đồng";

const round1 = (value: number) => Number(value.toFixed(1));
const sum = (items: ChartBarItem[], key: "plan" | "actual") => items.reduce((acc, it) => acc + it[key], 0);
const scaleOf = (items: ChartBarItem[], floor: number, factor: number) =>
  Math.ceil(Math.max(...items.flatMap((i) => [i.plan, i.actual]), floor) * factor);
const billion = (value: number) => `${value.toFixed(1)} tỷ`;

export function yearRatio(year: number): number {
  if (year === CURRENT_YEAR) return 1;
  if (year === 2025) return 0.88;
  if (year === 2024) return 0.75;
  return 1.12;
}

export function weekBlockOf(week: number): { start: number; end: number } {
  const start = Math.floor((week - 1) / 5) * 5 + 1;
  return { start, end: Math.min(52, start + 4) };
}

export function weekBlocks(): { start: number; end: number }[] {
  const blocks = [];
  for (let start = 1; start <= 52; start += 5) blocks.push({ start, end: Math.min(52, start + 4) });
  return blocks;
}

function monthItem(month: number, year: number): ChartBarItem {
  const ratio = yearRatio(year);
  const isCurrent = year === CURRENT_YEAR && month === CURRENT_MONTH;
  let actual = 0;
  if (year < CURRENT_YEAR || (year === CURRENT_YEAR && month < CURRENT_MONTH)) actual = round1((48 + ((month * 6) % 12)) * ratio);
  else if (isCurrent) actual = round1(41.5 * ratio);
  return {
    label: isCurrent ? `Tháng ${month} (HT)` : `Tháng ${month}`,
    plan: round1((50 + ((month * 4) % 15)) * ratio),
    actual,
    isCurrent,
  };
}

function completionMetrics(items: ChartBarItem[], suffix: string): [ChartMetric, ChartMetric, ChartMetric] {
  const plan = sum(items, "plan");
  const actual = sum(items, "actual");
  return [
    { label: `Đã giải ngân ${suffix}`, value: billion(actual), sub: "VNĐ" },
    { label: `Kế hoạch ${suffix}`, value: billion(plan), sub: "VNĐ" },
    {
      label: `Tỷ lệ hoàn thành ${suffix}`,
      value: `${plan > 0 ? ((actual / plan) * 100).toFixed(1) : "0"}%`,
      sub: `Đạt KH ${actual.toFixed(1)}/${plan.toFixed(1)} tỷ`,
    },
  ];
}

function weekDataset(year: number, week: number): ChartDataset {
  const ratio = yearRatio(year);
  const { start, end } = weekBlockOf(week);
  const items: ChartBarItem[] = [];
  for (let w = start; w <= end; w++) {
    const isCurrent = year === CURRENT_YEAR ? w === CURRENT_WEEK : w === week;
    let actual = 0;
    if (year < CURRENT_YEAR || (year === CURRENT_YEAR && w < CURRENT_WEEK)) actual = round1((17 + ((w * 5) % 9)) * ratio);
    else if (year === CURRENT_YEAR && w === CURRENT_WEEK) actual = round1(11.5 * ratio);
    items.push({ label: isCurrent ? `Tuần ${w} (HT)` : `Tuần ${w}`, plan: round1((18 + ((w * 7) % 8)) * ratio), actual, isCurrent });
  }
  const actual = sum(items, "actual");
  const activeCount = items.filter((it) => it.actual > 0).length || 1;
  return {
    title: `BIỂU ĐỒ GIẢI NGÂN THEO TUẦN (NIÊN ĐỘ ${year})`,
    unit: UNIT,
    maxScale: scaleOf(items, 20, 1.25),
    items,
    metrics: [
      { label: `Đã giải ngân T${start}-T${end}`, value: billion(actual), sub: "VNĐ" },
      { label: `Kế hoạch T${start}-T${end}`, value: billion(sum(items, "plan")), sub: "VNĐ" },
      { label: "Tốc độ trung bình", value: billion(actual / activeCount), sub: "/ tuần" },
    ],
  };
}

function monthDataset(year: number, monthBlock: string): ChartDataset {
  const [start, end] = monthBlock.split("-").map(Number);
  const items: ChartBarItem[] = [];
  for (let m = start; m <= end; m++) items.push(monthItem(m, year));
  return {
    title: `BIỂU ĐỒ GIẢI NGÂN THEO THÁNG (THÁNG ${start} - ${end} / NIÊN ĐỘ ${year})`,
    unit: UNIT,
    maxScale: scaleOf(items, 40, 1.25),
    items,
    metrics: completionMetrics(items, `T${start}-T${end}`),
  };
}

function fallbackQuarters(year: number): ChartBarItem[] {
  const ratio = yearRatio(year);
  const past = year <= CURRENT_YEAR;
  return [
    { label: "Quý 1", plan: round1(145 * ratio), actual: round1(past ? 158 * ratio : 0) },
    { label: "Quý 2", plan: round1(180 * ratio), actual: round1(past ? 175 * ratio : 0) },
    { label: "Quý 3", plan: round1(190 * ratio), actual: round1(past ? 76.5 * ratio : 0) },
    {
      label: year === CURRENT_YEAR ? "Quý 4 (HT)" : "Quý 4",
      plan: round1(150 * ratio),
      actual: round1(year < CURRENT_YEAR ? 148 * ratio : year === CURRENT_YEAR ? 8.5 : 0),
      isCurrent: year === CURRENT_YEAR,
    },
  ];
}

function yearDataset(year: number, quarters: QuarterlyData[], totals: DisbursementTotals): ChartDataset {
  const ratio = yearRatio(year);
  const items =
    year === CURRENT_YEAR && quarters.length > 0
      ? quarters.map((q) => ({ label: q.quarter, plan: q.plan, actual: q.actual, isCurrent: q.isCurrent }))
      : fallbackQuarters(year);
  return {
    title: `BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NIÊN ĐỘ ${year})`,
    unit: UNIT,
    maxScale: scaleOf(items, 100, 1.2),
    items,
    metrics: [
      { label: "Đã giải ngân lũy kế", value: billion(totals.disbursed * ratio), sub: "VNĐ" },
      { label: "Còn lại cần giải ngân", value: billion(totals.remaining * ratio), sub: "VNĐ" },
      { label: "Tốc độ yêu cầu", value: billion(totals.monthlySpeed * ratio), sub: "/ tháng" },
    ],
  };
}

function quarterDataset(year: number, quarter: number): ChartDataset {
  const items = [1, 2, 3].map((i) => monthItem((quarter - 1) * 3 + i, year));
  return {
    title: `BIỂU ĐỒ GIẢI NGÂN CHI TIẾT QUÝ ${quarter} (NIÊN ĐỘ ${year})`,
    unit: UNIT,
    maxScale: scaleOf(items, 50, 1.25),
    items,
    metrics: completionMetrics(items, `Quý ${quarter}`),
  };
}

export function buildDisbursementChart(
  year: number,
  period: DisbursementPeriod,
  quarters: QuarterlyData[],
  totals: DisbursementTotals,
): ChartDataset {
  if (period.filter === "week") return weekDataset(year, period.week);
  if (period.filter === "month") return monthDataset(year, period.monthBlock);
  if (period.quarter === "all") return yearDataset(year, quarters, totals);
  return quarterDataset(year, Number(period.quarter));
}
