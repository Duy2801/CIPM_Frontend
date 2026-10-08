import { sortWorkspaceTasks } from "../../../components/workspace/workspace.types.ts";
import type { Incident, WarrantyRecord, WarrantyRolePermissions, WarrantyTask } from "../types/warranty.types";
import { matchesIncidentFilter, matchesWarrantyFilter } from "./warranty-rules.ts";

export function buildWarrantyTasks(
  permissions: WarrantyRolePermissions,
  warranties: WarrantyRecord[],
  incidents: Incident[],
  today: string,
): WarrantyTask[] {
  const overdue = incidents.filter((item) => matchesIncidentFilter(item, "OVERDUE", today)).length;
  const urgent = warranties.filter((item) => matchesWarrantyFilter(item, "URGENT", incidents, today)).length;
  const bondReady = warranties.filter((item) => matchesWarrantyFilter(item, "BOND_READY", incidents, today)).length;

  const tasks: WarrantyTask[] = [
    {
      key: "incident-overdue",
      tone: "danger",
      title: "Sự cố quá hạn khắc phục",
      description: "Nhà thầu chưa khắc phục xong trong thời hạn yêu cầu",
      count: overdue,
      tab: "incidents",
      filter: "OVERDUE",
    },
    {
      key: "warranty-urgent",
      tone: "warning",
      title: "Công trình còn ≤ 30 ngày bảo hành",
      description: permissions.canManageIncidents
        ? "Kiểm tra hiện trường lần cuối trước khi hết hạn"
        : "Theo dõi để chuẩn bị hoàn trả bảo lãnh",
      count: urgent,
      tab: "warranties",
      filter: "URGENT",
    },
  ];

  if (permissions.canManageIncidents) {
    tasks.push(
      {
        key: "incident-open",
        tone: "warning",
        title: "Sự cố mới cần đôn đốc nhà thầu",
        description: "Chưa được nhà thầu bắt đầu khắc phục",
        count: incidents.filter((item) => item.status === "OPEN").length,
        tab: "incidents",
        filter: "OPEN",
      },
      {
        key: "incident-fixing",
        tone: "info",
        title: "Sự cố đang khắc phục",
        description: "Nghiệm thu khi nhà thầu báo hoàn thành",
        count: incidents.filter((item) => item.status === "FIXING").length,
        tab: "incidents",
        filter: "FIXING",
      },
    );
  }

  tasks.push({
    key: "bond-ready",
    tone: permissions.canManageBond ? "warning" : "info",
    title: permissions.canManageBond ? "Bảo lãnh chờ bạn hoàn trả" : "Bảo lãnh đủ điều kiện hoàn trả",
    description: "Đã hết hạn bảo hành và không còn sự cố",
    count: bondReady,
    tab: "warranties",
    filter: "BOND_READY",
  });

  return sortWorkspaceTasks(tasks);
}
