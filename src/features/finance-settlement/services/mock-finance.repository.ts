import { FINANCE_MOCK_DATA } from "../constants/finance-mock-data.ts";
import type {
  ApprovalEvent,
  CapitalPlan,
  CapitalPlanAdjustmentInput,
  CapitalPlanInput,
  Disbursement,
  DisbursementInput,
  FinanceDataset,
  SettlementRecord,
} from "../types/finance.types";
import { canCompleteSettlementStep } from "../utils/finance-rules.ts";
import type { FinanceRepository, SettlementStepPayload } from "./finance.repository.ts";
import { getSharedProjects, useProjectStore } from "@/stores/project.store";
import type { ProjectItem } from "@/features/projects_works/types/project.types";

const clone = <T,>(value: T): T => structuredClone(value);

const FINANCE_STORAGE_KEY = "cipm_finance_settlement_store_v1";

function loadFinanceStorage(): FinanceDataset {
  if (typeof window === "undefined") return clone(FINANCE_MOCK_DATA);
  try {
    const raw = window.localStorage.getItem(FINANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
        treasuryAccounts: Array.isArray(parsed.treasuryAccounts) ? parsed.treasuryAccounts : [],
        capitalPlans: Array.isArray(parsed.capitalPlans) ? parsed.capitalPlans : [],
        disbursements: Array.isArray(parsed.disbursements) ? parsed.disbursements : [],
        settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      };
    }
  } catch (e) {
    console.error("Failed to load finance data from localStorage", e);
  }
  return clone(FINANCE_MOCK_DATA);
}

function saveFinanceStorage(data: FinanceDataset) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save finance data to localStorage", e);
  }
}

function syncProjectToStore(projectId: string, capitalPlans: CapitalPlan[]) {
  if (typeof window === "undefined") return;
  try {
    const store = useProjectStore.getState();
    const target = store.projects.find((p) => p.id === projectId || p.code === projectId);
    if (!target) return;

    const prjPlans = capitalPlans.filter(
      (p) => p.projectId === target.id || p.projectId === target.code
    );
    const totalAllocated = prjPlans.reduce(
      (sum, p) => sum + (p.initialAmount || 0) + (p.adjustmentAmount || 0),
      0
    );
    const plan2026 = prjPlans
      .filter((p) => p.year === 2026)
      .reduce((sum, p) => sum + (p.initialAmount || 0) + (p.adjustmentAmount || 0), 0);

    const updates: Partial<ProjectItem> = {};
    if (totalAllocated > 0) {
      if (target.totalInvestment === 0 || totalAllocated > target.totalInvestment) {
        updates.totalInvestment = totalAllocated;
      }
    }
    if (plan2026 > 0 && target.plan2026 !== plan2026) {
      updates.plan2026 = plan2026;
    }

    if (Object.keys(updates).length > 0) {
      store.updateProject(target.id, updates);
    }
  } catch (e) {
    console.error("Failed to sync project to store", e);
  }
}

function syncAllProjectsToStore(capitalPlans: CapitalPlan[]) {
  if (typeof window === "undefined") return;
  try {
    const store = useProjectStore.getState();
    for (const prj of store.projects) {
      syncProjectToStore(prj.id, capitalPlans);
    }
  } catch (e) {
    console.error("Failed to sync all projects to store", e);
  }
}

