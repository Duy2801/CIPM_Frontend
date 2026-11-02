"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomFieldDefinition, CustomFieldTarget } from "../types/custom-fields.types";
import { getCustomFields, saveCustomFields, subscribeCustomFieldsChange } from "../utils/custom-fields-storage";

/**
 * Danh sách trường tùy biến của cán bộ / phòng ban; tự cập nhật khi nơi khác thay đổi cấu hình.
 * Danh mục trường lưu trình duyệt (backend chưa có API danh mục); giá trị của từng cán bộ lưu trong customFields của hồ sơ.
 */
export function useCustomFieldDefs(target: CustomFieldTarget) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(() => getCustomFields(target));

  useEffect(() => {
    setFields(getCustomFields(target));
    return subscribeCustomFieldsChange((changedTarget, nextFields) => {
      if (changedTarget === target) setFields(nextFields);
    });
  }, [target]);

  const save = useCallback(
    (nextFields: CustomFieldDefinition[]) => {
      setFields(nextFields);
      saveCustomFields(target, nextFields);
    },
    [target],
  );

  return [fields, save] as const;
}
