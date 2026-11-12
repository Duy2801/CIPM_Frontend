import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectNature,
  ProjectWorkType,
} from "../types/project.types";

export interface CreateProjectForm {
  name: string;
  type: ProjectWorkType | "";
  location: string;
  fundingSource: FundingSourceType | "";
  totalInvestment: number | "";
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
  fundingSource: "Ngân sách thành phố",
  totalInvestment: "",
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

export function toProjectFormData(form: CreateProjectForm): ProjectFormData {
  return {
    name: form.name.trim(),
    type: form.type || "Giao thông",
    location: form.location.trim() || undefined,
    fundingSource: form.fundingSource || "Ngân sách thành phố",
    totalInvestment: form.totalInvestment === "" ? 0 : Number(form.totalInvestment),
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
