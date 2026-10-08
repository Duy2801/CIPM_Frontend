import type {
  CapitalPlan,
  CapitalPlanAdjustmentInput,
  CapitalPlanInput,
  Disbursement,
  DisbursementInput,
  FinanceDataset,
  SettlementRecord,
} from "../types/finance.types";

export interface SettlementStepPayload {
  approvedDecisionFile?: string;
  approvedSettlementAmount?: number;
  advanceRecovered?: boolean;
  treasuryClosedDate?: string;
  warrantyReturned?: boolean;
}

export interface FinanceRepository {
  getDataset(): Promise<FinanceDataset>;
  createCapitalPlan(input: CapitalPlanInput): Promise<CapitalPlan>;
  adjustCapitalPlan(input: CapitalPlanAdjustmentInput): Promise<CapitalPlan>;
  createDisbursement(input: DisbursementInput, actorName?: string): Promise<Disbursement>;
  updateDisbursement(id: string, input: DisbursementInput, actorName?: string): Promise<Disbursement>;
  approveDisbursement(id: string, actorName?: string, actorRole?: string): Promise<Disbursement>;
  rejectDisbursement(id: string, reason: string, actorName?: string, actorRole?: string): Promise<Disbursement>;
  completeSettlementStep(
    id: string,
    step: number,
    payload: SettlementStepPayload,
  ): Promise<SettlementRecord>;
}

