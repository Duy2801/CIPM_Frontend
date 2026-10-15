"use client";

import React from "react";
import Image from "next/image";
import { Card, Title } from "@/components/ui";
import LoginForm from "./LoginForm";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth.types";

import { ComprehensiveCulturalWatermark } from "./CulturalMotifs";

export default function LoginView() {
  const { login, loading } = useAuth();

  const handleFormSubmit = async (values: LoginCredentials) => {
    await login(values);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col items-center font-sans select-none bg-slate-50">
      {/* 1. NỬA PHÍA TRÊN: Hình ảnh Trụ sở UBND xã (chiếm ~48vh-50vh để không bị phóng to) */}
      <div className="absolute top-0 left-0 right-0 h-[48vh] sm:h-[50vh] z-0 overflow-hidden pointer-events-none">
        <Image
          src="/udnd.png"
          alt="Trụ sở UBND Xã"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-top sm:object-center"
        />
        {/* Lớp phủ sáng tự nhiên giữ trọn vẹn màu trời xanh và tòa nhà rõ nét */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/15 via-transparent to-transparent" />

        {/* ĐƯỜNG CONG VÒNG CUNG & DẢI CẦU VỒNG (RAINBOW CURVED ARCH) Ở ĐÁY HÌNH ẢNH */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg
            viewBox="0 0 1440 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-16 sm:h-24 md:h-28 block preserve-3d"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Dải dốc màu cầu vồng rực rỡ và hài hòa */}
              <linearGradient id="rainbow-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="18%" stopColor="#f97316" />
                <stop offset="36%" stopColor="#eab308" />
                <stop offset="54%" stopColor="#10b981" />
                <stop offset="72%" stopColor="#06b6d4" />
                <stop offset="88%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

              {/* Hiệu ứng phát sáng cầu vồng nhẹ */}
              <linearGradient id="rainbow-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Dải hào quang cầu vồng phát sáng nhẹ - Vòm cong ngược lên trên */}
            <path
              d="M0,105 Q720,20 1440,105"
              stroke="url(#rainbow-glow)"
              strokeWidth="10"
              fill="none"
              className="filter blur-[3px]"
            />

            {/* Đường viền cong cầu vồng (Rainbow curve ribbon) */}
            <path
              d="M0,105 Q720,20 1440,105"
              stroke="url(#rainbow-line)"
              strokeWidth="4.5"
              fill="none"
            />

            {/* Khối nền dưới vòm cong lấp đầy màu nền slate-50 của nửa dưới */}
            <path
              d="M0,106 Q720,21 1440,106 L1440,140 L0,140 Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </div>

      {/* 2. HỆ THỐNG HOA VĂN NỀN CHÌM DƯỚI NỀN TRẮNG (NẰM DƯỚI VÒM CẦU VỒNG, TUYỆT ĐỐI KHÔNG ĐÈ LÊN HÌNH TRÊN) */}
      <div className="absolute top-[48vh] sm:top-[50vh] bottom-0 left-0 right-0 z-0 pointer-events-none overflow-hidden select-none">
        <ComprehensiveCulturalWatermark />
      </div>

      {/* 3. KHU VỰC CHÍNH: Tiêu đề cơ quan & Form đăng nhập khóa tọa độ tuyệt đối vào tâm khung đá tòa nhà */}
      <main
        style={{
          marginTop: "clamp(75px, calc(25vh - 4.65vw - 28px), 380px)",
        }}
        className="relative z-20 w-full flex flex-col items-center justify-center px-4 pb-12"
      >
        {/* TIÊU ĐỀ CƠ QUAN NHÀ NƯỚC: Luôn khớp chuẩn xác 100% vào tâm khung đá ở mọi độ phân giải */}
        <div className="w-full max-w-[min(92vw,960px)] text-center mb-2.5 sm:mb-3.5 px-3 select-none">
          <p className="text-[clamp(12px,1.1vw,17px)] font-bold text-[#b91c1c] tracking-[0.12em] sm:tracking-[0.16em] uppercase leading-snug whitespace-nowrap [text-shadow:_0_1px_2px_rgba(255,255,255,0.95)]">
            ỦY BAN NHÂN DÂN TỈNH AN GIANG
          </p>
          <h1 className="text-[clamp(15px,1.55vw,25px)] font-black text-[#fbbf24] tracking-normal sm:tracking-[0.025em] uppercase leading-tight mt-0.5 sm:mt-1 whitespace-nowrap [text-shadow:_0_1px_2px_rgba(0,0,0,0.5),_0_2px_4px_rgba(0,0,0,0.2)]">
            BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG HÀ TIÊN
          </h1>
        </div>

        {/* FORM ĐĂNG NHẬP: Nằm ngay dưới tiêu đề, cân đối trang trọng */}
        <Card
          surface="portal"
          padding="comfortable"
          rounded="lg"
          className="w-full max-w-[420px] shadow-2xl bg-white/95 dark:bg-white/95 backdrop-blur-xl border border-white/90 text-slate-800 ring-1 ring-slate-900/5 z-10 transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col justify-between"
        >
          {/* QUỐC HUY VIỆT NAM TRANG TRỌNG Ở TRUNG TÂM FORM */}
          <div className="flex flex-col items-center justify-center text-center -mt-1 mb-4">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 mb-2 filter drop-shadow-md hover:scale-105 transition-transform duration-300">
              <Image
                src="/quochuy.png"
                alt="Quốc huy Nước CHXHCN Việt Nam"
                width={72}
                height={72}
                priority
                className="object-contain"
              />
            </div>
            <Title
              level={3}
              className="!m-0 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
            >
              ĐĂNG NHẬP HỆ THỐNG
            </Title>
          </div>

          {/* FORM ĐĂNG NHẬP TRỰC TIẾP */}
          <LoginForm
            onSubmit={handleFormSubmit}
            loading={loading}
          />
        </Card>
      </main>
    </div>
  );
}
