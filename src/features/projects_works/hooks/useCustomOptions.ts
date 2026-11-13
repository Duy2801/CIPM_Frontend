"use client";

import { useState } from "react";
import { loadCustomOptions, saveCustomOptions } from "../utils/custom-options";

export function useCustomOptions(storageKey: string) {
  const [custom, setCustom] = useState(() => loadCustomOptions(storageKey));
  const add = (label: string) => setCustom((prev) => saveCustomOptions(storageKey, [...prev, label]));
  return { custom, add };
}
