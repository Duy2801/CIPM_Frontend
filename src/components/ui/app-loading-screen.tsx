"use client";

import React from "react";

interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export function AppLoadingScreen({
  message = "Đang tải dữ liệu hệ thống...",
  subMessage = "BQL Đầu tư Xây dựng Khu vực Hà Tiên",
  fullscreen = false,
}: AppLoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200 ${
        fullscreen
          ? "fixed inset-0 z-[2000] bg-[var(--cipm-surface-shell)]"
          : "min-h-[calc(100vh-140px)] w-full"
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* Synchronized Concentric Circular Loader (Đồng bộ tròn hoàn hảo, không lệch) */}
        <div className="relative mb-5 flex items-center justify-center w-20 h-20">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-[#007A78]/15 blur-md animate-pulse" />

          {/* Outer Circular Track */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200/70 dark:border-slate-700/60" />

          {/* Concentric Spinning Arc — đồng bộ chính xác trên đường tròn viền ngoài */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#007A78] border-r-[#007A78] animate-spin" />

          {/* Center Concentric Circular Badge */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#0F2744] to-[#163357] text-white shadow-lg border border-teal-500/25">
            <span className="text-base font-extrabold tracking-wider text-[#2DD4BF]">
              HT
            </span>
          </div>
        </div>

        {/* Message and Sub-message */}
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-1">
          {message}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium">
          {subMessage}
        </p>

        {/* Sleek Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-200/80 dark:bg-slate-700/60 rounded-full overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-[#007A78] via-[#00B4D8] to-[#007A78] rounded-full animate-progress-slide" />
        </div>
      </div>
    </div>
  );
}

export default AppLoadingScreen;
