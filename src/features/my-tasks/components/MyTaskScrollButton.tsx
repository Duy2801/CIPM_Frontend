"use client";

import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { cn } from "@/utils/cn";

interface MyTaskScrollButtonProps {
  side: "left" | "right";
  onClick: () => void;
}

export default function MyTaskScrollButton({ side, onClick }: MyTaskScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Xem cột bên trái" : "Xem cột bên phải"}
      title={side === "left" ? "Cột trước" : "Cột tiếp theo"}
      className={cn(
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md transition hover:border-[#DC2626] hover:text-[#DC2626]",
        side === "left" ? "-left-2" : "-right-2",
      )}
    >
      {side === "left" ? <LeftOutlined /> : <RightOutlined />}
    </button>
  );
}
