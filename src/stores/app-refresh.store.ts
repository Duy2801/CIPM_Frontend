"use client";

import { create } from "zustand";

interface AppRefreshState {
  refreshTrigger: number;
  isRefreshing: boolean;
  lastRefreshedAt: Date;
  triggerRefresh: () => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useAppRefreshStore = create<AppRefreshState>((set) => ({
  refreshTrigger: 0,
  isRefreshing: false,
  lastRefreshedAt: new Date(),
  triggerRefresh: () =>
    set((state) => ({
      refreshTrigger: state.refreshTrigger + 1,
      isRefreshing: true,
      lastRefreshedAt: new Date(),
    })),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
}));
