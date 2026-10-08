import { todayIso } from "../../../utils/date.ts";
import { GPMB_MOCK_DATA } from "../constants/gpmb-mock-data.ts";
import type { GpmbDataset, Household, HouseholdInput, StepRecord } from "../types/gpmb.types";
import { getCurrentStep, validateStepCompletion } from "../utils/gpmb-rules.ts";
import type { GpmbRepository } from "./gpmb.repository.ts";

const clone = <T,>(value: T): T => structuredClone(value);

export function createMockGpmbRepository(): GpmbRepository {
  const dataset: GpmbDataset = clone(GPMB_MOCK_DATA);

  const find = (id: string): Household => {
    const household = dataset.households.find((item) => item.id === id);
    if (!household) throw new Error("Không tìm thấy hồ sơ hộ dân.");
    return household;
  };

  return {
    async getDataset() {
      return clone(dataset);
    },

    async createHousehold(input, actor) {
      if (!input.ownerName?.trim()) throw new Error("Vui lòng nhập họ tên chủ hộ theo CCCD.");
      if (!input.idNumber?.trim()) throw new Error("Vui lòng nhập số CCCD của chủ hộ.");
      if (!input.projectId) throw new Error("Vui lòng chọn dự án.");

      const project = dataset.projects.find((p) => p.id === input.projectId);
      const projectCode = project?.code || "DA-001";
      const projectHouseholds = dataset.households.filter((h) => h.projectId === input.projectId);
      const nextNum = projectHouseholds.length + 1;
      const code = input.code || `${projectCode}-HD-${String(nextNum).padStart(3, "0")}`;
      const id = `HH-${Date.now()}`;

      let records: StepRecord[] = [];
      if (input.matrixSteps && input.matrixSteps.length > 0) {
        records = input.matrixSteps
          .filter((s) => s.status === "COMPLETED")
          .map((s) => ({
            step: s.step,
            completedAt: s.completedAt || todayIso(),
            documentNo: s.documentNo || `${String(s.step).padStart(2, "0")}/HD-BT`,
            fileName: s.fileName,
            note: s.note,
            by: actor,
          }));
      } else if (input.currentStep && input.currentStep > 1) {
        for (let s = 1; s < input.currentStep; s++) {
          records.push({
            step: s,
            completedAt: todayIso(),
            documentNo: `${String(s).padStart(2, "0")}/HD-BT`,
            by: actor,
          });
        }
      }

      const newHousehold: Household = {
        id,
        code,
        projectId: input.projectId,
        ownerName: input.ownerName.trim(),
        idNumber: input.idNumber.trim(),
        address: input.address?.trim() || "Chưa cập nhật",
        areaM2: Number(Number(input.areaM2 || 0).toFixed(2)),
        landType: input.landType || "ONT",
        compensation: Number(input.compensation) || 0,
        specialStatus: input.specialStatus || "NORMAL",
        records,
        currentStepStartedAt: todayIso(),
      };

      dataset.households = [newHousehold, ...dataset.households];
      return clone(newHousehold);
    },

    async completeStep(householdId, input, actor) {
      const household = find(householdId);
      const error = validateStepCompletion(household, input, "complete");
      if (error) throw new Error(error);

      const step = getCurrentStep(household) as number;
      household.records.push({ step, ...input, by: actor });
      household.currentStepStartedAt = input.completedAt;
      household.rejection = undefined;
      return clone(household);
    },

    async proposeStep(householdId, input, actor) {
      const household = find(householdId);
      const error = validateStepCompletion(household, input, "propose");
      if (error) throw new Error(error);

      household.proposal = {
        step: getCurrentStep(household) as number,
        proposedBy: actor,
        proposedAt: todayIso(),
        documentNo: input.documentNo,
        fileName: input.fileName,
        note: input.note,
      };
      household.rejection = undefined;
      return clone(household);
    },

    async approveProposal(householdId, actor) {
      const household = find(householdId);
      const proposal = household.proposal;
      if (!proposal) throw new Error("Hộ dân này không có đề xuất đang chờ duyệt.");

      const completedAt = todayIso();
      household.records.push({
        step: proposal.step,
        completedAt,
        documentNo: proposal.documentNo,
        fileName: proposal.fileName,
        note: proposal.note,
        by: proposal.proposedBy,
        approvedBy: actor,
      });
      household.currentStepStartedAt = completedAt;
      household.proposal = undefined;
      return clone(household);
    },

    async rejectProposal(householdId, reason, actor) {
      const household = find(householdId);
      if (!household.proposal) throw new Error("Hộ dân này không có đề xuất đang chờ duyệt.");
      if (!reason.trim()) throw new Error("Vui lòng nhập lý do trả lại đề xuất.");

      household.rejection = { step: household.proposal.step, reason, by: actor, at: todayIso() };
      household.proposal = undefined;
      return clone(household);
    },

    async updateSpecialStatus(householdId, status) {
      const household = find(householdId);
      const before = getCurrentStep(household);
      household.specialStatus = status;
      // Bước hiện tại thay đổi (ví dụ kích hoạt bước 14) thì bắt đầu đếm lại thời hạn
      if (getCurrentStep(household) !== before) household.currentStepStartedAt = todayIso();
      return clone(household);
    },

    async updateStepRecord(householdId, step, data, actor) {
      const household = find(householdId);
      const record = household.records.find((r) => r.step === step);
      if (!record) {
        throw new Error(`Chưa tìm thấy bản ghi cho bước ${step}.`);
      }
      if (data.fileName !== undefined) {
        record.fileName = data.fileName;
      }
      if (data.documentNo !== undefined && data.documentNo.trim()) {
        record.documentNo = data.documentNo.trim();
      }
      if (data.note !== undefined) {
        record.note = data.note.trim() || undefined;
      }
      return clone(household);
    },
  };
}

export const mockGpmbRepository = createMockGpmbRepository();
