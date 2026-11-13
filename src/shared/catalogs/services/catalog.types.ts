/** Loại danh mục backend (GET /catalogs/types) */
export type CatalogType =
  | "LEGAL_FIELD"
  | "LEGAL_ISSUER"
  | "LEGAL_CATEGORY"
  | "PROJECT_TYPE"
  | "PROJECT_LEVEL"
  | "PROJECT_GROUP"
  | "PROCEDURE_STAGE"
  | "EXECUTING_UNIT"
  | "FUND_SOURCE"
  | "EXPENSE_TYPE"
  | "EMPLOYMENT_TYPE"
  | "LAND_TYPE"
  | "RESETTLEMENT_AREA"
  | "COMPENSATION_REASON"
  | "BIDDING_METHOD"
  | "BIDDING_TYPE"
  | "CONTRACT_TYPE"
  | (string & {});

export interface ApiCatalogItem {
  id: string;
  type: CatalogType;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  /** Danh mục mặc định của hệ thống (không xóa được) */
  isSystem: boolean;
  isActive: boolean;
}
