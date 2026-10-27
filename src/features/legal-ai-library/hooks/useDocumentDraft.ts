"use client";

import { useState } from "react";
import type { LegalDocument } from "../types/legal-ai.types";
import {
  describeLegalChanges,
  isSameFieldValue,
  type LegalDocumentField,
  type LegalDocumentPatch,
} from "../utils/document-changes";

/**
 * Bản nháp khi sửa văn bản: các trường đã sửa bằng bút chì nhưng chưa lưu.
 * `document` = bản gốc + các trường đang sửa; sửa về đúng giá trị cũ thì trường đó tự bỏ khỏi bản nháp.
 */
export function useDocumentDraft(original: LegalDocument | undefined) {
  const [patch, setPatch] = useState<LegalDocumentPatch>({});

  const document = original ? { ...original, ...patch } : undefined;
  const changes = original ? describeLegalChanges(original, patch) : [];

  const setFields = (next: LegalDocumentPatch) => {
    if (!original) return;
    const merged: LegalDocumentPatch = { ...patch, ...next };
    for (const field of Object.keys(next) as LegalDocumentField[]) {
      if (isSameFieldValue(merged[field], original[field])) delete merged[field];
    }
    setPatch(merged);
  };

  return {
    document,
    patch,
    changes,
    isDirty: changes.length > 0,
    isChanged: (field: LegalDocumentField) => field in patch,
    setFields,
    discard: () => setPatch({}),
  };
}
