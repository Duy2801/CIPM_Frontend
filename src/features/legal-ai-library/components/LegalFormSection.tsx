import type { ReactNode } from "react";

/** Khối nhóm trường trong form văn bản: nền xám nhạt, tiêu đề có biểu tượng */
export function LegalFormSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col gap-3">
      <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <span className="text-[#DC2626]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

/** Một trường trong form: nhãn (dấu * nếu bắt buộc, ghi chú nhỏ nếu có) + ô nhập */
export function LegalFormField({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1 leading-tight">
        {label} {required && <span className="text-rose-500">*</span>}
        {hint && <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
