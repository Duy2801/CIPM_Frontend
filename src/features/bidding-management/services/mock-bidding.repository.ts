import { todayIso } from "../../../utils/date.ts";
import { BIDDING_MOCK_DATA } from "../constants/bidding-mock-data.ts";
import type { BidPackage, BiddingDataset, BidStepRecord } from "../types/bidding.types";
import { getCurrentBidStep, validateBidStep } from "../utils/bidding-rules.ts";
import type { BiddingRepository } from "./bidding.repository.ts";

const clone = <T,>(value: T): T => structuredClone(value);

export function createMockBiddingRepository(): BiddingRepository {
  const dataset: BiddingDataset = clone(BIDDING_MOCK_DATA);

  const find = (id: string): BidPackage => {
    const pkg = dataset.packages.find((item) => item.id === id);
    if (!pkg) throw new Error("Không tìm thấy gói thầu.");
    return pkg;
  };

  return {
    async getDataset() {
      return clone(dataset);
    },

    async createPackage(input) {
      if (!input.name.trim()) throw new Error("Vui lòng nhập tên gói thầu.");
      if (input.estimatedPrice <= 0) throw new Error("Giá gói thầu phải lớn hơn 0.");

      const projectNo = input.projectId.replace("PRJ-", "");
      const sequence = dataset.packages.filter((item) => item.projectId === input.projectId).length + 1;
      const records: BidStepRecord[] = [];
      const currentStep = input.currentStep || 1;
      const stepDates: Record<number, string> = {
        1: "2026-02-15", 2: "2026-03-01", 3: "2026-03-15",
        4: "2026-04-01", 5: "2026-04-20", 6: "2026-05-05",
        7: "2026-05-25", 8: "2026-06-10", 9: "2026-06-25",
      };
      for (let s = 1; s < currentStep; s++) {
        records.push({
          step: s,
          completedAt: stepDates[s] || todayIso(),
          documentNo: `${String(s).padStart(2, "0")}/QĐ-BQL`,
          by: "Tổ Giám sát – Kỹ thuật",
          approvedBy: s === 2 || s === 8 ? "Huỳnh Thái Hải" : undefined,
        });
      }

      const pkg: BidPackage = {
        id: `PKG-${Date.now()}`,
        code: `DA-${projectNo}-GT-${String(sequence).padStart(3, "0")}`,
        name: input.name.trim(),
        projectId: input.projectId,
        type: input.type,
        method: input.method,
        estimatedPrice: input.estimatedPrice,
        bidDeadline: input.bidDeadline || undefined,
        winner: input.winner?.trim() || undefined,
        winningPrice: input.winningPrice ? Number(input.winningPrice) : undefined,
        records,
        currentStepStartedAt: todayIso(),
      };
      dataset.packages = [pkg, ...dataset.packages];
      return clone(pkg);
    },

    async completeStep(packageId, input, actor) {
      const pkg = find(packageId);
      const error = validateBidStep(pkg, input, "complete");
      if (error) throw new Error(error);

      const step = getCurrentBidStep(pkg) as number;
      pkg.records.push({
        step,
        completedAt: input.completedAt,
        documentNo: input.documentNo,
        by: actor,
        fileName: input.fileName,
        fileSize: input.fileSize,
      });
      if (step === 4) pkg.bidDeadline = input.bidDeadline;
      pkg.currentStepStartedAt = input.completedAt;
      pkg.rejection = undefined;
      return clone(pkg);
    },

    async submitStep(packageId, input, actor) {
      const pkg = find(packageId);
      const error = validateBidStep(pkg, input, "submit");
      if (error) throw new Error(error);

      pkg.submission = {
        step: getCurrentBidStep(pkg) as number,
        submittedBy: actor,
        submittedAt: todayIso(),
        documentNo: input.documentNo,
        winner: input.winner,
        winningPrice: input.winningPrice,
        fileName: input.fileName,
        fileSize: input.fileSize,
      };
      pkg.rejection = undefined;
      return clone(pkg);
    },

    async approveSubmission(packageId, actor) {
      const pkg = find(packageId);
      const submission = pkg.submission;
      if (!submission) throw new Error("Gói thầu không có tờ trình đang chờ duyệt.");

      const completedAt = todayIso();
      pkg.records.push({
        step: submission.step,
        completedAt,
        documentNo: submission.documentNo,
        by: submission.submittedBy,
        approvedBy: actor,
        fileName: submission.fileName,
        fileSize: submission.fileSize,
      });
      if (submission.winner) {
        pkg.winner = submission.winner;
        pkg.winningPrice = submission.winningPrice;
      }
      pkg.currentStepStartedAt = completedAt;
      pkg.submission = undefined;
      return clone(pkg);
    },

    async rejectSubmission(packageId, reason, actor) {
      const pkg = find(packageId);
      if (!pkg.submission) throw new Error("Gói thầu không có tờ trình đang chờ duyệt.");
      if (!reason.trim()) throw new Error("Vui lòng nhập lý do trả lại.");

      pkg.rejection = { step: pkg.submission.step, reason, by: actor, at: todayIso() };
      pkg.submission = undefined;
      return clone(pkg);
    },
  };
}

export const mockBiddingRepository = createMockBiddingRepository();
