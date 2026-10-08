import { sortWorkspaceTasks } from "../../../components/workspace/workspace.types.ts";
import type {
  Assignment,
  AssignmentFilter,
  PersonnelRolePermissions,
  PersonnelTask,
  Staff,
} from "../types/personnel.types";
import { isOverloaded, matchesAssignmentFilter } from "./personnel-rules.ts";

export function buildPersonnelTasks(
  permissions: PersonnelRolePermissions,
  assignments: Assignment[],
  staff: Staff[],
  today: string,
): PersonnelTask[] {
  const count = (filter: AssignmentFilter) =>
    assignments.filter((item) => matchesAssignmentFilter(item, filter, today)).length;

  const tasks: PersonnelTask[] = [
    {
      key: "overdue",
      tone: "danger",
      title: "Nhiệm vụ quá hạn",
      description: "Cần đôn đốc hoặc điều chỉnh hạn",
      count: count("OVERDUE"),
      tab: "assignments",
      filter: "OVERDUE",
    },
    {
      key: "due-soon",
      tone: "warning",
      title: "Nhiệm vụ sắp đến hạn",
      description: "Còn tối đa 3 ngày",
      count: count("DUE_SOON"),
      tab: "assignments",
      filter: "DUE_SOON",
    },
    {
      key: "overloaded",
      tone: "info",
      title: "Cán bộ đang quá tải",
      description: "Từ 4 việc đang làm trở lên – cân nhắc san sẻ",
      count: staff.filter((person) => isOverloaded(person.id, assignments)).length,
      tab: "organization",
    },
  ];

  if (permissions.canAssign) {
    tasks.push({
      key: "unassigned",
      tone: "warning",
      title: "Nhiệm vụ chưa giao người",
      description: "Chọn cán bộ phù hợp để giao",
      count: count("UNASSIGNED"),
      tab: "assignments",
      filter: "UNASSIGNED",
    });
  }

  if (permissions.canManageAccounts) {
    tasks.push({
      key: "locked",
      tone: "info",
      title: "Tài khoản đang bị khóa",
      description: "Kiểm tra lại khi cán bộ trở lại công tác",
      count: staff.filter((person) => !person.accountActive).length,
      tab: "accounts",
    });
  }

  return sortWorkspaceTasks(tasks);
}
