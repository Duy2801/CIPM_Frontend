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

const clone = <T,>(value: T): T => structuredClone(value);

export function createMockFinanceRepository(): FinanceRepository {
  const dataset = clone(FINANCE_MOCK_DATA);

  return {
    async getDataset(): Promise<FinanceDataset> {
      return clone(dataset);
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
      return clone(settlement);
    },
  };
}

export const mockFinanceRepository = createMockFinanceRepository();
