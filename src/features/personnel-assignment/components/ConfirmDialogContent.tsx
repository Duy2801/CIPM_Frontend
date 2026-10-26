import type { ReactNode } from "react";

/** Khung hộp xác nhận bo góc dùng với modal.confirm (title / icon của antd để null) */
export const CONFIRM_DIALOG_CLASS =
  "[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-6 [&_.ant-modal-content]:!shadow-xl";

interface ConfirmDialogContentProps {
  icon: ReactNode;
  /** Màu viền ô biểu tượng, VD: "border-amber-200" */
  iconBorderClass?: string;
  title: ReactNode;
  subtitle: ReactNode;
  /** Thêm class cho ô thông tin bên dưới, VD: "space-y-1.5" */
  bodyClassName?: string;
  children: ReactNode;
}

/** Nội dung hộp xác nhận: biểu tượng + tiêu đề + mô tả, bên dưới là ô thông tin của đối tượng */
export default function ConfirmDialogContent({
  icon,
  iconBorderClass = "border-amber-200",
  title,
  subtitle,
  bodyClassName = "",
  children,
}: ConfirmDialogContentProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-start gap-3.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 border ${iconBorderClass} text-amber-600 text-lg shadow-xs`}
        >
          {icon}
        </span>
        <div className="pt-0.5">
          <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className={`rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-700 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
