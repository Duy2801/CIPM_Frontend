import type { KeyboardEvent, MouseEvent } from "react";

/** Ngày sinh trong hồ sơ cán bộ lưu dạng "dd/mm/yyyy"; ô ngày của trình duyệt dùng "yyyy-mm-dd" */
const toInputValue = (value?: string) => {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value : "";
};

const toStoredValue = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
};

/** Form.Item: chuỗi "dd/mm/yyyy" → giá trị cho ô ngày */
export const dobGetValueProps = (value?: string) => ({ value: toInputValue(value) });

/** Form.Item: giá trị ô ngày → chuỗi "dd/mm/yyyy" để lưu */
export const dobNormalize = (value?: string) => toStoredValue(value);

const todayInputValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Thuộc tính ô ngày sinh của trình duyệt: chỉ chọn trên lịch (không gõ tay), không chọn ngày tương lai */
export const dobInputProps = () => ({
  type: "date" as const,
  max: todayInputValue(),
  // Bấm vào ô là mở lịch luôn
  onClick: (e: MouseEvent<HTMLInputElement>) => e.currentTarget.showPicker?.(),
  // Chặn gõ tay, vẫn cho Tab để chuyển ô
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Tab") e.preventDefault();
  },
});
