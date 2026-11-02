"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { hasBackendSession } from "@/features/personnel-assignment/services/backend";
import * as catalogApi from "../services/catalog.api";
import type { ApiCatalogItem, CatalogType } from "../services/catalog.types";

const NO_ITEMS: ApiCatalogItem[] = [];

export const catalogKeys = {
  all: ["catalogs"] as const,
  list: (type: CatalogType) => [...catalogKeys.all, type] as const,
};

/** Một loại danh mục backend: danh sách mục và hàm thêm nhanh (nút "+ Thêm") */
export function useCatalog(type: CatalogType) {
  const queryClient = useQueryClient();
  const { data: items = NO_ITEMS } = useQuery({
    queryKey: catalogKeys.list(type),
    queryFn: () => catalogApi.getCatalogItems(type),
    enabled: hasBackendSession(),
    staleTime: 5 * 60 * 1000,
  });

  const add = useCallback(
    async (name: string) => {
      try {
        if (await catalogApi.addCatalogItem(type, name)) {
          await queryClient.invalidateQueries({ queryKey: catalogKeys.list(type) });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thêm được vào danh mục, vui lòng thử lại.");
      }
    },
    [type, queryClient],
  );

  return { items, add };
}
