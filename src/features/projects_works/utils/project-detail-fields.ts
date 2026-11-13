import { formatMoneyString } from "../../../utils/format-money.ts";
import { PROJECT_NATURE_OPTIONS } from "../constants/project-enums.ts";
import type { ProjectItem, ProjectNature } from "@/shared/projects_works/types/project.types";

export type EditablePatch = Partial<
  Pick<
    ProjectItem,
    | "name"
    | "type"
    | "location"
    | "fundingSource"
    | "fundingSources"
    | "totalInvestment"
    | "plan2026"
    | "managerName"
    | "supervisorName"
    | "departments"
    | "startDate"
    | "endDatePlanned"
    | "nature"
  >
>;
export type EditableField = keyof EditablePatch;

export const NATURE_LABELS = Object.fromEntries(PROJECT_NATURE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ProjectNature,
  string
>;

export const FIELD_LABELS: Record<EditableField, string> = {
  name: "Tên dự án",
  type: "Loại dự án",
  location: "Địa bàn xây dựng",
  fundingSource: "Nguồn vốn",
  fundingSources: "Cơ cấu nguồn vốn",
  totalInvestment: "Tổng mức đầu tư",
  plan2026: `Kế hoạch vốn ${new Date().getFullYear()}`,
  managerName: "Người phụ trách",
  supervisorName: "Giám sát kỹ thuật",
  departments: "Phòng ban phụ trách",
  startDate: "Ngày bắt đầu",
  endDatePlanned: "Ngày kết thúc",
  nature: "Tính chất dự án",
};

export function formatField(field: EditableField, project: ProjectItem): string {
  switch (field) {
    case "totalInvestment":
    case "plan2026":
      return `${formatMoneyString(project[field] || 0)} VNĐ`;
    case "nature":
      return project.nature ? NATURE_LABELS[project.nature] : "";
    case "fundingSources":
      return (project.fundingSources ?? [])
        .map((f) => `${f.source}: ${formatMoneyString(f.amount || 0)} VNĐ`)
        .join("; ");
    case "departments":
      return (project.departments ?? []).join(", ");
    default:
      return String(project[field] ?? "");
  }
}
