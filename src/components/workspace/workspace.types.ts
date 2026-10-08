import type { ReactNode } from "react";

/** Mức độ ưu tiên của một mục việc: đỏ = xử lý ngay, vàng = sắp đến hạn, xanh = theo dõi */
export type WorkspaceTaskTone = "danger" | "warning" | "info";

export interface WorkspaceTask<TTab extends string = string> {
  key: string;
  tone: WorkspaceTaskTone;
  title: string;
  description: string;
  count: number;
  tab: TTab;
  /** Bộ lọc áp dụng khi mở tab (mỗi phân hệ tự định nghĩa giá trị) */
  filter?: string;
}

/** Thông tin vai trò hiển thị trên khu vực làm việc, phân hệ nào cũng cung cấp */
export interface WorkspaceRoleProfile {
  roleTitle: string;
  userName: string;
  department: string;
  isReadOnly: boolean;
  scopeDescription: string;
  allowedDuties: string[];
  readingGuide: string;
}

export type KpiTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface KpiItem {
  key: string;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon: ReactNode;
  tone: KpiTone;
  /** 0–100, hiển thị thanh tiến độ dưới giá trị */
  progress?: number;
}

export interface WorkspaceStep {
  number: number;
  label: string;
}

const TONE_ORDER: Record<WorkspaceTaskTone, number> = { danger: 0, warning: 1, info: 2 };

/** Bỏ các mục không có việc và xếp mục khẩn cấp lên đầu */
export function sortWorkspaceTasks<T extends WorkspaceTask>(tasks: T[]): T[] {
  return tasks
    .filter((task) => task.count > 0)
    .sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
}
