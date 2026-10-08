import { todayIso } from "../../../utils/date.ts";
import { WARRANTY_MOCK_DATA } from "../constants/warranty-mock-data.ts";
import type { Incident, WarrantyDataset, WarrantyRecord } from "../types/warranty.types";
import { getBondReturnBlocker, getCountdown, validateFix, validateIncident } from "../utils/warranty-rules.ts";
import type { WarrantyRepository } from "./warranty.repository.ts";

const clone = <T,>(value: T): T => structuredClone(value);

export function createMockWarrantyRepository(): WarrantyRepository {
  const dataset: WarrantyDataset = clone(WARRANTY_MOCK_DATA);

  const findIncident = (id: string): Incident => {
    const incident = dataset.incidents.find((item) => item.id === id);
    if (!incident) throw new Error("Không tìm thấy sự cố.");
    return incident;
  };

  return {
    async getDataset() {
      return clone(dataset);
    },

    async reportIncident(input, actor) {
      const error = validateIncident(input);
      if (error) throw new Error(error);
      const warranty = dataset.warranties.find((item) => item.id === input.warrantyId);
      if (!warranty) throw new Error("Không tìm thấy công trình bảo hành.");
      if (getCountdown(warranty, input.foundDate).daysLeft < 0) {
        throw new Error("Công trình đã hết thời hạn bảo hành vào ngày phát hiện sự cố.");
      }

      const incident: Incident = {
        id: `INC-${Date.now()}`,
        code: `SC-${input.foundDate.slice(0, 4)}-${String(dataset.incidents.length + 10).padStart(3, "0")}`,
        warrantyId: input.warrantyId,
        foundDate: input.foundDate,
        description: input.description.trim(),
        location: input.location.trim(),
        severity: input.severity,
        requiredFixDate: input.requiredFixDate,
        status: "OPEN",
        reportedBy: actor,
        attachments: input.attachment ? [input.attachment] : [],
      };
      dataset.incidents = [incident, ...dataset.incidents];
      return clone(incident);
    },

    async startFixing(incidentId) {
      const incident = findIncident(incidentId);
      if (incident.status !== "OPEN") throw new Error("Chỉ chuyển sang khắc phục với sự cố mới ghi nhận.");
      incident.status = "FIXING";
      return clone(incident);
    },

    async acceptFix(incidentId, input) {
      const incident = findIncident(incidentId);
      const error = validateFix(incident, input);
      if (error) throw new Error(error);
      Object.assign(incident, {
        status: "FIXED",
        fixedDate: input.fixedDate,
        acceptanceDocument: input.acceptanceDocument.trim(),
        attachments: input.attachment ? [...incident.attachments, input.attachment] : incident.attachments,
      });
      return clone(incident);
    },

    async closeBond(warrantyId, status, note) {
      const warranty = dataset.warranties.find((item) => item.id === warrantyId);
      if (!warranty) throw new Error("Không tìm thấy công trình bảo hành.");
      if (status === "RETURNED") {
        const blocker = getBondReturnBlocker(warranty, dataset.incidents, todayIso());
        if (blocker) throw new Error(`Chưa thể hoàn trả bảo lãnh: ${blocker}`);
      } else if (warranty.bondStatus !== "HOLDING") {
        throw new Error("Bảo lãnh đã được xử lý trước đó.");
      }
      if (status === "FORFEITED" && !note.trim()) throw new Error("Thu hồi bảo lãnh cần ghi rõ lý do vi phạm.");

      Object.assign(warranty, { bondStatus: status, bondClosedAt: todayIso(), bondNote: note.trim() || undefined });
      return clone(warranty);
    },

    async createWarranty(input) {
      if (!input.acceptanceDate) throw new Error("Vui lòng chọn ngày nghiệm thu hoàn thành.");
      if (!input.months || input.months <= 0) throw new Error("Thời hạn bảo hành phải lớn hơn 0 tháng.");
      if (!input.workName.trim()) throw new Error("Vui lòng nhập tên hạng mục / công trình bảo hành.");

      const id = `WR-${String(dataset.warranties.length + 1).padStart(3, "0")}`;
      const record: WarrantyRecord = {
        id,
        projectId: input.projectId || "PRJ-101",
        workName: input.workName.trim(),
        contractCode: input.contractCode.trim() || "Chưa có mã HĐ",
        contractor: input.contractor.trim() || "Chưa cập nhật nhà thầu",
        acceptanceDate: input.acceptanceDate,
        months: Number(input.months),
        bondValue: Number(input.bondValue) || 0,
        bank: input.bank.trim() || "Chưa cập nhật ngân hàng",
        bondStatus: input.bondStatus || "HOLDING",
      };
      dataset.warranties = [record, ...dataset.warranties];
      return clone(record);
    },

    async updateWarranty(id, input) {
      const warranty = dataset.warranties.find((item) => item.id === id);
      if (!warranty) throw new Error("Không tìm thấy hồ sơ bảo hành.");

      if (input.acceptanceDate !== undefined) warranty.acceptanceDate = input.acceptanceDate;
      if (input.months !== undefined) warranty.months = Number(input.months);
      if (input.workName !== undefined) warranty.workName = input.workName.trim();
      if (input.contractCode !== undefined) warranty.contractCode = input.contractCode.trim();
      if (input.contractor !== undefined) warranty.contractor = input.contractor.trim();
      if (input.bondValue !== undefined) warranty.bondValue = Number(input.bondValue) || 0;
      if (input.bank !== undefined) warranty.bank = input.bank.trim();
      if (input.bondStatus !== undefined) warranty.bondStatus = input.bondStatus;
      if (input.projectId !== undefined) warranty.projectId = input.projectId;

      return clone(warranty);
    },
  };
}

export const mockWarrantyRepository = createMockWarrantyRepository();
