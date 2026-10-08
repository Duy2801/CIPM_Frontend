"use client";

import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  logout: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setAuth: (user, token) => set({ user, accessToken: token, isInitialized: true }),
  updateUser: (partialUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    })),
  logout: () => set({ user: null, accessToken: null, isInitialized: true }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
