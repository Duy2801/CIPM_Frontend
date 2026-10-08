import { sortWorkspaceTasks } from "../../../components/workspace/workspace.types.ts";
import type { GpmbRolePermissions, GpmbTask, Household, HouseholdFilter } from "../types/gpmb.types";
import { matchesHouseholdFilter } from "./gpmb-rules.ts";

/** Danh sách việc đầu trang M6, khác nhau giữa người cập nhật (Tổ BT) và người duyệt (GĐ/PGĐ) */
export function buildGpmbTasks(
  permissions: GpmbRolePermissions,
  households: Household[],
  today: string,
): GpmbTask[] {
  const count = (filter: HouseholdFilter) =>
    households.filter((household) => matchesHouseholdFilter(household, filter, today)).length;

  const tasks: GpmbTask[] = [
    {
      key: "overdue",
      tone: "danger",
      title: "Hộ dân quá hạn pháp lý",
      description: "Đã vượt thời hạn bắt buộc của bước hiện tại",
      count: count("OVERDUE"),
      tab: "households",
      filter: "OVERDUE",
    },
    {
      key: "soon",
      tone: "warning",
      title: "Sắp hết thời hạn pháp lý",
      description: "Còn tối đa 3 ngày",
      count: count("SOON"),
      tab: "households",
      filter: "SOON",
    },
  ];

  if (permissions.canApprove) {
    tasks.push({
      key: "approve",
      tone: "warning",
      title: "Đề xuất chờ bạn duyệt",
      description: "Tổ Bồi thường đề xuất hoàn thành bước quan trọng",
      count: count("PENDING_APPROVAL"),
      tab: "households",
      filter: "PENDING_APPROVAL",
    });
  }

  if (permissions.canEdit) {
    tasks.push(
      {
        key: "rejected",
        tone: "danger",
        title: "Đề xuất bị trả lại",
        description: "Đọc lý do, bổ sung hồ sơ rồi đề xuất lại",
        count: count("REJECTED"),
        tab: "households",
        filter: "REJECTED",
      },
      {
        key: "payment",
        tone: "info",
        title: "Hộ đến bước chi trả tiền",
        description: "Phương án đã duyệt, sẵn sàng chi trả",
        count: count("PAYMENT_READY"),
        tab: "households",
        filter: "PAYMENT_READY",
      },
      {
        key: "waiting",
        tone: "info",
        title: "Đề xuất đang chờ lãnh đạo duyệt",
        description: "Theo dõi, không cần thao tác",
        count: count("PENDING_APPROVAL"),
        tab: "households",
        filter: "PENDING_APPROVAL",
      },
    );
  }

  tasks.push({
    key: "special",
    tone: "warning",
    title: "Hộ không hợp tác / khiếu kiện",
    description: "Cần vận động, đối thoại hoặc xử lý theo bước 14–15",
    count: count("SPECIAL"),
    tab: "households",
    filter: "SPECIAL",
  });

  return sortWorkspaceTasks(tasks);
}
