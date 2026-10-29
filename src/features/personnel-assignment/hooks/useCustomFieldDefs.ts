"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui";
import { hasBackendSession } from "../services/backend";
import * as personnelApi from "../services/personnel.api";
import type { CustomFieldDefinition, CustomFieldTarget } from "../types/custom-fields.types";
import { getCustomFields, saveCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";
import { personnelKeys } from "./usePersonnelQueries";

const NO_FIELDS: CustomFieldDefinition[] = [];

/**
 * Danh sách trường tùy biến của cán bộ / phòng ban; tự cập nhật khi nơi khác thay đổi cấu hình.
 * Trường của cán bộ lưu backend (GET / PUT /settings/staff-custom-fields), trường của phòng ban lưu trình duyệt.
 */
export function useCustomFieldDefs(target: CustomFieldTarget) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [...personnelKeys.all, "custom-fields", target] as const, [target]);
  const isStaff = target === "staff";

  const { data: fields = NO_FIELDS } = useQuery({
    queryKey,
    queryFn: () => (isStaff ? personnelApi.getStaffCustomFields() : getCustomFields(target)),
    // Dữ liệu backend thì chờ tải; bản lưu trình duyệt thì đọc ngay
    initialData: isStaff && hasBackendSession() ? undefined : () => getCustomFields(target),
    staleTime: Infinity,
  });

  useEffect(() => {
    return subscribeCustomFieldsChange((changedTarget, nextFields) => {
      if (changedTarget === target) queryClient.setQueryData(queryKey, nextFields);
    });
  }, [target, queryKey, queryClient]);

  const save = useCallback(
    (nextFields: CustomFieldDefinition[]) => {
      queryClient.setQueryData(queryKey, nextFields);
      if (!isStaff) {
        saveCustomFields(target, nextFields);
        return;
      }
      personnelApi
        .saveStaffCustomFields(nextFields)
        .then((saved) => queryClient.setQueryData(queryKey, saved))
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Không thể lưu trường dữ liệu, vui lòng thử lại.");
          queryClient.invalidateQueries({ queryKey });
        });
    },
    [target, isStaff, queryKey, queryClient],
  );

  return [fields, save] as const;
}
