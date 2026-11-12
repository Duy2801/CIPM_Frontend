"use client";

import { useEffect } from "react";

export function useDisableSwipeBack() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorX;
    root.style.overscrollBehaviorX = "none";
    return () => {
      root.style.overscrollBehaviorX = previous;
    };
  }, []);
}
