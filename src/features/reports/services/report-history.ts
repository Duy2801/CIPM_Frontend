/**
 * Lịch sử thao tác của phân hệ Báo cáo — ghi vào sổ nhật ký chung của hệ thống
 * (cùng chỗ với Nhân sự, Phân quyền, Thư viện pháp lý), lọc theo phân hệ "Báo cáo".
 */
import {
  appendActivity,
  getPersonnelActivities,
  type ActivityEntry,
} from "@/features/personnel-assignment/utils/activity-log";
import type { AuthUser } from "@/types/auth";

const REPORT_LOG_MODULE = "Báo cáo";

type ReportAction = "IMPORT" | "EXPORT" | "ADD_TYPE" | "REMOVE_TYPE";

const ACTION_TEXT: Record<ReportAction, string> = {
  IMPORT: "Nhập Excel",
  EXPORT: "Xuất Excel",
  ADD_TYPE: "Thêm loại báo cáo",
  REMOVE_TYPE: "Xóa loại báo cáo",
};

/** Ghi một thao tác: "Nhập Excel: Báo cáo giám sát – kỹ thuật", kèm tên tệp nếu có */
export function logReportAction(
  user: AuthUser | null,
  action: ReportAction,
  type: { id: string; name: string },
  fileName?: string,
) {
  appendActivity({
    actorName: user?.displayName || user?.name || "Không rõ",
    actorRole: user?.roleName ?? undefined,
    module: REPORT_LOG_MODULE,
    action: `${ACTION_TEXT[action]}: ${type.name}`,
    // Mã loại báo cáo: để xem riêng lịch sử từng báo cáo
    targetId: type.id,
    targetName: fileName,
    changes: fileName ? [{ label: "Tệp", to: fileName }] : undefined,
  });
}

/** Lịch sử của phân hệ Báo cáo; truyền `typeId` để chỉ lấy thao tác trên một loại báo cáo */
export function getReportHistory(typeId?: string): ActivityEntry[] {
  return getPersonnelActivities().filter(
    (e) => e.module === REPORT_LOG_MODULE && (!typeId || e.targetId === typeId),
  );
}
