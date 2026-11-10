import { todayIso } from "../../../utils/date.ts";
import { buildMissingSampleHouseholds, buildSampleHouseholds, GPMB_MOCK_DATA, SAMPLE_ID_NUMBERS } from "../constants/gpmb-mock-data.ts";
import type { GpmbDataset, Household, HouseholdInput, StepRecord } from "../types/gpmb.types";
import { getCurrentStep, isStepApplicable, validateStepCompletion } from "../utils/gpmb-rules.ts";
import { itemAmount } from "../utils/gpmb-compensation.ts";
import type { GpmbRepository } from "./gpmb.repository.ts";
import { getSharedProjects } from "../../../stores/project.store.ts";

const clone = <T,>(value: T): T => structuredClone(value);

/** Bản mock lưu hộ dân trong trình duyệt để thêm / cập nhật không mất khi tải lại trang */
const STORAGE_KEY = "cipm_gpmb_dataset_v2";
/** Bản lưu cũ (dữ liệu mẫu theo bảng giá minh họa): chỉ giữ lại hộ người dùng tự thêm */
const LEGACY_STORAGE_KEY = "cipm_gpmb_dataset_v1";
/** Hộ người dùng thêm có id dạng HH-<thời điểm tạo>; hộ mẫu có id theo mã hộ */
const isUserHousehold = (h: Household) => /^HH-\d+$/.test(h.id);

function loadDataset(): GpmbDataset {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as GpmbDataset) : null;
      if (parsed && Array.isArray(parsed.households) && Array.isArray(parsed.projects)) {
        // Bản lưu cũ: CCCD hộ mẫu còn che số (091****4521) → thay bằng số đầy đủ
        for (const h of parsed.households) {
          if (h.idNumber?.includes("*") && SAMPLE_ID_NUMBERS[h.ownerName]) h.idNumber = SAMPLE_ID_NUMBERS[h.ownerName];
        }
        // Danh sách hộ mẫu có thêm hộ mới: nối vào dự án đã có hộ mẫu, giữ nguyên tiến độ các hộ cũ
        let added = false;
        for (const project of parsed.projects) {
          const inProject = parsed.households.filter((h) => h.projectId === project.id);
          const sampleCount = inProject.filter((h) => !isUserHousehold(h)).length;
          if (sampleCount === 0) continue;
          const maxNo = Math.max(0, ...inProject.map((h) => Number(/HD-(\d+)$/.exec(h.code)?.[1] ?? 0)));
          const missing = buildMissingSampleHouseholds(project, sampleCount, maxNo + 1);
          if (missing.length) {
            parsed.households.push(...missing);
            added = true;
          }
        }
        if (added) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch {
      // Dữ liệu lưu hỏng: dùng lại dữ liệu mẫu
    }
  }
  const fresh = clone(GPMB_MOCK_DATA);
  if (typeof window !== "undefined") {
    try {
      const legacy = JSON.parse(window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null") as GpmbDataset | null;
      if (legacy && Array.isArray(legacy.households)) {
        const kept = legacy.households.filter(isUserHousehold);
        const projectIds = new Set(kept.map((h) => h.projectId));
        for (const p of legacy.projects ?? []) {
          if (projectIds.has(p.id) && !fresh.projects.some((x) => x.id === p.id)) fresh.projects.push(p);
        }
        fresh.households = [...kept, ...fresh.households];
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // Bản cũ hỏng: bỏ qua
    }
  }
  return fresh;
}

export function createMockGpmbRepository(): GpmbRepository {
  let state: GpmbDataset | null = null;
  // Đọc lần đầu khi dùng (tránh đọc localStorage lúc dựng trang phía máy chủ)
  const ds = (): GpmbDataset => (state ??= loadDataset());
  const save = () => {
    if (typeof window === "undefined" || !state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save GPMB dataset", e);
    }
  };

  const find = (id: string): Household => {
    const household = ds().households.find((item) => item.id === id);
    if (!household) throw new Error("Không tìm thấy hồ sơ hộ dân.");
    return household;
  };

  return {
    async getDataset() {
      const copy = clone(ds());
      const shared = getSharedProjects();
      const existingIds = new Set(copy.projects.map((p) => p.id));
      for (const sp of shared) {
        if (!existingIds.has(sp.id)) {
          copy.projects.push({
            id: sp.id,
            code: sp.code,
            name: sp.name,
          });
          existingIds.add(sp.id);
        }
      }
      return copy;
    },

    async ensureSampleHouseholds(project) {
      if (ds().households.some((h) => h.projectId === project.id)) return;
      if (!ds().projects.some((p) => p.id === project.id)) ds().projects.push({ ...project });
      ds().households.push(...buildSampleHouseholds(project));
      save();
    },

    async createHousehold(input, actor) {
      if (!input.ownerName?.trim()) throw new Error("Vui lòng nhập họ tên chủ hộ theo CCCD.");
      if (!input.idNumber?.trim()) throw new Error("Vui lòng nhập số CCCD của chủ hộ.");
      if (!input.projectId) throw new Error("Vui lòng chọn dự án.");

      const project = ds().projects.find((p) => p.id === input.projectId);
      const projectCode = project?.code || "DA-001";
      const projectHouseholds = ds().households.filter((h) => h.projectId === input.projectId);
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
        const status = input.specialStatus || "NORMAL";
        for (let s = 1; s < input.currentStep; s++) {
          // Bước 14, 15 chỉ ghi nhận với hộ không hợp tác / cưỡng chế
          if (!isStepApplicable(s, { specialStatus: status })) continue;
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
        // Có bảng kê thì tổng tiền = tổng các khoản
        compensation: input.compensationItems?.length
          ? input.compensationItems.reduce((sum, item) => sum + itemAmount(item), 0)
          : Number(input.compensation) || 0,
        compensationItems: input.compensationItems?.length ? input.compensationItems : undefined,
        specialStatus: input.specialStatus || "NORMAL",
        specialStatusLabel: input.specialStatus === "OTHER" ? input.specialStatusLabel : undefined,
        note: input.note?.trim() || undefined,
        persons: input.persons,
        birthDate: input.birthDate,
        idIssuedDate: input.idIssuedDate,
        phone: input.phone,
        landOrigin: input.landOrigin,
        landOriginFiles: input.landOriginFiles?.length ? input.landOriginFiles : undefined,
        records,
        currentStepStartedAt: todayIso(),
        createdAt: Date.now(),
      };

      ds().households = [newHousehold, ...ds().households];
      save();
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
      save();
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
      save();
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
      save();
      return clone(household);
    },

    async rejectProposal(householdId, reason, actor) {
      const household = find(householdId);
      if (!household.proposal) throw new Error("Hộ dân này không có đề xuất đang chờ duyệt.");
      if (!reason.trim()) throw new Error("Vui lòng nhập lý do trả lại đề xuất.");

      household.rejection = { step: household.proposal.step, reason, by: actor, at: todayIso() };
      household.proposal = undefined;
      save();
      return clone(household);
    },

    async updateSpecialStatus(householdId, status) {
      const household = find(householdId);
      const before = getCurrentStep(household);
      household.specialStatus = status;
      // Bước hiện tại thay đổi (ví dụ kích hoạt bước 14) thì bắt đầu đếm lại thời hạn
      if (getCurrentStep(household) !== before) household.currentStepStartedAt = todayIso();
      save();
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
      save();
      return clone(household);
    },
  };
}

export const mockGpmbRepository = createMockGpmbRepository();
