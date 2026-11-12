"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const MIN_COLUMN_WIDTH = 320;
const COLUMN_GAP = 12;

const fitColumnWidth = (boardWidth: number) => {
  const perView = Math.max(1, Math.floor((boardWidth + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP)));
  return Math.floor((boardWidth - COLUMN_GAP * (perView - 1)) / perView);
};

export function useHorizontalBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ canLeft: false, canRight: false });
  const [columnWidth, setColumnWidth] = useState<number>();
  const pan = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setEdges({
        canLeft: el.scrollLeft > 4,
        canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    const resize = () => {
      setColumnWidth(fitColumnWidth(el.clientWidth));
      sync();
    };
    resize();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, []);

  const step = () => (columnWidth ?? MIN_COLUMN_WIDTH) + COLUMN_GAP;

  const scrollByColumn = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / step()) + dir;
    el.scrollTo({ left: Math.max(0, index * step()), behavior: "smooth" });
  };

  const snapToColumn = (el: HTMLElement) =>
    el.scrollTo({ left: Math.round(el.scrollLeft / step()) * step(), behavior: "smooth" });

  const endPan = (e: PointerEvent<HTMLDivElement>) => {
    if (pan.current?.moved) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      e.currentTarget.style.cursor = "";
      e.currentTarget.style.userSelect = "";
      snapToColumn(e.currentTarget);
    }
    pan.current = null;
  };

  const panHandlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("article,button,a,input,textarea,[role='button']")) return;
      pan.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const p = pan.current;
      if (!p) return;
      const dx = e.clientX - p.x;
      if (!p.moved && Math.abs(dx) < 4) return;
      if (!p.moved) {
        p.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = "grabbing";
        e.currentTarget.style.userSelect = "none";
      }
      e.currentTarget.scrollLeft = p.left - dx;
    },
    onPointerUp: endPan,
    onPointerCancel: endPan,
  };

  return { ref, ...edges, columnWidth, scrollByColumn, panHandlers };
}
