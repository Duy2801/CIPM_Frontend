import type {
  FundingSourceType,
  ProjectDocument,
  ProjectFormData,
  ProjectItem,
  ProjectNature,
  ProjectStage,
  ProjectWorkType,
} from "@/shared/projects_works/types/project.types";

export interface EditProjectForm {
  name: string;
  type: ProjectWorkType | "";
  fundingSource: FundingSourceType | "";
  totalInvestment: number | "";
  plan2026: number | "";
  departments: string[];
  managerName: string;
  startDate: string;
  endDatePlanned: string;
  nature: ProjectNature;
  currentStage: ProjectStage;
  actualProgress: number | "";
  plannedProgress: number | "";
  note: string;
  documents: ProjectDocument[];
}

const DEFAULT_PERSON = "Huỳnh Thái Hải";

export function formFromProject(project: ProjectItem): EditProjectForm {
  return {
    name: project.name || "",
    type: project.type || "Giao thông",
    fundingSource: project.fundingSource || "Ngân sách tỉnh",
    totalInvestment: project.totalInvestment ?? "",
    plan2026: project.plan2026 ?? "",
    departments: project.departments && project.departments.length > 0 ? project.departments : ["Tổ Giám sát – Kỹ thuật"],
    managerName: project.managerName || DEFAULT_PERSON,
    startDate: project.startDate || "",
    endDatePlanned: project.endDatePlanned || "",
    nature: project.nature || (project.actualProgress > 0 ? "transitional" : "new"),
    currentStage: project.currentStage || "BIDDING",
    actualProgress: project.actualProgress ?? 0,
    plannedProgress: project.plannedProgress ?? 0,
    note: project.note || "",
    documents: project.documents || [],
  };
}

export function validateEditForm(form: EditProjectForm, project: ProjectItem): string {
  if (project.status === "closed") return "Dự án đã đóng. Không thể sửa thông tin.";
  if (!form.name.trim()) return "Vui lòng nhập tên công trình / dự án (*).";
  if (!form.type) return "Vui lòng chọn loại công trình (*).";
  if (form.departments.length === 0) return "Vui lòng chọn ít nhất một phòng ban phụ trách (*).";
  if (!form.startDate) return "Vui lòng chọn ngày bắt đầu (*).";
  if (!form.endDatePlanned) return "Vui lòng chọn ngày kết thúc kế hoạch (*).";
  if (new Date(form.endDatePlanned) <= new Date(form.startDate))
    return "Ràng buộc 4.2.2: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.";
  return "";
}

export function toEditProjectFormData(form: EditProjectForm, project: ProjectItem): ProjectFormData {
  return {
    name: form.name.trim(),
    type: (form.type as ProjectWorkType) || project.type,
    location: project.location,
    scale: project.scale,
    fundingSource: (form.fundingSource as FundingSourceType) || project.fundingSource,
    totalInvestment: form.totalInvestment === "" ? (project.totalInvestment ?? 0) : Number(form.totalInvestment),
    plan2026: form.plan2026 === "" ? 0 : Number(form.plan2026),
    departments: form.departments,
    managerName: form.managerName?.trim() || DEFAULT_PERSON,
    supervisorName: project.supervisorName || DEFAULT_PERSON,
    startDate: form.startDate,
    endDatePlanned: form.endDatePlanned,
    nature: form.nature,
    currentStage: form.currentStage || project.currentStage,
    actualProgress: form.nature === "new" ? 0 : form.actualProgress === "" ? 0 : Number(form.actualProgress),
    plannedProgress: form.plannedProgress === "" ? 0 : Number(form.plannedProgress),
    note: form.note.trim(),
    documents: form.documents,
  };
}
