"use client";

import { useEffect, useRef, useState } from "react";

export function useStickyScrollbar(remeasureKey?: unknown) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      setScrollWidth(body.scrollWidth);
      setOverflows(body.scrollWidth > body.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    return () => observer.disconnect();
  }, [remeasureKey]);

  const sync = (from: HTMLDivElement | null, to: HTMLDivElement | null) => {
    if (from && to && to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
  };

  return {
    bodyRef,
    barRef,
    scrollWidth,
    overflows,
    syncFromBody: () => sync(bodyRef.current, barRef.current),
    syncFromBar: () => sync(barRef.current, bodyRef.current),
  };
}
