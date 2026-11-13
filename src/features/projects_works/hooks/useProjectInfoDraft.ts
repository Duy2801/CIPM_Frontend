"use client";

import { useState } from "react";
import type { ProjectItem } from "@/shared/projects_works/types/project.types";
import { FIELD_LABELS, formatField, type EditableField, type EditablePatch } from "../utils/project-detail-fields";

export interface FieldChange {
  label: string;
  from: string;
  to: string;
}

export function useProjectInfoDraft(project: ProjectItem, canEdit: boolean) {
  const [pending, setPending] = useState<EditablePatch>({});

  const view: ProjectItem = { ...project, ...pending };
  const isChanged = (field: EditableField) => field in pending;

  const setField = <K extends EditableField>(field: K, value: EditablePatch[K]) =>
    setPending((prev) => {
      const next = { ...prev, [field]: value };
      if (JSON.stringify(value) === JSON.stringify(project[field])) delete next[field];
      return next;
    });

  const saver = <K extends EditableField>(field: K, parse: (raw: string) => EditablePatch[K]) =>
    canEdit ? (raw: string) => setField(field, parse(raw)) : undefined;

  const changes: FieldChange[] = (Object.keys(pending) as EditableField[]).map((field) => ({
    label: FIELD_LABELS[field],
    from: formatField(field, project),
    to: formatField(field, view),
  }));

  return {
    pending,
    view,
    isChanged,
    setField,
    saver,
    changes,
    isDirty: changes.length > 0,
    canEdit,
    reset: () => setPending({}),
  };
}

export type ProjectInfoDraft = ReturnType<typeof useProjectInfoDraft>;