export function createMockFinanceRepository(): FinanceRepository {
  let dataset = loadFinanceStorage();

  return {
    async getDataset(): Promise<FinanceDataset> {
      const stored = loadFinanceStorage();
      if (stored.capitalPlans.length > 0 || stored.disbursements.length > 0 || stored.settlements.length > 0) {
        dataset = stored;
      }

      const copy = clone(dataset);
      const shared = getSharedProjects();
      const existingIds = new Set(copy.projects.map((p) => p.id));
      for (const sp of shared) {
        const prjPlans = dataset.capitalPlans.filter(
          (p) => p.projectId === sp.id || p.projectId === sp.code
        );
        const totalAllocated = prjPlans.reduce(
          (sum, p) => sum + (p.initialAmount || 0) + (p.adjustmentAmount || 0),
          0
        );
        const effectiveInvestment = totalAllocated > 0
          ? Math.max(sp.totalInvestment || 0, totalAllocated)
          : (sp.totalInvestment || 0);

        if (!existingIds.has(sp.id)) {
          copy.projects.push({
            id: sp.id,
            code: sp.code,
            name: sp.name,
            totalInvestment: effectiveInvestment,
            status: "Đang thực hiện",
          });
          existingIds.add(sp.id);
        } else {
          const p = copy.projects.find((item) => item.id === sp.id);
          if (p) {
            p.totalInvestment = effectiveInvestment;
          }
        }
      }

      syncAllProjectsToStore(dataset.capitalPlans);

      return copy;
    },

    async createCapitalPlan(input: CapitalPlanInput): Promise<CapitalPlan> {
      const plan: CapitalPlan = {
        id: `PLAN-${Date.now()}`,
        projectId: input.projectId,
        year: input.year,
        source: input.source,
        initialAmount: input.amount,
        adjustmentAmount: 0,
        approvalDocument: input.approvalDocument || "QĐ giao vốn đầu năm",
        approvalFileName: input.approvalFileName,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      dataset.capitalPlans = [plan, ...dataset.capitalPlans];
      syncProjectToStore(input.projectId, dataset.capitalPlans);
      saveFinanceStorage(dataset);
      return clone(plan);
    },

    async adjustCapitalPlan(input: CapitalPlanAdjustmentInput): Promise<CapitalPlan> {
      const plan = dataset.capitalPlans.find((item) => item.id === input.planId);
      if (!plan) throw new Error("Không tìm thấy kế hoạch vốn.");
      if (!input.approvalDocument.trim() || !input.approvalFileName.trim()) {
        throw new Error("Điều chỉnh vốn cần văn bản phê duyệt và file đính kèm.");
      }
      Object.assign(plan, {
        adjustmentAmount: plan.adjustmentAmount + input.amount,
        approvalDocument: input.approvalDocument,
        approvalFileName: input.approvalFileName,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      syncProjectToStore(plan.projectId, dataset.capitalPlans);
      saveFinanceStorage(dataset);
      return clone(plan);
    },

    async createDisbursement(input: DisbursementInput, actorName?: string): Promise<Disbursement> {
      const disbursement: Disbursement = {
        ...input,
        id: `DIS-${Date.now()}`,
        code: `GN-${new Date().getFullYear()}-${String(dataset.disbursements.length + 40).padStart(3, "0")}`,
        status: "PENDING_CHIEF",
        approvals: [{
          role: "Kế toán viên",
          actor: actorName || "Nguyễn Thị Thúy Hà",
          at: new Date().toLocaleString("vi-VN"),
          action: "Khởi tạo",
        }],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      dataset.disbursements = [disbursement, ...dataset.disbursements];
      saveFinanceStorage(dataset);
      return clone(disbursement);
    },

    async updateDisbursement(id: string, input: DisbursementInput, actorName?: string): Promise<Disbursement> {
      const item = dataset.disbursements.find((entry) => entry.id === id);
      if (!item) throw new Error("Không tìm thấy đợt giải ngân.");
      if (item.status === "APPROVED") {
        throw new Error("Hồ sơ đã được phê duyệt KBNN, không thể chỉnh sửa.");
      }

      Object.assign(item, input);
      item.status = "PENDING_CHIEF"; // Resubmit to Chief Accountant
      item.approvals.push({
        role: "Kế toán viên",
        actor: actorName || "Nguyễn Thị Thúy Hà",
        at: new Date().toLocaleString("vi-VN"),
        action: "Khởi tạo",
        note: "Đã cập nhật/bổ sung chứng từ và trình lại hồ sơ cho Kế toán trưởng",
      });

      saveFinanceStorage(dataset);
      return clone(item);
    },

    async approveDisbursement(id: string, actorName?: string, actorRole?: string): Promise<Disbursement> {
      const item = dataset.disbursements.find((entry) => entry.id === id);
      if (!item) throw new Error("Không tìm thấy đợt giải ngân.");
      if (item.status === "APPROVED" || item.status === "REJECTED") {
        throw new Error("Luồng duyệt đã hoàn tất.");
      }
      if (item.status === "DRAFT") {
        throw new Error("Kế toán viên cần gửi hồ sơ trước khi duyệt.");
      }

      const isChiefApproval = item.status === "PENDING_CHIEF";
      const event: ApprovalEvent = isChiefApproval
        ? {
          role: "Kế toán trưởng",
          actor: actorName || "Đặng Thị Kim Ngân",
          at: new Date().toLocaleString("vi-VN"),
          action: "Đã duyệt",
          note: "Đã kiểm tra đối chiếu chứng từ và chuyển Giám đốc phê duyệt",
        }
        : {
          role: "Giám đốc",
          actor: actorName || "Huỳnh Thái Hải",
          at: new Date().toLocaleString("vi-VN"),
          action: "Phê duyệt",
          note: "Phê duyệt tờ trình giải ngân KBNN",
        };

      item.approvals.push(event);
      item.status = isChiefApproval ? "PENDING_DIRECTOR" : "APPROVED";
      saveFinanceStorage(dataset);
      return clone(item);
    },

    async rejectDisbursement(id: string, reason: string, actorName?: string, actorRole?: string): Promise<Disbursement> {
      const item = dataset.disbursements.find((entry) => entry.id === id);
      if (!item) throw new Error("Không tìm thấy đợt giải ngân.");
      if (item.status === "APPROVED") {
        throw new Error("Hồ sơ đã được Giám đốc phê duyệt, không thể trả lại.");
      }
      if (!reason.trim()) {
        throw new Error("Vui lòng nhập lý do trả lại / từ chối hồ sơ.");
      }

      const role: ApprovalEvent["role"] = actorRole || (item.status === "PENDING_CHIEF" ? "Kế toán trưởng" : "Giám đốc");
      const defaultActor = item.status === "PENDING_CHIEF" ? "Đặng Thị Kim Ngân" : "Huỳnh Thái Hải";

      item.rejectionReason = reason;
      item.status = "REJECTED";
      item.approvals.push({
        role,
        actor: actorName || defaultActor,
        at: new Date().toLocaleString("vi-VN"),
        action: "Từ chối",
        note: reason,
      });

      saveFinanceStorage(dataset);
      return clone(item);
    },

    async completeSettlementStep(
      id: string,
      step: number,
      payload: SettlementStepPayload,
    ): Promise<SettlementRecord> {
      const settlement = dataset.settlements.find((entry) => entry.id === id);
      if (!settlement) throw new Error("Không tìm thấy hồ sơ tất toán.");

      Object.assign(settlement, payload);
      const result = canCompleteSettlementStep(step, {
        completedSteps: settlement.completedSteps,
        approvedDecisionFile: Boolean(settlement.approvedDecisionFile),
        disbursedAmount: settlement.disbursedAmount,
        approvedSettlementAmount: settlement.approvedSettlementAmount,
        advanceRecovered: settlement.advanceRecovered,
        treasuryClosedDate: settlement.treasuryClosedDate,
        warrantyReturned: settlement.warrantyReturned,
      });
      if (!result.allowed) throw new Error(result.reason);

      if (!settlement.completedSteps.includes(step)) {
        settlement.completedSteps.push(step);
        settlement.completedSteps.sort((a, b) => a - b);
      }
      settlement.status = step === 5 ? "SETTLED" : "IN_PROGRESS";
      if (step === 5) {
        const project = dataset.projects.find((item) => item.id === settlement.projectId);
        if (project) project.status = "Đã tất toán";
      }
      saveFinanceStorage(dataset);
      return clone(settlement);
    },
  };
}

export const mockFinanceRepository = createMockFinanceRepository();
