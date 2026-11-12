"use client";

import { create } from "zustand";
import type { TaskRef } from "../utils/my-task-data";

export type MyTaskReasonKind = "reject" | "incident" | "decline" | "return";

interface MyTaskStore {
  keyword: string;
  procedure?: string;
  opened: TaskRef | null;
  reason: (TaskRef & { kind: MyTaskReasonKind }) | null;
  setKeyword: (keyword: string) => void;
  setProcedure: (procedure?: string) => void;
  openTask: (ref: TaskRef) => void;
  closeTask: () => void;
  openReason: (ref: TaskRef, kind: MyTaskReasonKind) => void;
  closeReason: () => void;
  reset: () => void;
}

const INITIAL = { keyword: "", procedure: undefined, opened: null, reason: null };

export const useMyTaskStore = create<MyTaskStore>((set) => ({
  ...INITIAL,
  setKeyword: (keyword) => set({ keyword }),
  setProcedure: (procedure) => set({ procedure }),
  openTask: ({ projectId, stepId }) => set({ opened: { projectId, stepId } }),
  closeTask: () => set({ opened: null }),
  openReason: ({ projectId, stepId }, kind) => set({ reason: { projectId, stepId, kind } }),
  closeReason: () => set({ reason: null }),
  reset: () => set(INITIAL),
}));
