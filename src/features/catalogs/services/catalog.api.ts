import { withBackend } from "@/features/personnel-assignment/services/backend";
import * as backend from "../api/catalog.backend";
import type { ApiCatalogItem, CatalogType } from "./catalog.types";

/**
 * Danh mục dùng chung (loại văn bản, cơ quan ban hành, lĩnh vực...).
 * Đăng nhập bằng tài khoản thật thì đọc / thêm trên backend; tài khoản thử nghiệm thì không có danh mục backend
 * (màn hình dùng danh sách gợi ý sẵn có).
 */

/** Các mục đang hiển thị của một loại danh mục, theo thứ tự backend */
export function getCatalogItems(type: CatalogType): Promise<ApiCatalogItem[]> {
  return withBackend(
    async () => (await backend.getCatalogItemsApi(type)).filter((item) => item.isActive),
    () => [],
  );
}

/** Thêm nhanh một mục; bản mock trả null (màn hình tự giữ mục vừa thêm) */
export function addCatalogItem(type: CatalogType, name: string): Promise<ApiCatalogItem | null> {
  return withBackend(
    () => backend.createCatalogItemApi(type, name.trim()),
    () => null,
  );
}
