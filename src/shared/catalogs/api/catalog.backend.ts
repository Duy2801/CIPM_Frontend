import apiClient from "@/config";
import type { ApiCatalogItem, CatalogType } from "../services/catalog.types";

/**
 * Các API danh mục dùng chung của backend thật — chỉ gọi API và trả dữ liệu backend, không xử lý thêm.
 * Chạy bản mock khi không có backend: services/catalog.api.ts.
 */

/** GET /catalogs?type= */
export async function getCatalogItemsApi(type: CatalogType): Promise<ApiCatalogItem[]> {
  return (await apiClient.get<ApiCatalogItem[]>("catalogs", { params: { type } })).data;
}

/** POST /catalogs — thêm nhanh một mục (nút "+ Thêm"); mã tự sinh từ tên */
export async function createCatalogItemApi(type: CatalogType, name: string): Promise<ApiCatalogItem> {
  return (await apiClient.post<ApiCatalogItem>("catalogs", { type, name })).data;
}
