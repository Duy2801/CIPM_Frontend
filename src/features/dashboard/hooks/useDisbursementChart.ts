"use client";

import { useMemo } from "react";
import { useFiscalYearStore } from "@/stores/fiscal-year.store";
import type { QuarterlyData } from "../types/dashboard.types";
import { buildDisbursementChart, CURRENT_YEAR } from "../utils/disbursement-chart";
import { useDisbursementTotals, useQuarterlyDisbursement } from "./useDashboardQueries";
import { useDashboardStore } from "./useDashboardStore";

const NO_QUARTERS: QuarterlyData[] = [];

export function useFiscalYear() {
  const selectedYear = useFiscalYearStore((s) => s.selectedYear);
  return Number(selectedYear) || CURRENT_YEAR;
}

export function useDisbursementChart() {
  const year = useFiscalYear();
  const period = useDashboardStore((s) => s.period);
  const { data: quarters = NO_QUARTERS } = useQuarterlyDisbursement();
  const totals = useDisbursementTotals();
  return useMemo(() => buildDisbursementChart(year, period, quarters, totals), [year, period, quarters, totals]);
}
