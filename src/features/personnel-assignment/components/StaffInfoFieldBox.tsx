import type { ReactNode } from "react";
import { FormOutlined } from "@ant-design/icons";

/** Ô nhập "trong suốt": trông như giá trị đang hiển thị, bấm vào là sửa được ngay.
 *  Ô nhập và ô chọn cùng đệm 8px; phần điều khiển nới ra 8px mỗi bên (-mx-2) để chữ thẳng với nhãn
 *  mà viền khi đang nhập vẫn có khoảng thở, không dính sát chữ. */
export const INLINE_INPUT_CLASS =
  "!px-2 !rounded-md !font-semibold !text-slate-800 placeholder:!font-normal placeholder:!italic";
export const INLINE_SELECT_CLASS =
  "w-full !px-2 !rounded-md [&_.ant-select-selector]:!px-0 [&_.ant-select-content]:!font-semibold [&_.ant-select-content]:!text-slate-800";
export const INLINE_FORM_ITEM_CLASS =
  "!mb-0 mt-0.5 -mx-2 [&_.ant-form-item-explain]:px-2 [&_.ant-form-item-explain]:text-[11px]";

/** Ô thông tin hồ sơ: nhãn nhỏ + giá trị; sửa được thì hiện biểu tượng bút và viền khi rê / nhập */
export default function StaffInfoFieldBox({
  label,
  editable,
  children,
}: {
  label: string;
  editable?: boolean;
  children: ReactNode;
}) {
  return (
    // Dùng <label> để bấm vào bất kỳ đâu trong ô (kể cả biểu tượng bút) là con trỏ vào ô nhập luôn
    <label
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
        editable
          ? "cursor-text border-slate-200/70 bg-slate-50/50 hover:border-[#DC2626]/40 hover:bg-white focus-within:border-[#DC2626]/60 focus-within:bg-white focus-within:shadow-xs"
          : "border-slate-200/70 bg-slate-50/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] text-slate-400">{label}</span>
        <div className="font-semibold text-slate-800 break-words">{children}</div>
      </div>
      {/* Biểu tượng sửa luôn hiện để người dùng biết ô này sửa được */}
      {editable && <FormOutlined className="shrink-0 text-lg text-slate-700" aria-hidden />}
    </label>
  );
}
