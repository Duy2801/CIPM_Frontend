"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomFieldDefinition, CustomFieldTarget } from "../types/custom-fields.types";
import { getCustomFields, saveCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";

/** Danh sách trường tùy biến của cán bộ / phòng ban; tự cập nhật khi nơi khác thay đổi cấu hình */
export function useCustomFieldDefs(target: CustomFieldTarget) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(() => getCustomFields(target));

  useEffect(() => {
    return subscribeCustomFieldsChange((changedTarget, nextFields) => {
      if (changedTarget === target) setFields(nextFields);
    });
  }, [target]);

  const save = useCallback(
    (nextFields: CustomFieldDefinition[]) => {
      saveCustomFields(target, nextFields);
      setFields(nextFields);
    },
    [target],
  );

  return [fields, save] as const;
}
