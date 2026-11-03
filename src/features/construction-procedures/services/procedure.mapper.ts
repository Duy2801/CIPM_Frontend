import { PROCEDURE_CATEGORY } from "../constants/procedure-categories";
import type { ProcedureStep, StepType } from "../types/procedure.types";
import type { ProcedureLibraryItem, ProcedureStatus } from "../utils/procedure-library";

/** Dữ liệu Quy trình thủ tục của backend ↔ dạng màn hình dùng (ProcedureLibraryItem / ProcedureStep) */

interface ApiPerson {
  id: string;
  fullName: string;
}

export interface ApiProcedureStep {
  id: string;
  code: string;
  name: string;
  type: StepType;
  plannedDays: number | null;
  durationText: string | null;
  flowStage: number | null;
  isEnabled: boolean;
  spanDays?: number | null;
  assignee?: (ApiPerson & { email?: string }) | null;
  responsibleUnit?: string;
  notes?: string;
  order: number;
}

export interface ApiProcedure {
  id: string;
  name: string;
  isTemplate?: boolean;
  version: string;
  enabled: boolean;
  status: ProcedureStatus;
  stepCount: number;
  totalDays?: number | null;
  submittedBy: ApiPerson | null;
  submittedAt: string | null;
  approvedBy: ApiPerson | null;
  approvedAt: string | null;
  createdBy: ApiPerson | null;
  createdAt: string | null;
  updatedBy: ApiPerson | null;
  updatedAt: string | null;
}

export interface ApiProcedureDetail extends ApiProcedure {
  steps: ApiProcedureStep[];
}

export interface ApiProcedureToggle {
  id: string;
  enabled: boolean;
  status: ProcedureStatus;
}

export interface ApiProcedureReview {
  id: string;
  status: ProcedureStatus;
  submittedBy?: ApiPerson;
  submittedAt?: string;
  approvedBy?: ApiPerson;
  approvedAt?: string;
}

export interface ApiStepsUpdate {
  id: string;
  stepCount: number;
  totalDays?: number | null;
  updatedBy: ApiPerson;
  updatedAt: string;
  steps: ApiProcedureStep[];
}

/** Bước gửi lên backend (StepDto) */
export interface ApiStepInput {
  id?: string;
  code: string;
  name: string;
  type: StepType;
  plannedDays: number | null;
  durationText: string | null;
  flowStage: number | null;
  isEnabled: boolean;
  assigneeId: string | null;
  responsibleUnit: string;
  notes: string;
  order: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Mã do backend cấp (UUID); bước mới tạo trên màn hình có mã tạm, để backend tự sinh */
export const isBackendId = (id?: string | null): id is string => Boolean(id && UUID_PATTERN.test(id));

const rootCode = (code: string) => code.split(".")[0];

export function toProcedureStep(step: ApiProcedureStep, all: ApiProcedureStep[]): ProcedureStep {
  const groupCode = rootCode(step.code);
  const days = step.plannedDays ?? null;
  return {
    id: step.id,
    order: step.order,
    code: step.code,
    groupCode,
    groupTitle: all.find((s) => s.code === groupCode)?.name ?? step.name,
    name: step.name,
    type: step.type,
    responsibleUnit: step.responsibleUnit || "Chủ đầu tư",
    durationMargin: days ? `${days} ngày` : step.durationText || "Theo quy định",
    durationDaysMin: days,
    durationDaysMax: days,
    plannedDays: days ?? undefined,
    flowStage: step.flowStage ?? undefined,
    isEnabled: step.type === "MANDATORY" ? true : step.isEnabled,
    status: "NOT_STARTED",
    assignedTo: step.assignee?.fullName,
    assignedToId: step.assignee?.id,
    attachments: [],
    notes: step.notes ?? "",
  };
}

export const toProcedureSteps = (steps: ApiProcedureStep[] = []): ProcedureStep[] =>
  [...steps].sort((a, b) => a.order - b.order).map((s) => toProcedureStep(s, steps));

export function toStepInput(step: ProcedureStep, index: number): ApiStepInput {
  const days = step.plannedDays || step.durationDaysMax || step.durationDaysMin || null;
  const margin = step.durationMargin?.trim();
  return {
    ...(isBackendId(step.id) ? { id: step.id } : {}),
    code: step.code.trim(),
    name: step.name.trim(),
    type: step.type,
    plannedDays: days && days >= 1 ? Math.round(days) : null,
    // Không có số ngày thì gửi thời gian dạng chữ (Theo HĐ, Theo quy định...)
    durationText: days ? null : margin && !/^\d+\s*ngày$/.test(margin) ? margin : null,
    flowStage: step.flowStage ?? null,
    isEnabled: step.type === "MANDATORY" ? true : step.isEnabled,
    assigneeId: isBackendId(step.assignedToId) ? step.assignedToId : null,
    responsibleUnit: step.responsibleUnit?.trim() || "Chủ đầu tư",
    notes: step.notes ?? "",
    order: index + 1,
  };
}

/** Backend chưa lưu loại quy trình: đoán theo tên (dùng để hiện tab GPMB / Đấu thầu... ở trang dự án) */
export function inferProcedureCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("đấu thầu") || n.includes("lựa chọn nhà thầu")) return PROCEDURE_CATEGORY.BIDDING;
  if (n.includes("bồi thường") || n.includes("gpmb") || n.includes("giải phóng mặt bằng") || n.includes("tái định cư")) {
    return PROCEDURE_CATEGORY.GPMB;
  }
  if (n.includes("quyết toán") || n.includes("giải ngân") || n.includes("tài chính")) return PROCEDURE_CATEGORY.FINANCE;
  if (n.includes("bảo hành") || n.includes("bảo trì")) return PROCEDURE_CATEGORY.WARRANTY;
  return PROCEDURE_CATEGORY.XDCB;
}

/** Quy trình backend → dòng thư viện quy trình. `steps` lấy từ chi tiết (danh sách chỉ có số bước) */
export function toLibraryItem(api: ApiProcedure, steps: ProcedureStep[] = [], category?: string): ProcedureLibraryItem {
  return {
    id: api.id,
    name: api.name,
    category: category || inferProcedureCategory(api.name),
    isCustom: !api.isTemplate,
    status: api.status,
    enabled: api.enabled,
    version: api.version,
    submittedBy: api.submittedBy?.fullName ?? null,
    submittedAt: api.submittedAt,
    approvedBy: api.approvedBy?.fullName ?? null,
    approvedAt: api.approvedAt,
    createdAt: api.createdAt,
    createdBy: api.createdBy?.fullName ?? null,
    updatedAt: api.updatedAt,
    updatedBy: api.updatedBy?.fullName ?? null,
    steps,
  };
}
