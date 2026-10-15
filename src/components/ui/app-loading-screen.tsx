"use client";

import React from "react";
import Image from "next/image";

interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
  /** Biểu tượng trung tâm: "ht" (chữ HT đỏ thương hiệu) hoặc "quochuy" (Quốc huy Việt Nam) */
  logo?: "ht" | "quochuy";
}

export function AppLoadingScreen({
  message = "Đang tải dữ liệu hệ thống...",
  subMessage = "BQL Đầu tư Xây dựng Khu vực Hà Tiên",
  fullscreen = false,
  logo = "ht",
}: AppLoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200 ${
        fullscreen
          ? "fixed inset-0 z-[2000] bg-white/95 backdrop-blur-sm"
          : "min-h-[calc(100vh-140px)] w-full"
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* Synchronized Concentric Circular Loader */}
        <div className="relative mb-5 flex items-center justify-center w-20 h-20">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500/15 via-amber-500/10 to-red-500/5 blur-lg animate-pulse" />

          {/* Outer Circular Track */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200/70" />

          {/* Concentric Spinning Arc — Dải xoay màu Đỏ thương hiệu kết hợp điểm vàng kim */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#DC2626] border-r-[#F59E0B] animate-spin" />

          {/* Center Concentric Circular Badge */}
          {logo === "quochuy" ? (
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md border border-slate-200/80 p-2">
              <Image
                src="/quochuy.png"
                alt="Quốc huy"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#DC2626] via-[#B91C1C] to-[#991B1B] text-white shadow-md shadow-red-500/20 border-2 border-white ring-2 ring-red-100">
              <span className="text-base font-black tracking-widest text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]">
                HT
              </span>
            </div>
          )}
        </div>

        {/* Message and Sub-message */}
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight mb-1">
          {message}
        </h3>
        <p className="text-xs text-slate-500 mb-5 font-medium">
          {subMessage}
        </p>

        {/* Sleek Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/60 shadow-2xs">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#DC2626] rounded-full animate-progress-slide" />
        </div>
      </div>
    </div>
  );
}

export default AppLoadingScreen;
