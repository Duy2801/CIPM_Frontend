import type { GpmbDataset, Household, HouseholdInput, SpecialStatus, StepCompletionInput } from "../types/gpmb.types";

/** Ranh giới dữ liệu M6 – backend chỉ cần cung cấp implementation cùng interface */
export interface GpmbRepository {
  getDataset(): Promise<GpmbDataset>;
  createHousehold(input: HouseholdInput, actor: string): Promise<Household>;
  /** Hoàn thành bước thường (Tổ Bồi thường) */
  completeStep(householdId: string, input: StepCompletionInput, actor: string): Promise<Household>;
  /** Đề xuất hoàn thành bước quan trọng (Tổ Bồi thường) */
  proposeStep(householdId: string, input: StepCompletionInput, actor: string): Promise<Household>;
  approveProposal(householdId: string, actor: string): Promise<Household>;
  rejectProposal(householdId: string, reason: string, actor: string): Promise<Household>;
  updateSpecialStatus(householdId: string, status: SpecialStatus, actor: string): Promise<Household>;
  /** Bổ sung / cập nhật tài liệu hoặc thông tin cho một bước đã hoàn thành */
  updateStepRecord(
    householdId: string,
    step: number,
    data: { fileName?: string; documentNo?: string; note?: string },
    actor: string
  ): Promise<Household>;
}
