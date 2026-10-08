import type {
  ApprovalStatus,
  CapitalPlan,
  Disbursement,
  FinanceRolePermissions,
  FinanceTask,
  FinanceTaskTone,
  SettlementRecord,
} from "../types/finance.types";
import { sortWorkspaceTasks } from "../../../components/workspace/workspace.types.ts";
import { getNextSettlementStep } from "./finance-rules.ts";

interface BuildFinanceTasksInput {
  permissions: FinanceRolePermissions;
  disbursements: Disbursement[];
  settlements: SettlementRecord[];
  plans: CapitalPlan[];
  overdueCount: number;
  dueSoonCount: number;
  contractWarningCount: number;
}

const ACTION_TASK_COPY: Partial<Record<ApprovalStatus, { title: string; description: string; tone: FinanceTaskTone }>> = {
  PENDING_CHIEF: {
    title: "Hồ sơ chờ bạn duyệt cấp 1",
    description: "Kiểm tra chứng từ, hạn mức hợp đồng rồi duyệt hoặc trả lại.",
    tone: "warning",
  },
  PENDING_DIRECTOR: {
    title: "Hồ sơ chờ bạn phê duyệt cấp 2",
    description: "Kế toán trưởng đã kiểm tra, cần Giám đốc ký tờ trình KBNN.",
    tone: "warning",
  },
  REJECTED: {
    title: "Hồ sơ bị trả lại cần bổ sung",
    description: "Đọc lý do trả lại, bổ sung chứng từ và trình lại.",
    tone: "danger",
  },
};

const isPending = (status: ApprovalStatus) =>
  status === "PENDING_CHIEF" || status === "PENDING_DIRECTOR";

/**
 * Dựng danh sách "việc cần xử lý" (vai trò có quyền thao tác)
 * hoặc "điểm cần theo dõi" (vai trò chỉ xem) cho khu vực làm việc đầu trang.
 */
export function buildFinanceTasks({
  permissions,
  disbursements,
  settlements,
  plans,
  overdueCount,
  dueSoonCount,
  contractWarningCount,
}: BuildFinanceTasksInput): FinanceTask[] {
  const tasks: FinanceTask[] = [];
  const { actionStatus, isReadOnly } = permissions;

  if (actionStatus && ACTION_TASK_COPY[actionStatus]) {
    const copy = ACTION_TASK_COPY[actionStatus];
    tasks.push({
      key: "my-turn",
      ...copy,
      count: disbursements.filter((item) => item.status === actionStatus).length,
      tab: "disbursement",
      statusFilter: actionStatus,
    });
  }

  tasks.push(
    {
      key: "overdue",
      tone: "danger",
      title: "Hồ sơ quá hạn thanh toán",
      description: "Đã qua hạn nhưng chưa hoàn tất phê duyệt.",
      count: overdueCount,
      tab: "disbursement",
    },
    {
      key: "due-soon",
      tone: "warning",
      title: "Sắp đến hạn thanh toán",
      description: "Còn tối đa 5 ngày làm việc.",
      count: dueSoonCount,
      tab: "disbursement",
    },
    {
      key: "contract-cap",
      tone: "warning",
      title: "Hợp đồng chạm ngưỡng 95%",
      description: "Đợt thanh toán tiếp theo dễ vượt giá trị hợp đồng.",
      count: contractWarningCount,
      tab: "disbursement",
    },
  );

  if (permissions.settlementSteps.length > 0) {
    tasks.push({
      key: "settlement",
      tone: "info",
      title: "Hồ sơ tất toán đến lượt bạn",
      description: "Bước tiếp theo của quy trình KBNN thuộc thẩm quyền của bạn.",
      count: settlements.filter((item) => {
        const next = getNextSettlementStep(item.completedSteps);
        return next !== null && permissions.settlementSteps.includes(next);
      }).length,
      tab: "settlement",
    });
  }

  const inFlight = disbursements.filter(
    (item) => isPending(item.status) && item.status !== actionStatus,
  ).length;
  tasks.push({
    key: "in-flight",
    tone: "info",
    title: isReadOnly ? "Hồ sơ đang trong luồng duyệt" : "Hồ sơ đang chờ cấp khác xử lý",
    description: "Theo dõi để nắm tiến độ, không cần thao tác.",
    count: inFlight,
    tab: "disbursement",
  });

  if (permissions.roleCode === "ADMINISTRATIVE_OFFICER") {
    tasks.push({
      key: "capital-docs",
      tone: "info",
      title: "Văn bản điều chỉnh vốn cần lưu trữ",
      description: "Quyết định điều chỉnh kế hoạch vốn đã ban hành trong năm.",
      count: plans.filter((plan) => Boolean(plan.approvalDocument)).length,
      tab: "capital",
    });
  }

  return sortWorkspaceTasks(tasks);
}
