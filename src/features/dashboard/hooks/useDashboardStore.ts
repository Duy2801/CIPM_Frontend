"use client";

import { create } from "zustand";
import type { ActivityFilterMethod, UrgentFilter } from "../types/dashboard.types";
import { CURRENT_WEEK, type DisbursementPeriod } from "../utils/disbursement-chart";

interface DashboardState {
  urgentFilter: UrgentFilter;
  activityMethod: ActivityFilterMethod;
  activityProject?: string;
  activityActor?: string;
  activityPage: number;
  period: DisbursementPeriod;
  setUrgentFilter: (filter: UrgentFilter) => void;
  setActivityMethod: (method: ActivityFilterMethod) => void;
  setActivityProject: (project?: string) => void;
  setActivityActor: (actor?: string) => void;
  setActivityPage: (page: number) => void;
  resetActivityFilter: () => void;
  setPeriod: (patch: Partial<DisbursementPeriod>) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  urgentFilter: "all",
  activityMethod: "ALL",
  activityPage: 1,
  period: { filter: "quarter", week: CURRENT_WEEK, monthBlock: "9-12", quarter: "4" },
  setUrgentFilter: (urgentFilter) => set({ urgentFilter }),
  setActivityMethod: (activityMethod) =>
    set({ activityMethod, activityProject: undefined, activityActor: undefined, activityPage: 1 }),
  setActivityProject: (activityProject) => set({ activityProject, activityPage: 1 }),
  setActivityActor: (activityActor) => set({ activityActor, activityPage: 1 }),
  setActivityPage: (activityPage) => set({ activityPage }),
  resetActivityFilter: () =>
    set({ activityMethod: "ALL", activityProject: undefined, activityActor: undefined, activityPage: 1 }),
  setPeriod: (patch) => set((state) => ({ period: { ...state.period, ...patch } })),
}));
