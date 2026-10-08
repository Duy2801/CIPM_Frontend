"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  CloseOutlined,
} from "@ant-design/icons";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  exiting?: boolean;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(
    type: ToastType,
    title: string,
    description?: string,
    duration = 4000
  ): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type,
      title,
      description,
      duration,
      exiting: false,
    };
    // Giữ tối đa 5 toast trên màn hình cùng lúc để tránh tràn màn hình
    this.toasts = [newToast, ...this.toasts.slice(0, 4)];
    this.notify();
    return id;
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.map((t) =>
      t.id === id ? { ...t, exiting: true } : t
    );
    this.notify();

    // Chờ hiệu ứng trượt ra (slide out) kết thúc rồi mới xoá khỏi DOM
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    }, 250);
  }

  public clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

/**
 * Tiện ích hiển thị Toast notification trượt từ bên phải màn hình vào
 */
export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    toastManager.show("success", title, description, duration),
  error: (title: string, description?: string, duration?: number) =>
    toastManager.show("error", title, description, duration ?? 5000),
  warning: (title: string, description?: string, duration?: number) =>
    toastManager.show("warning", title, description, duration),
  info: (title: string, description?: string, duration?: number) =>
    toastManager.show("info", title, description, duration),
  dismiss: (id: string) => toastManager.dismiss(id),
  clear: () => toastManager.clear(),
};

const TOAST_THEMES: Record<
  ToastType,
  {
    icon: React.ReactNode;
    borderColor: string;
    bgColor: string;
    textColor: string;
    progressColor: string;
    borderLeftColor: string;
  }
> = {
  success: {
    icon: <CheckCircleFilled className="text-emerald-500 text-lg shrink-0" />,
    borderColor: "border-emerald-200",
    bgColor: "bg-white",
    textColor: "text-emerald-950",
    progressColor: "bg-emerald-500",
    borderLeftColor: "border-l-emerald-500",
  },
  error: {
    icon: <CloseCircleFilled className="text-rose-500 text-lg shrink-0" />,
    borderColor: "border-rose-200",
    bgColor: "bg-white",
    textColor: "text-rose-950",
    progressColor: "bg-rose-500",
    borderLeftColor: "border-l-rose-500",
  },
  warning: {
    icon: <ExclamationCircleFilled className="text-amber-500 text-lg shrink-0" />,
    borderColor: "border-amber-200",
    bgColor: "bg-white",
    textColor: "text-amber-950",
    progressColor: "bg-amber-500",
    borderLeftColor: "border-l-amber-500",
  },
  info: {
    icon: <InfoCircleFilled className="text-[#007A78] text-lg shrink-0" />,
    borderColor: "border-teal-200",
    bgColor: "bg-white",
    textColor: "text-slate-900",
    progressColor: "bg-[#007A78]",
    borderLeftColor: "border-l-[#007A78]",
  },
};

interface ToastItemComponentProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function SingleToast({ toast: item, onDismiss }: ToastItemComponentProps) {
  const theme = TOAST_THEMES[item.type];
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!item.duration || item.duration <= 0 || paused || item.exiting) return;

    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, paused, item.exiting, onDismiss]);

  return (
    <div
      role={item.type === "error" ? "alert" : "status"}
      aria-live={item.type === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative flex w-full max-w-[380px] overflow-hidden rounded-xl border border-slate-200/90 border-l-4 ${theme.borderLeftColor} bg-white shadow-xl backdrop-blur-sm transition-all ${
        item.exiting ? "animate-toast-slide-out" : "animate-toast-slide-in"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5 pr-2 w-full">
        <div className="mt-0.5">{theme.icon}</div>
        <div className="min-w-0 flex-1 pr-1">
          <div className={`text-xs font-bold leading-snug ${theme.textColor}`}>
            {item.title}
          </div>
          {item.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 font-normal m-0 break-words">
              {item.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md p-1 transition-colors cursor-pointer shrink-0 -mt-0.5"
          title="Đóng thông báo"
          aria-label="Đóng thông báo"
        >
          <CloseOutlined className="text-xs" />
        </button>
      </div>

      {/* Thanh tiến trình thời gian tự tắt */}
      {item.duration && item.duration > 0 && !item.exiting && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.progressColor} opacity-70`}
          style={{
            animation: `shrinkWidth ${item.duration}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
    </div>
  );
}

/**
 * Container chứa các Toast, cố định góc trên bên phải màn hình
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastManager.subscribe((items) => {
      setToasts(items);
    });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    toastManager.dismiss(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Thông báo hệ thống"
      className="pointer-events-none fixed top-5 right-5 z-[999999] flex flex-col items-end gap-2.5 max-h-screen overflow-hidden p-1"
    >
      {toasts.map((item) => (
        <SingleToast key={item.id} toast={item} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
