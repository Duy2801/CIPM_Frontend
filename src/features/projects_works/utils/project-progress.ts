export interface ProgressUpdateInput {
  permission: { allowed: boolean; reason?: string };
  progress: number;
  note: string;
  actualEndDate: string;
}

export function validateProgressUpdate({ permission, progress, note, actualEndDate }: ProgressUpdateInput): string {
  if (!permission.allowed) return permission.reason || "Bạn không có quyền cập nhật tiến độ cho dự án này.";
  if (progress < 0 || progress > 100) return "Tiến độ thực tế phải nằm trong khoảng từ 0% đến 100%.";
  if (progress === 100 && !actualEndDate.trim())
    return "Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế theo Quy tắc 6.";
  if (!note.trim()) return "Vui lòng nhập ghi chú hoặc nội dung công việc hiện trường trong tuần.";
  return "";
}
