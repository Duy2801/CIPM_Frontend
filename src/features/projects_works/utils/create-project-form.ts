import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectNature,
  ProjectWorkType,
} from "@/shared/projects_works/types/project.types";

export interface FundingLine {
  id: string;
  source: FundingSourceType | "";
  amount: number | "";
}

export interface CreateProjectForm {
  name: string;
  type: ProjectWorkType | "";
  location: string;
  fundings: FundingLine[];
  plan2026: number | "";
  procedures: Record<string, string>;
  tabLabels: Record<string, string>;
  managerName: string;
  supervisorName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  documents: ProjectDocument[];
}

export const DEFAULT_PERSON = "Huỳnh Thái Hải";

export const createInitialForm = (today = new Date().toISOString().slice(0, 10)): CreateProjectForm => ({
  name: "",
  type: "Giao thông",
  location: "",
  fundings: [{ id: "FUND-1", source: "Ngân sách thành phố", amount: "" }],
  plan2026: "",
  procedures: {},
  tabLabels: {},
  managerName: DEFAULT_PERSON,
  supervisorName: DEFAULT_PERSON,
  startDate: today,
  endDatePlanned: "",
  nature: "new",
  documents: [],
});

export function validateCreateForm(form: CreateProjectForm): string {
  if (!form.name.trim()) return "Vui lòng nhập tên công trình / dự án (*).";
  if (!form.type) return "Vui lòng chọn loại công trình (*).";
  if (Object.keys(form.procedures).length === 0) return "Vui lòng chọn ít nhất một quy trình dự án (*).";
  if (!form.startDate) return "Vui lòng chọn ngày bắt đầu (*).";
  if (!form.endDatePlanned) return "Vui lòng chọn ngày kết thúc kế hoạch (*).";
  if (new Date(form.endDatePlanned) <= new Date(form.startDate))
    return "Ràng buộc: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.";
  return "";
}

export function toFundingSources(lines: FundingLine[]) {
  return lines.flatMap((line) =>
    line.source ? [{ source: line.source, amount: line.amount === "" ? 0 : Number(line.amount) }] : [],
  );
}

export function toProjectFormData(form: CreateProjectForm): ProjectFormData {
  const fundingSources = toFundingSources(form.fundings);
  return {
    name: form.name.trim(),
    type: form.type || "Giao thông",
    location: form.location.trim() || undefined,
    fundingSource: (fundingSources.map((f) => f.source).join(", ") || "Ngân sách thành phố") as FundingSourceType,
    fundingSources,
    totalInvestment: fundingSources.reduce((sum, f) => sum + f.amount, 0),
    plan2026: form.plan2026 === "" ? 0 : Number(form.plan2026),
    departments: Object.keys(form.procedures),
    managerName: form.managerName.trim() || DEFAULT_PERSON,
    supervisorName: form.supervisorName.trim() || DEFAULT_PERSON,
    startDate: form.startDate,
    endDatePlanned: form.endDatePlanned,
    nature: form.nature,
    currentStage: "PREPARATION",
    actualProgress: 0,
    plannedProgress: 0,
    note: "",
    documents: form.documents,
    procedures: form.procedures,
    procedureTabLabels: form.tabLabels,
  };
}
