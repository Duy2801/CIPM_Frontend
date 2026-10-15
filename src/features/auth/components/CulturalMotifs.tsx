"use client";

import React from "react";

/**
 * CÁNH TRÁI: Trống Đồng Đông Sơn & Đàn Chim Lạc Hướng Tâm (Bản sắc Dân tộc Cội nguồn)
 * Thiết kế line-art chuẩn hoa văn kỷ hà Đông Sơn: Vòng tròn đồng tâm, Mặt trời 14 tia sáng, Chim Lạc sải cánh, Mây cổ vân
 */
export function DongSonLeftPanelSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 420" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dongson-left-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      {/* VÒNG TRỐNG ĐỒNG ĐÔNG SƠN CHÍNH (TÂM cx=240, cy=200) */}
      <g stroke="url(#dongson-left-stroke)">
        {/* Vòng ngoài cùng */}
        <circle cx="240" cy="200" r="185" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="240" cy="200" r="175" strokeWidth="1.2" />

        {/* Vòng chim Lạc bay lượn (8 Chim Lạc sải cánh bay lượn hướng vào trung tâm) */}
        <circle cx="240" cy="200" r="160" strokeWidth="1" strokeDasharray="6 3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 240 200)`}>
            <path
              d="M240,50 C246,56 262,62 274,56 C284,50 278,65 272,68 C262,72 252,65 242,59 Z"
              fill="url(#dongson-left-stroke)"
              opacity="0.85"
            />
            <path
              d="M272,68 C284,72 296,70 306,65 C296,73 284,76 272,73 Z"
              fill="url(#dongson-left-stroke)"
              opacity="0.85"
            />
            <path
              d="M240,50 C236,42 228,36 218,34 C226,42 234,47 238,51 Z"
              fill="url(#dongson-left-stroke)"
              opacity="0.8"
            />
          </g>
        ))}
        <circle cx="240" cy="200" r="135" strokeWidth="1.2" />

        {/* Vòng răng cưa kỷ hà */}
        <circle cx="240" cy="200" r="125" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="240" cy="200" r="112" strokeWidth="1.2" />

        {/* Vòng chấm tròn đồng tâm */}
        <circle cx="240" cy="200" r="98" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="240" cy="200" r="82" strokeWidth="1.2" />

        {/* Vòng hình thoi / kỷ hà */}
        <circle cx="240" cy="200" r="68" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="240" cy="200" r="52" strokeWidth="1.2" />

        {/* Mặt trời 14 tia sáng ở tâm trống đồng */}
        <circle cx="240" cy="200" r="26" fill="url(#dongson-left-stroke)" opacity="0.35" />
        <circle cx="240" cy="200" r="26" strokeWidth="1.2" />
        {[
          0, 25.71, 51.42, 77.14, 102.85, 128.57, 154.28,
          180, 205.71, 231.42, 257.14, 282.85, 308.57, 334.28,
        ].map((angle, idx) => (
          <polygon
            key={idx}
            points="240,150 244,175 236,175"
            transform={`rotate(${angle} 240 200)`}
            fill="url(#dongson-left-stroke)"
            opacity="0.8"
          />
        ))}
        <circle cx="240" cy="200" r="8" strokeWidth="1.2" />
        <circle cx="240" cy="200" r="3" fill="url(#dongson-left-stroke)" />
      </g>

      {/* DẢI MÂY CỔ VÂN CHẠM KHẮC ĐÌNH CHÙA & SÓNG NƯỚC CỔ Ở CHÂN TRỐNG ĐỒNG */}
      <g stroke="url(#dongson-left-stroke)" strokeWidth="1.3" fill="none">
        {/* Cụm mây cổ vân bên phải trống đồng */}
        <g transform="translate(330, 280)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
          <path d="M65,20 C75,10 95,15 95,30 C90,40 75,40 70,30" strokeDasharray="3 3" />
        </g>

        {/* Họa tiết răng cưa sóng nước uốn lượn nâng đỡ chân */}
        <path d="M120,380 C160,350 220,390 280,365 C340,340 400,375 460,355" strokeWidth="1.5" />
        <path d="M140,395 C180,370 240,405 300,385 C360,360 420,395 470,375" strokeWidth="1" strokeDasharray="4 3" />
      </g>
    </svg>
  );
}

/**
 * CÁNH PHẢI: Trống Đồng Đông Sơn, Chim Lạc & Hoa Sen (Biểu tượng Cháu Tiên & Tiền Giang)
 * Thiết kế line-art tinh xảo, trọn vẹn, độc lập, đồng điệu tuyệt đối với Cánh Trái.
 */
