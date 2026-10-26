"use client";

import { useEffect, useState } from "react";

/** Bề ngang cửa sổ, tự cập nhật khi đổi kích thước */
export function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}
