"use client";

/** Ngày (yyyy-mm-dd, theo giờ máy) của một thời điểm ISO — dùng để lọc nhật ký theo ngày */
export const toLocalDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface ActivityDateFilterProps {
  /** Ngày đang lọc (yyyy-mm-dd), rỗng = không lọc */
  value: string;
  onChange: (value: string) => void;
}

/** Lọc nhật ký theo một ngày: ô ngày của trình duyệt (chỉ chọn trên lịch, không gõ tay) */
export default function ActivityDateFilter({ value, onChange }: ActivityDateFilterProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span>Ngày</span>
      <input
        type="date"
        aria-label="Lọc theo ngày"
        title="Lọc theo ngày"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        onKeyDown={(e) => {
          // Không gõ tay; Backspace / Delete để bỏ lọc (lịch của trình duyệt cũng có nút "Xóa")
          if (e.key === "Backspace" || e.key === "Delete") onChange("");
          if (e.key !== "Tab") e.preventDefault();
        }}
        className="h-7 w-33 cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
      />
    </div>
  );
}
