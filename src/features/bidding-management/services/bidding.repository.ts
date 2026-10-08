import type { BidPackage, BidStepInput, BiddingDataset, CreatePackageInput } from "../types/bidding.types";

/** Ranh giới dữ liệu M7 – backend chỉ cần cung cấp implementation cùng interface */
export interface BiddingRepository {
  getDataset(): Promise<BiddingDataset>;
  createPackage(input: CreatePackageInput, actor: string): Promise<BidPackage>;
  completeStep(packageId: string, input: BidStepInput, actor: string): Promise<BidPackage>;
  submitStep(packageId: string, input: BidStepInput, actor: string): Promise<BidPackage>;
  approveSubmission(packageId: string, actor: string): Promise<BidPackage>;
  rejectSubmission(packageId: string, reason: string, actor: string): Promise<BidPackage>;
}