export function DongSonRightPanelSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 420" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dongson-right-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* VÒNG TRỐNG ĐỒNG ĐÔNG SƠN CHÍNH (TÂM cx=300, cy=200) */}
      <g stroke="url(#dongson-right-stroke)">
        {/* Vòng ngoài cùng */}
        <circle cx="300" cy="200" r="185" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="300" cy="200" r="175" strokeWidth="1.2" />

        {/* Vòng chim Lạc bay lượn (8 Chim Lạc bay ngược chiều kim đồng hồ) */}
        <circle cx="300" cy="200" r="160" strokeWidth="1" strokeDasharray="6 3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 300 200)`}>
            <path
              d="M300,50 C306,56 322,62 334,56 C344,50 338,65 332,68 C322,72 312,65 302,59 Z"
              fill="url(#dongson-right-stroke)"
              opacity="0.85"
            />
            <path
              d="M332,68 C344,72 356,70 366,65 C356,73 344,76 332,73 Z"
              fill="url(#dongson-right-stroke)"
              opacity="0.85"
            />
            <path
              d="M300,50 C296,42 288,36 278,34 C286,42 294,47 298,51 Z"
              fill="url(#dongson-right-stroke)"
              opacity="0.8"
            />
          </g>
        ))}
        <circle cx="300" cy="200" r="135" strokeWidth="1.2" />

        {/* Vòng răng cưa kỷ hà */}
        <circle cx="300" cy="200" r="125" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="300" cy="200" r="112" strokeWidth="1.2" />

        {/* Vòng chấm tròn đồng tâm */}
        <circle cx="300" cy="200" r="98" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="300" cy="200" r="82" strokeWidth="1.2" />

        {/* Vòng hình thoi / kỷ hà */}
        <circle cx="300" cy="200" r="68" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="300" cy="200" r="52" strokeWidth="1.2" />

        {/* Mặt trời 14 tia sáng ở tâm trống đồng */}
        <circle cx="300" cy="200" r="26" fill="url(#dongson-right-stroke)" opacity="0.35" />
        <circle cx="300" cy="200" r="26" strokeWidth="1.2" />
        {[
          0, 25.71, 51.42, 77.14, 102.85, 128.57, 154.28,
          180, 205.71, 231.42, 257.14, 282.85, 308.57, 334.28,
        ].map((angle, idx) => (
          <polygon
            key={idx}
            points="300,150 304,175 296,175"
            transform={`rotate(${angle} 300 200)`}
            fill="url(#dongson-right-stroke)"
            opacity="0.8"
          />
        ))}
        <circle cx="300" cy="200" r="8" strokeWidth="1.2" />
        <circle cx="300" cy="200" r="3" fill="url(#dongson-right-stroke)" />
      </g>

      {/* ĐÓA SEN THANH TAO VÀ BÔNG LÚA TIỀN GIANG Ở GÓC BÊN DƯỚI (Trang nhã, không đè lên tâm trống) */}
      <g stroke="url(#dongson-right-stroke)" strokeWidth="1.3" fill="none">
        {/* Đóa Sen ở phía trước bên trái trống đồng */}
        <g transform="translate(110, 290)">
          <path d="M50,10 C42,30 40,50 50,70 C60,50 58,30 50,10 Z" />
          <path d="M50,25 C32,30 18,42 22,62 C34,66 45,64 50,54 Z" />
          <path d="M50,25 C68,30 82,42 78,62 C66,66 55,64 50,54 Z" />
          <path d="M30,42 C12,46 2,58 8,72 C22,72 34,66 38,58 Z" />
          <path d="M70,42 C88,46 98,58 92,72 C78,72 66,66 62,58 Z" />
        </g>

        {/* Bông lúa vàng uốn lượn ôm viền */}
        <path d="M80,390 C60,350 70,300 90,260" strokeWidth="1.5" />
        {[270, 295, 320, 345, 370].map((y, idx) => (
          <ellipse key={idx} cx={85 + (idx % 2 === 0 ? 8 : -8)} cy={y} rx="3" ry="6" transform={`rotate(${idx % 2 === 0 ? 30 : -30} ${85 + (idx % 2 === 0 ? 8 : -8)} ${y})`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * DẢI SÓNG NƯỚC THỦY BA CỔ TRUYỀN DỌC CHÂN TRANG
 * Nằm sát đáy màn hình, thanh mảnh, tạo nhịp điệu nâng đỡ tổng thể
 */
export function ThuyBaContinuousWatermark({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="thuyba-clean-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0.2" />
          <stop offset="25%" stopColor="#d97706" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#DC2626" stopOpacity="0.25" />
          <stop offset="75%" stopColor="#0284c7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <path
        d="M0,45 C80,25 160,65 240,45 C320,25 400,65 480,45 C560,25 640,65 720,45 C800,25 880,65 960,45 C1040,25 1120,65 1200,45 C1280,25 1360,65 1440,45"
        stroke="url(#thuyba-clean-grad)"
        strokeWidth="1.8"
      />
      <path
        d="M0,60 C90,42 180,75 270,58 C360,42 450,75 540,58 C630,42 720,75 810,58 C900,42 990,75 1080,58 C1170,42 1260,75 1350,58 C1395,48 1420,55 1440,52"
        stroke="url(#thuyba-clean-grad)"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

/**
 * HỌA TIẾT NỐI LIỀN XUYÊN SUỐT TỪ BÊN NÀY SANG BÊN KIA
 * Đàn Chim Lạc Đông Sơn sải cánh vút bay cùng Dải Mây Cổ Vân & Dải lụa hoa văn uốn lượn:
 * Đi vào từ mép trái -> Lướt bay CAO TRÊN ĐỈNH Trống Đồng 1 -> Uốn võng duyên dáng XUỐNG ở giữa -> Lại vòng lên vút bay CAO TRÊN ĐỈNH Trống Đồng 2 -> Đi ra mép phải
 */
export function TraversingCulturalRibbonSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ribbon-gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.1" />
          <stop offset="15%" stopColor="#b45309" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.32" />
          <stop offset="85%" stopColor="#b45309" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* 1. ĐƯỜNG CONG UỐN LƯỢN HÌNH DẢI LỤA: CAO TRÊN TRỐNG ĐỒNG 1 -> VÕNG XUỐNG GIỮA -> CAO TRÊN TRỐNG ĐỒNG 2 */}
      <g stroke="url(#ribbon-gold-grad)" fill="none">
        {/* Đường dải lụa chính */}
        <path
          d="M0,45 C140,5 260,5 430,70 C560,130 630,190 720,190 C810,190 880,130 1010,70 C1180,5 1300,5 1440,45"
          strokeWidth="1.8"
        />
        {/* Đường đứt nét hoa văn song hành */}
        <path
          d="M0,58 C140,18 260,18 430,83 C560,143 630,203 720,203 C810,203 880,143 1010,83 C1180,18 1300,18 1440,58"
          strokeWidth="1.2"
          strokeDasharray="5 4"
        />
        <path
          d="M0,70 C140,30 260,30 430,95 C560,155 630,215 720,215 C810,215 880,155 1010,95 C1180,30 1300,30 1440,70"
          strokeWidth="0.8"
          strokeDasharray="2 4"
        />
      </g>

      {/* 2. CÁC CỤM MÂY CỔ VÂN THỜI LÝ - TRẦN ĐI THEO ĐƯỜNG UỐN LƯỢN */}
      <g stroke="url(#ribbon-gold-grad)" strokeWidth="1.2" fill="none">
        {/* Cụm mây cao trên đỉnh Trống Đồng 1 (x=140, y=18) */}
        <g transform="translate(130, 8) scale(0.65)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
          <path d="M65,20 C75,10 95,15 95,30" strokeDasharray="2 2" />
        </g>
        {/* Cụm mây đoạn uốn lượn xuống (x=460, y=85) */}
        <g transform="translate(450, 75) scale(0.65)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
        </g>
        {/* Cụm mây ở đáy võng trung tâm (x=720, y=200) */}
        <g transform="translate(705, 188) scale(0.75)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
          <path d="M65,20 C75,10 95,15 95,30" strokeDasharray="2 2" />
        </g>
        {/* Cụm mây đoạn vút vòng lên (x=970, y=85) */}
        <g transform="translate(960, 75) scale(0.65)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
        </g>
        {/* Cụm mây cao trên đỉnh Trống Đồng 2 (x=1300, y=18) */}
        <g transform="translate(1290, 8) scale(0.65)">
          <path d="M40,25 C25,10 35,-15 60,-10 C75,-25 105,-20 110,0 C125,-5 140,10 130,25 C145,35 135,55 115,50 C105,60 75,60 65,45 C45,55 30,40 40,25 Z" />
          <path d="M65,20 C75,10 95,15 95,30" strokeDasharray="2 2" />
        </g>
      </g>

      {/* 3. ĐÀN CHIM LẠC SẢI CÁNH VÚT BAY THEO ĐƯỜNG UỐN LƯỢN */}
      <g fill="url(#ribbon-gold-grad)">
        {/* Chim Lạc 1: Đi vào từ bên trái, vút bay lên */}
        <g transform="translate(80, 48) rotate(-16) scale(0.68)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 2: Bay kiêu hãnh CAO TRÊN PHÍA TRÊN Trống Đồng 1 */}
        <g transform="translate(210, 12) rotate(0) scale(0.68)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 3: Bắt đầu uốn cong xuống sau khi qua Trống Đồng 1 */}
        <g transform="translate(360, 48) rotate(22) scale(0.65)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 4: Lướt dốc xuống về phía trung tâm */}
        <g transform="translate(540, 130) rotate(26) scale(0.62)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 5: Đáy võng trung tâm thanh thoát */}
        <g transform="translate(720, 190) rotate(0) scale(0.65)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 6: Vút bay vòng lên từ đáy võng */}
        <g transform="translate(900, 130) rotate(-26) scale(0.62)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 7: Vút lên hướng về phía trên Trống Đồng 2 */}
        <g transform="translate(1080, 48) rotate(-22) scale(0.65)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 8: Bay kiêu hãnh CAO TRÊN PHÍA TRÊN Trống Đồng 2 */}
        <g transform="translate(1230, 12) rotate(0) scale(0.68)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
        {/* Chim Lạc 9: Lướt bay thanh tao ra mép phải */}
        <g transform="translate(1360, 48) rotate(16) scale(0.68)">
          <path d="M0,0 C10,8 35,16 55,8 C70,-2 60,22 50,26 C35,32 20,20 5,12 Z" />
          <path d="M50,26 C70,32 90,30 110,22 C95,34 75,38 55,34 Z" />
          <path d="M0,0 C-5,-10 -15,-18 -30,-22 C-15,-12 -5,-4 0,0 Z" />
        </g>
      </g>
    </svg>
  );
}

/**
 * HỆ THỐNG HOA VĂN NỀN CHÌM CÂN ĐỐI - KHÔNG CHỒNG ĐÈ, KHÔNG LẤN LÊN HÌNH TRÊN
 * - Dải nối liền: Uốn lượn cao trên Trống Đồng 1 -> võng xuống giữa -> vòng lên cao trên Trống Đồng 2
 * - Cánh trái: Trống Đồng Đông Sơn & Đàn Chim Lạc (Nằm sát đáy, không chạm dải hoa văn)
 * - Cánh phải: Trống Đồng Đông Sơn, Chim Lạc & Hoa Sen Tiền Giang (Nằm sát đáy)
 * - Đáy chân: Dải Sóng Thủy Ba thanh mảnh
 * - Tâm Form: Thoáng sạch, hài hòa
 */
export function ComprehensiveCulturalWatermark() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
    >
      {/* 1. DẢI HỌA TIẾT NỐI LIỀN UỐN LƯỢN XÍCH LÊN CAO: TRÊN TRỐNG ĐỒNG 1 -> VÕNG XUỐNG GIỮA -> VÒNG LÊN TRÊN TRỐNG ĐỒNG 2 */}
      <div className="absolute -top-3 sm:-top-5 left-0 right-0 w-full h-[92%] z-0 opacity-90">
        <TraversingCulturalRibbonSvg />
      </div>

      {/* 2. CÁNH TRÁI: TRỐNG ĐỒNG ĐÔNG SƠN & CHIM LẠC (Nằm sát mép đáy dưới, tách biệt hoàn toàn với dải trên) */}
      <div className="hidden lg:block absolute bottom-0 left-2 sm:left-6 xl:left-12 w-[340px] xl:w-[410px] max-h-[70%] opacity-[0.16] text-amber-800 z-10">
        <DongSonLeftPanelSvg />
      </div>

      {/* 3. CÁNH PHẢI: TRỐNG ĐỒNG ĐÔNG SƠN & CHIM LẠC & SEN TIỀN GIANG (Nằm sát mép đáy dưới) */}
      <div className="hidden lg:block absolute bottom-0 right-2 sm:right-6 xl:right-12 w-[340px] xl:w-[410px] max-h-[70%] opacity-[0.16] text-amber-800 z-10">
        <DongSonRightPanelSvg />
      </div>

      {/* 4. DẢI SÓNG NƯỚC THỦY BA THANH MẢNH Ở SÁT CHÂN TRANG */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-12 opacity-70 z-10">
        <ThuyBaContinuousWatermark />
      </div>

      {/* 5. QUẦNG SÁNG CẦU VỒNG DỊU NHẸ LAN TỎA (Ambient Glow) */}
      <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-200/20 via-rose-200/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 right-10 w-80 h-80 rounded-full bg-gradient-to-tl from-sky-200/20 via-emerald-200/10 to-transparent blur-3xl" />
    </div>
  );
}
