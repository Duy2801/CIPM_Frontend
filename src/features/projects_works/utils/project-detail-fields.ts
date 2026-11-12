import { formatMoneyString } from "../../../utils/format-money.ts";
import type { ProjectItem, ProjectNature } from "../types/project.types";

export type EditablePatch = Partial<
  Pick<
    ProjectItem,
    | "name"
    | "type"
    | "location"
    | "fundingSource"
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

export const NATURE_LABELS: Record<ProjectNature, string> = {
  new: "Dự án mới (Khởi công mới)",
  transitional: "Dự án cũ (Chuyển tiếp)",
};

export const FIELD_LABELS: Record<EditableField, string> = {
  name: "Tên dự án",
  type: "Loại dự án",
  location: "Địa bàn xây dựng",
  fundingSource: "Nguồn vốn",
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
    case "departments":
      return (project.departments ?? []).join(", ");
    default:
      return String(project[field] ?? "");
  }
}

export const parseMoney = (raw: string) => Number(raw.replace(/[.,\s]/g, ""));

export const validateMoney = (raw: string) =>
  /^[\d.,\s]+$/.test(raw) && Number.isFinite(parseMoney(raw)) ? undefined : "Vui lòng nhập số tiền hợp lệ.";
