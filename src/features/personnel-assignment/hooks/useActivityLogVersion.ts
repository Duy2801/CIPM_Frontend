"use client";

import { useEffect, useState } from "react";
import { ACTIVITY_LOG_EVENT } from "../utils/activity-log";

/** Tăng mỗi khi nhật ký thao tác có dòng mới (dùng làm phụ thuộc để đọc lại nhật ký) */
export function useActivityLogVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(ACTIVITY_LOG_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(ACTIVITY_LOG_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return version;
}
