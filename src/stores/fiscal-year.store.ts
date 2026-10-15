"use client";

import { create } from "zustand";

interface FiscalYearState {
  selectedYear: string;
  availableYears: string[];
  setSelectedYear: (year: string) => void;
}

export const useFiscalYearStore = create<FiscalYearState>((set) => ({
  selectedYear: "2026",
  availableYears: ["2024", "2025", "2026", "2027"],
  setSelectedYear: (year: string) => set({ selectedYear: year }),
}));
