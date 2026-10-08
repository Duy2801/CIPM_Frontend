import type {
  BondStatus,
  FixInput,
  Incident,
  IncidentInput,
  WarrantyDataset,
  WarrantyRecord,
} from "../types/warranty.types";

/** Ranh giới dữ liệu M8 – backend chỉ cần cung cấp implementation cùng interface */
export interface WarrantyRepository {
  getDataset(): Promise<WarrantyDataset>;
  reportIncident(input: IncidentInput, actor: string): Promise<Incident>;
  startFixing(incidentId: string): Promise<Incident>;
  acceptFix(incidentId: string, input: FixInput): Promise<Incident>;
  closeBond(warrantyId: string, status: Exclude<BondStatus, "HOLDING">, note: string): Promise<WarrantyRecord>;
  createWarranty(input: import("../types/warranty.types").WarrantyCreateInput): Promise<WarrantyRecord>;
  updateWarranty(id: string, input: Partial<import("../types/warranty.types").WarrantyCreateInput>): Promise<WarrantyRecord>;
}
